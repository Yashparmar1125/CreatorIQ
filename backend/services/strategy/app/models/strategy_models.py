import enum
import uuid
from datetime import datetime

from sqlalchemy import INTEGER, BOOLEAN, TIMESTAMP, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SessionStatus(str, enum.Enum):
    pending = "pending"
    generating = "generating"
    complete = "complete"
    failed = "failed"


class ContentType(str, enum.Enum):
    idea = "idea"
    title = "title"
    tag_set = "tag_set"
    script_outline = "script_outline"
    thumbnail_brief = "thumbnail_brief"


class UserFeedback(str, enum.Enum):
    thumbs_up = "thumbs_up"
    thumbs_down = "thumbs_down"


class StrategySession(Base):
    __tablename__ = "strategy_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    trend_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    input_topic: Mapped[str] = mapped_column(String(500), nullable=False)
    input_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus, name="strategy_session_status"), nullable=False)
    llm_model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    llm_prompt_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    token_usage: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType, name="generated_content_type"), nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    predicted_ctr_score: Mapped[float | None] = mapped_column(NUMERIC(4, 3), nullable=True)
    performance_score: Mapped[float | None] = mapped_column(NUMERIC(5, 2), nullable=True)
    selected: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    user_feedback: Mapped[UserFeedback | None] = mapped_column(Enum(UserFeedback, name="generated_content_feedback"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
