import pytest

from app.config import Settings


def test_production_configuration_fails_closed_without_real_dependencies() -> None:
    settings = Settings(
        app_env="production",
        database_url="sqlite:///demo.db",
        cors_origins="http://localhost:3000",
        allowed_hosts="localhost",
        auth_mode="demo",
        storage_mode="local",
    )

    with pytest.raises(RuntimeError, match="Invalid production configuration"):
        settings.validate_runtime()


def test_production_configuration_accepts_explicit_runtime_dependencies() -> None:
    settings = Settings(
        app_env="production",
        database_url="postgresql+psycopg://user:password@db.example/fiscale_lijn",
        cors_origins="https://app.example",
        allowed_hosts="api.example",
        auth_mode="oidc",
        auth_jwks_url="https://id.example/.well-known/jwks.json",
        auth_issuer="https://id.example/",
        auth_audience="fiscale-lijn-api",
        storage_mode="private",
    )

    settings.validate_runtime()
