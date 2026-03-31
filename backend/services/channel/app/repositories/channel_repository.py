import uuid

from sqlalchemy import desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel_models import Channel, ChannelMetric


class ChannelRepository:
    def health_payload(self) -> dict:
        return {"service": "channel", "status": "ok"}

    async def list_channels_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> list[Channel]:
        res = await db.execute(select(Channel).where(Channel.user_id == user_id, Channel.deleted_at.is_(None)).order_by(desc(Channel.created_at)))
        return list(res.scalars().all())

    async def get_channel_for_user(self, db: AsyncSession, user_id: uuid.UUID, channel_id: uuid.UUID) -> Channel | None:
        res = await db.execute(select(Channel).where(Channel.id == channel_id, Channel.user_id == user_id, Channel.deleted_at.is_(None)))
        return res.scalar_one_or_none()

    async def latest_metrics(self, db: AsyncSession, channel_id: uuid.UUID) -> ChannelMetric | None:
        res = await db.execute(select(ChannelMetric).where(ChannelMetric.channel_id == channel_id).order_by(desc(ChannelMetric.recorded_at)).limit(1))
        return res.scalar_one_or_none()

    async def upsert_channel_from_oauth(
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
    ) -> Channel:
        res = await db.execute(
            select(Channel).where(
                Channel.user_id == user_id, 
                Channel.youtube_channel_id == youtube_channel_id
            )
        )
        existing = res.scalar_one_or_none()

        if existing:
            existing.name = name
            existing.handle = handle
            existing.thumbnail_url = thumbnail_url
            existing.subscriber_count = subscriber_count
            existing.video_count = video_count
            existing.view_count = view_count
            existing.engagement_rate = engagement_rate
            existing.niches = list(set(existing.niches).union(niches))
            existing.deleted_at = None
            await db.flush()
            return existing
        else:
            # Check if this is the first channel for the user
            count_res = await db.execute(select(func.count()).select_from(Channel).where(Channel.user_id == user_id))
            has_channels = count_res.scalar_one() > 0

            channel = Channel(
                user_id=user_id,
                youtube_channel_id=youtube_channel_id,
                name=name,
                handle=handle,
                thumbnail_url=thumbnail_url,
                subscriber_count=subscriber_count,
                video_count=video_count,
                view_count=view_count,
                engagement_rate=engagement_rate,
                is_primary=not has_channels,
                niches=niches,
                content_formats=[],
            )
            db.add(channel)
            await db.flush()
            return channel

    async def get_primary_channel_context(self, db: AsyncSession, user_id: uuid.UUID) -> Channel | None:
        res = await db.execute(
            select(Channel).where(
                Channel.user_id == user_id, 
                Channel.is_primary == True,
                Channel.deleted_at.is_(None)
            )
        )
        return res.scalar_one_or_none()
