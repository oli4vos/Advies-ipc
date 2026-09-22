from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..schemas import ClaimCreate, ExpertReviewCreate
from .cases import _add_provenance, get_case_or_404


def now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_demo_expert(session: Session) -> models.User:
    expert = session.scalar(select(models.User).where(models.User.email == "adviseurdemo@example.test"))
    if expert is None:
        expert = models.User(
            email="adviseurdemo@example.test",
            role="ADVISOR",
            display_name="Mara van Dijk",
            is_demo=True,
        )
        session.add(expert)
        session.flush()
    return expert


def get_expert(session: Session, expert_id: str | None) -> models.User:
    if expert_id is None:
        return ensure_demo_expert(session)
    expert = session.scalar(
        select(models.User).where(models.User.id == expert_id, models.User.role == "ADVISOR")
    )
    if expert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adviseur niet gevonden")
    return expert


def claim_case(
    session: Session, case: models.Case, payload: ClaimCreate
) -> models.ExpertClaim:
    if case.status not in {"PUBLISHED", "CLAIMED"}:
        raise HTTPException(status_code=409, detail="Deze casus staat niet meer open voor claims")
    expert = get_expert(session, payload.expert_id)
    existing = session.scalar(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.expert_id == expert.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Deze adviseur heeft al interesse getoond")
    active_claims = session.scalars(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.status == "PENDING_CUSTOMER",
        )
    ).all()
    if len(active_claims) >= 3:
        raise HTTPException(status_code=409, detail="Het maximum van drie adviseurs is bereikt")

    claim = models.ExpertClaim(
        case_id=case.id,
        expert_id=expert.id,
        status="PENDING_CUSTOMER",
        match_score=86 if case.category == "Loonheffingen" else 78,
        message=payload.message,
    )
    session.add(claim)
    session.flush()
    previous = case.status
    case.status = "CLAIMED"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status=case.status,
            actor_type="ADVISOR",
            actor_id=expert.id,
            reason="Adviseur heeft interesse getoond; klant kan adviseur kiezen.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="ADVISOR",
            actor_id=expert.id,
            action="EXPERT_CLAIM_CREATED",
            object_type="ExpertClaim",
            object_id=claim.id,
            metadata_json={"case_id": case.id, "match_score": claim.match_score},
        )
    )
    session.expire(case, ["claims"])
    session.commit()
    return get_claim_or_404(session, claim.id)


def get_claim_or_404(session: Session, claim_id: str) -> models.ExpertClaim:
    claim = session.scalar(
        select(models.ExpertClaim).where(models.ExpertClaim.id == claim_id)
    )
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim niet gevonden")
    return claim


def select_claim(session: Session, case: models.Case, claim_id: str) -> models.Case:
    if case.status != "CLAIMED":
        raise HTTPException(status_code=409, detail="De casus wacht niet op een adviseurskeuze")
    selected = get_claim_or_404(session, claim_id)
    if selected.case_id != case.id or selected.status != "PENDING_CUSTOMER":
        raise HTTPException(status_code=409, detail="Deze claim kan niet worden gekozen")

    selected.status = "SELECTED"
    selected.selected_at = now()
    other_claims = session.scalars(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.id != selected.id,
            models.ExpertClaim.status == "PENDING_CUSTOMER",
        )
    ).all()
    for claim in other_claims:
        claim.status = "REJECTED"

    payment = models.Payment(
        case_id=case.id,
        customer_id=case.customer_id,
        amount_cents=case.offered_fee_cents,
        status="PENDING",
        provider="mock",
    )
    session.add(payment)
    previous = case.status
    case.status = "AWAITING_PAYMENT"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status=case.status,
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            reason="Klant heeft een adviseur gekozen; mockbetaling staat klaar.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="EXPERT_SELECTED",
            object_type="Case",
            object_id=case.id,
            metadata_json={"claim_id": selected.id, "payment_id": payment.id},
        )
    )
    session.flush()
    session.expire(case, ["claims", "payments"])
    session.commit()
    return get_case_or_404(session, case.id)


def pay_case(session: Session, case: models.Case) -> models.Case:
    if case.status != "AWAITING_PAYMENT":
        raise HTTPException(status_code=409, detail="Voor deze casus staat geen betaling klaar")
    payment = session.scalar(
        select(models.Payment).where(
            models.Payment.case_id == case.id, models.Payment.status == "PENDING"
        )
    )
    if payment is None:
        raise HTTPException(status_code=409, detail="Betaling niet gevonden")
    payment.status = "PAID"
    payment.paid_at = now()
    previous = case.status
    case.status = "PAID"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status=case.status,
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            reason="Mockbetaling ontvangen; adviseur kan de review starten.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="MOCK_PAYMENT_PAID",
            object_type="Payment",
            object_id=payment.id,
            metadata_json={"case_id": case.id, "amount_cents": payment.amount_cents},
        )
    )
    session.expire(case, ["payments"])
    session.commit()
    return get_case_or_404(session, case.id)


def submit_review(
    session: Session, case: models.Case, payload: ExpertReviewCreate
) -> models.Case:
    if case.status not in {"PAID", "IN_REVIEW"}:
        raise HTTPException(status_code=409, detail="De adviseur kan deze casus nog niet reviewen")
    selected = session.scalar(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.status == "SELECTED",
        )
    )
    if selected is None:
        raise HTTPException(status_code=409, detail="Er is nog geen adviseur gekozen")

    review = models.ExpertReview(
        case_id=case.id,
        expert_id=selected.expert_id,
        claim_id=selected.id,
        final_answer=payload.final_answer,
        notes=payload.notes,
    )
    session.add(review)
    session.flush()
    for position, item in enumerate(payload.items, start=1):
        session.add(
            models.ExpertReviewItem(
                review_id=review.id,
                ai_claim_id=item.ai_claim_id,
                position=position,
                dimension=item.dimension,
                verdict=item.verdict,
                comment=item.comment,
            )
        )
    previous = case.status
    case.status = "DELIVERED"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status="ANSWER_SUBMITTED",
            actor_type="ADVISOR",
            actor_id=selected.expert_id,
            reason="Adviseur heeft AI-conclusies beoordeeld en een definitief antwoord ingediend.",
        )
    )
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status="ANSWER_SUBMITTED",
            to_status="DELIVERED",
            actor_type="SYSTEM",
            reason="Gecontroleerd antwoord is beschikbaar voor de klant.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="ADVISOR",
            actor_id=selected.expert_id,
            action="EXPERT_REVIEW_SUBMITTED",
            object_type="ExpertReview",
            object_id=review.id,
            metadata_json={"case_id": case.id, "feedback_items": len(payload.items)},
        )
    )
    _add_provenance(
        session,
        case=case,
        entity_type="ExpertReview",
        entity_id=review.id,
        origin_type="HUMAN_FEEDBACK",
        creation_method="CREATED",
        schema_version="expert-review.v1",
        value={
            "final_answer": payload.final_answer,
            "notes": payload.notes,
            "items": [item.model_dump() for item in payload.items],
        },
        producer_user_id=selected.expert_id,
    )
    session.expire(case, ["claims", "reviews", "provenance"])
    session.commit()
    return get_case_or_404(session, case.id)
