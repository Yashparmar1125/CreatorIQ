import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import UserContext, get_user_context
from app.models.planner_models import SlotStatus
from app.services.planner_service import PlannerService


router = APIRouter()
service = PlannerService()


class CreateSlotBody(BaseModel):
    channel_id: str
    scheduled_at: datetime
    topic: str = Field(..., min_length=1, max_length=500)
    status: SlotStatus = SlotStatus.not_started
    strategy_session_id: str | None = None
    trend_id: str | None = None
    notes: str | None = None


class UpdateSlotBody(BaseModel):
    scheduled_at: datetime | None = None
    topic: str | None = Field(default=None, max_length=500)
    status: SlotStatus | None = None
    notes: str | None = None


@router.get("/health")
async def health() -> dict:
    return service.health()


@router.get("/planner/slots")
async def list_slots(
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
    channel_id: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> dict:
    return await service.list_slots(
        db,
        user,
        channel_id=uuid.UUID(channel_id),
        start_date=start_date,
        end_date=end_date,
    )


@router.post("/planner/slots")
async def create_slot(
    body: CreateSlotBody,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.create_slot(
        db,
        user,
        channel_id=uuid.UUID(body.channel_id),
        scheduled_at=body.scheduled_at,
        topic=body.topic,
        status=body.status,
        strategy_session_id=uuid.UUID(body.strategy_session_id) if body.strategy_session_id else None,
        trend_id=uuid.UUID(body.trend_id) if body.trend_id else None,
        notes=body.notes,
    )


@router.patch("/planner/slots/{slot_id}")
async def update_slot(
    slot_id: str,
    body: UpdateSlotBody,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await service.update_slot(
        db,
        user,
        uuid.UUID(slot_id),
        scheduled_at=body.scheduled_at,
        topic=body.topic,
        status=body.status,
        notes=body.notes,
    )


@router.delete("/planner/slots/{slot_id}")
async def delete_slot(
    slot_id: str,
    user: UserContext = Depends(get_user_context),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await service.delete_slot(db, user, uuid.UUID(slot_id))
    return Response(status_code=204)
