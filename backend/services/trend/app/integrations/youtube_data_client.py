"""YouTube Data API v3 — public search + video statistics (API key, no OAuth)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.core.youtube_router import youtube_router

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeDataClient:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.youtube_api_key

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
        """Search recent videos across multi-key pool with automated failover and 270 daily query limit."""
        published_after = datetime.now(timezone.utc) - timedelta(days=published_after_days)
        return await youtube_router.search_videos(
            query=q,
            max_results=max_results,
            region_code=region_code,
            published_after=published_after,
            order=order,
        )

    async def get_video_statistics(self, video_ids: list[str]) -> dict[str, dict[str, Any]]:
        """Get statistics and snippet details for video IDs using videos.list."""
        if not video_ids:
            return {}
        items = await youtube_router.get_videos_details(video_ids)
        out: dict[str, dict[str, Any]] = {}
        for item in items:
            vid = item.get("video_id")
            if not vid:
                continue
            out[vid] = {
                "view_count": int(item.get("view_count") or 0),
                "like_count": int(item.get("like_count") or 0),
                "comment_count": int(item.get("comment_count") or 0),
                "title": item.get("title"),
                "channel_title": item.get("channel_title"),
                "published_at": item.get("published_at"),
            }
        return out
