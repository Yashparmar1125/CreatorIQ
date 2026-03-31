import uuid
from datetime import date, datetime, timezone

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trend_models import SavedTrend, SupportedFormat, Trend, TrendSentiment, TrendStatus


class TrendRepository:
    def health_payload(self) -> dict:
        return {"service": "trend", "status": "ok"}

    async def list_trends(
        self,
        db: AsyncSession,
        *,
        limit: int = 20,
        cursor: str | None = None,
        niches: list[str] | None = None,
        formats: list[str] | None = None,
    ) -> tuple[list[Trend], str | None]:
        q = select(Trend).order_by(desc(Trend.tvs_score), desc(Trend.scored_at))
        
        if niches:
            # Filter trends that have at least one niche in common with the user
            q = q.where(Trend.niches.overlap(niches))
        
        if formats:
            # Filter trends that support at least one of the user's preferred formats
            # Using overlap for ARRAY(Enum)
            q = q.where(Trend.supported_formats.overlap(formats))

        if cursor:
            try:
                last_id = uuid.UUID(cursor)
            except ValueError:
                last_id = None
            if last_id:
                q = q.where(Trend.id < last_id)
        
        q = q.limit(limit + 1)
        res = await db.execute(q)
        rows = list(res.scalars().all())
        next_cursor = None
        if len(rows) > limit:
            rows = rows[:limit]
            next_cursor = str(rows[-1].id)
        return rows, next_cursor

    async def get_trend(self, db: AsyncSession, trend_id: uuid.UUID) -> Trend | None:
        res = await db.execute(select(Trend).where(Trend.id == trend_id))
        return res.scalar_one_or_none()

    async def is_saved(self, db: AsyncSession, user_id: uuid.UUID, trend_id: uuid.UUID) -> bool:
        res = await db.execute(
            select(func.count()).select_from(SavedTrend).where(
                SavedTrend.user_id == user_id,
                SavedTrend.trend_id == trend_id,
            )
        )
        return (res.scalar() or 0) > 0

    async def save_trend(self, db: AsyncSession, user_id: uuid.UUID, trend_id: uuid.UUID) -> None:
        exists = await self.is_saved(db, user_id, trend_id)
        if not exists:
            db.add(SavedTrend(user_id=user_id, trend_id=trend_id))

    async def unsave_trend(self, db: AsyncSession, user_id: uuid.UUID, trend_id: uuid.UUID) -> None:
        await db.execute(delete(SavedTrend).where(SavedTrend.user_id == user_id, SavedTrend.trend_id == trend_id))

    async def ingest_batch(self, db: AsyncSession, items: list[dict]) -> int:
        now = datetime.now(timezone.utc)
        today = date.today()
        count = 0
        for row in items:
            slug = row.get("topic_slug") or row["topic"].lower().replace(" ", "-")[:500]
            res = await db.execute(select(Trend).where(Trend.topic_slug == slug))
            existing = res.scalar_one_or_none()
            if existing:
                if "tvs_score" in row:
                    existing.tvs_score = float(row["tvs_score"])
                if "prediction_confidence" in row:
                    existing.prediction_confidence = float(row["prediction_confidence"])
                existing.scored_at = row.get("scored_at") or now
                count += 1
                continue
            formats = row.get("supported_formats") or ["long_form", "shorts"]
            t = Trend(
                id=row.get("id") or uuid.uuid4(),
                topic=row["topic"],
                topic_slug=slug,
                niches=row.get("niches") or [],
                tvs_score=float(row.get("tvs_score", 0)),
                prediction_confidence=float(row.get("prediction_confidence", 0.5)),
                peak_window_start=row.get("peak_window_start") or today,
                peak_window_end=row.get("peak_window_end") or today,
                status=TrendStatus(row.get("status", "emerging")),
                sentiment=TrendSentiment(row.get("sentiment", "neutral")),
                supported_formats=[SupportedFormat(x) for x in formats],
                top_keywords=row.get("top_keywords") or [],
                description=row.get("description"),
                data_sources=row.get("data_sources") or ["ingest"],
                scored_at=row.get("scored_at") or now,
            )
            db.add(t)
            count += 1
        await db.flush()
        return count

    async def update_trend_scores(
        self,
        db: AsyncSession,
        trend_id: uuid.UUID,
        *,
        tvs_score: float,
        prediction_confidence: float,
    ) -> Trend | None:
        t = await self.get_trend(db, trend_id)
        if not t:
            return None
        t.tvs_score = tvs_score
        t.prediction_confidence = prediction_confidence
        t.scored_at = datetime.now(timezone.utc)
        await db.flush()
        return t

    async def list_saved_ids(self, db: AsyncSession, user_id: uuid.UUID) -> list[uuid.UUID]:
        res = await db.execute(select(SavedTrend.trend_id).where(SavedTrend.user_id == user_id))
        return list(res.scalars().all())
