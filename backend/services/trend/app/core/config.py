import os
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "trend"
    environment: str = "development"

    database_url: str = ""
    internal_service_token: str = "change-me"
    ml_service_url: str = "http://127.0.0.1:8007"
    channel_service_url: str = "http://127.0.0.1:8002"

    # Qdrant Vector Database
    qdrant_url: str = "http://qdrant:6333"
    enable_vector_search: bool = True

    # Max niches to query in parallel per request (controls SerpApi credit usage)
    max_trend_niches: int = 2

    # SerpApi Google Trends — https://serpapi.com/google-trends-api
    serpapi_api_key: str = ""
    serpapi_base_url: str = "https://serpapi.com/search.json"

    # YouTube Data API v3 — primary trend signal (server API key)
    youtube_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("YOUTUBE_API_KEY", "GOOGLE_API_KEY"),
    )
    youtube_search_days: int = 7
    youtube_search_max_results: int = 15
    youtube_min_views: int = 1000
    enable_youtube_collector: bool = True
    enable_serpapi_collector: bool = True

    # Background collector interval (hours)
    collector_interval_hours: int = 4

    # OpenRouter — AI enrichment for feed cards (https://openrouter.ai)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_http_referer: str = ""
    openrouter_app_title: str = "CreatorIQ"
    llm_model: str = Field(
        default="openai/gpt-4o-mini",
        validation_alias=AliasChoices("MODEL_NAME", "LLM_MODEL"),
    )
    enable_trend_enrichment: bool = True

    # Feed refresh credits — disabled automatically in development
    enable_feed_credit_limits: bool = True

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")

    @property
    def feed_credits_enabled(self) -> bool:
        if not self.enable_feed_credit_limits:
            return False
        return self.environment.lower() not in ("development", "dev", "local")


settings = Settings()
