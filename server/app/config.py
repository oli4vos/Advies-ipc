from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


SERVER_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Fiscale Lijn API"
    app_env: str = "local"
    api_prefix: str = "/api/v1"
    database_url: str = f"sqlite:///{SERVER_ROOT / 'fiscale_lijn.db'}"
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002"

    model_config = SettingsConfigDict(
        env_file=SERVER_ROOT / ".env",
        env_prefix="FISCALE_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
