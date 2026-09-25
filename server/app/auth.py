"""Identity boundary for the local demo and a standards-based OIDC provider.

The demo identities are explicit and remain unavailable in staging/production.
Production accepts only a verified JWT from the configured OIDC provider. The
rest of the application receives the same small ``Actor`` abstraction in both
cases, which keeps the domain services independent of the identity vendor.
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .config import get_settings
from .db import get_session


@dataclass(frozen=True)
class Actor:
    user: models.User

    @property
    def role(self) -> str:
        return self.user.role


DEMO_IDENTITIES = {
    "demo-customer": ("klantdemo@example.test", "CUSTOMER", "Klantdemo"),
    "demo-customer-2": ("klantdemo2@example.test", "CUSTOMER", "Klantdemo 2"),
    "demo-advisor": ("adviseurdemo@example.test", "ADVISOR", "Mara van Dijk"),
    "demo-admin": ("beheerdersdemo@example.test", "ADMIN", "Beheerdersdemo"),
}
DEMO_ENVS = {"local", "test", "demo"}


def ensure_demo_actor(session: Session, token: str) -> Actor:
    email, role, display_name = DEMO_IDENTITIES[token]
    user = session.scalar(select(models.User).where(models.User.email == email))
    if user is None:
        user = models.User(
            email=email,
            role=role,
            display_name=display_name,
            is_demo=True,
        )
        session.add(user)
        session.flush()
    return Actor(user=user)


@lru_cache(maxsize=4)
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url)


def _oidc_actor(session: Session, token: str) -> Actor:
    settings = get_settings()
    if settings.auth_mode.lower() != "oidc" or not all(
        (settings.auth_jwks_url, settings.auth_issuer, settings.auth_audience)
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Productie-authenticatie is niet volledig geconfigureerd.",
        )

    try:
        signing_key = _jwks_client(settings.auth_jwks_url).get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256", "ES256"],
            audience=settings.auth_audience,
            issuer=settings.auth_issuer,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ongeldige of verlopen aanmelding.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        # Do not expose provider/network details. An unavailable identity provider
        # is an operational outage, not an invalid customer token.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="De authenticatieservice is tijdelijk niet beschikbaar.",
        ) from exc

    subject = str(claims["sub"])
    app_metadata = claims.get("app_metadata")
    role = claims.get("role")
    if not role and isinstance(app_metadata, dict):
        role = app_metadata.get("role")
    if role not in {"CUSTOMER", "ADVISOR", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Je account heeft nog geen toegestane platformrol.",
        )

    email = str(claims.get("email") or f"{subject}@auth.invalid")
    display_name = str(claims.get("name") or claims.get("preferred_username") or email)
    user = session.scalar(select(models.User).where(models.User.auth_provider_id == subject))
    if user is None:
        user = session.scalar(select(models.User).where(models.User.email == email))
    if user is not None and user.auth_provider_id not in {None, subject}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Accountkoppeling is ongeldig.")

    changed = False
    if user is None:
        user = models.User(
            email=email,
            auth_provider_id=subject,
            role=role,
            display_name=display_name,
            is_demo=False,
        )
        session.add(user)
        changed = True
    else:
        if user.auth_provider_id != subject:
            user.auth_provider_id = subject
            changed = True
        if user.is_demo:
            user.is_demo = False
            changed = True
        if user.role != role:
            user.role = role
            changed = True
        if user.display_name != display_name:
            user.display_name = display_name
            changed = True
    if changed:
        session.commit()
        session.refresh(user)
    return Actor(user=user)


def get_current_actor(
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> Actor:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo-aanmelding ontbreekt.",
            headers={"WWW-Authenticate": "Bearer"},
    )
    token = authorization.removeprefix("Bearer ").strip()
    if get_settings().app_env.lower() in DEMO_ENVS:
        if token not in DEMO_IDENTITIES:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ongeldige demo-aanmelding.")
        return ensure_demo_actor(session, token)
    return _oidc_actor(session, token)


def require_role(actor: Actor, *roles: str) -> None:
    if actor.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Niet bevoegd voor deze actie.")


def require_case_customer(actor: Actor, case: models.Case) -> None:
    require_role(actor, "CUSTOMER")
    if actor.user.id != case.customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Deze casus is niet van jou.")


def require_selected_expert(session: Session, actor: Actor, case: models.Case) -> models.ExpertClaim:
    require_role(actor, "ADVISOR")
    claim = session.scalar(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.expert_id == actor.user.id,
            models.ExpertClaim.status == "SELECTED",
        )
    )
    if claim is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Je bent niet de gekozen adviseur.")
    return claim
