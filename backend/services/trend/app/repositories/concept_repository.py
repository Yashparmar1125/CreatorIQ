import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.concept_models import ConceptLifecycle, ConceptSignal, ConceptSignalSource, TrendConcept


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower().strip())
    return (s[:480].strip("-") or "topic")


class ConceptRepository:
    async def upsert_concept(
        self,
        db: AsyncSession,
        *,
        title: str,
        niche_tags: list[str],
        geo_strength: dict[str, float],
        youtube_video_velocity: float,
        youtube_search_velocity: float,
        google_trends_growth: float,
        search_volume_est: int,
        raw_momentum: float,
        lifecycle: ConceptLifecycle,
        why_trending: str | None,
        key_indicator: str | None,
        sources: list[str],
        aliases: list[str] | None = None,
    ) -> TrendConcept:
        slug = slugify(title)
        res = await db.execute(select(TrendConcept).where(TrendConcept.title_slug == slug))
        existing = res.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if existing:
            existing.canonical_title = title
            existing.niche_tags = list(dict.fromkeys((existing.niche_tags or []) + niche_tags))[:5]
            if geo_strength:
                existing.geo_strength = {**existing.geo_strength, **geo_strength}
            existing.youtube_video_velocity = max(float(existing.youtube_video_velocity), youtube_video_velocity)
            existing.youtube_search_velocity = max(float(existing.youtube_search_velocity), youtube_search_velocity)
            existing.google_trends_growth = max(float(existing.google_trends_growth), google_trends_growth)
            existing.search_volume_est = max(int(existing.search_volume_est), search_volume_est)
            existing.raw_momentum = max(float(existing.raw_momentum), raw_momentum)
            existing.lifecycle = lifecycle
            existing.why_trending = why_trending or existing.why_trending
            existing.key_indicator = key_indicator or existing.key_indicator
            existing.sources = list(dict.fromkeys((existing.sources or []) + sources))[:6]
            if aliases:
                existing.aliases = list(dict.fromkeys((existing.aliases or []) + aliases))[:10]
            existing.last_signal_at = now
            await db.flush()
            return existing

        concept = TrendConcept(
            canonical_title=title,
            title_slug=slug,
            aliases=aliases or [],
            niche_tags=niche_tags[:5],
            geo_strength=geo_strength or {},
            lifecycle=lifecycle,
            raw_momentum=raw_momentum,
            youtube_video_velocity=youtube_video_velocity,
            youtube_search_velocity=youtube_search_velocity,
            google_trends_growth=google_trends_growth,
            search_volume_est=search_volume_est,
            why_trending=why_trending,
            key_indicator=key_indicator,
            sources=sources,
            first_seen_at=now,
            last_signal_at=now,
        )
        db.add(concept)
        await db.flush()
        return concept

    async def add_signal(
        self,
        db: AsyncSession,
        *,
        concept_id: uuid.UUID,
        source: ConceptSignalSource,
        payload: dict,
    ) -> None:
        db.add(ConceptSignal(concept_id=concept_id, source=source, payload=payload))

    async def list_active_concepts(self, db: AsyncSession, *, max_age_days: int = 7, limit: int = 200) -> list[TrendConcept]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
        res = await db.execute(
            select(TrendConcept)
            .where(
                TrendConcept.last_signal_at >= cutoff,
                TrendConcept.lifecycle != ConceptLifecycle.expired,
            )
            .order_by(desc(TrendConcept.raw_momentum))
            .limit(limit)
        )
        return list(res.scalars().all())

    async def search_by_title(self, db: AsyncSession, q: str, *, limit: int = 20) -> list[TrendConcept]:
        pattern = f"%{q.lower()}%"
        res = await db.execute(
            select(TrendConcept)
            .where(func.lower(TrendConcept.canonical_title).like(pattern))
            .order_by(desc(TrendConcept.raw_momentum))
            .limit(limit)
        )
        return list(res.scalars().all())

    async def get_by_id(self, db: AsyncSession, concept_id: uuid.UUID) -> TrendConcept | None:
        res = await db.execute(select(TrendConcept).where(TrendConcept.id == concept_id))
        return res.scalar_one_or_none()

    async def count_concepts(self, db: AsyncSession) -> int:
        res = await db.execute(select(func.count()).select_from(TrendConcept))
        return int(res.scalar_one())
