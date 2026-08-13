import uuid

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


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/channels")
async def list_channels(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.list_channels(db, user.user_id)


@router.get("/channels/me")
async def get_my_channel(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.get_my_channel(db, user.user_id)


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
    )
    await db.commit()
    return {"data": profile, "meta": {"request_id": "local-dev"}}


@router.post("/internal/channels/{channel_id}/refresh-metrics")
async def refresh_metrics(channel_id: str, _: None = Depends(require_internal_token)) -> dict:
    # Metrics ingestion will be implemented once YouTube integrations are enabled.
    return {"data": {"message": "Queued metrics refresh (dev stub)", "channel_id": channel_id}, "meta": {"request_id": "local-dev"}}


@router.get("/internal/channels/user/{user_id}/context")
async def get_user_channel_context(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    """Fetch niches, formats, and tone for the user's primary channel (Internal only)."""
    return await service.get_user_channel_context(db, uuid.UUID(user_id))
