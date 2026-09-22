from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .db import get_session
from .schemas import AnonymisationPreview, AuditLogRead, CaseCreate, CaseListItem, CaseRead
from .services.cases import (
    case_to_list_item,
    case_to_read,
    confirm_structure,
    create_case,
    get_case_or_404,
    list_cases,
    publish_case,
)


router = APIRouter()


@router.post("/cases", response_model=CaseRead, status_code=201)
def submit_case(payload: CaseCreate, session: Session = Depends(get_session)) -> CaseRead:
    case = create_case(session, payload)
    return case_to_read(case, include_original=True)


@router.get("/cases", response_model=list[CaseListItem])
def customer_cases(session: Session = Depends(get_session)) -> list[CaseListItem]:
    return [case_to_list_item(case) for case in list_cases(session)]


@router.get("/cases/{case_id}", response_model=CaseRead)
def case_detail(case_id: str, session: Session = Depends(get_session)) -> CaseRead:
    return case_to_read(get_case_or_404(session, case_id), include_original=True)


@router.get("/cases/{case_id}/anonymisation-preview", response_model=AnonymisationPreview)
def anonymisation_preview(
    case_id: str, session: Session = Depends(get_session)
) -> AnonymisationPreview:
    case = get_case_or_404(session, case_id)
    return AnonymisationPreview(
        case_id=case.id,
        original_text=case.raw_inputs[-1].raw_text,
        anonymized_text=case.anonymized.anonymized_text,
        detected_entity_counts=case.anonymized.detected_entity_counts,
        review_status=case.anonymized.review_status,
    )


@router.post("/cases/{case_id}/confirm-structure", response_model=CaseRead)
def confirm_case_structure(case_id: str, session: Session = Depends(get_session)) -> CaseRead:
    case = confirm_structure(session, get_case_or_404(session, case_id))
    return case_to_read(case, include_original=True)


@router.post("/admin/cases/{case_id}/publish", response_model=CaseRead)
def admin_publish_case(case_id: str, session: Session = Depends(get_session)) -> CaseRead:
    case = publish_case(session, get_case_or_404(session, case_id))
    return case_to_read(case, include_original=True)


@router.get("/jobboard", response_model=list[CaseListItem])
def jobboard(session: Session = Depends(get_session)) -> list[CaseListItem]:
    return [case_to_list_item(case) for case in list_cases(session, status_filter="PUBLISHED")]


@router.get("/jobboard/{case_id}", response_model=CaseRead)
def jobboard_case(case_id: str, session: Session = Depends(get_session)) -> CaseRead:
    case = get_case_or_404(session, case_id)
    if case.status != "PUBLISHED":
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Gepubliceerde casus niet gevonden")
    return case_to_read(case, include_original=False)


@router.get("/admin/audit-logs", response_model=list[AuditLogRead])
def audit_logs(session: Session = Depends(get_session)) -> list[AuditLogRead]:
    statement = select(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(200)
    return list(session.scalars(statement))

