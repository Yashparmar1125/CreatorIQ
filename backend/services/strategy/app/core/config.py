import os
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "strategy"
    environment: str = "development"

    database_url: str = ""
    internal_service_token: str = "change-me"
    ml_service_url: str = "http://127.0.0.1:8007"
    channel_service_url: str = "http://127.0.0.1:8002"

    # OpenRouter (OpenAI-compatible) — https://openrouter.ai
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_http_referer: str = ""  # optional site URL for OpenRouter rankings
    openrouter_app_title: str = "CreatorIQ"

    # Prefer `MODEL_NAME` in `.env` (matches your file); also accepts LLM_MODEL
    llm_model: str = Field(
        default="openai/gpt-4o-mini",
        validation_alias=AliasChoices("MODEL_NAME", "LLM_MODEL"),
    )

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
