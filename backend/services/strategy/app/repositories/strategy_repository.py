import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategy_models import ContentType, GeneratedContent, SessionStatus, StrategySession


class StrategyRepository:
    def health_payload(self) -> dict:
        return {"service": "strategy", "status": "ok"}

    async def create_session(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        channel_id: uuid.UUID,
        trend_id: uuid.UUID | None,
        input_topic: str,
        input_config: dict,
        status: SessionStatus,
        llm_model_version: str,
    ) -> StrategySession:
        s = StrategySession(
            user_id=user_id,
            channel_id=channel_id,
            trend_id=trend_id,
            input_topic=input_topic,
            input_config=input_config,
            status=status,
            llm_model_version=llm_model_version,
        )
        db.add(s)
        await db.flush()
        return s

    async def get_session_for_user(
        self, db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> StrategySession | None:
        res = await db.execute(
            select(StrategySession).where(StrategySession.id == session_id, StrategySession.user_id == user_id)
        )
        return res.scalar_one_or_none()

    async def list_generated(self, db: AsyncSession, session_id: uuid.UUID) -> list[GeneratedContent]:
        res = await db.execute(select(GeneratedContent).where(GeneratedContent.session_id == session_id))
        return list(res.scalars().all())

    async def add_generated(
        self,
        db: AsyncSession,
        *,
        session_id: uuid.UUID,
        content_type: ContentType,
        content: dict,
        predicted_ctr_score: float | None = None,
        performance_score: float | None = None,
    ) -> GeneratedContent:
        g = GeneratedContent(
            session_id=session_id,
            content_type=content_type,
            content=content,
            predicted_ctr_score=predicted_ctr_score,
            performance_score=performance_score,
        )
        db.add(g)
        await db.flush()
        return g
