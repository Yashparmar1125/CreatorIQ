import uuid
from datetime import date
import httpx

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.channel_access import ensure_channel_allowed
from app.core.deps import UserContext
from app.repositories.analytics_repository import AnalyticsRepository


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
        
        # 1. Fetch live token from Auth Service
        access_token = await self._get_google_token(channel_id)
        
        # 2. Fetch real stats (Simulated for now, would be YT Data/Analytics API)
        # In a real scenario, we'd call https://youtubeanalytics.googleapis.com/v2/reports
        total_views = 0
        subscriber_growth = 0
        
        if access_token:
            try:
                async with httpx.AsyncClient() as client:
                    # Get channel stats as a base for "real" data
                    yt_res = await client.get(
                        "https://www.googleapis.com/youtube/v3/channels",
                        params={"part": "statistics", "id": str(channel_id)},
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    if yt_res.status_code == 200:
                        chan_data = yt_res.json().get("items", [{}])[0]
                        total_views = int(chan_data.get("statistics", {}).get("viewCount", 0))
            except Exception as e:
                print(f"Failed to fetch live YT stats: {e}")

        snap = await self.repo.latest_snapshot(db, channel_id)
        if total_views == 0 and snap and isinstance(snap.payload, dict):
            total_views = snap.payload.get("views", 0)

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

    async def _get_google_token(self, channel_id: uuid.UUID) -> str | None:
        """Fetch decrypted token from Auth service."""
        try:
            from app.core.config import settings
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{settings.auth_service_url}/internal/auth/youtube/token/{str(channel_id)}",
                    headers={"X-Internal-Service-Token": settings.internal_service_token}
                )
                if res.status_code == 200:
                    return res.json().get("data", {}).get("access_token")
        except Exception as e:
            print(f"Token retrieval failed: {e}")
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
