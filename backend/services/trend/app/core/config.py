import os
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "trend"
    environment: str = "development"

    database_url: str = ""
    redis_url: str = Field(default="redis://redis:6379/0", validation_alias=AliasChoices("REDIS_URL"))
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

    # YouTube Data API v3 — multi-key pool & rate limit (server API keys)
    youtube_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("YOUTUBE_API_KEY", "GOOGLE_API_KEY"),
    )
    youtube_api_key_2: str = Field(
        default="",
        validation_alias=AliasChoices("YOUTUBE_API_KEY_2", "GOOGLE_API_KEY_2", "Youtube_API_KEY_2"),
    )
    youtube_api_key_3: str = Field(
        default="",
        validation_alias=AliasChoices("YOUTUBE_API_KEY_3", "GOOGLE_API_KEY_3", "Youtube_API_KEY_3"),
    )
    youtube_api_keys: str = Field(
        default="",
        validation_alias=AliasChoices("YOUTUBE_API_KEYS", "GOOGLE_API_KEYS"),
    )
    youtube_max_daily_queries: int = 270
    youtube_search_days: int = 7
    youtube_search_max_results: int = 15
    youtube_min_views: int = 1000
    enable_youtube_collector: bool = True
    enable_serpapi_collector: bool = True

    # Canonical Concept Pipeline Engine Thresholds (D-3 Lag & 3-Stage Gate)
    lag_days: int = 3
    search_max_results: int = 40
    min_views: int = 500
    min_subscribers: int = 100
    min_duration_seconds: int = 60
    min_description_chars: int = 15
    semantic_score_threshold: float = 0.28
    youtube_api_max_retries: int = 3
    youtube_api_retry_backoff: float = 1.0
    backfill_days: int = 30

    # Background collector interval (hours)
    collector_interval_hours: int = 4

    # OpenRouter — AI enrichment for feed cards (https://openrouter.ai)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_http_referer: str = ""
    openrouter_app_title: str = "CreatorIQ"
    llm_model: str = Field(
        default="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        validation_alias=AliasChoices("MODEL_NAME", "LLM_MODEL"),
    )
    enable_trend_enrichment: bool = True

    # Free Model Providers & Web Search
    groq_api_keys: str = ""
    groq_api_key: str = ""
    gemini_api_keys: str = ""
    gemini_api_key: str = ""
    tavily_api_keys: str = ""
    tavily_api_key: str = ""

    # Feed refresh credits — set False for unlimited refreshes
    enable_feed_credit_limits: bool = False

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")

    @property
    def feed_credits_enabled(self) -> bool:
        return False


settings = Settings()
