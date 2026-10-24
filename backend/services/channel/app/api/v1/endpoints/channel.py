import uuid
from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context, require_internal_token
from app.services.channel_service import ChannelService
from app.services.creator_context_pipeline import CreatorContextPipeline


router = APIRouter()
service = ChannelService()
pipeline = CreatorContextPipeline()


class UpsertFromOAuthRequest(BaseModel):
    user_id: str
    youtube_channel_id: str | None = None
    name: str | None = None
    handle: str | None = None
    thumbnail_url: str | None = None
    subscriber_count: int | None = None
    video_count: int | None = None
    view_count: int | None = None
    engagement_rate: float | None = None
    niches: list[str] = []


class ChannelAnalysisPatch(BaseModel):
    user_id: str
    engagement_rate: float | None = None
    niches: list[str] = []


class ChannelGeoPatch(BaseModel):
    audience_geo_weights: dict[str, float]
    view_count: int


class BuildProfileRequest(BaseModel):
    user_id: str
    mode: str = "onboarding"
    niche: list[str]
    primary_format: str
    posting_frequency: str
    channel_tone: str
    country: str
    run_analysis: bool | None = None
    channel_name: str | None = None
    handle: str | None = None
    subscriber_count: int | None = None


class DeepSyncRequest(BaseModel):
    median_reach_ratio: float = 0.35
    dominant_traffic_source: str = "browse"
    speech_tempo_wpm: int = 155
    median_retention_30s_pct: float = 55.0
    analyzed_video_count: int = 0
    engagement_rate: float | None = None
    niches: list[str] = []
    top_geos: dict[str, float] = {}
    outliers: list[dict[str, Any]] = []
    detected_format: str | None = None
    detected_frequency: str | None = None
    subscriber_count: int | None = None
    video_count: int | None = None
    view_count: int | None = None
    channel_name: str | None = None
    handle: str | None = None
    thumbnail_url: str | None = None


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/channels")
async def list_channels(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.list_channels(db, user.user_id)


@router.get("/channels/me")
async def get_my_channel(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.get_my_channel(db, user.user_id)


@router.get("/channels/me/outliers")
async def get_my_outliers(
    limit: int = 5,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Fetch top breakout outlier uploads for creator's connected channel."""
    return await service.get_my_outliers(db, user.user_id, limit=limit)


@router.get("/channels/me/analysis-status")
async def get_analysis_status(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.get_analysis_status(db, user.user_id)


class UpdateProfileRequest(BaseModel):
    niches: list[str] | None = None
    content_format: str | None = None
    tone: str | None = None
    target_country: str | None = None


@router.get("/channels/profile")
async def get_creator_profile(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.get_creator_profile(db, user.user_id)


@router.put("/channels/profile")
@router.post("/channels/profile/update")
async def update_creator_profile(
    payload: UpdateProfileRequest,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.update_creator_profile(
        db,
        user_id=user.user_id,
        niches=payload.niches,
        content_format=payload.content_format,
        tone=payload.tone,
        target_country=payload.target_country,
    )


@router.post("/channels/profile/reconfigure")
async def reconfigure_creator_profile(
    user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)
) -> dict:
    """Re-run the creator context pipeline using stored profile preferences + latest channel data."""
    return await service.reconfigure_profile(db, user.user_id)


@router.get("/channels/{channel_id}/metrics")
async def channel_metrics(channel_id: str, user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.channel_metrics(db, user.user_id, uuid.UUID(channel_id))


@router.post("/internal/channels/upsert-from-oauth")
async def upsert_from_oauth(payload: UpsertFromOAuthRequest, db: AsyncSession = Depends(get_db), _: None = Depends(require_internal_token)) -> dict:
    return await service.upsert_from_oauth(
        db,
        user_id=uuid.UUID(payload.user_id),
        youtube_channel_id=payload.youtube_channel_id,
        name=payload.name,
        handle=payload.handle,
        thumbnail_url=payload.thumbnail_url,
        subscriber_count=payload.subscriber_count,
        video_count=payload.video_count,
        view_count=payload.view_count,
        engagement_rate=payload.engagement_rate,
        niches=payload.niches,
    )


@router.patch("/internal/channels/user/{user_id}/analysis")
async def patch_channel_analysis(
    user_id: str,
    payload: ChannelAnalysisPatch,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    return await service.patch_channel_analysis(
        db,
        uuid.UUID(user_id),
        engagement_rate=payload.engagement_rate,
        niches=payload.niches,
    )


@router.patch("/internal/channels/user/{user_id}/geo")
async def patch_channel_geo(
    user_id: str,
    payload: ChannelGeoPatch,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    return await service.patch_channel_geo(
        db,
        uuid.UUID(user_id),
        audience_geo_weights=payload.audience_geo_weights,
        view_count=payload.view_count,
    )


@router.post("/internal/channels/profile/build")
async def build_creator_profile(
    payload: BuildProfileRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    profile = await pipeline.run(
        db,
        user_id=uuid.UUID(payload.user_id),
        mode=payload.mode,
        niche=payload.niche,
        primary_format=payload.primary_format,
        posting_frequency=payload.posting_frequency,
        channel_tone=payload.channel_tone,
        country=payload.country,
        run_analysis=payload.run_analysis,
        channel_name=payload.channel_name,
        handle=payload.handle,
        subscriber_count=payload.subscriber_count,
    )
    await db.commit()
    return {"data": profile, "meta": {"request_id": "local-dev"}}


@router.post("/internal/channels/user/{user_id}/deep-sync")
async def save_deep_sync(
    user_id: str,
    payload: DeepSyncRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    """Store quota-efficient deep YouTube ingestion context (reach baseline, outliers, tempo)."""
    return await service.save_deep_sync(
        db,
        uuid.UUID(user_id),
        median_reach_ratio=payload.median_reach_ratio,
        dominant_traffic_source=payload.dominant_traffic_source,
        speech_tempo_wpm=payload.speech_tempo_wpm,
        median_retention_30s_pct=payload.median_retention_30s_pct,
        analyzed_video_count=payload.analyzed_video_count,
        engagement_rate=payload.engagement_rate,
        niches=payload.niches,
        top_geos=payload.top_geos,
        outliers=payload.outliers,
        detected_format=payload.detected_format,
        detected_frequency=payload.detected_frequency,
        subscriber_count=payload.subscriber_count,
        video_count=payload.video_count,
        view_count=payload.view_count,
        channel_name=payload.channel_name,
        handle=payload.handle,
        thumbnail_url=payload.thumbnail_url,
    )


@router.post("/internal/channels/user/{user_id}/disconnect-oauth")
async def disconnect_channel_oauth(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    """Unlink YouTube OAuth integration from channel service."""
    return await service.disconnect_oauth(db, uuid.UUID(user_id))


@router.post("/internal/channels/{channel_id}/refresh-metrics")
async def refresh_metrics(channel_id: str, _: None = Depends(require_internal_token)) -> dict:
    return {"data": {"message": "Queued metrics refresh (dev stub)", "channel_id": channel_id}, "meta": {"request_id": "local-dev"}}


@router.get("/internal/channels/user/{user_id}/context")
async def get_user_channel_context(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    """Fetch complete creator DNA for the user's primary channel (Internal only)."""
    return await service.get_user_channel_context(db, uuid.UUID(user_id))
