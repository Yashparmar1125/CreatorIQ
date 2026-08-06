import uuid

from fastapi import APIRouter, Body, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context, require_internal_token
from app.services.trend_service import TrendService


router = APIRouter()
service = TrendService()


class IngestBody(BaseModel):
    items: list[dict] = Field(default_factory=list)


class SerpapiRelatedBody(BaseModel):
    q: str = Field(..., min_length=1, max_length=500)
    geo: str = ""
    hl: str = "en"
    date: str = "today 3-m"


class SaveTrendBody(BaseModel):
    """
    Optional body for saving a live (ad-hoc) trend that isn't in the DB yet.
    Pass the full trend object from the list_trends response to auto-upsert it.
    """
    trend_data: dict | None = None


class GenerateFirstFeedBody(BaseModel):
    user_id: str


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/trends")
async def list_trends(
    q: str | None = Query(default=None),
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=5, ge=1, le=10),
    cursor: str | None = None,
) -> dict:
    return await service.list_trends(db, user, q=q, limit=limit, cursor=cursor)


@router.post("/trends/refresh")
async def refresh_trends(
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.refresh_feed(db, user)


@router.get("/trends/history")
async def trends_history(
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    return await service.feed_history(db, user, limit=limit)


@router.get("/trends/history/{feed_id}")
async def get_feed_snapshot(
    feed_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.get_feed_snapshot(db, user, uuid.UUID(feed_id))


@router.get("/trends/{trend_id}")
async def trend_detail(
    trend_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.trend_detail(db, user, uuid.UUID(trend_id))


@router.post("/trends/{trend_id}/save")
async def save_trend(
    trend_id: str,
    body: SaveTrendBody = Body(default=SaveTrendBody()),
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.save_trend(db, user, uuid.UUID(trend_id), trend_data=body.trend_data)


@router.delete("/trends/{trend_id}/save")
async def unsave_trend(
    trend_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.unsave_trend(db, user, uuid.UUID(trend_id))


@router.post("/internal/trends/serpapi/related-queries")
async def serpapi_related_queries(
    body: SerpapiRelatedBody,
    _: None = Depends(require_internal_token),
) -> dict:
    """Debug/proxy: call SerpApi Google Trends RELATED_QUERIES (uses SERPAPI_API_KEY from env)."""
    return await service.serpapi_related_queries(
        q=body.q, geo=body.geo, hl=body.hl, date=body.date
    )


@router.post("/internal/trends/feeds/generate-first")
async def generate_first_feed(
    body: GenerateFirstFeedBody,
    _: None = Depends(require_internal_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.generate_first_feed(db, uuid.UUID(body.user_id))


@router.post("/internal/trends/collect")
async def run_collector(
    _: None = Depends(require_internal_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.run_collector(db)


@router.post("/internal/trends/ingest")
async def ingest_trends(
    body: IngestBody,
    _: None = Depends(require_internal_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.ingest_trends(db, body.items)


@router.post("/internal/trends/{trend_id}/recompute-score")
async def recompute_score(
    trend_id: str,
    _: None = Depends(require_internal_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.recompute_score(db, uuid.UUID(trend_id))
