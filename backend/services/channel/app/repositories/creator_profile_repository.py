import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.creator_profile_models import (
    CreatorProfile,
    GeoSource,
    NicheSource,
    ProfileMaturity,
    ProfileMode,
    SyncStatus,
)


class CreatorProfileRepository:
    async def get_by_user_id(self, db: AsyncSession, user_id: uuid.UUID) -> CreatorProfile | None:
        res = await db.execute(select(CreatorProfile).where(CreatorProfile.user_id == user_id))
        return res.scalar_one_or_none()

    async def upsert(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        channel_id: uuid.UUID | None,
        profile_maturity: ProfileMaturity,
        analysis_confidence: float,
        profile_mode: ProfileMode,
        niches_onboarding: list[str],
        niches_inferred: list[str],
        niches_effective: list[str],
        niche_source: NicheSource,
        content_format: str,
        posting_frequency: str | None,
        tone: str,
        geo_source: GeoSource,
        geo_target_country: str | None,
        audience_geo_weights: dict,
        channel_stats: dict,
        sync_status: SyncStatus,
        last_analyzed_at: datetime | None,
        onboarding_completed_at: datetime | None,
        last_reconfigured_at: datetime | None = None,
    ) -> CreatorProfile:
        existing = await self.get_by_user_id(db, user_id)
        if existing:
            existing.channel_id = channel_id
            existing.profile_maturity = profile_maturity
            existing.analysis_confidence = analysis_confidence
            existing.profile_mode = profile_mode
            existing.niches_onboarding = niches_onboarding
            existing.niches_inferred = niches_inferred
            existing.niches_effective = niches_effective
            existing.niche_source = niche_source
            existing.content_format = content_format
            existing.posting_frequency = posting_frequency
            existing.tone = tone
            existing.geo_source = geo_source
            existing.geo_target_country = geo_target_country
            existing.audience_geo_weights = audience_geo_weights
            existing.channel_stats = channel_stats
            existing.sync_status = sync_status
            if last_analyzed_at:
                existing.last_analyzed_at = last_analyzed_at
            if onboarding_completed_at:
                existing.onboarding_completed_at = onboarding_completed_at
            if last_reconfigured_at:
                existing.last_reconfigured_at = last_reconfigured_at
            await db.flush()
            return existing

        profile = CreatorProfile(
            user_id=user_id,
            channel_id=channel_id,
            profile_maturity=profile_maturity,
            analysis_confidence=analysis_confidence,
            profile_mode=profile_mode,
            niches_onboarding=niches_onboarding,
            niches_inferred=niches_inferred,
            niches_effective=niches_effective,
            niche_source=niche_source,
            content_format=content_format,
            posting_frequency=posting_frequency,
            tone=tone,
            geo_source=geo_source,
            geo_target_country=geo_target_country,
            audience_geo_weights=audience_geo_weights,
            channel_stats=channel_stats,
            sync_status=sync_status,
            last_analyzed_at=last_analyzed_at,
            onboarding_completed_at=onboarding_completed_at,
            last_reconfigured_at=last_reconfigured_at,
        )
        db.add(profile)
        await db.flush()
        return profile
