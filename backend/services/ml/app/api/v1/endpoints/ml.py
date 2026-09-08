from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import require_internal_token
from app.services.ml_service import MlService


router = APIRouter()
service = MlService()


class TrendForecastBody(BaseModel):
    trend_id: str | None = None
    topic: str | None = None
    tvs_score: float | None = None
    lifecycle: str | None = None
    growth: float | None = None
    velocity: float | None = None
    history: list[dict[str, Any]] | None = None
    periods: int | None = 90


class ScoreIdeaBody(BaseModel):
    topic: str | None = None
    ideas: list[dict[str, Any]] | None = None


class ScoreTitleBody(BaseModel):
    titles: list[str] | None = None
    topic: str | None = None


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.post("/internal/ml/trend-forecast")
async def trend_forecast(body: TrendForecastBody, _: None = Depends(require_internal_token)) -> dict:
    return service.trend_forecast(body.model_dump(exclude_none=True))


@router.post("/internal/ml/score-idea")
async def score_idea(body: ScoreIdeaBody, _: None = Depends(require_internal_token)) -> dict:
    return service.score_idea(body.model_dump(exclude_none=True))


@router.post("/internal/ml/score-title-ctr")
async def score_title_ctr(body: ScoreTitleBody, _: None = Depends(require_internal_token)) -> dict:
    return service.score_title_ctr(body.model_dump(exclude_none=True))


@router.get("/internal/ml/health")
async def internal_health(_: None = Depends(require_internal_token)) -> dict:
    return service.internal_health()
