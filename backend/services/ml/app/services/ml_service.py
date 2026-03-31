import hashlib
from typing import Any


def _hash_score(s: str) -> float:
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


class MlService:
    def __init__(self) -> None:
        pass

    def health(self) -> dict:
        return {"data": {"service": "ml", "status": "ok"}, "meta": {"request_id": "local-dev"}}

    def trend_forecast(self, payload: dict[str, Any]) -> dict:
        topic = str(payload.get("topic") or "")
        base = float(payload.get("tvs_score") or 50.0)
        bump = _hash_score(topic) * 5.0
        return {
            "data": {
                "forecast_tvs": min(100.0, base + bump),
                "confidence": 0.5 + (_hash_score(topic + "c") * 0.49),
            },
            "meta": {"request_id": "local-dev"},
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
