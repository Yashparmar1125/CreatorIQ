"""YouTube Data API v3 — public search + video statistics (API key, no OAuth)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.config import settings

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeDataClient:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.youtube_api_key

    def _require_key(self) -> str:
        if not self.api_key:
            raise RuntimeError("YOUTUBE_API_KEY / youtube_api_key is not set")
        return self.api_key

    async def search_videos(
        self,
        *,
        q: str,
        region_code: str = "IN",
        published_after_days: int = 7,
        order: str = "viewCount",
        video_duration: str = "any",
        max_results: int = 15,
    ) -> list[dict[str, Any]]:
        """Search recent videos. order: viewCount | date | rating"""
        key = self._require_key()
        published_after = (
            datetime.now(timezone.utc) - timedelta(days=published_after_days)
        ).strftime("%Y-%m-%dT%H:%M:%SZ")

        params: dict[str, Any] = {
            "part": "snippet",
            "q": q,
            "type": "video",
            "order": order,
            "publishedAfter": published_after,
            "regionCode": region_code,
            "maxResults": min(max_results, 50),
            "key": key,
            "safeSearch": "moderate",
            "relevanceLanguage": "en",
        }
        if video_duration in ("short", "medium", "long"):
            params["videoDuration"] = video_duration

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(f"{YOUTUBE_API_BASE}/search", params=params)
            r.raise_for_status()
            data = r.json()

        items: list[dict[str, Any]] = []
        for item in data.get("items") or []:
            if item.get("id", {}).get("kind") != "youtube#video":
                continue
            vid = item.get("id", {}).get("videoId")
            snip = item.get("snippet") or {}
            if not vid or not snip.get("title"):
                continue
            items.append(
                {
                    "video_id": vid,
                    "title": snip.get("title", "").strip(),
                    "channel_id": snip.get("channelId"),
                    "channel_title": snip.get("channelTitle", ""),
                    "published_at": snip.get("publishedAt"),
                    "description": (snip.get("description") or "")[:500],
                    "thumbnails": snip.get("thumbnails") or {},
                }
            )
        return items

    async def get_video_statistics(self, video_ids: list[str]) -> dict[str, dict[str, Any]]:
        if not video_ids:
            return {}
        key = self._require_key()
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(
                f"{YOUTUBE_API_BASE}/videos",
                params={
                    "part": "statistics,contentDetails,snippet",
                    "id": ",".join(video_ids[:50]),
                    "key": key,
                },
            )
            r.raise_for_status()
            data = r.json()

        out: dict[str, dict[str, Any]] = {}
        for item in data.get("items") or []:
            vid = item.get("id")
            if not vid:
                continue
            stats = item.get("statistics") or {}
            out[vid] = {
                "view_count": int(stats.get("viewCount") or 0),
                "like_count": int(stats.get("likeCount") or 0),
                "comment_count": int(stats.get("commentCount") or 0),
                "duration": (item.get("contentDetails") or {}).get("duration"),
                "title": (item.get("snippet") or {}).get("title"),
                "channel_title": (item.get("snippet") or {}).get("channelTitle"),
                "published_at": (item.get("snippet") or {}).get("publishedAt"),
            }
        return out
