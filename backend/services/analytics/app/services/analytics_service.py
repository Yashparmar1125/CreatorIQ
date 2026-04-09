import uuid
from datetime import date
import httpx
import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.channel_access import ensure_channel_allowed
from app.core.deps import UserContext
from app.repositories.analytics_repository import AnalyticsRepository

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self) -> None:
        self.repo = AnalyticsRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def analytics_videos(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        allowed_channels: set[uuid.UUID],
        start_date: date,
        end_date: date,
        sort: str,
        order: str,
        cursor: str | None,
        limit: int,
    ) -> dict:
        _ = user
        ensure_channel_allowed(allowed_channels, channel_id)
        snap = await self.repo.latest_snapshot(db, channel_id)
        videos = []
        if snap and isinstance(snap.payload, dict):
            videos = snap.payload.get("videos") or []
        return {
            "data": {
                "videos": videos,
                "sort": sort,
                "order": order,
                "next_cursor": None,
                "channel_id": str(channel_id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def analytics_summary(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        allowed_channels: set[uuid.UUID],
        start_date: date,
        end_date: date,
    ) -> dict:
        _ = user
        ensure_channel_allowed(allowed_channels, channel_id)
        row = await self.repo.get_summary(db, channel_id, start_date, end_date)
        if not row:
            return {
                "data": {
                    "channel_id": str(channel_id),
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "summary_text": "",
                    "recommendations": {},
                    "cached": False,
                },
                "meta": {"request_id": "local-dev"},
            }
        return {
            "data": {
                "channel_id": str(channel_id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "summary_text": row.summary_text,
                "recommendations": row.recommendations,
                "cached": True,
                "generated_at": row.generated_at.isoformat(),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def analytics_benchmarks(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        allowed_channels: set[uuid.UUID],
        niche: str,
    ) -> dict:
        _ = user
        ensure_channel_allowed(allowed_channels, channel_id)
        b = await self.repo.get_benchmark(db, niche)
        if not b:
            return {
                "data": {"channel_id": str(channel_id), "niche": niche, "benchmark": None},
                "meta": {"request_id": "local-dev"},
            }
        return {
            "data": {
                "channel_id": str(channel_id),
                "niche": niche,
                "benchmark": b.payload,
                "computed_at": b.computed_at.isoformat(),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def analytics_dashboard(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        allowed_channels: set[uuid.UUID],
    ) -> dict:
        _ = user
        ensure_channel_allowed(allowed_channels, channel_id)
        
        logger.info(f"Fetching analytics dashboard for channel: {channel_id}")
        
        # 1. Fetch live token from Auth Service
        auth_data = await self._get_google_auth_data(channel_id)
        access_token = auth_data.get("access_token") if auth_data else None
        yt_id = auth_data.get("youtube_channel_id") if auth_data else None
        
        # Determine which ID to use for YouTube API (fallback to internal if UC... ID is missing)
        target_yt_id = yt_id or str(channel_id)
        
        # 2. Fetch real stats (Simulated for now, would be YT Data/Analytics API)
        total_views = 0
        
        if access_token:
            logger.info(f"Access token retrieved, calling YouTube API for channel {target_yt_id}...")
            try:
                async with httpx.AsyncClient() as client:
                    # Get channel stats as a base for "real" data
                    yt_res = await client.get(
                        "https://www.googleapis.com/youtube/v3/channels",
                        params={"part": "statistics", "id": target_yt_id},
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=10.0
                    )
                    logger.info(f"YouTube API Response Status: {yt_res.status_code}")
                    if yt_res.status_code == 200:
                        items = yt_res.json().get("items", [])
                        if items:
                            chan_data = items[0]
                            total_views = int(chan_data.get("statistics", {}).get("viewCount", 0))
                            logger.info(f"Successfully fetched live views: {total_views}")
                        else:
                            logger.warning(f"YouTube API returned no items for channel_id: {channel_id}")
                    else:
                        logger.error(f"YouTube API error: {yt_res.text}")
            except Exception as e:
                logger.error(f"Failed to fetch live YT stats from Google: {str(e)}")
        else:
            logger.warning(f"No access token found for channel {channel_id}, falling back to cache")

        snap = await self.repo.latest_snapshot(db, channel_id)
        if total_views == 0 and snap and isinstance(snap.payload, dict):
            total_views = snap.payload.get("views", 0)
            logger.info(f"Using cached views from database: {total_views}")

        return {
            "data": {
                "channel_id": str(channel_id),
                "retentionData": {
                    "intro": 88,
                    "value": 72,
                    "outro": 45
                },
                "trafficSources": [
                    { "source": 'Search', "value": 45 },
                    { "source": 'Suggested', "value": 28 },
                    { "source": 'External', "value": 17 },
                    { "source": 'Others', "value": 10 }
                ],
                "audienceDemographics": {
                    "ageGroups": [
                        { "group": '18-24', "percentage": 35 },
                        { "group": '25-34', "percentage": 42 },
                        { "group": '35+', "percentage": 23 }
                    ],
                    "locations": [
                        { "country": 'United States', "percentage": 55 },
                        { "country": 'United Kingdom', "percentage": 15 },
                        { "country": 'Germany', "percentage": 10 }
                    ]
                },
                "total_views": total_views,
                "cached": bool(snap) and total_views == 0
            },
            "meta": {"request_id": "local-dev"},
        }

    async def _get_google_auth_data(self, channel_id: uuid.UUID) -> dict | None:
        """Fetch decrypted token and metadata from Auth service."""
        try:
            from app.core.config import settings
            logger.info(f"Requesting auth data from Auth Service for {channel_id}")
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{settings.auth_service_url}/internal/auth/youtube/token/{str(channel_id)}",
                    headers={"X-Internal-Service-Token": settings.internal_service_token}
                )
                logger.info(f"Auth Service Response Status: {res.status_code}")
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    if data.get("access_token"):
                        logger.info("Successfully retrieved auth metadata from Auth Service")
                        return data
                    else:
                        logger.warning("Auth Service returned 200 but no access_token in payload")
                else:
                    logger.error(f"Auth Service returned error: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Internal auth data retrieval failed: {str(e)}")
        return None

    async def rebuild_summary(
        self,
        db: AsyncSession,
        *,
        channel_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> dict:
        text = f"Summary for {channel_id} from {start_date} to {end_date} (rebuilt)."
        recs = {"items": ["Post consistently", "Review top videos"]}
        row = await self.repo.upsert_summary(
            db, channel_id=channel_id, start_date=start_date, end_date=end_date, summary_text=text, recommendations=recs
        )
        await db.commit()
        return {
            "data": {"channel_id": str(channel_id), "summary_id": str(row.id), "rebuilt": True},
            "meta": {"request_id": "local-dev"},
        }
