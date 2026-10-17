"""Trend Engine v1 — concept store and feed snapshots."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    BOOLEAN,
    DATE,
    FLOAT,
    INTEGER,
    TIMESTAMP,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Fitness", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(BOOLEAN, default=True, nullable=False)
    is_dynamic: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    discovery_source: Mapped[str] = mapped_column(String(50), default="yaml_seed", nullable=False)
    confidence_score: Mapped[float] = mapped_column(FLOAT, default=1.0, nullable=False)
    last_decay_check: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    include_terms: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    exclude_terms: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    daily_signals: Mapped[list["ConceptDailySignal"]] = relationship(
        "ConceptDailySignal", back_populates="concept", cascade="all, delete-orphan"
    )


class ConceptCandidate(Base):
    __tablename__ = "concept_candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proposed_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="General", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    include_terms: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    exclude_terms: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    discovery_source: Mapped[str] = mapped_column(String(50), nullable=False)  # 'youtube_popular', 'google_trends', 'tavily'
    raw_signals: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    confidence_score: Mapped[float] = mapped_column(FLOAT, default=0.5, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)  # 'pending', 'promoted', 'rejected'
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_concept_candidates_status", "status"),
    )


class ConceptDailySignal(Base):
    __tablename__ = "concept_daily_signals"

    id: Mapped[int] = mapped_column(INTEGER, primary_key=True, autoincrement=True)
    concept_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False
    )
    concept_name: Mapped[str] = mapped_column(String(255), nullable=False)
    processed_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    video_date: Mapped[date] = mapped_column(DATE, nullable=False)
    population_size: Mapped[int] = mapped_column(INTEGER, nullable=False)

    # Core daily signals
    reach_ratio_median: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    interaction_density_median: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    semantic_score_mean: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    trend_score_median: Mapped[float | None] = mapped_column(FLOAT, nullable=True)

    # Outlier tracking
    top_outlier_video_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    top_outlier_reach_ratio: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    top_outlier_interaction_density: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    top_outlier_semantic_score: Mapped[float | None] = mapped_column(FLOAT, nullable=True)
    top_outlier_channel_tier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    outlier_streak: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)

    # Population composition
    big_channel_count: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    medium_channel_count: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    small_channel_count: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)

    # Full audit trail
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    population: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    high_variance_flags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    filter_audit: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    concept: Mapped["Concept"] = relationship("Concept", back_populates="daily_signals")

    __table_args__ = (
        Index("idx_concept_signals_concept_date", "concept_id", "video_date"),
        UniqueConstraint("concept_id", "video_date", name="uq_concept_id_video_date"),
    )


class ApiRequestLog(Base):
    __tablename__ = "api_request_logs"

    id: Mapped[int] = mapped_column(INTEGER, primary_key=True, autoincrement=True)
    requested_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    api_name: Mapped[str] = mapped_column(String(50), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(100), nullable=False)
    operation: Mapped[str] = mapped_column(String(100), nullable=False)
    http_status: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    quota_cost: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    attempt: Mapped[int] = mapped_column(INTEGER, default=1, nullable=False)
    success: Mapped[bool] = mapped_column(BOOLEAN, nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __table_args__ = (
        Index("idx_api_logs_requested_at", "requested_at"),
    )


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

