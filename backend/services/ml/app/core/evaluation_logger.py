"""Structured JSON Lines logger for ML model evaluations and performance audit."""

import json
import logging
import os
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from typing import Any

from app.core.config import settings

# Dedicated logger for ML evaluations
EVAL_LOGGER_NAME = "ml_evaluations"
eval_logger = logging.getLogger(EVAL_LOGGER_NAME)
eval_logger.setLevel(logging.INFO)
eval_logger.propagate = False  # Keep out of root stdout to avoid clutter

_initialized = False


def init_evaluation_logger() -> None:
    global _initialized
    if _initialized:
        return

    log_path = settings.evaluation_log_path
    log_dir = os.path.dirname(log_path)
    if log_dir and not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir, exist_ok=True)
        except Exception:
            pass

    try:
        # Rotating file handler: 50MB max file size, 5 backups
        handler = RotatingFileHandler(
            log_path,
            maxBytes=50 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        handler.setFormatter(logging.Formatter("%(message)s"))
        eval_logger.addHandler(handler)
        _initialized = True
    except Exception as exc:
        logging.getLogger(__name__).warning("Could not setup file logger for ML evaluations: %s", exc)


def log_model_evaluation(
    model_name: str,
    topic: str,
    entity_type: str = "trend",
    entity_id: str | None = None,
    accuracy_metrics: dict[str, Any] | None = None,
    latency_ms: float = 0.0,
    data_source: str = "real_history",
    observations_count: int = 0,
    status: str = "success",
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Writes a structured JSON record to the rotating ML evaluations log."""
    init_evaluation_logger()

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "model_evaluation",
        "model_name": model_name,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "topic": topic,
        "data_source": data_source,
        "observations_count": observations_count,
        "latency_ms": round(latency_ms, 2),
        "status": status,
        "accuracy": accuracy_metrics or {},
    }
    if extra:
        record["extra"] = extra

    try:
        eval_logger.info(json.dumps(record))
    except Exception:
        pass

    return record
