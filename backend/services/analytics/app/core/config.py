from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "analytics"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://creatoriq:creatoriq@postgres:5432/creatoriq"
    internal_service_token: str = "change-me"
    auth_service_url: str = "http://127.0.0.1:8001"


    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")


settings = Settings()
