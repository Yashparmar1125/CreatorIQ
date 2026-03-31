from app.repositories.gateway_repository import GatewayRepository


class GatewayService:
    def __init__(self) -> None:
        self.repo = GatewayRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    def not_implemented(self, method: str, path: str) -> dict:
        return {
            "error": {
                "code": "NOT_IMPLEMENTED",
                "message": f"{method} {path} is scaffolded but not implemented yet.",
                "details": {},
            },
            "meta": {"request_id": "local-dev"},
        }
