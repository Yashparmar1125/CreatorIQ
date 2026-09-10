import pytest
import numpy as np

from app.services.metrics_collector import (
    compute_mae,
    compute_rmse,
    compute_mape,
    compute_r2,
    compute_ci_coverage,
    evaluate_fit_quality,
    build_accuracy_metrics,
)


def test_compute_mae():
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([12.0, 19.0, 33.0])
    # abs diff: [2, 1, 3] -> mean = 2.0
    assert compute_mae(y_true, y_pred) == 2.0


def test_compute_rmse():
    y_true = np.array([10.0, 20.0])
    y_pred = np.array([13.0, 24.0])
    # diff: [3, 4] -> squared: [9, 16] -> mean = 12.5 -> sqrt(12.5) = 3.5355...
    assert pytest.approx(compute_rmse(y_true, y_pred), 0.001) == 3.5355


def test_compute_r2():
    y_true = np.array([10.0, 20.0, 30.0])
    # Perfect fit
    assert compute_r2(y_true, y_true) == 1.0


def test_compute_ci_coverage():
    y_true = np.array([10.0, 20.0, 30.0, 40.0])
    lower = np.array([8.0, 18.0, 25.0, 50.0])  # 40 is not in [50, 60]
    upper = np.array([12.0, 22.0, 35.0, 60.0])
    # 3 out of 4 inside interval -> 75%
    assert compute_ci_coverage(y_true, lower, upper) == 75.0


def test_build_accuracy_metrics():
    y_true = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0]
    y_pred = [10.5, 19.5, 30.2, 39.8, 50.1, 60.2, 69.9, 80.1]
    lower = [9.0, 18.0, 28.0, 38.0, 48.0, 58.0, 68.0, 78.0]
    upper = [12.0, 22.0, 32.0, 42.0, 52.0, 62.0, 72.0, 82.0]

    res = build_accuracy_metrics(y_true, y_pred, lower, upper, latency_ms=115.4, obs_count=8)
    assert res["mae"] < 0.6
    assert res["r2_score"] > 0.99
    assert res["ci_coverage_pct"] == 100.0
    assert res["fit_quality"] == "high_accuracy"
    assert res["latency_ms"] == 115.4
