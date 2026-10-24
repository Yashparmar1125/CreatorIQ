import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import desc, select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel_models import Channel, ChannelMetric, ChannelHistoricalSnapshot, ChannelVideoOutlier


class ChannelRepository:
    def health_payload(self) -> dict:
        return {"service": "channel", "status": "ok"}

    async def list_channels_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> list[Channel]:
        res = await db.execute(
            select(Channel)
            .where(Channel.user_id == user_id, Channel.deleted_at.is_(None))
            .order_by(desc(Channel.created_at))
        )
        return list(res.scalars().all())

    async def get_channel_for_user(self, db: AsyncSession, user_id: uuid.UUID, channel_id: uuid.UUID) -> Channel | None:
        res = await db.execute(
            select(Channel)
            .where(Channel.id == channel_id, Channel.user_id == user_id, Channel.deleted_at.is_(None))
        )
        return res.scalar_one_or_none()

    async def latest_metrics(self, db: AsyncSession, channel_id: uuid.UUID) -> ChannelMetric | None:
        res = await db.execute(
            select(ChannelMetric)
            .where(ChannelMetric.channel_id == channel_id)
            .order_by(desc(ChannelMetric.recorded_at))
            .limit(1)
        )
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
        # 1. If any OTHER user row currently holds this youtube_channel_id, detach it so unique constraint won't fail
        other_res = await db.execute(
            select(Channel).where(
                Channel.youtube_channel_id == youtube_channel_id,
                Channel.user_id != user_id,
            )
        )
        for other_row in other_res.scalars().all():
            other_row.youtube_channel_id = f"manual-{other_row.user_id}-{str(other_row.id)[:8]}"
        await db.flush()

        # 2. Fetch all channels for this user (including manual onboarding placeholders)
        user_channels_res = await db.execute(
            select(Channel).where(Channel.user_id == user_id).order_by(Channel.is_primary.desc(), Channel.created_at.asc())
        )
        user_channels = list(user_channels_res.scalars().all())

        # Prefer row already matching youtube_channel_id, otherwise upgrade the primary/manual row in-place
        target: Channel | None = None
        for ch in user_channels:
            if ch.youtube_channel_id == youtube_channel_id:
                target = ch
                break
        if target is None and user_channels:
            target = user_channels[0]

        if target:
            # Remove any duplicate/leftover manual rows for this user
            for ch in user_channels:
                if ch.id != target.id and ch.youtube_channel_id.startswith("manual-"):
                    await db.delete(ch)
                elif ch.id != target.id:
                    ch.is_primary = False

            target.youtube_channel_id = youtube_channel_id
            target.name = name
            target.handle = handle
            target.thumbnail_url = thumbnail_url
            target.subscriber_count = subscriber_count
            target.video_count = video_count
            target.view_count = view_count
            if engagement_rate is not None:
                target.engagement_rate = engagement_rate
            if niches:
                target.niches = niches[:5]
            target.is_primary = True
            target.deleted_at = None
            await db.flush()
            return target

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
            is_primary=True,
            niches=niches[:5] if niches else [],
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

    async def get_primary_channel_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> Channel | None:
        return await self.get_primary_channel_context(db, user_id)

    async def get_primary_channel_by_user(self, db: AsyncSession, user_id: uuid.UUID) -> Channel | None:
        """Return primary channel, or first channel if no primary flagged."""
        primary = await self.get_primary_channel_context(db, user_id)
        if primary:
            return primary
        channels = await self.list_channels_for_user(db, user_id)
        return channels[0] if channels else None

    async def patch_channel_analysis(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        engagement_rate: float | None,
        niches: list[str],
    ) -> Channel | None:
        channel = await self.get_primary_channel_by_user(db, user_id)
        if not channel:
            return None
        if engagement_rate is not None:
            channel.engagement_rate = engagement_rate
        if niches:
            channel.niches = list(dict.fromkeys((channel.niches or []) + niches))[:5]
        await db.flush()
        return channel

    async def patch_channel_geo(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        audience_geo_weights: dict[str, float],
    ) -> Channel | None:
        channel = await self.get_primary_channel_by_user(db, user_id)
        if not channel:
            return None
        channel.audience_geo_weights = audience_geo_weights
        await db.flush()
        return channel

    async def replace_channel_outliers(
        self,
        db: AsyncSession,
        channel_id: uuid.UUID,
        outliers_data: list[dict[str, Any]],
    ) -> None:
        """Purge and replace the top breakout outlier videos for a channel."""
        await db.execute(delete(ChannelVideoOutlier).where(ChannelVideoOutlier.channel_id == channel_id))

        for o in outliers_data:
            pub_date = None
            if o.get("published_at"):
                try:
                    pub_date = datetime.fromisoformat(str(o["published_at"]).replace("Z", "+00:00"))
                except Exception:
                    pass

            outlier_entry = ChannelVideoOutlier(
                channel_id=channel_id,
                youtube_video_id=str(o.get("youtube_video_id") or o.get("id") or "unknown"),
                title=str(o.get("title") or "Untitled Outlier"),
                published_at=pub_date,
                view_count=int(o.get("view_count") or o.get("views") or 0),
                reach_ratio=float(o.get("reach_ratio") or 0.0),
                is_outlier=bool(o.get("is_outlier", True)),
                format_type=str(o.get("format_type", "long_form")),
            )
            db.add(outlier_entry)
        await db.flush()

    async def get_channel_outliers(
        self,
        db: AsyncSession,
        channel_id: uuid.UUID,
        limit: int = 5,
    ) -> list[ChannelVideoOutlier]:
        """Fetch historical breakout outliers for a channel sorted by reach ratio descending."""
        res = await db.execute(
            select(ChannelVideoOutlier)
            .where(ChannelVideoOutlier.channel_id == channel_id)
            .order_by(desc(ChannelVideoOutlier.reach_ratio))
            .limit(limit)
        )
        return list(res.scalars().all())

    async def get_latest_snapshot(
        self,
        db: AsyncSession,
        channel_id: uuid.UUID,
    ) -> ChannelHistoricalSnapshot | None:
        res = await db.execute(
            select(ChannelHistoricalSnapshot)
            .where(ChannelHistoricalSnapshot.channel_id == channel_id)
            .order_by(desc(ChannelHistoricalSnapshot.calibrated_at))
            .limit(1)
        )
        return res.scalar_one_or_none()
