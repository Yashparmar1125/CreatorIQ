import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "ml"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://creatoriq:creatoriq@localhost:5432/creatoriq"
    internal_service_token: str = "change-me"
    evaluation_log_path: str = "logs/ml_evaluations.jsonl"

    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
