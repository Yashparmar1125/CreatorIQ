"""
YouTube mostPopular Harvester — ultra-low quota (1 unit per call).
Fetches breakout viral videos by category and region to discover emerging creator trends.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.core.youtube_router import youtube_router

logger = logging.getLogger(__name__)

YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

CATEGORY_MAP: dict[str, str] = {
    "0": "General",                  # All trending topics (Lifestyle, Culture)
    "28": "Tech",                    # Science & Technology
    "17": "Fitness",                 # Sports / Fitness / Gym
    "20": "Gaming",                  # Gaming
    "24": "Entertainment",           # Entertainment
    "25": "News & Current Affairs",  # News & Politics (breaking events, debates, controversies)
    "27": "Education",               # Education / Explainers / Analysis
}


class YouTubePopularHarvester:
    """Fetches high-velocity trending videos from the mostPopular chart at 1 unit/request."""

    def __init__(self) -> None:
        pass

    async def fetch_popular_videos(
        self,
        *,
        categories: list[str] | None = None,
        regions: list[str] | None = None,
        max_results_per_cat: int = 25,
    ) -> list[dict[str, Any]]:
        target_cats = categories or list(CATEGORY_MAP.keys())
        target_regions = regions or ["IN", "US"]
        all_videos: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            for region in target_regions:
                for cat_id in target_cats:
                    key = await youtube_router.get_active_key_async() or settings.youtube_api_key
                    if not key:
                        logger.warning("No active YouTube API key available for mostPopular harvest.")
                        break

                    cat_name = CATEGORY_MAP.get(cat_id, "General")
                    try:
                        resp = await client.get(
                            YOUTUBE_VIDEOS_URL,
                            params={
                                "part": "snippet,statistics,contentDetails",
                                "chart": "mostPopular",
                                "regionCode": region,
                                "videoCategoryId": cat_id,
                                "maxResults": min(max_results_per_cat, 50),
                                "key": key,
                            },
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            items = data.get("items") or []
                            for item in items:
                                snippet = item.get("snippet") or {}
                                stats = item.get("statistics") or {}
                                title = snippet.get("title") or ""
                                if not title:
                                    continue
                                all_videos.append(
                                    {
                                        "video_id": item.get("id"),
                                        "title": title,
                                        "description": (snippet.get("description") or "")[:400],
                                        "channel_id": snippet.get("channelId"),
                                        "channel_title": snippet.get("channelTitle") or "",
                                        "category_id": cat_id,
                                        "category": cat_name,
                                        "region": region,
                                        "view_count": int(stats.get("viewCount") or 0),
                                        "like_count": int(stats.get("likeCount") or 0),
                                        "comment_count": int(stats.get("commentCount") or 0),
                                        "published_at": snippet.get("publishedAt"),
                                        "tags": snippet.get("tags") or [],
                                        "source": "youtube_popular",
                                    }
                                )
                        elif resp.status_code == 429 or "quotaExceeded" in resp.text:
                            logger.warning("Quota exceeded on key ending in %s, marking exhausted.", key[-6:])
                            await youtube_router._mark_key_exhausted_global(key)
                        else:
                            logger.warning(
                                "mostPopular failed for cat %s region %s: HTTP %s",
                                cat_id,
                                region,
                                resp.status_code,
                            )
                    except Exception as exc:
                        logger.warning("mostPopular call error for cat %s: %s", cat_id, exc)

        logger.info("Harvested %d trending videos from YouTube mostPopular charts.", len(all_videos))
        return all_videos
