from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "trend"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://postgres:CreatorIQ%40123@creator-iq.postgres.database.azure.com:5432/postgres"
    internal_service_token: str = "change-me"
    ml_service_url: str = "http://127.0.0.1:8007"

    # SerpApi Google Trends — https://serpapi.com/google-trends-api
    serpapi_api_key: str = ""
    serpapi_base_url: str = "https://serpapi.com/search.json"

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")


settings = Settings()
