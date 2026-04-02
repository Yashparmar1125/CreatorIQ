from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "auth"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://postgres:CreatorIQ%40123@creator-iq.postgres.database.azure.com:5432/postgres"

    jwt_issuer: str = "creatoriq-auth"
    jwt_audience: str = "creatoriq-api"
    jwt_private_key_path: str = "/run/secrets/jwt_private.pem"
    jwt_public_key_path: str = "/run/secrets/jwt_public.pem"
    access_token_ttl_minutes: int = 15

    aes_encryption_key: str = ""


    refresh_token_ttl_days: int = 90
    refresh_token_pepper: str = "change-me"

    # Service-to-service auth
    internal_service_token: str = "change-me"
    channel_service_url: str = "http://channel:8002"

    # Google OAuth (Sign in + YouTube scopes) — set in root `.env` for Docker Compose
    google_client_id: str = ""
    google_client_secret: str = ""
    # Must match an authorized redirect URI in Google Cloud (use API gateway URL in dev)
    google_oauth_redirect_uri: str = "http://localhost:8000/v1/auth/google/callback"
    # Where users land after tokens are issued (SPA)
    frontend_url: str = "http://localhost:5173"
    # HMAC secret for OAuth `state` (defaults to refresh pepper if unset)
    oauth_state_secret: str = ""

    # Dev toggles (keep production-shape but allow stubbing)
    enable_youtube_oauth: bool = Field(default=True, description="If false, legacy YouTube stub routes return 501.")

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")


settings = Settings()

