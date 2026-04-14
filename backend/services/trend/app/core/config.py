import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "trend"
    environment: str = "development"

    database_url: str = ""
    internal_service_token: str = "change-me"
    ml_service_url: str = "http://127.0.0.1:8007"

    # SerpApi Google Trends — https://serpapi.com/google-trends-api
    serpapi_api_key: str = ""
    serpapi_base_url: str = "https://serpapi.com/search.json"

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
