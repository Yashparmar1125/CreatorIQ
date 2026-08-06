import enum
import uuid
from datetime import datetime

from sqlalchemy import TIMESTAMP, Enum, String, func, Numeric
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProfileMaturity(str, enum.Enum):
    new = "new"
    emerging = "emerging"
    established = "established"


class NicheSource(str, enum.Enum):
    onboarding = "onboarding"
    blended = "blended"
    channel_primary = "channel_primary"


class ProfileMode(str, enum.Enum):
    manual = "manual"
    analysis_assisted = "analysis_assisted"


class GeoSource(str, enum.Enum):
    youtube_analytics = "youtube_analytics"
    onboarding_country = "onboarding_country"
    global_default = "global_default"


class SyncStatus(str, enum.Enum):
    pending = "pending"
    essential_complete = "essential_complete"
    analysis_complete = "analysis_complete"
    analysis_limited = "analysis_limited"


class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True, nullable=False)
    channel_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    profile_maturity: Mapped[ProfileMaturity] = mapped_column(
        Enum(ProfileMaturity, name="profile_maturity"), default=ProfileMaturity.new, nullable=False
    )
    analysis_confidence: Mapped[float] = mapped_column(Numeric(4, 3), default=0.3, nullable=False)
    profile_mode: Mapped[ProfileMode] = mapped_column(
        Enum(ProfileMode, name="profile_mode"), default=ProfileMode.manual, nullable=False
    )

    niches_onboarding: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list, nullable=False)
    niches_inferred: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list, nullable=False)
    niches_effective: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list, nullable=False)
    niche_source: Mapped[NicheSource] = mapped_column(
        Enum(NicheSource, name="niche_source"), default=NicheSource.onboarding, nullable=False
    )

    content_format: Mapped[str] = mapped_column(String(32), default="both", nullable=False)
    posting_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tone: Mapped[str] = mapped_column(String(32), default="mixed", nullable=False)

    geo_source: Mapped[GeoSource] = mapped_column(
        Enum(GeoSource, name="geo_source"), default=GeoSource.onboarding_country, nullable=False
    )
    geo_target_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    audience_geo_weights: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    channel_stats: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    sync_status: Mapped[SyncStatus] = mapped_column(
        Enum(SyncStatus, name="creator_sync_status"), default=SyncStatus.pending, nullable=False
    )

    last_analyzed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_reconfigured_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
