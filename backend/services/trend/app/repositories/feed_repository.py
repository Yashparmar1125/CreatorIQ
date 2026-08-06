import uuid
from datetime import datetime, timezone

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.concept_models import TrendFeedSnapshot, UserFeedCredits


class FeedRepository:
    async def get_latest_snapshot(self, db: AsyncSession, user_id: uuid.UUID) -> TrendFeedSnapshot | None:
        res = await db.execute(
            select(TrendFeedSnapshot)
            .where(TrendFeedSnapshot.user_id == user_id)
            .order_by(desc(TrendFeedSnapshot.created_at))
            .limit(1)
        )
        return res.scalar_one_or_none()

    async def save_snapshot(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        items: list[dict],
        concept_ids: list[str],
        credits_used: int,
        is_first_feed: bool,
        geo_source: str | None,
    ) -> TrendFeedSnapshot:
        snap = TrendFeedSnapshot(
            user_id=user_id,
            items=items,
            concept_ids=concept_ids,
            credits_used=credits_used,
            is_first_feed=is_first_feed,
            geo_source=geo_source,
        )
        db.add(snap)
        await db.flush()
        return snap

    async def list_history(self, db: AsyncSession, user_id: uuid.UUID, *, limit: int = 10) -> list[TrendFeedSnapshot]:
        res = await db.execute(
            select(TrendFeedSnapshot)
            .where(TrendFeedSnapshot.user_id == user_id)
            .order_by(desc(TrendFeedSnapshot.created_at))
            .limit(limit)
        )
        return list(res.scalars().all())

    async def get_snapshot_by_id(
        self, db: AsyncSession, user_id: uuid.UUID, feed_id: uuid.UUID
    ) -> TrendFeedSnapshot | None:
        res = await db.execute(
            select(TrendFeedSnapshot).where(
                TrendFeedSnapshot.id == feed_id,
                TrendFeedSnapshot.user_id == user_id,
            )
        )
        return res.scalar_one_or_none()

    async def find_enriched_item(
        self, db: AsyncSession, user_id: uuid.UUID, concept_id: uuid.UUID, *, limit: int = 20
    ) -> dict | None:
        """Return the most recent snapshot item for a concept (preserves AI enrichment)."""
        snaps = await self.list_history(db, user_id, limit=limit)
        cid = str(concept_id)
        for snap in snaps:
            for item in snap.items or []:
                if str(item.get("id")) == cid:
                    return dict(item)
        return None

    async def get_credits(self, db: AsyncSession, user_id: uuid.UUID) -> UserFeedCredits:
        res = await db.execute(select(UserFeedCredits).where(UserFeedCredits.user_id == user_id))
        row = res.scalar_one_or_none()
        if row:
            return row
        row = UserFeedCredits(user_id=user_id, credits_used=0, period_start=datetime.now(timezone.utc))
        db.add(row)
        await db.flush()
        return row

    async def increment_credits(self, db: AsyncSession, user_id: uuid.UUID, amount: int = 1) -> UserFeedCredits:
        row = await self.get_credits(db, user_id)
        row.credits_used += amount
        await db.flush()
        return row

    async def count_refreshes_this_month(self, db: AsyncSession, user_id: uuid.UUID) -> int:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        res = await db.execute(
            select(func.count())
            .select_from(TrendFeedSnapshot)
            .where(
                TrendFeedSnapshot.user_id == user_id,
                TrendFeedSnapshot.created_at >= month_start,
                TrendFeedSnapshot.is_first_feed.is_(False),
            )
        )
        return int(res.scalar_one())
