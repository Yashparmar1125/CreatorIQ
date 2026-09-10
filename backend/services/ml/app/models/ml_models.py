import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ModelEvaluationRecord(Base):
    __tablename__ = "ml_model_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), index=True, default="trend", nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    topic: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Goodness-of-Fit & Accuracy Metrics
    mae: Mapped[float | None] = mapped_column(Float, nullable=True)
    rmse: Mapped[float | None] = mapped_column(Float, nullable=True)
    mape: Mapped[float | None] = mapped_column(Float, nullable=True)
    r2_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ci_coverage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    fit_quality: Mapped[str] = mapped_column(String(32), default="moderate", nullable=False)

    # Operational Performance
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    observations_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    data_source: Mapped[str] = mapped_column(String(64), default="real_history", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="success", nullable=False)

    # JSON Snapshot
    metrics_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )
