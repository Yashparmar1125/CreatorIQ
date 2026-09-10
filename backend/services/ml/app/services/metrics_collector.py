"""Mathematical accuracy and model performance metrics collector."""

from __future__ import annotations

from typing import Any
import numpy as np


def compute_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error."""
    if len(y_true) == 0:
        return 0.0
    return float(np.mean(np.abs(y_true - y_pred)))


def compute_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error."""
    if len(y_true) == 0:
        return 0.0
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def compute_mape(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1e-5) -> float:
    """Mean Absolute Percentage Error (clamped to prevent div-by-zero)."""
    if len(y_true) == 0:
        return 0.0
    denom = np.where(np.abs(y_true) < epsilon, epsilon, np.abs(y_true))
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def compute_r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Coefficient of Determination (R^2)."""
    if len(y_true) < 2:
        return 1.0
    ss_tot = float(np.sum((y_true - np.mean(y_true)) ** 2))
    ss_res = float(np.sum((y_true - y_pred) ** 2))
    if ss_tot == 0.0:
        return 1.0 if ss_res == 0.0 else 0.0
    r2 = 1.0 - (ss_res / ss_tot)
    return float(max(-1.0, min(1.0, r2)))


def compute_ci_coverage(
    y_true: np.ndarray,
    lower_bounds: np.ndarray,
    upper_bounds: np.ndarray,
) -> float:
    """Percentage of actual empirical values falling within the prediction intervals."""
    if len(y_true) == 0:
        return 100.0
    in_interval = (y_true >= lower_bounds) & (y_true <= upper_bounds)
    return float(np.mean(in_interval) * 100.0)


def evaluate_fit_quality(
    r2: float,
    ci_coverage: float,
    mae: float,
    obs_count: int,
) -> str:
    """Classifies model fit quality based on empirical accuracy."""
    if obs_count < 7:
        return "synthetic_calibrated"
    if r2 >= 0.85 and ci_coverage >= 85.0 and mae <= 5.0:
        return "high_accuracy"
    if r2 >= 0.60 and ci_coverage >= 70.0 and mae <= 10.0:
        return "moderate"
    return "divergent"


def build_accuracy_metrics(
    y_true: list[float] | np.ndarray,
    y_pred: list[float] | np.ndarray,
    lower_bounds: list[float] | np.ndarray | None = None,
    upper_bounds: list[float] | np.ndarray | None = None,
    latency_ms: float = 0.0,
    obs_count: int = 0,
) -> dict[str, Any]:
    """Computes a complete, structured accuracy and performance snapshot."""
    yt = np.array(y_true, dtype=float)
    yp = np.array(y_pred, dtype=float)

    if len(yt) != len(yp) or len(yt) == 0:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "mape_pct": 0.0,
            "r2_score": 1.0,
            "ci_coverage_pct": 100.0,
            "fit_quality": "synthetic_calibrated" if obs_count < 7 else "insufficient_data",
            "latency_ms": round(latency_ms, 2),
            "observations_evaluated": len(yt),
        }

    mae = compute_mae(yt, yp)
    rmse = compute_rmse(yt, yp)
    mape = compute_mape(yt, yp)
    r2 = compute_r2(yt, yp)

    if lower_bounds is not None and upper_bounds is not None:
        lb = np.array(lower_bounds, dtype=float)
        ub = np.array(upper_bounds, dtype=float)
        ci_cov = compute_ci_coverage(yt, lb, ub)
    else:
        ci_cov = 100.0

    quality = evaluate_fit_quality(r2, ci_cov, mae, obs_count)

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "mape_pct": round(mape, 2),
        "r2_score": round(r2, 3),
        "ci_coverage_pct": round(ci_cov, 1),
        "fit_quality": quality,
        "latency_ms": round(latency_ms, 2),
        "observations_evaluated": len(yt),
    }
