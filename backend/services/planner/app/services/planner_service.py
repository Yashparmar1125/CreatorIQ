import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import UserContext
from app.models.planner_models import SlotStatus
from app.repositories.planner_repository import PlannerRepository


class PlannerService:
    def __init__(self) -> None:
        self.repo = PlannerRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    def _slot_dict(self, s) -> dict:
        return {
            "id": str(s.id),
            "channel_id": str(s.channel_id),
            "scheduled_at": s.scheduled_at.isoformat(),
            "topic": s.topic,
            "strategy_session_id": str(s.strategy_session_id) if s.strategy_session_id else None,
            "trend_id": str(s.trend_id) if s.trend_id else None,
            "status": s.status.value,
            "notes": s.notes,
        }

    async def list_slots(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> dict:
        rows = await self.repo.list_slots(db, user_id=user.user_id, channel_id=channel_id, start_date=start_date, end_date=end_date)
        return {"data": {"slots": [self._slot_dict(s) for s in rows]}, "meta": {"request_id": "local-dev"}}

    async def create_slot(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        channel_id: uuid.UUID,
        scheduled_at: datetime,
        topic: str,
        status: SlotStatus,
        strategy_session_id: uuid.UUID | None,
        trend_id: uuid.UUID | None,
        notes: str | None,
    ) -> dict:
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        s = await self.repo.create_slot(
            db,
            user_id=user.user_id,
            channel_id=channel_id,
            scheduled_at=scheduled_at,
            topic=topic,
            status=status,
            strategy_session_id=strategy_session_id,
            trend_id=trend_id,
            notes=notes,
        )
        await db.commit()
        return {"data": self._slot_dict(s), "meta": {"request_id": "local-dev"}}

    async def update_slot(
        self,
        db: AsyncSession,
        user: UserContext,
        slot_id: uuid.UUID,
        *,
        scheduled_at: datetime | None,
        topic: str | None,
        status: SlotStatus | None,
        notes: str | None,
    ) -> dict:
        slot = await self.repo.get_slot(db, slot_id, user.user_id)
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Slot not found.", "details": {}},
            )
        fields: dict = {}
        if scheduled_at is not None:
            if scheduled_at.tzinfo is None:
                scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
            fields["scheduled_at"] = scheduled_at
        if topic is not None:
            fields["topic"] = topic
        if status is not None:
            fields["status"] = status
        if notes is not None:
            fields["notes"] = notes
        await self.repo.update_slot(db, slot, fields)
        await db.commit()
        return {"data": self._slot_dict(slot), "meta": {"request_id": "local-dev"}}

    async def delete_slot(self, db: AsyncSession, user: UserContext, slot_id: uuid.UUID) -> None:
        ok = await self.repo.soft_delete(db, slot_id, user.user_id)
        if not ok:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Slot not found.", "details": {}},
            )
        await db.commit()
