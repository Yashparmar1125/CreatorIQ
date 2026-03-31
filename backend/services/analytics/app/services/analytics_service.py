import uuid
from datetime import date

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
