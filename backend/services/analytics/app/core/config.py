import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get root .env path relative to this file
env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")

class Settings(BaseSettings):
    service_name: str = "analytics"
    environment: str = "development"

    database_url: str = ""
    internal_service_token: str = "change-me"
    auth_service_url: str = "http://127.0.0.1:8001"
    aes_encryption_key: str | None = None


    model_config = SettingsConfigDict(env_file=env_path, extra="ignore")


settings = Settings()
