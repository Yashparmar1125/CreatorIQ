import enum
import uuid
from datetime import datetime

from sqlalchemy import BIGINT, INTEGER, BOOLEAN, TIMESTAMP, Enum, String, Text, func, Numeric
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ContentFormat(str, enum.Enum):
    long_form = "long_form"
    shorts = "shorts"
    both = "both"


class ChannelTone(str, enum.Enum):
    educational = "educational"
    entertaining = "entertaining"
    authoritative = "authoritative"
    conversational = "conversational"
    mixed = "mixed"


class MetricPeriod(str, enum.Enum):
    day = "day"
    week = "week"
    month = "month"


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    youtube_channel_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    subscriber_count: Mapped[int] = mapped_column(BIGINT, default=0, nullable=False)
    view_count: Mapped[int] = mapped_column(BIGINT, default=0, nullable=False)
    engagement_rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    video_count: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    niches: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False)
    content_formats: Mapped[list[ContentFormat]] = mapped_column(ARRAY(Enum(ContentFormat, name="channel_content_format")), nullable=False)
    tone: Mapped[ChannelTone] = mapped_column(Enum(ChannelTone, name="channel_tone"), default=ChannelTone.mixed, nullable=False)
    audience_geo_weights: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    median_reach_ratio: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    dominant_traffic_source: Mapped[str | None] = mapped_column(String(32), default="browse", nullable=True)
    speech_tempo_wpm: Mapped[int | None] = mapped_column(INTEGER, default=155, nullable=True)
    median_retention_30s_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    metrics_last_refreshed: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    is_primary: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)


class ChannelMetric(Base):
    __tablename__ = "channel_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True, nullable=False)
    period: Mapped[MetricPeriod] = mapped_column(Enum(MetricPeriod, name="channel_metric_period"), nullable=False)
    views: Mapped[int] = mapped_column(BIGINT, nullable=False)
    watch_time_minutes: Mapped[int] = mapped_column(BIGINT, nullable=False)
    subscribers_gained: Mapped[int] = mapped_column(INTEGER, nullable=False)
    subscribers_lost: Mapped[int] = mapped_column(INTEGER, nullable=False)
    estimated_revenue_usd: Mapped[float | None] = mapped_column(NUMERIC(12, 4), nullable=True)
    avg_view_duration_secs: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    avg_ctr: Mapped[float | None] = mapped_column(NUMERIC(5, 4), nullable=True)
    impressions: Mapped[int | None] = mapped_column(BIGINT, nullable=True)


class AudienceSnapshot(Base):
    __tablename__ = "audience_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), index=True, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class ChannelHistoricalSnapshot(Base):
    __tablename__ = "channel_historical_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    total_subscribers: Mapped[int] = mapped_column(BIGINT, default=0, nullable=False)
    total_views: Mapped[int] = mapped_column(BIGINT, default=0, nullable=False)
    median_reach_ratio: Mapped[float] = mapped_column(Numeric(6, 3), default=0.35, nullable=False)
    average_view_duration_seconds: Mapped[int] = mapped_column(INTEGER, default=180, nullable=False)
    median_retention_30s_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=55.0, nullable=False)
    speech_tempo_wpm: Mapped[int] = mapped_column(INTEGER, default=155, nullable=False)
    dominant_traffic_source: Mapped[str] = mapped_column(String(32), default="browse", nullable=False)
    top_geos: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    analyzed_video_count: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    calibrated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class ChannelVideoOutlier(Base):
    __tablename__ = "channel_video_outliers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    youtube_video_id: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    view_count: Mapped[int] = mapped_column(BIGINT, default=0, nullable=False)
    reach_ratio: Mapped[float] = mapped_column(Numeric(6, 3), default=0.0, nullable=False)
    is_outlier: Mapped[bool] = mapped_column(BOOLEAN, default=True, nullable=False)
    format_type: Mapped[str] = mapped_column(String(16), default="long_form", nullable=False)
    hook_transcript_first_30s: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

