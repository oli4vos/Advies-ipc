from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


SERVER_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Fiscale Lijn API"
    app_env: str = "local"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    database_url: str = f"sqlite:///{SERVER_ROOT / 'fiscale_lijn.db'}"
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002"
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    auth_mode: str = "demo"
    auth_jwks_url: str | None = None
    auth_issuer: str | None = None
    auth_audience: str | None = None
    storage_mode: str = "local"
    max_request_bytes: int = 1_048_576

    model_config = SettingsConfigDict(
        env_file=SERVER_ROOT / ".env",
        env_prefix="FISCALE_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]

    def validate_runtime(self) -> None:
        """Fail closed when the service is configured as staging/production.

        The public GitHub Pages demo intentionally uses a separate static frontend.
        This guard prevents accidentally presenting the local demo auth and SQLite
        setup as a deployable production API.
        """
        environment = self.app_env.lower().strip()
        if environment not in {"staging", "production"}:
            return

        errors: list[str] = []
        if not self.database_url.startswith(("postgresql://", "postgresql+")):
            errors.append("FISCALE_DATABASE_URL must point to PostgreSQL")
        if self.auth_mode.lower() != "oidc":
            errors.append("FISCALE_AUTH_MODE must be oidc")
        for name, value in (
            ("FISCALE_AUTH_JWKS_URL", self.auth_jwks_url),
            ("FISCALE_AUTH_ISSUER", self.auth_issuer),
            ("FISCALE_AUTH_AUDIENCE", self.auth_audience),
        ):
            if not value:
                errors.append(f"{name} is required")
        if not self.cors_origin_list or "*" in self.cors_origin_list:
            errors.append("FISCALE_CORS_ORIGINS must contain explicit origins")
        if any("localhost" in origin or "127.0.0.1" in origin for origin in self.cors_origin_list):
            errors.append("FISCALE_CORS_ORIGINS may not contain localhost")
        if not self.allowed_host_list or "*" in self.allowed_host_list:
            errors.append("FISCALE_ALLOWED_HOSTS must contain explicit hosts")
        if self.storage_mode.lower() != "private":
            errors.append("FISCALE_STORAGE_MODE must be private")
        if self.max_request_bytes < 16_384:
            errors.append("FISCALE_MAX_REQUEST_BYTES is too small")

        if errors:
            raise RuntimeError("Invalid production configuration: " + "; ".join(errors))


@lru_cache
def get_settings() -> Settings:
    return Settings()
