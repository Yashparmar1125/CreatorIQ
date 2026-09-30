import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context
from app.services.strategy_service import StrategyService

router = APIRouter()
strategy_service = StrategyService()


class CreateSessionRequest(BaseModel):
    title: str = "New Strategy Chat"


class ChatMessageRequest(BaseModel):
    prompt: str
    session_id: str | None = None


@router.get("/strategy/sessions")
async def list_sessions(
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    sessions = await strategy_service.list_sessions(db, user.user_id)
    return {"data": sessions, "meta": {"request_id": "local-dev"}}


@router.post("/strategy/sessions")
async def create_session(
    payload: CreateSessionRequest,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    session = await strategy_service.create_session(db, user.user_id, title=payload.title)
    return {"data": session, "meta": {"request_id": "local-dev"}}


@router.get("/strategy/sessions/{session_id}")
async def get_session_messages(
    session_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    try:
        s_id = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")

    messages = await strategy_service.get_session_messages(db, user.user_id, s_id)
    return {"data": messages, "meta": {"request_id": "local-dev"}}


@router.delete("/strategy/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    try:
        s_id = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")

    success = await strategy_service.delete_session(db, user.user_id, s_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return {"data": {"deleted": True, "session_id": session_id}, "meta": {"request_id": "local-dev"}}


@router.post("/strategy/chat")
@router.post("/strategy/generate")
async def chat(
    payload: ChatMessageRequest,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if not payload.prompt.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt cannot be empty")

    s_id = None
    if payload.session_id:
        try:
            s_id = uuid.UUID(payload.session_id)
        except ValueError:
            pass

    result = await strategy_service.chat(
        db,
        user_id=user.user_id,
        session_id=s_id,
        prompt=payload.prompt.strip(),
    )
    return {"data": result, "meta": {"request_id": "local-dev"}}
