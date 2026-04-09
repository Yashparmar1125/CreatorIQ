from pydantic import AliasChoices, Field
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "ml"
    environment: str = "development"

    serpapi_key: str = Field(
        default="",
        validation_alias=AliasChoices("SERPAPI_API_KEY", "SERPAPI_KEY")
    )
    openrouter_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENROUTER_API_KEY", "OPENROUTER_KEY")
    )
    internal_service_token: str = "change-me"

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")
    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
