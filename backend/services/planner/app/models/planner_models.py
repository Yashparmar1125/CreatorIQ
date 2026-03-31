import enum
import uuid
from datetime import datetime

from sqlalchemy import BOOLEAN, TIMESTAMP, Enum, Float, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SlotStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    scripted = "scripted"
    ready = "ready"
    published = "published"
    skipped = "skipped"


class PlannerSlot(Base):
    __tablename__ = "planner_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    strategy_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    trend_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[SlotStatus] = mapped_column(Enum(SlotStatus, name="planner_slot_status"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    trend_window_alert_sent: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)


class PostingTimeData(Base):
    __tablename__ = "posting_time_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(16), nullable=False)
    hour_bucket: Mapped[str] = mapped_column(String(8), nullable=False)
    activity_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
