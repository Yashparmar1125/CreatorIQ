import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.planner_models import PlannerSlot, SlotStatus


class PlannerRepository:
    def health_payload(self) -> dict:
        return {"service": "planner", "status": "ok"}

    async def list_slots(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        channel_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[PlannerSlot]:
        start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end_dt = datetime.combine(end_date, time(23, 59, 59, 999999, tzinfo=timezone.utc))
        res = await db.execute(
            select(PlannerSlot)
            .where(
                PlannerSlot.user_id == user_id,
                PlannerSlot.channel_id == channel_id,
                PlannerSlot.deleted_at.is_(None),
                PlannerSlot.scheduled_at >= start_dt,
                PlannerSlot.scheduled_at <= end_dt,
            )
            .order_by(PlannerSlot.scheduled_at)
        )
        return list(res.scalars().all())

    async def get_slot(self, db: AsyncSession, slot_id: uuid.UUID, user_id: uuid.UUID) -> PlannerSlot | None:
        res = await db.execute(
            select(PlannerSlot).where(
                PlannerSlot.id == slot_id,
                PlannerSlot.user_id == user_id,
                PlannerSlot.deleted_at.is_(None),
            )
        )
        return res.scalar_one_or_none()

    async def create_slot(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        channel_id: uuid.UUID,
        scheduled_at: datetime,
        topic: str,
        status: SlotStatus,
        strategy_session_id: uuid.UUID | None,
        trend_id: uuid.UUID | None,
        notes: str | None,
    ) -> PlannerSlot:
        s = PlannerSlot(
            user_id=user_id,
            channel_id=channel_id,
            scheduled_at=scheduled_at,
            topic=topic,
            status=status,
            strategy_session_id=strategy_session_id,
            trend_id=trend_id,
            notes=notes,
        )
        db.add(s)
        await db.flush()
        return s

    async def update_slot(self, db: AsyncSession, slot: PlannerSlot, fields: dict) -> PlannerSlot:
        for k, v in fields.items():
            if v is not None and hasattr(slot, k):
                setattr(slot, k, v)
        await db.flush()
        return slot

    async def soft_delete(self, db: AsyncSession, slot_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        res = await db.execute(
            update(PlannerSlot)
            .where(PlannerSlot.id == slot_id, PlannerSlot.user_id == user_id, PlannerSlot.deleted_at.is_(None))
            .values(deleted_at=datetime.now(timezone.utc))
        )
        return (res.rowcount or 0) > 0
