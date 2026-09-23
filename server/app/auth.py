"""Local-only demo identity boundary.

This adapter deliberately has a very small surface: it makes the demo roles
explicit and fails closed outside local/test/demo environments. A real identity
provider can replace it without changing the case and marketplace services.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
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


def get_current_actor(
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> Actor:
    if get_settings().app_env.lower() not in DEMO_ENVS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Er is nog geen productie-authenticatieprovider geconfigureerd.",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo-aanmelding ontbreekt.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token not in DEMO_IDENTITIES:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ongeldige demo-aanmelding.")
    return ensure_demo_actor(session, token)


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
