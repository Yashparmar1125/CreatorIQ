"""
YouTube Multi-Key Router & Daily Quota Governor.
Manages a pool of YouTube Data API v3 keys with automated failover,
strict 270 queries/day throttling, and zero fallback to dummy/synthetic data.
"""

from __future__ import annotations

import asyncio
import logging
import random
import time
from datetime import datetime, timezone, date
from typing import Any

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
            "AIzaSyCmvke7zO57ymTAQWXZK9Fj_BFQEGNZAeU",
            "AIzaSyCv7CFlKxD4QKwVrFSaEs5noYdI9jdVRJM",
            "AIzaSyBg9QvhZfJwvI8-aqeWevtm8guElEopEcE",
        ]
        for k in default_pool:
            if k not in raw_keys:
                raw_keys.append(k)

        self._keys = raw_keys
        logger.info("YouTubeKeyRouter initialized with %d API keys in pool.", len(self._keys))

    def _get_today_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def get_daily_searches_used(self) -> int:
        today = self._get_today_key()
        return self._daily_counts.get(today, 0)

    def can_make_search_query(self) -> bool:
        today = self._get_today_key()
        count = self._daily_counts.get(today, 0)
        return count < MAX_DAILY_SEARCH_QUERIES

    def _record_search_query(self) -> None:
        today = self._get_today_key()
        self._daily_counts[today] = self._daily_counts.get(today, 0) + 1
        logger.info(
            "YouTube search query executed [%d / %d today limit]",
            self._daily_counts[today],
            MAX_DAILY_SEARCH_QUERIES,
        )

    def get_active_key(self) -> str | None:
        """Returns the next available non-cooled-down API key."""
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

    def mark_key_exhausted(self, key: str, duration_seconds: float = 86400.0) -> None:
        """Puts a key on cooldown (e.g. 24h when YouTube returns 429 quota exceeded)."""
        self._key_cooldowns[key] = time.time() + duration_seconds
        logger.warning(
            "YouTube API key '...%s' hit quota/rate limit. Cooling down for %.0f seconds.",
            key[-6:],
            duration_seconds,
        )
        # Advance index to next key
        if self._keys:
            self._current_index = (self._current_index + 1) % len(self._keys)

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
        async with self._lock:
            if not self.can_make_search_query():
                logger.error(
                    "YouTube 270 queries/day limit reached (%d used). HOLDING SYSTEM. Refusing to synthesize fake data.",
                    self.get_daily_searches_used(),
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
        if published_after:
            params["publishedAfter"] = published_after.strftime("%Y-%m-%dT%H:%M:%SZ")
        if published_before:
            params["publishedBefore"] = published_before.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Try active keys in rotation
        attempts = 0
        max_attempts = len(self._keys)

        async with httpx.AsyncClient(timeout=25.0) as client:
            while attempts < max_attempts:
                key = self.get_active_key()
                if not key:
                    logger.error("All YouTube API keys in pool are exhausted. System held.")
                    raise YouTubeQuotaExceededError("All YouTube API keys exhausted. System held.")

                params["key"] = key
                attempts += 1
                try:
                    resp = await client.get(f"{YOUTUBE_API_BASE}/search", params=params)
                    if resp.status_code == 200:
                        async with self._lock:
                            self._record_search_query()
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
                        self.mark_key_exhausted(key, duration_seconds=86400.0)
                        continue
                    else:
                        logger.warning("YouTube search.list returned HTTP %d: %s", resp.status_code, resp.text[:200])
                        break
                except httpx.RequestError as req_err:
                    logger.warning("YouTube search network error on key ...%s: %s", key[-6:], req_err)
                    continue

        return []

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
                key = self.get_active_key()
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
                    elif resp.status_code == 429 or "quotaExceeded" in resp.text:
                        self.mark_key_exhausted(key)
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
                key = self.get_active_key()
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
                    elif resp.status_code == 429 or "quotaExceeded" in resp.text:
                        self.mark_key_exhausted(key)
                except Exception as exc:
                    logger.warning("Error fetching channels.list: %s", exc)

        return results


# Global singleton instance
youtube_router = YouTubeKeyRouter()
