"""Repository for persisting and querying ML model evaluations."""

import json
import logging
import os
import uuid
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.ml_models import ModelEvaluationRecord

logger = logging.getLogger(__name__)


class MlEvaluationRepository:
    async def save_evaluation(
        self,
        db: AsyncSession | None,
        *,
        model_name: str,
        topic: str,
        entity_type: str = "trend",
        entity_id: str | None = None,
        mae: float | None = None,
        rmse: float | None = None,
        mape: float | None = None,
        r2_score: float | None = None,
        ci_coverage_pct: float | None = None,
        fit_quality: str = "moderate",
        latency_ms: float = 0.0,
        observations_count: int = 0,
        data_source: str = "real_history",
        status: str = "success",
        metrics_payload: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> ModelEvaluationRecord | None:
        if db is None:
            return None

        try:
            record = ModelEvaluationRecord(
                model_name=model_name,
                topic=topic,
                entity_type=entity_type,
                entity_id=entity_id,
                mae=mae,
                rmse=rmse,
                mape=mape,
                r2_score=r2_score,
                ci_coverage_pct=ci_coverage_pct,
                fit_quality=fit_quality,
                latency_ms=latency_ms,
                observations_count=observations_count,
                data_source=data_source,
                status=status,
                metrics_payload=metrics_payload,
                error_message=error_message,
            )
            db.add(record)
            await db.commit()
            await db.refresh(record)
            return record
        except Exception as exc:
            logger.warning("Could not persist ML evaluation to database: %s", exc)
            try:
                await db.rollback()
            except Exception:
                pass
            return None

    async def get_summary(self, db: AsyncSession | None) -> dict[str, Any]:
        """Returns aggregate model performance metrics across all evaluations."""
        if db is not None:
            try:
                stmt = select(
                    func.count(ModelEvaluationRecord.id).label("total"),
                    func.avg(ModelEvaluationRecord.mae).label("avg_mae"),
                    func.avg(ModelEvaluationRecord.rmse).label("avg_rmse"),
                    func.avg(ModelEvaluationRecord.r2_score).label("avg_r2"),
                    func.avg(ModelEvaluationRecord.ci_coverage_pct).label("avg_ci_cov"),
                    func.avg(ModelEvaluationRecord.latency_ms).label("avg_latency"),
                )
                res = await db.execute(stmt)
                row = res.one_or_none()

                if row and row.total > 0:
                    # Breakdown by source
                    source_stmt = select(
                        ModelEvaluationRecord.data_source,
                        func.count(ModelEvaluationRecord.id),
                    ).group_by(ModelEvaluationRecord.data_source)
                    source_res = await db.execute(source_stmt)
                    sources = {r[0]: r[1] for r in source_res.all()}

                    # Breakdown by quality
                    qual_stmt = select(
                        ModelEvaluationRecord.fit_quality,
                        func.count(ModelEvaluationRecord.id),
                    ).group_by(ModelEvaluationRecord.fit_quality)
                    qual_res = await db.execute(qual_stmt)
                    quality = {r[0]: r[1] for r in qual_res.all()}

                    return {
                        "total_evaluations": int(row.total or 0),
                        "avg_mae": round(float(row.avg_mae or 0.0), 3),
                        "avg_rmse": round(float(row.avg_rmse or 0.0), 3),
                        "avg_r2_score": round(float(row.avg_r2 or 0.0), 3),
                        "avg_ci_coverage_pct": round(float(row.avg_ci_cov or 0.0), 1),
                        "avg_latency_ms": round(float(row.avg_latency or 0.0), 2),
                        "sources_breakdown": sources,
                        "quality_breakdown": quality,
                        "storage_tier": "postgresql_and_jsonl",
                    }
            except Exception as exc:
                logger.info("DB evaluation summary fallback to file log: %s", exc)

        # Fallback to reading file log
        return self._summary_from_file_log()

    async def get_recent_evaluations(
        self,
        db: AsyncSession | None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Returns the most recent evaluation records."""
        if db is not None:
            try:
                stmt = (
                    select(ModelEvaluationRecord)
                    .order_by(desc(ModelEvaluationRecord.created_at))
                    .limit(limit)
                )
                res = await db.execute(stmt)
                records = res.scalars().all()
                if records:
                    return [
                        {
                            "id": str(r.id),
                            "timestamp": r.created_at.isoformat(),
                            "model_name": r.model_name,
                            "entity_type": r.entity_type,
                            "entity_id": r.entity_id,
                            "topic": r.topic,
                            "mae": r.mae,
                            "rmse": r.rmse,
                            "mape": r.mape,
                            "r2_score": r.r2_score,
                            "ci_coverage_pct": r.ci_coverage_pct,
                            "fit_quality": r.fit_quality,
                            "latency_ms": r.latency_ms,
                            "observations_count": r.observations_count,
                            "data_source": r.data_source,
                            "status": r.status,
                            "metrics_payload": r.metrics_payload,
                        }
                        for r in records
                    ]
            except Exception as exc:
                logger.info("DB recent evaluations fallback to file log: %s", exc)

        # Fallback to reading recent entries from file log
        return self._recent_from_file_log(limit=limit)

    def _recent_from_file_log(self, limit: int = 50) -> list[dict[str, Any]]:
        log_path = settings.evaluation_log_path
        if not os.path.exists(log_path):
            return []

        entries = []
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        acc = data.get("accuracy", {})
                        entries.append({
                            "id": str(uuid.uuid4()),
                            "timestamp": data.get("timestamp"),
                            "model_name": data.get("model_name"),
                            "entity_type": data.get("entity_type", "trend"),
                            "entity_id": data.get("entity_id"),
                            "topic": data.get("topic"),
                            "mae": acc.get("mae"),
                            "rmse": acc.get("rmse"),
                            "mape": acc.get("mape_pct"),
                            "r2_score": acc.get("r2_score"),
                            "ci_coverage_pct": acc.get("ci_coverage_pct"),
                            "fit_quality": acc.get("fit_quality", "moderate"),
                            "latency_ms": data.get("latency_ms", 0.0),
                            "observations_count": data.get("observations_count", 0),
                            "data_source": data.get("data_source", "real_history"),
                            "status": data.get("status", "success"),
                            "metrics_payload": acc,
                        })
                        if len(entries) >= limit:
                            break
                    except Exception:
                        continue
        except Exception:
            pass
        return entries

    def _summary_from_file_log(self) -> dict[str, Any]:
        log_path = settings.evaluation_log_path
        if not os.path.exists(log_path):
            return {
                "total_evaluations": 0,
                "avg_mae": 0.0,
                "avg_rmse": 0.0,
                "avg_r2_score": 1.0,
                "avg_ci_coverage_pct": 100.0,
                "avg_latency_ms": 0.0,
                "sources_breakdown": {},
                "quality_breakdown": {},
                "storage_tier": "jsonl_log_file",
            }

        maes, rmses, r2s, covs, lats = [], [], [], [], []
        sources = {}
        qualities = {}
        total = 0

        try:
            with open(log_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        acc = data.get("accuracy", {})
                        total += 1
                        if acc.get("mae") is not None:
                            maes.append(float(acc["mae"]))
                        if acc.get("rmse") is not None:
                            rmses.append(float(acc["rmse"]))
                        if acc.get("r2_score") is not None:
                            r2s.append(float(acc["r2_score"]))
                        if acc.get("ci_coverage_pct") is not None:
                            covs.append(float(acc["ci_coverage_pct"]))
                        if data.get("latency_ms") is not None:
                            lats.append(float(data["latency_ms"]))

                        src = data.get("data_source", "real_history")
                        sources[src] = sources.get(src, 0) + 1

                        qual = acc.get("fit_quality", "moderate")
                        qualities[qual] = qualities.get(qual, 0) + 1
                    except Exception:
                        continue
        except Exception:
            pass

        return {
            "total_evaluations": total,
            "avg_mae": round(sum(maes) / max(1, len(maes)), 3),
            "avg_rmse": round(sum(rmses) / max(1, len(rmses)), 3),
            "avg_r2_score": round(sum(r2s) / max(1, len(r2s)), 3),
            "avg_ci_coverage_pct": round(sum(covs) / max(1, len(covs)), 1),
            "avg_latency_ms": round(sum(lats) / max(1, len(lats)), 2),
            "sources_breakdown": sources,
            "quality_breakdown": qualities,
            "storage_tier": "jsonl_log_file",
        }
