import uuid
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_models import CreatorMemory

logger = logging.getLogger(__name__)


class MemoryRepository:
    async def get_user_memories(
        self, db: AsyncSession, user_id: uuid.UUID, *, category: str | None = None, limit: int = 25
    ) -> list[dict[str, Any]]:
        query = select(CreatorMemory).where(CreatorMemory.user_id == user_id)
        if category:
            query = query.where(CreatorMemory.category == category)
        query = query.order_by(CreatorMemory.updated_at.desc()).limit(limit)

        res = await db.execute(query)
        memories = res.scalars().all()
        return [
            {
                "id": str(m.id),
                "category": m.category,
                "key": m.key,
                "value": m.value,
                "confidence": m.confidence,
                "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            }
            for m in memories
        ]

    async def upsert_memory(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        category: str,
        key: str,
        value: str,
        confidence: float = 1.0,
    ) -> dict[str, Any]:
        existing_res = await db.execute(
            select(CreatorMemory).where(
                CreatorMemory.user_id == user_id,
                CreatorMemory.category == category,
                CreatorMemory.key == key,
            )
        )
        existing = existing_res.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if existing:
            existing.value = value
            existing.confidence = confidence
            existing.updated_at = now
            mem = existing
        else:
            mem = CreatorMemory(
                id=uuid.uuid4(),
                user_id=user_id,
                category=category,
                key=key,
                value=value,
                confidence=confidence,
                created_at=now,
                updated_at=now,
            )
            db.add(mem)

        await db.flush()
        return {
            "id": str(mem.id),
            "category": mem.category,
            "key": mem.key,
            "value": mem.value,
            "confidence": mem.confidence,
        }

    async def delete_memory(self, db: AsyncSession, user_id: uuid.UUID, memory_id: uuid.UUID) -> bool:
        res = await db.execute(
            delete(CreatorMemory).where(
                CreatorMemory.id == memory_id,
                CreatorMemory.user_id == user_id,
            )
        )
        await db.flush()
        return (res.rowcount or 0) > 0
