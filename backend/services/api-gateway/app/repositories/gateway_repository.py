class GatewayRepository:
    def health_payload(self) -> dict:
        return {"service": "api-gateway", "status": "ok"}
