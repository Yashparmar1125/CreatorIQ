"""Trend Engine v1 — concept store and feed snapshots."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import BOOLEAN, INTEGER, TIMESTAMP, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ConceptLifecycle(str, enum.Enum):
    emerging = "emerging"
    growing = "growing"
    peaking = "peaking"
    declining = "declining"
    expired = "expired"


class ConceptSignalSource(str, enum.Enum):
    youtube_search = "youtube_search"
    youtube_video = "youtube_video"
    google_trends = "google_trends"
    news = "news"


class TrendConcept(Base):
    __tablename__ = "trend_concepts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_slug: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String(256)), nullable=False, server_default="{}")
    niche_tags: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False, server_default="{}")
    geo_strength: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    lifecycle: Mapped[ConceptLifecycle] = mapped_column(
        Enum(ConceptLifecycle, name="concept_lifecycle"), default=ConceptLifecycle.emerging, nullable=False
    )
    raw_momentum: Mapped[float] = mapped_column(NUMERIC(6, 3), default=0, nullable=False)
    youtube_video_velocity: Mapped[float] = mapped_column(NUMERIC(6, 3), default=0, nullable=False)
    youtube_search_velocity: Mapped[float] = mapped_column(NUMERIC(6, 3), default=0, nullable=False)
    google_trends_growth: Mapped[float] = mapped_column(NUMERIC(6, 3), default=0, nullable=False)
    search_volume_est: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    why_trending: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_indicator: Mapped[str | None] = mapped_column(String(256), nullable=True)
    sources: Mapped[list[str]] = mapped_column(ARRAY(String(32)), nullable=False, server_default="{}")
    first_seen_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    last_signal_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ConceptSignal(Base):
    __tablename__ = "concept_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    concept_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    source: Mapped[ConceptSignalSource] = mapped_column(
        Enum(ConceptSignalSource, name="concept_signal_source"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    captured_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class TrendFeedSnapshot(Base):
    __tablename__ = "trend_feed_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    items: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    concept_ids: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False, server_default="{}")
    credits_used: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    is_first_feed: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    geo_source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class UserFeedCredits(Base):
    __tablename__ = "user_feed_credits"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    credits_used: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    period_start: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
