import uuid
from datetime import date

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics_models import AISummary, AnalyticsSnapshot, Benchmark


class AnalyticsRepository:
    def health_payload(self) -> dict:
        return {"service": "analytics", "status": "ok"}

    async def latest_snapshot(self, db: AsyncSession, channel_id: uuid.UUID) -> AnalyticsSnapshot | None:
        res = await db.execute(
            select(AnalyticsSnapshot)
            .where(AnalyticsSnapshot.channel_id == channel_id)
            .order_by(desc(AnalyticsSnapshot.created_at))
            .limit(1)
        )
        return res.scalar_one_or_none()

    async def create_snapshot(
        self, db: AsyncSession, channel_id: uuid.UUID, start_date: date, end_date: date, payload: dict
    ) -> AnalyticsSnapshot:
        snap = AnalyticsSnapshot(
            channel_id=channel_id,
            start_date=start_date,
            end_date=end_date,
            payload=payload,
        )
        db.add(snap)
        await db.flush()
        return snap

    async def get_summary(
        self, db: AsyncSession, channel_id: uuid.UUID, start_date: date, end_date: date
    ) -> AISummary | None:
        res = await db.execute(
            select(AISummary).where(
                AISummary.channel_id == channel_id,
                AISummary.start_date == start_date,
                AISummary.end_date == end_date,
            )
        )
        return res.scalar_one_or_none()

    async def get_benchmark(self, db: AsyncSession, niche: str) -> Benchmark | None:
        res = await db.execute(select(Benchmark).where(Benchmark.niche == niche).order_by(desc(Benchmark.computed_at)).limit(1))
        return res.scalar_one_or_none()

    async def upsert_summary(
        self,
        db: AsyncSession,
        *,
        channel_id: uuid.UUID,
        start_date: date,
        end_date: date,
        summary_text: str,
        recommendations: dict,
    ) -> AISummary:
        existing = await self.get_summary(db, channel_id, start_date, end_date)
        if existing:
            existing.summary_text = summary_text
            existing.recommendations = recommendations
            await db.flush()
            return existing
        row = AISummary(
            channel_id=channel_id,
            start_date=start_date,
            end_date=end_date,
            summary_text=summary_text,
            recommendations=recommendations,
        )
        db.add(row)
        await db.flush()
        return row
