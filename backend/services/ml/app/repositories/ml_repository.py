class MlRepository:
    def health_payload(self) -> dict:
        return {"service": "ml", "status": "ok"}
