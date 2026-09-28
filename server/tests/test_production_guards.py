import pytest
from fastapi import HTTPException

from app.auth import require_mfa_assurance
from app.config import Settings
from app.services.ai_provider import get_case_analysis_provider


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
        malware_scanner="clamav",
    )

    settings.validate_runtime()


def test_mfa_is_required_for_privileged_roles_by_default() -> None:
    settings = Settings()

    assert settings.mfa_required_role_set == {"ADMIN", "ADVISOR"}
    assert "CUSTOMER" not in settings.mfa_required_role_set


def test_privileged_oidc_claim_requires_aal2() -> None:
    with pytest.raises(HTTPException, match="MFA"):
        require_mfa_assurance("ADVISOR", {"aal": "aal1"}, {"ADMIN", "ADVISOR"})

    require_mfa_assurance("ADVISOR", {"aal": "aal2"}, {"ADMIN", "ADVISOR"})
    require_mfa_assurance("CUSTOMER", {"aal": "aal1"}, {"ADMIN", "ADVISOR"})


def test_default_analysis_provider_is_local_and_zero_cost() -> None:
    provider = get_case_analysis_provider()

    assert provider.name == "mock-local"
    assert provider.model == "deterministic-rules-v1"
