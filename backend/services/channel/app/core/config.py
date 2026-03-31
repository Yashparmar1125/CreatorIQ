from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "channel"
    environment: str = "development"

    database_url: str = "postgresql://postgres:1125@postgres:5432/CreatorIQ"

    internal_service_token: str = "change-me"

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")


settings = Settings()

