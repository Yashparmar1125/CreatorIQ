import hashlib
from typing import Any

from app.services.forecast_engine import ForecastEngine


def _hash_score(s: str) -> float:
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


class MlService:
    def __init__(self) -> None:
        self.forecast_engine = ForecastEngine()

    def health(self) -> dict:
        return {"data": {"service": "ml", "status": "ok"}, "meta": {"request_id": "local-dev"}}

    def trend_forecast(self, payload: dict[str, Any]) -> dict:
        topic = str(payload.get("topic") or "General Trend")
        base = float(payload.get("tvs_score") or 50.0)
        history = payload.get("history")
        periods = int(payload.get("periods") or 90)
        lifecycle = payload.get("lifecycle")
        growth = payload.get("growth")
        velocity = payload.get("velocity")

        forecast_data = self.forecast_engine.generate_forecast(
            topic=topic,
            current_score=base,
            history=history,
            periods=periods,
            lifecycle=lifecycle,
            growth=growth,
            velocity=velocity,
        )

        return {
            "data": forecast_data,
            "meta": {"request_id": "ml-prophet"},
        }

    def score_idea(self, payload: dict[str, Any]) -> dict:
        topic = str(payload.get("topic") or "")
        perf = 50.0 + _hash_score(topic + "idea") * 50.0
        return {"data": {"performance_score": round(perf, 2)}, "meta": {"request_id": "local-dev"}}

    def score_title_ctr(self, payload: dict[str, Any]) -> dict:
        titles = payload.get("titles") or []
        key = "|".join(str(t) for t in titles) if titles else "empty"
        ctr = 0.02 + _hash_score(key) * 0.08
        return {"data": {"predicted_ctr": round(ctr, 4)}, "meta": {"request_id": "local-dev"}}

    def internal_health(self) -> dict:
        return {"data": {"service": "ml", "internal_status": "ok"}, "meta": {"request_id": "local-dev"}}
