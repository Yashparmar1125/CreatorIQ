import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "api-gateway"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    # JWT verification (user auth)
    jwt_issuer: str = "creatoriq-auth"
    jwt_audience: str = "creatoriq-api"
    jwt_public_key_path: str = ""

    # Internal service auth (service-to-service)
    internal_service_token: str = "change-me"

    # Downstream services
    auth_service_url: str = "http://127.0.0.1:8001"
    channel_service_url: str = "http://127.0.0.1:8002"
    trend_service_url: str = "http://127.0.0.1:8003"
    strategy_service_url: str = "http://127.0.0.1:8004"
    planner_service_url: str = "http://127.0.0.1:8005"
    analytics_service_url: str = "http://127.0.0.1:8006"
    ml_service_url: str = "http://127.0.0.1:8007"

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
