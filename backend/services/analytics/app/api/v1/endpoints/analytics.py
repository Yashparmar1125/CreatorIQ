import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.channel_access import parse_allowed_channel_ids
from app.core.db import get_db
from app.core.deps import UserContext, get_user_context, require_internal_token
from app.services.analytics_service import AnalyticsService


router = APIRouter()
service = AnalyticsService()


class RebuildSummaryBody(BaseModel):
    channel_id: str
    start_date: date
    end_date: date


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/analytics/videos")
async def analytics_videos(
    user: UserContext = Depends(get_user_context),
    allowed: set[uuid.UUID] = Depends(parse_allowed_channel_ids),
    db: AsyncSession = Depends(get_db),
    channel_id: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    sort: str = Query(default="views"),
    order: str = Query(default="desc"),
    cursor: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
) -> dict:
    return await service.analytics_videos(
        db,
        user,
        channel_id=uuid.UUID(channel_id),
        allowed_channels=allowed,
        start_date=start_date,
        end_date=end_date,
        sort=sort,
        order=order,
        cursor=cursor,
        limit=limit,
    )


@router.get("/analytics/summary")
async def analytics_summary(
    user: UserContext = Depends(get_user_context),
    allowed: set[uuid.UUID] = Depends(parse_allowed_channel_ids),
    db: AsyncSession = Depends(get_db),
    channel_id: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> dict:
    return await service.analytics_summary(
        db,
        user,
        channel_id=uuid.UUID(channel_id),
        allowed_channels=allowed,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/analytics/benchmarks")
async def analytics_benchmarks(
    user: UserContext = Depends(get_user_context),
    allowed: set[uuid.UUID] = Depends(parse_allowed_channel_ids),
    db: AsyncSession = Depends(get_db),
    channel_id: str = Query(...),
    niche: str = Query(..., min_length=1, max_length=64),
) -> dict:
    return await service.analytics_benchmarks(
        db,
        user,
        channel_id=uuid.UUID(channel_id),
        allowed_channels=allowed,
        niche=niche,
    )


@router.get("/analytics/dashboard")
async def analytics_dashboard(
    user: UserContext = Depends(get_user_context),
    allowed: set[uuid.UUID] = Depends(parse_allowed_channel_ids),
    db: AsyncSession = Depends(get_db),
    channel_id: str = Query(...),
) -> dict:
    return await service.analytics_dashboard(
        db,
        user,
        channel_id=uuid.UUID(channel_id),
        allowed_channels=allowed,
    )


@router.post("/internal/analytics/rebuild-summary")
async def rebuild_summary(
    body: RebuildSummaryBody,
    _: None = Depends(require_internal_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.rebuild_summary(
        db,
        channel_id=uuid.UUID(body.channel_id),
        start_date=body.start_date,
        end_date=body.end_date,
    )
