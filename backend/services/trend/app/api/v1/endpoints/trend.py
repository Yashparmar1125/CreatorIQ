import uuid

from fastapi import APIRouter, Depends, Query
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


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/trends")
async def list_trends(
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = None,
) -> dict:
    return await service.list_trends(db, user, limit=limit, cursor=cursor)


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
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.save_trend(db, user, uuid.UUID(trend_id))


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
