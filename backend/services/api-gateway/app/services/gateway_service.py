import asyncio
import httpx
from app.core.config import settings
from app.repositories.gateway_repository import GatewayRepository


class GatewayService:
    def __init__(self) -> None:
        self.repo = GatewayRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def full_health(self) -> dict:
        services = {
            "auth": f"{settings.auth_service_url}/auth/health",
            "channel": f"{settings.channel_service_url}/health",
            "trend": f"{settings.trend_service_url}/health",
            "strategy": f"{settings.strategy_service_url}/health",
            "planner": f"{settings.planner_service_url}/health",
            "analytics": f"{settings.analytics_service_url}/health",
            "ml": f"{settings.ml_service_url}/health"
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            async def fetch_health(name: str, url: str):
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                    return name, data.get("data", data)
                except Exception as e:
                    return name, {"status": "down", "error": str(e)}

            tasks = [fetch_health(name, url) for name, url in services.items()]
            responses = await asyncio.gather(*tasks)

        results = {"gateway": self.repo.health_payload()}
        for name, data in responses:
            results[name] = data

        overall_status = "ok"
        for name, data in results.items():
            if isinstance(data, dict) and data.get("status") == "down":
                overall_status = "degraded"
                
        return {
            "status": overall_status,
            "services": results
        }

    def not_implemented(self, method: str, path: str) -> dict:
        return {
            "error": {
                "code": "NOT_IMPLEMENTED",
                "message": f"{method} {path} is scaffolded but not implemented yet.",
                "details": {},
            },
            "meta": {"request_id": "local-dev"},
        }

