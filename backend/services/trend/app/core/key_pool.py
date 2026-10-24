"""
Redis-Backed Universal API Key Pool & Distributed Router.
Provides automated failover, distributed round-robin rotation, and TTL-based cooldowns
across Groq, Gemini, YouTube, Tavily, and SerpApi multi-key pools.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisKeyPool:
    """
    Production-grade distributed key pool for external API providers.
    Tracks exhaustion, cooldowns, and round-robin index in Redis across all workers/containers.
    """

    def __init__(
        self,
        provider: str,
        env_vars: list[str] | None = None,
        default_rate_limit_cooldown: int = 60,
        default_quota_cooldown: int = 86400,
    ) -> None:
        self.provider = provider.lower().strip()
        self.env_vars = env_vars or [f"{self.provider.upper()}_API_KEYS", f"{self.provider.upper()}_API_KEY"]
        self.default_rate_limit_cooldown = default_rate_limit_cooldown
        self.default_quota_cooldown = default_quota_cooldown

        self._keys: list[str] = []
        self._redis = None
        self._redis_failed = False
        self._memory_cooldowns: dict[str, float] = {}
        self._memory_idx: int = 0
        self._reload_keys()

    def _reload_keys(self) -> None:
        raw_keys: list[str] = []
        for var in self.env_vars:
            val = getattr(settings, var.lower(), None) or os.environ.get(var) or ""
            if val and isinstance(val, str):
                for k in val.split(","):
                    clean = k.strip()
                    if clean and clean not in raw_keys:
                        raw_keys.append(clean)
        self._keys = raw_keys
        if self._keys:
            logger.info("KeyPool[%s]: Loaded %d keys from env/config (%s)", self.provider, len(self._keys), ", ".join(self.env_vars))

    def get_all_keys(self) -> list[str]:
        if not self._keys:
            self._reload_keys()
        return list(self._keys)

    def get_keys(self) -> list[str]:
        """Alias for backward-compatibility with callers expecting get_keys()."""
        return self.get_all_keys()

    def _hash_key(self, key: str) -> str:
        return hashlib.sha256(key.encode("utf-8")).hexdigest()[:12]

    def _key_suffix(self, key: str) -> str:
        return key[-6:] if len(key) >= 6 else key

    async def _get_redis(self):
        if self._redis is None and not self._redis_failed:
            try:
                import redis.asyncio as aioredis
                url = getattr(settings, "redis_url", "") or os.environ.get("REDIS_URL", "redis://redis:6379/0")
                if url:
                    client = aioredis.from_url(url, decode_responses=True, socket_timeout=2)
                    await client.ping()
                    self._redis = client
            except Exception as exc:
                logger.warning("KeyPool[%s]: Redis unavailable, using memory fallback: %s", self.provider, exc)
                self._redis_failed = True
        return self._redis

    async def get_active_key(self) -> str | None:
        """
        Returns the next available non-exhausted key using distributed round-robin.
        If all keys are exhausted, resets or returns the first key as fallback.
        """
        keys = self.get_all_keys()
        if not keys:
            return None
        if len(keys) == 1:
            return keys[0]

        r = await self._get_redis()
        now = time.time()

        # 1. Redis-backed check
        if r is not None:
            try:
                # Check exhaustion flags in Redis
                exhausted_flags = await asyncio.gather(
                    *[r.exists(f"keypool:{self.provider}:exhausted:{self._hash_key(k)}") for k in keys]
                )
                available = [keys[i] for i, is_ex in enumerate(exhausted_flags) if not is_ex]

                if not available:
                    logger.warning("KeyPool[%s]: All %d keys are exhausted in Redis! Resetting pool for retry.", self.provider, len(keys))
                    await asyncio.gather(
                        *[r.delete(f"keypool:{self.provider}:exhausted:{self._hash_key(k)}") for k in keys]
                    )
                    available = list(keys)

                rr_idx = await r.incr(f"keypool:{self.provider}:rr_idx")
                return available[rr_idx % len(available)]
            except Exception as exc:
                logger.debug("KeyPool[%s]: Redis get_active_key failed (%s), using memory fallback", self.provider, exc)

        # 2. In-memory fallback
        available = [k for k in keys if self._memory_cooldowns.get(k, 0) < now]
        if not available:
            self._memory_cooldowns.clear()
            available = list(keys)
        self._memory_idx += 1
        return available[self._memory_idx % len(available)]

    async def mark_exhausted(self, key: str, cooldown_seconds: int | None = None, reason: str = "") -> None:
        """
        Marks a key as exhausted in Redis with a TTL.
        """
        ttl = cooldown_seconds or self.default_quota_cooldown
        key_h = self._hash_key(key)
        suffix = self._key_suffix(key)

        r = await self._get_redis()
        if r is not None:
            try:
                await r.set(f"keypool:{self.provider}:exhausted:{key_h}", reason or "1", ex=ttl)
            except Exception as exc:
                logger.debug("KeyPool[%s]: Redis set exhausted failed: %s", self.provider, exc)

        self._memory_cooldowns[key] = time.time() + ttl
        logger.warning(
            "KeyPool[%s]: Key ...%s marked exhausted (%s) for %ds (TTL: %ds in Redis).",
            self.provider,
            suffix,
            reason or "429 / Quota",
            ttl,
            ttl,
        )

    async def record_usage(self, key: str, cost: int = 1) -> None:
        """Records daily usage count per key in Redis for observability."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key_h = self._hash_key(key)
        r = await self._get_redis()
        if r is not None:
            try:
                redis_key = f"keypool:{self.provider}:usage:{key_h}:{today}"
                await r.incrby(redis_key, cost)
                await r.expire(redis_key, 86400 * 7)  # 7-day retention
            except Exception as exc:
                logger.debug("KeyPool[%s]: Redis record_usage failed: %s", self.provider, exc)

    async def get_stats(self) -> dict[str, Any]:
        """Returns real-time health and usage stats across all keys in the pool."""
        keys = self.get_all_keys()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        r = await self._get_redis()

        stats: dict[str, Any] = {
            "provider": self.provider,
            "total_keys": len(keys),
            "keys_status": [],
        }

        for k in keys:
            key_h = self._hash_key(k)
            suffix = self._key_suffix(k)
            is_exhausted = False
            ttl_remaining = 0
            usage_today = 0

            if r is not None:
                try:
                    ttl_val = await r.ttl(f"keypool:{self.provider}:exhausted:{key_h}")
                    ttl_remaining = max(0, ttl_val)
                    is_exhausted = ttl_remaining > 0
                    usage_val = await r.get(f"keypool:{self.provider}:usage:{key_h}:{today}")
                    usage_today = int(usage_val) if usage_val else 0
                except Exception:
                    pass
            else:
                mem_ttl = self._memory_cooldowns.get(k, 0) - time.time()
                is_exhausted = mem_ttl > 0
                ttl_remaining = int(max(0, mem_ttl))

            stats["keys_status"].append(
                {
                    "key_suffix": suffix,
                    "is_exhausted": is_exhausted,
                    "ttl_remaining_sec": ttl_remaining,
                    "usage_today": usage_today,
                }
            )

        active_count = sum(1 for item in stats["keys_status"] if not item["is_exhausted"])
        stats["active_keys"] = active_count
        return stats


# Global pool singletons
groq_pool = RedisKeyPool("groq", ["GROQ_API_KEYS", "GROQ_API_KEY"], default_rate_limit_cooldown=60, default_quota_cooldown=86400)
gemini_pool = RedisKeyPool("gemini", ["GEMINI_API_KEYS", "GEMINI_API_KEY"], default_rate_limit_cooldown=60, default_quota_cooldown=86400)
openrouter_pool = RedisKeyPool("openrouter", ["OPENROUTER_API_KEYS", "OPENROUTER_API_KEY"], default_rate_limit_cooldown=60, default_quota_cooldown=86400)
tavily_pool = RedisKeyPool("tavily", ["TAVILY_API_KEYS", "TAVILY_API_KEY"], default_rate_limit_cooldown=60, default_quota_cooldown=86400)
serpapi_pool = RedisKeyPool("serpapi", ["SERPAPI_API_KEYS", "SERPAPI_API_KEY"], default_rate_limit_cooldown=60, default_quota_cooldown=86400)
youtube_pool = RedisKeyPool(
    "youtube",
    ["YOUTUBE_API_KEYS", "YOUTUBE_API_KEY", "YOUTUBE_API_KEY_1", "YOUTUBE_API_KEY_2", "YOUTUBE_API_KEY_3", "GOOGLE_API_KEY"],
    default_quota_cooldown=86400
)


async def get_all_pool_stats() -> dict[str, Any]:
    """Returns aggregated real-time pool status across all external providers."""
    return {
        "youtube": await youtube_pool.get_stats(),
        "groq": await groq_pool.get_stats(),
        "gemini": await gemini_pool.get_stats(),
        "openrouter": await openrouter_pool.get_stats(),
        "tavily": await tavily_pool.get_stats(),
        "serpapi": await serpapi_pool.get_stats(),
    }
