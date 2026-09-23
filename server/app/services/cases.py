import hashlib
import json
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models
from ..schemas import (
    CaseCreate,
    CaseListItem,
    CaseRead,
    ClaimRead,
    ExpertReviewRead,
    InformationRequestRead,
    PaymentRead,
)
from .analysis import analyse
from .anonymisation import anonymise


CASE_LOAD_OPTIONS = (
    selectinload(models.Case.raw_inputs),
    selectinload(models.Case.external_ai_answers),
    selectinload(models.Case.facts),
    selectinload(models.Case.issues),
    selectinload(models.Case.summary),
    selectinload(models.Case.anonymized),
    selectinload(models.Case.ai_executions),
    selectinload(models.Case.ai_answers)
    .selectinload(models.AIAnswer.claims)
    .selectinload(models.AIClaim.source_links)
    .selectinload(models.AIClaimSource.source),
    selectinload(models.Case.provenance),
    selectinload(models.Case.history),
    selectinload(models.Case.claims).selectinload(models.ExpertClaim.expert),
    selectinload(models.Case.payments),
    selectinload(models.Case.information_requests).selectinload(models.InformationRequest.expert),
    selectinload(models.Case.reviews).selectinload(models.ExpertReview.expert),
    selectinload(models.Case.reviews).selectinload(models.ExpertReview.items),
)


def content_hash(value: str | dict | list) -> str:
    serialized = value if isinstance(value, str) else json.dumps(value, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def get_case_or_404(session: Session, case_id: str) -> models.Case:
    statement = select(models.Case).where(
        (models.Case.id == case_id) | (models.Case.public_code == case_id)
    )
    case = session.scalar(statement.options(*CASE_LOAD_OPTIONS))
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Casus niet gevonden")
    return case


def _add_provenance(
    session: Session,
    *,
    case: models.Case,
    entity_type: str,
    entity_id: str,
    origin_type: str,
    creation_method: str,
    schema_version: str,
    value: str | dict | list,
    producer_user_id: str | None = None,
    ai_execution_id: str | None = None,
) -> None:
    session.add(
        models.ProvenanceRecord(
            case_id=case.id,
            entity_type=entity_type,
            entity_id=entity_id,
            origin_type=origin_type,
            producer_user_id=producer_user_id,
            ai_execution_id=ai_execution_id,
            creation_method=creation_method,
            schema_version=schema_version,
            content_hash=content_hash(value),
        )
    )


def create_case(session: Session, payload: CaseCreate, *, customer: models.User) -> models.Case:
    anonymized_result = anonymise(payload.description)
    anonymized_title = anonymise(payload.title).text
    anonymized_question = anonymise(payload.question).text
    analysis = analyse(
        anonymized_text=anonymized_result.text,
        supplied_title=anonymized_title,
        supplied_question=anonymized_question,
        supplied_category=payload.category,
        urgency=payload.urgency,
    )
    prefix = {"Loonheffingen": "LH", "Btw": "BTW", "Inkomstenbelasting": "IB"}.get(
        analysis.category, "FIS"
    )
    case = models.Case(
        public_code=f"{prefix}-{uuid4().hex[:6].upper()}",
        customer_id=customer.id,
        title=analysis.title,
        category=analysis.category,
        specialization_tags=analysis.tags,
        client_type=payload.client_type,
        tax_year=payload.tax_year,
        urgency=payload.urgency,
        complexity=analysis.complexity,
        estimated_minutes_min=analysis.minutes_min,
        estimated_minutes_max=analysis.minutes_max,
        offered_fee_cents=analysis.fee_cents,
        deadline_label=analysis.deadline_label,
        status="PENDING_REVIEW",
    )
    session.add(case)
    session.flush()

    raw_input = models.RawCaseInput(
        case_id=case.id,
        raw_text=payload.description,
        concrete_question=payload.question,
        submitted_by=customer.id,
    )
    session.add(raw_input)
    session.flush()

    if payload.external_ai_answer:
        anonymized_external_answer = anonymise(payload.external_ai_answer).text
        external = models.ExternalAIAnswer(
            case_id=case.id,
            answer_text=payload.external_ai_answer,
            anonymized_answer_text=anonymized_external_answer,
        )
        session.add(external)
        session.flush()
        _add_provenance(
            session,
            case=case,
            entity_type="ExternalAIAnswer",
            entity_id=external.id,
            origin_type="EXTERNAL_AI",
            creation_method="IMPORTED",
            schema_version="external-ai-answer.v1",
            value=external.answer_text,
            producer_user_id=customer.id,
        )

    output_payload = {
        "title": analysis.title,
        "category": analysis.category,
        "tags": analysis.tags,
        "summary": analysis.summary,
        "facts": analysis.facts,
        "question": analysis.concrete_question,
        "complexity": analysis.complexity,
    }
    ai_execution = models.AIExecution(
        case_id=case.id,
        task_type="STRUCTURE_AND_DRAFT",
        input_snapshot_hash=content_hash(payload.description),
        output_hash=content_hash(output_payload),
    )
    session.add(ai_execution)
    session.flush()

    summary = models.CaseSummary(
        case_id=case.id,
        short_title=analysis.title,
        summary=analysis.summary,
        concrete_question=analysis.concrete_question,
    )
    anonymized = models.AnonymizedCase(
        case_id=case.id,
        anonymized_text=anonymized_result.text,
        detected_entity_counts=anonymized_result.entity_counts,
    )
    session.add_all((summary, anonymized))
    session.flush()

    fact_records: list[models.StructuredFact] = []
    for position, fact in enumerate(analysis.facts, start=1):
        fact_record = models.StructuredFact(
            case_id=case.id,
            position=position,
            label=f"Feit {position}",
            value=fact,
        )
        session.add(fact_record)
        fact_records.append(fact_record)

    for description in analysis.missing_information:
        session.add(
            models.CaseIssue(
                case_id=case.id,
                issue_type="MISSING_FACT",
                severity="MEDIUM",
                description=description,
            )
        )

    source = models.Source(
        title=analysis.source_title,
        source_type=analysis.source_type,
        citation=analysis.source_citation,
        version_or_date=analysis.source_version,
        official=False,
        demo_only=True,
    )
    answer = models.AIAnswer(
        case_id=case.id,
        ai_execution_id=ai_execution.id,
        answer_text=analysis.draft_answer,
    )
    session.add_all((source, answer))
    session.flush()
    claim = models.AIClaim(
        ai_answer_id=answer.id,
        position=1,
        claim_key="orientation-only",
        claim_text=analysis.draft_answer,
        certainty="LOW",
        requires_missing_fact=True,
    )
    session.add(claim)
    session.flush()
    session.add(models.AIClaimSource(claim_id=claim.id, source_id=source.id))

    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=None,
            to_status="PENDING_REVIEW",
            actor_type="CUSTOMER",
            actor_id=customer.id,
            reason="Casus ingediend, lokaal gestructureerd en geanonimiseerd.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=customer.id,
            action="CASE_CREATED",
            object_type="Case",
            object_id=case.id,
            metadata_json={
                "public_code": case.public_code,
                "status": case.status,
                "detected_entity_counts": anonymized_result.entity_counts,
            },
        )
    )

    session.flush()
    _add_provenance(
        session,
        case=case,
        entity_type="RawCaseInput",
        entity_id=raw_input.id,
        origin_type="CUSTOMER",
        creation_method="CREATED",
        schema_version="raw-case-input.v1",
        value=payload.description,
        producer_user_id=customer.id,
    )
    _add_provenance(
        session,
        case=case,
        entity_type="AnonymizedCase",
        entity_id=anonymized.id,
        origin_type="SYSTEM_RULE",
        creation_method="DERIVED",
        schema_version="anonymized-case.v1",
        value=anonymized.anonymized_text,
    )
    _add_provenance(
        session,
        case=case,
        entity_type="CaseSummary",
        entity_id=summary.id,
        origin_type="PLATFORM_AI",
        creation_method="DERIVED",
        schema_version=summary.schema_version,
        value=output_payload,
        ai_execution_id=ai_execution.id,
    )
    for fact_record in fact_records:
        session.flush()
        _add_provenance(
            session,
            case=case,
            entity_type="StructuredFact",
            entity_id=fact_record.id,
            origin_type="PLATFORM_AI",
            creation_method="EXTRACTED",
            schema_version="structured-fact.v1",
            value=fact_record.value,
            ai_execution_id=ai_execution.id,
        )
    _add_provenance(
        session,
        case=case,
        entity_type="AIAnswer",
        entity_id=answer.id,
        origin_type="PLATFORM_AI",
        creation_method="CREATED",
        schema_version=answer.answer_schema_version,
        value=answer.answer_text,
        ai_execution_id=ai_execution.id,
    )
    _add_provenance(
        session,
        case=case,
        entity_type="Source",
        entity_id=source.id,
        origin_type="IMPORTED_SOURCE",
        creation_method="IMPORTED",
        schema_version="source.v1",
        value={"title": source.title, "citation": source.citation, "version": source.version_or_date},
    )

    session.commit()
    return get_case_or_404(session, case.id)


def confirm_structure(
    session: Session, case: models.Case, anonymisation_confirmed: bool = False
) -> models.Case:
    if not anonymisation_confirmed:
        raise HTTPException(
            status_code=422,
            detail="De klant moet eerst de geanonimiseerde tekst controleren en bevestigen",
        )
    if case.status != "PENDING_REVIEW":
        raise HTTPException(status_code=409, detail="Alleen een casus in controle kan worden bevestigd")
    if case.summary is None:
        raise HTTPException(status_code=409, detail="Casussamenvatting ontbreekt")
    case.summary.confirmed_at = datetime.now(timezone.utc)
    for fact in case.facts:
        fact.customer_confirmation = "CONFIRMED"
    case.version += 1
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status="PENDING_REVIEW",
            to_status="PENDING_REVIEW",
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            reason="Klant heeft de gestructureerde feiten en anonimisering bevestigd.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=case.customer_id,
            action="CASE_STRUCTURE_CONFIRMED",
            object_type="Case",
            object_id=case.id,
            metadata_json={"version": case.version, "anonymisation_confirmed": True},
        )
    )
    session.commit()
    return get_case_or_404(session, case.id)


def publish_case(session: Session, case: models.Case) -> models.Case:
    if case.status != "PENDING_REVIEW":
        raise HTTPException(status_code=409, detail="Casus kan vanuit deze status niet worden gepubliceerd")
    if case.summary is None or case.summary.confirmed_at is None:
        raise HTTPException(status_code=409, detail="De klant moet eerst de casusstructuur bevestigen")
    if case.anonymized is None:
        raise HTTPException(status_code=409, detail="Geanonimiseerde casus ontbreekt")
    previous = case.status
    case.status = "PUBLISHED"
    case.published_at = datetime.now(timezone.utc)
    case.version += 1
    case.anonymized.review_status = "APPROVED"
    session.add(
        models.CaseStatusHistory(
            case_id=case.id,
            from_status=previous,
            to_status=case.status,
            actor_type="ADMIN",
            reason="Anonimisering en structuur gecontroleerd; casus gepubliceerd.",
        )
    )
    session.add(
        models.AuditLog(
            actor_type="ADMIN",
            action="CASE_PUBLISHED",
            object_type="Case",
            object_id=case.id,
            metadata_json={"from_status": previous, "to_status": case.status},
        )
    )
    session.commit()
    return get_case_or_404(session, case.id)


def claim_to_read(claim: models.ExpertClaim) -> ClaimRead:
    return ClaimRead(
        id=claim.id,
        expert_id=claim.expert_id,
        expert_name=claim.expert.display_name,
        expert_specialisation="Loonheffingen-specialist",
        expert_rating=4.8,
        status=claim.status,
        match_score=claim.match_score,
        message=claim.message,
        created_at=claim.created_at,
        selected_at=claim.selected_at,
    )


def review_to_read(review: models.ExpertReview) -> ExpertReviewRead:
    return ExpertReviewRead(
        id=review.id,
        expert_id=review.expert_id,
        expert_name=review.expert.display_name,
        final_answer=review.final_answer,
        notes=review.notes,
        status=review.status,
        created_at=review.created_at,
        submitted_at=review.submitted_at,
        items=review.items,
    )


def information_request_to_read(
    request: models.InformationRequest,
) -> InformationRequestRead:
    return InformationRequestRead(
        id=request.id,
        expert_id=request.expert_id,
        expert_name=request.expert.display_name,
        status=request.status,
        question=request.question,
        rationale=request.rationale,
        required_for_assessment=request.required_for_assessment,
        evaluation_origin=request.evaluation_origin,
        evaluation_confidence=request.evaluation_confidence,
        proposed_fee_delta_cents=request.proposed_fee_delta_cents,
        approved_fee_delta_cents=request.approved_fee_delta_cents,
        platform_decision_note=request.platform_decision_note,
        platform_decided_at=request.platform_decided_at,
        customer_answer=request.customer_answer,
        created_at=request.created_at,
        evaluated_at=request.evaluated_at,
        answered_at=request.answered_at,
        accepted_at=request.accepted_at,
    )


def case_to_read(case: models.Case, *, include_original: bool) -> CaseRead:
    answer = case.ai_answers[-1] if case.ai_answers else None
    sources = []
    if answer:
        seen: set[str] = set()
        for claim in answer.claims:
            for link in claim.source_links:
                if link.source.id not in seen:
                    seen.add(link.source.id)
                    sources.append(link.source)
    return CaseRead(
        id=case.id,
        public_code=case.public_code,
        title=case.title,
        category=case.category,
        specialization_tags=case.specialization_tags,
        client_type=case.client_type,
        tax_year=case.tax_year,
        urgency=case.urgency,
        complexity=case.complexity,
        estimated_minutes_min=case.estimated_minutes_min,
        estimated_minutes_max=case.estimated_minutes_max,
        offered_fee_cents=case.offered_fee_cents,
        deadline_label=case.deadline_label,
        status=case.status,
        version=case.version,
        created_at=case.created_at,
        published_at=case.published_at,
        summary=case.summary.summary if case.summary else "",
        concrete_question=case.summary.concrete_question if case.summary else "",
        anonymized_description=case.anonymized.anonymized_text if case.anonymized else "",
        original_description=case.raw_inputs[-1].raw_text if include_original and case.raw_inputs else None,
        external_ai_answer=(
            case.external_ai_answers[-1].answer_text
            if include_original and case.external_ai_answers
            else case.external_ai_answers[-1].anonymized_answer_text
            if case.external_ai_answers
            else None
        ),
        ai_answer=answer.answer_text if answer else "",
        facts=case.facts,
        issues=case.issues,
        sources=sources,
        provenance=case.provenance,
        ai_executions=case.ai_executions,
        history=case.history,
        claims=[claim_to_read(claim) for claim in case.claims],
        payment=PaymentRead.model_validate(case.payments[-1]) if case.payments else None,
        reviews=[review_to_read(review) for review in case.reviews],
        information_requests=[
            information_request_to_read(request) for request in case.information_requests
        ],
    )


def case_to_list_item(case: models.Case) -> CaseListItem:
    return CaseListItem(
        id=case.id,
        public_code=case.public_code,
        title=case.title,
        category=case.category,
        specialization_tags=case.specialization_tags,
        summary=case.summary.summary if case.summary else "",
        client_type=case.client_type,
        tax_year=case.tax_year,
        complexity=case.complexity,
        estimated_minutes_min=case.estimated_minutes_min,
        estimated_minutes_max=case.estimated_minutes_max,
        offered_fee_cents=case.offered_fee_cents,
        deadline_label=case.deadline_label,
        missing_information_count=sum(
            issue.issue_type == "MISSING_FACT" and issue.resolution_status == "OPEN"
            for issue in case.issues
        ),
        status=case.status,
        created_at=case.created_at,
    )


def list_cases(
    session: Session,
    *,
    status_filter: str | list[str] | None = None,
    customer_id: str | None = None,
) -> list[models.Case]:
    statement = select(models.Case).options(*CASE_LOAD_OPTIONS).order_by(models.Case.created_at.desc())
    if isinstance(status_filter, list):
        statement = statement.where(models.Case.status.in_(status_filter))
    elif status_filter:
        statement = statement.where(models.Case.status == status_filter)
    if customer_id:
        statement = statement.where(models.Case.customer_id == customer_id)
    return list(session.scalars(statement).unique())
