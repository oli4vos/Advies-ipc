from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..schemas import (
    ClaimCreate,
    ExpertReviewCreate,
    InformationAnswerCreate,
    InformationRequestCreate,
)
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


def evaluate_information_need(
    *, question: str, estimated_extra_minutes: int
) -> tuple[bool, int, int, str]:
    """Lean, explainable gate; replaceable by an AI evaluator later.

    The AI may suggest a classification in a future adapter, but it may not
    directly change the fee. The platform keeps a conservative keyword rule
    and a hard fee cap for this MVP.
    """
    text = question.lower()
    required_terms = (
        "loonstrook",
        "werkgever",
        "rittenregistratie",
        "contract",
        "factuur",
        "klantlocatie",
        "hypotheek",
        "eigendom",
        "datum",
        "bewijs",
        "document",
    )
    matched = [term for term in required_terms if term in text]
    required = bool(matched)
    confidence = min(95, 70 + len(matched) * 8) if required else 82
    if not required:
        return False, confidence, 0, (
            "Deze vraag lijkt nuttig voor context, maar is volgens de MVP-regels "
            "niet noodzakelijk om de casus te beoordelen."
        )
    proposed_delta = min(5000, max(1500, ((estimated_extra_minutes + 14) // 15) * 1500))
    return (
        True,
        confidence,
        proposed_delta,
        "De gevraagde informatie raakt een noodzakelijk feit: " + ", ".join(matched) + ".",
    )


def request_information(
    session: Session,
    case: models.Case,
    payload: InformationRequestCreate,
) -> models.InformationRequest:
    if case.status not in {"PAID", "IN_REVIEW"}:
        raise HTTPException(status_code=409, detail="Aanvullende vragen kunnen nu niet worden gesteld")
    selected = session.scalar(
        select(models.ExpertClaim).where(
            models.ExpertClaim.case_id == case.id,
            models.ExpertClaim.status == "SELECTED",
        )
    )
    if selected is None:
        raise HTTPException(status_code=409, detail="Er is nog geen adviseur gekozen")
    required, confidence, fee_delta, rationale = evaluate_information_need(
        question=payload.question,
        estimated_extra_minutes=payload.estimated_extra_minutes,
    )
    info_request = models.InformationRequest(
        case_id=case.id,
        expert_id=selected.expert_id,
        status="PENDING_CUSTOMER" if required else "DECLINED",
        question=payload.question,
        rationale=rationale,
        required_for_assessment=required,
        evaluation_origin="RULE_ENGINE",
        evaluation_confidence=confidence,
        proposed_fee_delta_cents=fee_delta,
        approved_fee_delta_cents=fee_delta,
        evaluated_at=now(),
    )
    session.add(info_request)
    session.flush()
    if required:
        previous = case.status
        case.status = "NEEDS_INFORMATION"
        case.version += 1
        session.add(
            models.CaseStatusHistory(
                case_id=case.id,
                from_status=previous,
                to_status=case.status,
                actor_type="SYSTEM",
                reason="Aanvullende informatie is noodzakelijk verklaard; klant moet eerst antwoorden.",
            )
        )
    session.add(
        models.AuditLog(
            actor_type="SYSTEM",
            action="INFORMATION_REQUEST_EVALUATED",
            object_type="InformationRequest",
            object_id=info_request.id,
            metadata_json={
                "case_id": case.id,
                "required_for_assessment": required,
                "evaluation_origin": "RULE_ENGINE",
                "confidence": confidence,
                "fee_delta_cents": fee_delta,
            },
        )
    )
    _add_provenance(
        session,
        case=case,
        entity_type="InformationRequest",
        entity_id=info_request.id,
        origin_type="SYSTEM_RULE",
        creation_method="EVALUATED",
        schema_version="information-request.v1",
        value={"question": payload.question, "required": required, "fee_delta_cents": fee_delta},
    )
    session.expire(case, ["information_requests", "history", "provenance"])
    session.commit()
    return get_case_or_404(session, case.id).information_requests[-1]


def answer_information(
    session: Session,
    case: models.Case,
    request_id: str,
    payload: InformationAnswerCreate,
) -> models.Case:
    if case.status != "NEEDS_INFORMATION":
        raise HTTPException(status_code=409, detail="Deze casus wacht niet op aanvullende informatie")
    info_request = session.scalar(
        select(models.InformationRequest).where(
            models.InformationRequest.id == request_id,
            models.InformationRequest.case_id == case.id,
        )
    )
    if info_request is None or info_request.status != "PENDING_CUSTOMER":
        raise HTTPException(status_code=409, detail="Deze informatievraag kan niet worden beantwoord")
    info_request.customer_answer = payload.answer
    info_request.answered_at = now()
    info_request.status = "ANSWERED"
    case.version += 1
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="INFORMATION_ANSWERED",
            object_type="InformationRequest",
            object_id=info_request.id,
            metadata_json={"case_id": case.id},
        )
    )
    _add_provenance(
        session,
        case=case,
        entity_type="InformationAnswer",
        entity_id=info_request.id,
        origin_type="CUSTOMER",
        creation_method="CREATED",
        schema_version="information-answer.v1",
        value=payload.answer,
        producer_user_id=case.customer_id,
    )
    session.expire(case, ["information_requests", "provenance"])
    session.commit()
    return get_case_or_404(session, case.id)


def accept_information_fee(
    session: Session, case: models.Case, request_id: str
) -> models.Case:
    info_request = session.scalar(
        select(models.InformationRequest).where(
            models.InformationRequest.id == request_id,
            models.InformationRequest.case_id == case.id,
        )
    )
    if case.status != "NEEDS_INFORMATION" or info_request is None:
        raise HTTPException(status_code=409, detail="Deze informatievraag kan niet worden geaccepteerd")
    if info_request.status != "ANSWERED" or not info_request.required_for_assessment:
        raise HTTPException(status_code=409, detail="De klant moet eerst antwoorden op een noodzakelijke vraag")
    info_request.status = "AWAITING_PAYMENT"
    info_request.accepted_at = now()
    payment = models.Payment(
        case_id=case.id,
        customer_id=case.customer_id,
        amount_cents=info_request.approved_fee_delta_cents,
        status="PENDING",
        provider="mock",
        payment_type="INFORMATION_REQUEST",
        information_request_id=info_request.id,
    )
    session.add(payment)
    case.status = "AWAITING_INFORMATION_PAYMENT"
    case.version += 1
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="INFORMATION_FEE_ACCEPTED",
            object_type="InformationRequest",
            object_id=info_request.id,
            metadata_json={"case_id": case.id, "amount_cents": payment.amount_cents},
        )
    )
    session.flush()
    session.expire(case, ["information_requests", "payments"])
    session.commit()
    return get_case_or_404(session, case.id)


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
    if case.status not in {"AWAITING_PAYMENT", "AWAITING_INFORMATION_PAYMENT"}:
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
    information_payment = payment.payment_type == "INFORMATION_REQUEST"
    case.status = "IN_REVIEW" if information_payment else "PAID"
    if information_payment and payment.information_request is not None:
        payment.information_request.status = "PAYMENT_RECEIVED"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status=case.status,
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            reason=(
                "Mockbetaling voor noodzakelijke aanvullende beoordeling ontvangen."
                if information_payment
                else "Mockbetaling ontvangen; adviseur kan de review starten."
            ),
        )
    )
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="MOCK_PAYMENT_PAID",
            object_type="Payment",
            object_id=payment.id,
            metadata_json={
                "case_id": case.id,
                "amount_cents": payment.amount_cents,
                "payment_type": payment.payment_type,
            },
        )
    )
    session.expire(case, ["payments", "information_requests"])
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
