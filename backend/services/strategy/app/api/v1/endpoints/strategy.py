import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context
from app.services.strategy_service import StrategyService


router = APIRouter()
service = StrategyService()


class CreateSessionBody(BaseModel):
    channel_id: str
    input_topic: str = Field(..., min_length=1, max_length=500)
    trend_id: str | None = None
    input_config: dict | None = None


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.post("/strategy/sessions")
async def create_session(
    body: CreateSessionBody,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tid = uuid.UUID(body.trend_id) if body.trend_id else None
    return await service.create_session(
        db,
        user,
        channel_id=uuid.UUID(body.channel_id),
        input_topic=body.input_topic,
        trend_id=tid,
        input_config=body.input_config,
    )


@router.get("/strategy/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.get_session(db, user, uuid.UUID(session_id))


@router.post("/strategy/sessions/{session_id}/titles")
async def generate_titles(
    session_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.generate_titles(db, user, uuid.UUID(session_id))


@router.post("/strategy/sessions/{session_id}/tags")
async def generate_tags(
    session_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.generate_tags(db, user, uuid.UUID(session_id))


@router.post("/strategy/generate-brief")
async def generate_unified_brief(
    body: dict,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    topic = body.get("topic")
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="topic is required")
    return await service.generate_unified_brief(db, user, topic)
