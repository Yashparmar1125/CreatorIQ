"""Shared Creator Context Pipeline — used by onboarding and profile reconfigure."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel_models import Channel, ChannelTone, ContentFormat
from app.models.creator_profile_models import (
    CreatorProfile,
    GeoSource,
    NicheSource,
    ProfileMaturity,
    ProfileMode,
    SyncStatus,
)
from app.repositories.channel_repository import ChannelRepository
from app.repositories.creator_profile_repository import CreatorProfileRepository


COUNTRY_TO_CODE: dict[str, str] = {
    "United States": "US",
    "United Kingdom": "UK",
    "Canada": "CA",
    "Australia": "AU",
    "India": "IN",
    "Brazil": "BR",
    "Japan": "JP",
    "Germany": "DE",
    "France": "FR",
    "Spain": "ES",
    "Mexico": "MX",
    "South Korea": "KR",
    "Italy": "IT",
}

FORMAT_UI_MAP: dict[str, str] = {
    "long-form": "long_form",
    "long_form": "long_form",
    "shorts": "shorts",
    "hybrid": "both",
    "both": "both",
}

TONE_UI_MAP: dict[str, str] = {
    "educational": "educational",
    "Educational": "educational",
    "magnetic": "entertaining",
    "Magnetic": "entertaining",
    "entertaining": "entertaining",
    "expert": "authoritative",
    "Expert": "authoritative",
    "authoritative": "authoritative",
    "casual": "conversational",
    "Casual": "conversational",
    "conversational": "conversational",
    "mixed": "mixed",
}


def classify_maturity(*, video_count: int, subscriber_count: int, view_count: int) -> ProfileMaturity:
    if video_count == 0 or view_count < 100:
        return ProfileMaturity.new
    if video_count >= 20 and (subscriber_count >= 1000 or view_count >= 10_000):
        return ProfileMaturity.established
    if video_count >= 1:
        return ProfileMaturity.emerging
    return ProfileMaturity.new


def maturity_confidence(maturity: ProfileMaturity) -> float:
    return {
        ProfileMaturity.new: 0.35,
        ProfileMaturity.emerging: 0.6,
        ProfileMaturity.established: 0.85,
    }[maturity]


def build_geo_weights(country: str | None) -> tuple[dict[str, float], GeoSource]:
    if country and country in COUNTRY_TO_CODE:
        code = COUNTRY_TO_CODE[country]
        return {code: 1.0}, GeoSource.onboarding_country
    return {"US": 0.55, "IN": 0.35, "UK": 0.10}, GeoSource.global_default


MIN_VIEWS_FOR_ANALYTICS_GEO = 1000


def resolve_geo_weights(
    country: str | None,
    *,
    analytics_weights: dict[str, float] | None,
    view_count: int,
    min_views: int = MIN_VIEWS_FOR_ANALYTICS_GEO,
) -> tuple[dict[str, float], GeoSource]:
    if analytics_weights and view_count >= min_views:
        return analytics_weights, GeoSource.youtube_analytics
    return build_geo_weights(country)


def map_content_format(value: str) -> str:
    return FORMAT_UI_MAP.get(value, "both")


def map_tone(value: str) -> str:
    return TONE_UI_MAP.get(value, "mixed")


def _content_format_enums(fmt: str) -> list[ContentFormat]:
    if fmt == "long_form":
        return [ContentFormat.long_form]
    if fmt == "shorts":
        return [ContentFormat.shorts]
    return [ContentFormat.long_form, ContentFormat.shorts]


def _tone_enum(tone: str) -> ChannelTone:
    try:
        return ChannelTone(tone)
    except ValueError:
        return ChannelTone.mixed


def merge_niches(
    *,
    onboarding: list[str],
    inferred: list[str],
    maturity: ProfileMaturity,
) -> tuple[list[str], NicheSource]:
    onboarding = [n.strip() for n in onboarding if n and n.strip()]
    inferred = [n.strip() for n in inferred if n and n.strip()]

    if maturity == ProfileMaturity.new or not inferred:
        effective = onboarding[:3] or inferred[:3]
        return effective, NicheSource.onboarding

    if maturity == ProfileMaturity.established:
        combined = list(dict.fromkeys(inferred + onboarding))[:3]
        return combined or onboarding[:3], NicheSource.channel_primary

    # emerging — blend
    combined = list(dict.fromkeys(onboarding + inferred))[:3]
    return combined or onboarding[:3], NicheSource.blended


class CreatorContextPipeline:
    def __init__(self) -> None:
        self.channel_repo = ChannelRepository()
        self.profile_repo = CreatorProfileRepository()

    async def run(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        mode: str,
        niche: list[str],
        primary_format: str,
        posting_frequency: str,
        channel_tone: str,
        country: str,
        run_analysis: bool | None = None,
    ) -> dict[str, Any]:
        channel = await self.channel_repo.get_primary_channel_by_user(db, user_id)

        video_count = int(channel.video_count) if channel else 0
        subscriber_count = int(channel.subscriber_count) if channel else 0
        view_count = int(channel.view_count) if channel else 0
        inferred: list[str] = list(channel.niches) if channel and channel.niches else []

        maturity = classify_maturity(
            video_count=video_count,
            subscriber_count=subscriber_count,
            view_count=view_count,
        )

        if run_analysis is None:
            run_analysis = maturity != ProfileMaturity.new and video_count > 0

        content_format = map_content_format(primary_format)
        tone = map_tone(channel_tone)
        analytics_weights = dict(channel.audience_geo_weights) if channel and channel.audience_geo_weights else None
        geo_weights, geo_source = resolve_geo_weights(
            country,
            analytics_weights=analytics_weights,
            view_count=view_count,
        )

        if channel:
            channel.content_formats = _content_format_enums(content_format)
            channel.tone = _tone_enum(tone)
            merged_niches = list(dict.fromkeys((channel.niches or []) + niche))[:5]
            if niche:
                channel.niches = merged_niches
            await db.flush()

        effective_niches, niche_source = merge_niches(
            onboarding=niche,
            inferred=inferred if run_analysis else [],
            maturity=maturity,
        )

        profile_mode = (
            ProfileMode.analysis_assisted
            if run_analysis and maturity != ProfileMaturity.new
            else ProfileMode.manual
        )

        sync_status = (
            SyncStatus.analysis_complete
            if run_analysis and inferred
            else SyncStatus.analysis_limited
            if maturity == ProfileMaturity.new
            else SyncStatus.essential_complete
        )

        now = datetime.now(timezone.utc)
        channel_stats = {
            "subscriber_count": subscriber_count,
            "video_count": video_count,
            "view_count": view_count,
            "engagement_rate": float(channel.engagement_rate) if channel and channel.engagement_rate else None,
            "channel_name": channel.name if channel else None,
            "thumbnail_url": channel.thumbnail_url if channel else None,
        }

        profile = await self.profile_repo.upsert(
            db,
            user_id=user_id,
            channel_id=channel.id if channel else None,
            profile_maturity=maturity,
            analysis_confidence=maturity_confidence(maturity),
            profile_mode=profile_mode,
            niches_onboarding=niche,
            niches_inferred=inferred if run_analysis else [],
            niches_effective=effective_niches,
            niche_source=niche_source,
            content_format=content_format,
            posting_frequency=posting_frequency,
            tone=tone,
            geo_source=geo_source,
            geo_target_country=country,
            audience_geo_weights=geo_weights,
            channel_stats=channel_stats,
            sync_status=sync_status,
            last_analyzed_at=now if run_analysis else None,
            onboarding_completed_at=now if mode == "onboarding" else None,
            last_reconfigured_at=now if mode == "reconfigure" else None,
        )

        return self.serialize_profile(profile)

    def serialize_profile(self, profile: CreatorProfile) -> dict[str, Any]:
        return {
            "user_id": str(profile.user_id),
            "channel_id": str(profile.channel_id) if profile.channel_id else None,
            "profile_maturity": profile.profile_maturity.value,
            "analysis_confidence": float(profile.analysis_confidence),
            "profile_mode": profile.profile_mode.value,
            "niches": {
                "effective": profile.niches_effective,
                "onboarding_selected": profile.niches_onboarding,
                "inferred": profile.niches_inferred,
                "source": profile.niche_source.value,
            },
            "content_format": profile.content_format,
            "posting_frequency": profile.posting_frequency,
            "tone": profile.tone,
            "geo": {
                "source": profile.geo_source.value,
                "target_country": profile.geo_target_country,
                "audience_weights": profile.audience_geo_weights,
            },
            "channel_stats": profile.channel_stats,
            "sync_status": profile.sync_status.value,
            "last_analyzed_at": profile.last_analyzed_at.isoformat() if profile.last_analyzed_at else None,
            "last_reconfigured_at": profile.last_reconfigured_at.isoformat() if profile.last_reconfigured_at else None,
        }
