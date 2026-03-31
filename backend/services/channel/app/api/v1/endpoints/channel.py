import uuid

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context, require_internal_token
from app.services.channel_service import ChannelService


router = APIRouter()
service = ChannelService()


class UpsertFromOAuthRequest(BaseModel):
    user_id: str
    youtube_channel_id: str
    name: str
    handle: str | None = None
    thumbnail_url: str | None = None
    subscriber_count: int = 0
    video_count: int = 0
    view_count: int = 0
    engagement_rate: float | None = None
    niches: list[str] = []


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/channels")
async def list_channels(user: UserContext = Depends(get_user_context), db: AsyncSession = Depends(get_db)) -> dict:
    return await service.list_channels(db, user.user_id)


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
