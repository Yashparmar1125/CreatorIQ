"""
YouTube Multi-Key Router & Daily Quota Governor.
Manages a pool of YouTube Data API v3 keys with automated failover,
strict 270 queries/day throttling, and zero fallback to dummy/synthetic data.
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
import time
from datetime import datetime, timezone, date, timedelta
from typing import Any

try:
    from zoneinfo import ZoneInfo
    PACIFIC = ZoneInfo("America/Los_Angeles")
except Exception:
    PACIFIC = timezone.utc

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
MAX_DAILY_SEARCH_QUERIES = 270


class YouTubeQuotaExceededError(Exception):
    """Raised when the 270 queries/day limit is hit or all keys are exhausted."""
    pass


class YouTubeKeyRouter:
    """Thread-safe multi-key router with daily quota enforcement and rotation."""

    def __init__(self) -> None:
        self._keys: list[str] = []
        self._key_cooldowns: dict[str, float] = {}  # key -> timestamp until cooldown ends
        self._current_index = 0
        self._daily_counts: dict[str, int] = {}     # 'YYYY-MM-DD' -> count
        self._lock = asyncio.Lock()
        self._redis = None
        self._redis_failed = False
        self._refresh_keys()

    def _refresh_keys(self) -> None:
        raw_keys: list[str] = []
        # Check explicit pool settings
        if getattr(settings, "youtube_api_keys", ""):
            raw_keys.extend([k.strip() for k in settings.youtube_api_keys.split(",") if k.strip()])
        # Check individual keys
        for attr in ["youtube_api_key_2", "youtube_api_key_3", "youtube_api_key"]:
            val = getattr(settings, attr, "")
            if val and val.strip() and val.strip() not in raw_keys:
                raw_keys.append(val.strip())

        # Hardcoded fallback list of provided user keys if env not populated yet
        default_pool = [
            "AIzaSyCv7CFlKxD4QKwVrFSaEs5noYdI9jdVRJM",
            "AIzaSyBg9QvhZfJwvI8-aqeWevtm8guElEopEcE",
            "AIzaSyCmvke7zO57ymTAQWXZK9Fj_BFQEGNZAeU",
        ]
        for k in default_pool:
            if k not in raw_keys:
                raw_keys.append(k)

        self._keys = raw_keys
        logger.info("YouTubeKeyRouter initialized with %d API keys in pool.", len(self._keys))

    def _get_today_key(self) -> str:
        # YouTube quotas reset at midnight Pacific Time
        return datetime.now(PACIFIC).strftime("%Y-%m-%d")

    @property
    def daily_limit(self) -> int:
        return int(getattr(settings, "youtube_max_daily_queries", MAX_DAILY_SEARCH_QUERIES) or MAX_DAILY_SEARCH_QUERIES)

    async def _get_redis(self):
        if self._redis is None and not self._redis_failed:
            try:
                import redis.asyncio as aioredis
                url = getattr(settings, "redis_url", "") or os.environ.get("REDIS_URL", "")
                if url:
                    client = aioredis.from_url(url, decode_responses=True, socket_timeout=2)
                    await client.ping()
                    self._redis = client
            except Exception as exc:
                logger.warning("YouTubeKeyRouter: Redis unavailable, using in-process counter: %s", exc)
                self._redis_failed = True
        return self._redis

    def _counter_key(self) -> str:
        return f"yt:search_count:{self._get_today_key()}"

    def _exhausted_key(self) -> str:
        return f"yt:exhausted_keys:{self._get_today_key()}"

    async def get_daily_searches_used_async(self) -> int:
        r = await self._get_redis()
        if r is not None:
            try:
                return int(await r.get(self._counter_key()) or 0)
            except Exception:
                pass
        return self._daily_counts.get(self._get_today_key(), 0)

    def get_daily_searches_used(self) -> int:
        return self._daily_counts.get(self._get_today_key(), 0)

    def can_make_search_query(self) -> bool:
        return self.get_daily_searches_used() < self.daily_limit

    async def can_make_search_query_async(self) -> bool:
        used = await self.get_daily_searches_used_async()
        return used < self.daily_limit

    def _record_search_query(self) -> None:
        today = self._get_today_key()
        self._daily_counts[today] = self._daily_counts.get(today, 0) + 1

    async def _reserve_search_slot(self) -> bool:
        """Atomically reserve one search.list call against the global daily cap."""
        r = await self._get_redis()
        if r is not None:
            try:
                key = self._counter_key()
                n = await r.incr(key)
                if n == 1:
                    await r.expire(key, 60 * 60 * 48)
                if n > self.daily_limit:
                    await r.decr(key)
                    return False
                return True
            except Exception as exc:
                logger.warning("Redis reserve failed, falling back to local counter: %s", exc)
        async with self._lock:
            today = self._get_today_key()
            if self._daily_counts.get(today, 0) >= self.daily_limit:
                return False
            self._daily_counts[today] = self._daily_counts.get(today, 0) + 1
            return True

    async def _release_search_slot(self) -> None:
        """Give back a reserved slot when the call did not consume quota (e.g. 429)."""
        r = await self._get_redis()
        if r is not None:
            try:
                await r.decr(self._counter_key())
                return
            except Exception:
                pass
        today = self._get_today_key()
        self._daily_counts[today] = max(0, self._daily_counts.get(today, 0) - 1)

    async def _exhausted_set(self) -> set[str]:
        r = await self._get_redis()
        if r is not None:
            try:
                return set(await r.smembers(self._exhausted_key()))
            except Exception:
                pass
        return set()

    async def get_active_key_async(self) -> str | None:
        exhausted = await self._exhausted_set()
        now = time.time()
        n = len(self._keys)
        for i in range(n):
            idx = (self._current_index + i) % n
            key = self._keys[idx]
            if key[-8:] in exhausted or now < self._key_cooldowns.get(key, 0.0):
                continue
            self._current_index = idx
            return key
        return None

    def get_active_key(self) -> str | None:
        """Returns the next available non-cooled-down API key (local view)."""
        now = time.time()
        n = len(self._keys)
        if n == 0:
            return None

        for i in range(n):
            idx = (self._current_index + i) % n
            key = self._keys[idx]
            cooldown_until = self._key_cooldowns.get(key, 0.0)
            if now >= cooldown_until:
                self._current_index = idx
                return key

        return None

    def _seconds_until_pacific_midnight(self) -> float:
        now = datetime.now(PACIFIC)
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=5, microsecond=0)
        return max(60.0, (tomorrow - now).total_seconds())

    def mark_key_exhausted(self, key: str, duration_seconds: float | None = None) -> None:
        """Cools a key down until Google's next Pacific-midnight quota reset."""
        duration = duration_seconds or self._seconds_until_pacific_midnight()
        self._key_cooldowns[key] = time.time() + duration
        logger.warning("YouTube API key '...%s' hit quota. Cooling down for %.0f seconds.", key[-6:], duration)
        if self._keys:
            self._current_index = (self._current_index + 1) % len(self._keys)

    async def _mark_key_exhausted_global(self, key: str) -> None:
        self.mark_key_exhausted(key)
        r = await self._get_redis()
        if r is not None:
            try:
                await r.sadd(self._exhausted_key(), key[-8:])
                await r.expire(self._exhausted_key(), 60 * 60 * 48)
            except Exception:
                pass

    async def search_videos(
        self,
        *,
        query: str,
        max_results: int = 15,
        region_code: str = "IN",
        published_after: datetime | None = None,
        published_before: datetime | None = None,
        order: str = "viewCount",
    ) -> list[dict[str, Any]]:
        """
        Executes search.list across the multi-key pool with automated failover
        and strict 270 daily query throttling. Never fabricates dummy data.
        """
        reserved = await self._reserve_search_slot()
        if not reserved:
            used = await self.get_daily_searches_used_async()
            logger.error(
                "YouTube 270 queries/day limit reached (%d used). HOLDING SYSTEM. Refusing to synthesize fake data.",
                used,
            )
            raise YouTubeQuotaExceededError("Daily YouTube search limit of 270 queries reached. System held.")

        params: dict[str, Any] = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "order": order,
            "regionCode": region_code,
            "maxResults": min(max_results, 50),
            "relevanceLanguage": "en",
            "videoDimension": "2d",
            "safeSearch": "moderate",
        }
        # Guard: In environments where the system clock is set ahead (e.g. 2026),
        # only send publishedAfter/Before if <= 2025 so YouTube doesn't return 0 videos.
        if published_after and published_after.year <= 2025:
            params["publishedAfter"] = published_after.strftime("%Y-%m-%dT%H:%M:%SZ")
        if published_before and published_before.year <= 2025:
            params["publishedBefore"] = published_before.strftime("%Y-%m-%dT%H:%M:%SZ")

        attempts = 0
        max_attempts = len(self._keys)
        success = False

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                while attempts < max_attempts:
                    key = await self.get_active_key_async()
                    if not key:
                        logger.error("All YouTube API keys in pool are exhausted. System held.")
                        raise YouTubeQuotaExceededError("All YouTube API keys exhausted. System held.")

                    params["key"] = key
                    attempts += 1
                    try:
                        resp = await client.get(f"{YOUTUBE_API_BASE}/search", params=params)
                        if resp.status_code == 200:
                            success = True
                            data = resp.json()
                            videos: list[dict[str, Any]] = []
                            for item in data.get("items") or []:
                                if (item.get("id") or {}).get("kind") != "youtube#video":
                                    continue
                                vid = (item.get("id") or {}).get("videoId")
                                snippet = item.get("snippet") or {}
                                if vid and snippet.get("title"):
                                    thumbs = snippet.get("thumbnails") or {}
                                    thumb_url = (
                                        (thumbs.get("high") or {}).get("url")
                                        or (thumbs.get("medium") or {}).get("url")
                                        or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                                    )
                                    videos.append({
                                        "video_id": vid,
                                        "title": snippet.get("title", "").strip(),
                                        "description": (snippet.get("description") or "")[:500],
                                        "channel_id": snippet.get("channelId") or "",
                                        "channel_title": snippet.get("channelTitle") or "",
                                        "published_at": snippet.get("publishedAt"),
                                        "thumbnail_url": thumb_url,
                                    })
                            return videos

                        if resp.status_code == 429 or "quotaExceeded" in resp.text:
                            await self._mark_key_exhausted_global(key)
                            continue
                        elif resp.status_code in (400, 403) and any(err in resp.text for err in ["API_KEY_INVALID", "API Key not found", "keyInvalid", "accessNotConfigured"]):
                            logger.error("YouTube key ...%s is invalid or rejected (%d). Cooling down.", key[-6:], resp.status_code)
                            await self._mark_key_exhausted_global(key)
                            continue
                        else:
                            logger.warning("YouTube search.list returned HTTP %d: %s", resp.status_code, resp.text[:200])
                            break
                    except httpx.RequestError as req_err:
                        logger.warning("YouTube search network error on key ...%s: %s", key[-6:], req_err)
                        continue

            return []
        finally:
            if not success:
                await self._release_search_slot()

    async def get_videos_details(self, video_ids: list[str]) -> list[dict[str, Any]]:
        """
        Calls videos.list (which costs ONLY 1 quota unit for up to 50 videos).
        Rotates keys automatically if needed.
        """
        if not video_ids:
            return []

        results: list[dict[str, Any]] = []
        chunks = [video_ids[i:i + 50] for i in range(0, len(video_ids), 50)]

        async with httpx.AsyncClient(timeout=25.0) as client:
            for chunk in chunks:
                key = await self.get_active_key_async()
                if not key:
                    break

                try:
                    resp = await client.get(
                        f"{YOUTUBE_API_BASE}/videos",
                        params={
                            "part": "snippet,statistics,contentDetails",
                            "id": ",".join(chunk),
                            "key": key,
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("items") or []:
                            vid = item.get("id")
                            snip = item.get("snippet") or {}
                            stats = item.get("statistics") or {}
                            thumbs = snip.get("thumbnails") or {}
                            thumb_url = (
                                (thumbs.get("high") or {}).get("url")
                                or (thumbs.get("medium") or {}).get("url")
                                or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                            )
                            results.append({
                                "video_id": vid,
                                "title": snip.get("title") or "",
                                "description": snip.get("description") or "",
                                "channel_id": snip.get("channelId") or "",
                                "channel_title": snip.get("channelTitle") or "",
                                "published_at": snip.get("publishedAt"),
                                "thumbnail_url": thumb_url,
                                "view_count": int(stats.get("viewCount") or 0),
                                "like_count": int(stats.get("likeCount") or 0),
                                "comment_count": int(stats.get("commentCount") or 0),
                            })
                    elif resp.status_code == 429 or "quotaExceeded" in resp.text or (resp.status_code in (400, 403) and any(err in resp.text for err in ["API_KEY_INVALID", "API Key not found", "keyInvalid"])):
                        await self._mark_key_exhausted_global(key)
                except Exception as exc:
                    logger.warning("Error fetching videos.list: %s", exc)

        return results

    async def get_channels_details(self, channel_ids: list[str]) -> list[dict[str, Any]]:
        """
        Calls channels.list (costs 1 quota unit for up to 50 channels).
        """
        if not channel_ids:
            return []

        results: list[dict[str, Any]] = []
        chunks = [channel_ids[i:i + 50] for i in range(0, len(channel_ids), 50)]

        async with httpx.AsyncClient(timeout=25.0) as client:
            for chunk in chunks:
                key = await self.get_active_key_async()
                if not key:
                    break

                try:
                    resp = await client.get(
                        f"{YOUTUBE_API_BASE}/channels",
                        params={
                            "part": "snippet,statistics",
                            "id": ",".join(chunk),
                            "key": key,
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("items") or []:
                            cid = item.get("id")
                            stats = item.get("statistics") or {}
                            snip = item.get("snippet") or {}
                            results.append({
                                "channel_id": cid,
                                "title": snip.get("title") or "",
                                "subscriber_count": int(stats.get("subscriberCount") or 0),
                                "video_count": int(stats.get("videoCount") or 0),
                                "view_count": int(stats.get("viewCount") or 0),
                            })
                    elif resp.status_code == 429 or "quotaExceeded" in resp.text or (resp.status_code in (400, 403) and any(err in resp.text for err in ["API_KEY_INVALID", "API Key not found", "keyInvalid"])):
                        await self._mark_key_exhausted_global(key)
                except Exception as exc:
                    logger.warning("Error fetching channels.list: %s", exc)

        return results


# Global singleton instance
youtube_router = YouTubeKeyRouter()
