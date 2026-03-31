import enum
import uuid
from datetime import date, datetime

from sqlalchemy import INTEGER, TIMESTAMP, DATE, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TrendStatus(str, enum.Enum):
    emerging = "emerging"
    peaking = "peaking"
    peaked = "peaked"
    declining = "declining"


class TrendSentiment(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"
    mixed = "mixed"


class SupportedFormat(str, enum.Enum):
    long_form = "long_form"
    shorts = "shorts"
    both = "both"


class SignalSource(str, enum.Enum):
    google_trends = "google_trends"
    youtube_data = "youtube_data"
    cross_platform = "cross_platform"


class Trend(Base):
    __tablename__ = "trends"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    topic_slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    niches: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False)
    tvs_score: Mapped[float] = mapped_column(NUMERIC(5, 2), nullable=False)
    prediction_confidence: Mapped[float] = mapped_column(NUMERIC(4, 3), nullable=False)
    peak_window_start: Mapped[date] = mapped_column(DATE, nullable=False)
    peak_window_end: Mapped[date] = mapped_column(DATE, nullable=False)
    status: Mapped[TrendStatus] = mapped_column(Enum(TrendStatus, name="trend_status"), nullable=False)
    sentiment: Mapped[TrendSentiment] = mapped_column(Enum(TrendSentiment, name="trend_sentiment"), default=TrendSentiment.neutral, nullable=False)
    supported_formats: Mapped[list[SupportedFormat]] = mapped_column(ARRAY(Enum(SupportedFormat, name="supported_format")), nullable=False)
    top_keywords: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_sources: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False)
    scored_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class TrendSignal(Base):
    __tablename__ = "trend_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trend_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    signal_source: Mapped[SignalSource] = mapped_column(Enum(SignalSource, name="signal_source"), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True, nullable=False)
    relative_interest: Mapped[float] = mapped_column(NUMERIC(5, 2), nullable=False)
    search_volume_est: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    region: Mapped[str] = mapped_column(String(10), default="GLOBAL", nullable=False)


class SavedTrend(Base):
    __tablename__ = "saved_trends"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    trend_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
