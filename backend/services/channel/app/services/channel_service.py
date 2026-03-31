import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.channel_repository import ChannelRepository


class ChannelService:
    def __init__(self) -> None:
        self.repo = ChannelRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def list_channels(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        channels = await self.repo.list_channels_for_user(db, user_id)
        return {
            "data": {
                "channels": [
                    {
                        "id": str(c.id),
                        "youtube_channel_id": c.youtube_channel_id,
                        "name": c.name,
                        "handle": c.handle,
                        "thumbnail_url": c.thumbnail_url,
                        "subscriber_count": int(c.subscriber_count),
                        "video_count": int(c.video_count),
                        "view_count": int(c.view_count),
                        "engagement_rate": float(c.engagement_rate) if c.engagement_rate is not None else None,
                        "niches": c.niches,
                        "is_primary": c.is_primary,
                    }
                    for c in channels
                ]
            },
            "meta": {"request_id": "local-dev"},
        }

    async def channel_metrics(self, db: AsyncSession, user_id: uuid.UUID, channel_id: uuid.UUID) -> dict:
        channel = await self.repo.get_channel_for_user(db, user_id, channel_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Channel not found.", "details": {}},
            )
        m = await self.repo.latest_metrics(db, channel_id)
        return {
            "data": {
                "channel_id": str(channel_id),
                "latest": (
                    None
                    if not m
                    else {
                        "recorded_at": m.recorded_at.isoformat(),
                        "period": m.period.value,
                        "views": int(m.views),
                        "watch_time_minutes": int(m.watch_time_minutes),
                        "subscribers_gained": int(m.subscribers_gained),
                        "subscribers_lost": int(m.subscribers_lost),
                        "estimated_revenue_usd": (float(m.estimated_revenue_usd) if m.estimated_revenue_usd is not None else None),
                    }
                ),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def upsert_from_oauth(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        youtube_channel_id: str,
        name: str,
        handle: str | None,
        thumbnail_url: str | None,
        subscriber_count: int,
        video_count: int,
        view_count: int,
        engagement_rate: float | None,
        niches: list[str],
    ) -> dict:
        channel = await self.repo.upsert_channel_from_oauth(
            db,
            user_id=user_id,
            youtube_channel_id=youtube_channel_id,
            name=name,
            handle=handle,
            thumbnail_url=thumbnail_url,
            subscriber_count=subscriber_count,
            video_count=video_count,
            view_count=view_count,
            engagement_rate=engagement_rate,
            niches=niches,
        )
        await db.commit()
        return {
            "data": {
                "id": str(channel.id),
                "youtube_channel_id": channel.youtube_channel_id,
                "name": channel.name,
                "is_primary": channel.is_primary,
            },
            "meta": {"request_id": "local-dev"},
        }

    def refresh_metrics(self, channel_id: str) -> dict:
        return {
            "data": {"message": "Scaffolded internal endpoint: refresh-metrics", "channel_id": channel_id},
            "meta": {"request_id": "local-dev"},
        }

    async def get_user_channel_context(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        channel = await self.repo.get_primary_channel_context(db, user_id)
        if not channel:
            return {
                "data": {"niches": [], "content_formats": [], "tone": "mixed"},
                "meta": {"request_id": "local-dev"},
            }
        return {
            "data": {
                "niches": channel.niches,
                "content_formats": [f.value for f in channel.content_formats],
                "tone": channel.tone.value,
            },
            "meta": {"request_id": "local-dev"},
        }
