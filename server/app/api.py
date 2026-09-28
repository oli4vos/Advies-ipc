from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .auth import (
    Actor,
    get_current_actor,
    require_case_customer,
    require_role,
    require_selected_expert,
)
from .db import get_session
from .schemas import (
    AnonymisationPreview,
    AuditLogRead,
    CaseCreate,
    CaseListItem,
    CaseRead,
    StructureConfirmation,
    ClaimCreate,
    ClaimRead,
    ExpertRead,
    ExpertReviewCreate,
    InformationAnswerCreate,
    InformationRequestDecision,
    InformationRequestCreate,
    InformationRequestRead,
    AttachmentRead,
)
from .services.cases import (
    case_to_list_item,
    case_to_read,
    confirm_structure,
    create_case,
    get_case_or_404,
    list_cases,
    list_selected_expert_cases,
    publish_case,
    claim_to_read,
    information_request_to_read,
)
from .services.marketplace import (
    claim_case,
    ensure_demo_expert,
    pay_case,
    select_claim,
    submit_review,
    accept_information_fee,
    answer_information,
    decide_information_request,
    request_information,
)
from .services.storage import store_private_upload
from .services.malware import get_malware_scanner
from .config import get_settings


router = APIRouter()


@router.post("/cases/{case_id}/attachments", response_model=AttachmentRead, status_code=201)
async def upload_case_attachment(
    case_id: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> AttachmentRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    settings = get_settings()
    original_name, storage_key, size_bytes, sha256 = await store_private_upload(
        file,
        case_id=case.id,
        root=settings.storage_path,
    )
    stored_path = (Path(settings.storage_path).resolve() / storage_key).resolve()
    scan_result = get_malware_scanner().scan(stored_path)
    if scan_result.status != "CLEARED":
        stored_path.unlink(missing_ok=True)
        status_code = 422 if scan_result.status == "REJECTED" else 503
        raise HTTPException(status_code=status_code, detail=f"Documentcontrole: {scan_result.detail}")
    attachment = models.CaseAttachment(
        case_id=case.id,
        uploaded_by=actor.user.id,
        original_name=original_name,
        storage_key=storage_key,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        sha256=sha256,
        scan_status=scan_result.status,
    )
    session.add(attachment)
    session.flush()
    session.add(
        models.AuditLog(
            actor_type="CUSTOMER",
            actor_id=actor.user.id,
            action="CASE_ATTACHMENT_STORED",
            object_type="CaseAttachment",
            object_id=attachment.id,
            metadata_json={"case_id": case.id, "size_bytes": size_bytes, "scan_status": scan_result.status, "scanner": scan_result.scanner},
        )
    )
    session.commit()
    session.refresh(attachment)
    return attachment


@router.get("/cases/{case_id}/attachments/{attachment_id}")
def download_case_attachment(
    case_id: str,
    attachment_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
):
    case = get_case_or_404(session, case_id)
    attachment = session.scalar(
        select(models.CaseAttachment).where(
            models.CaseAttachment.id == attachment_id,
            models.CaseAttachment.case_id == case.id,
        )
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="Document niet gevonden")

    if actor.role == "CUSTOMER":
        require_case_customer(actor, case)
    elif actor.role == "ADMIN":
        pass
    else:
        require_selected_expert(session, actor, case)
        if case.status not in {"PAID", "IN_REVIEW", "NEEDS_INFORMATION", "ANSWER_SUBMITTED", "DELIVERED"}:
            raise HTTPException(status_code=403, detail="Document is nog niet beschikbaar voor deze adviseur")

    if attachment.scan_status != "CLEARED":
        raise HTTPException(status_code=423, detail="Document wacht op veiligheidscontrole")

    root = Path(get_settings().storage_path).resolve()
    path = (root / attachment.storage_key).resolve()
    if root not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Documentbestand niet beschikbaar")
    return FileResponse(path, media_type=attachment.content_type, filename=attachment.original_name)


@router.post("/cases", response_model=CaseRead, status_code=201)
def submit_case(
    payload: CaseCreate,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    require_role(actor, "CUSTOMER")
    case = create_case(session, payload, customer=actor.user)
    return case_to_read(case, include_original=True)


@router.get("/cases", response_model=list[CaseListItem])
def customer_cases(
    session: Session = Depends(get_session), actor: Actor = Depends(get_current_actor)
) -> list[CaseListItem]:
    require_role(actor, "CUSTOMER", "ADMIN")
    customer_id = actor.user.id if actor.role == "CUSTOMER" else None
    return [case_to_list_item(case) for case in list_cases(session, customer_id=customer_id)]


@router.get("/cases/{case_id}", response_model=CaseRead)
def case_detail(
    case_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    if actor.role == "ADMIN":
        return case_to_read(case, include_original=True)
    if actor.role == "CUSTOMER":
        require_case_customer(actor, case)
        return case_to_read(case, include_original=True)
    require_selected_expert(session, actor, case)
    return case_to_read(case, include_original=False)


@router.get("/cases/{case_id}/anonymisation-preview", response_model=AnonymisationPreview)
def anonymisation_preview(
    case_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> AnonymisationPreview:
    case = get_case_or_404(session, case_id)
    if actor.role != "ADMIN":
        require_case_customer(actor, case)
    return AnonymisationPreview(
        case_id=case.id,
        original_text=case.raw_inputs[-1].raw_text,
        anonymized_text=case.anonymized.anonymized_text,
        detected_entity_counts=case.anonymized.detected_entity_counts,
        review_status=case.anonymized.review_status,
    )


@router.post("/cases/{case_id}/confirm-structure", response_model=CaseRead)
def confirm_case_structure(
    case_id: str,
    payload: StructureConfirmation,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    case = confirm_structure(
        session,
        case,
        payload.anonymisation_confirmed,
        payload.anonymized_text,
    )
    return case_to_read(case, include_original=True)


@router.post("/admin/cases/{case_id}/publish", response_model=CaseRead)
def admin_publish_case(
    case_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    require_role(actor, "ADMIN")
    case = publish_case(session, get_case_or_404(session, case_id))
    return case_to_read(case, include_original=True)


@router.post(
    "/admin/cases/{case_id}/information-requests/{request_id}/decision",
    response_model=CaseRead,
)
def decide_case_information_request(
    case_id: str,
    request_id: str,
    payload: InformationRequestDecision,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    require_role(actor, "ADMIN")
    return case_to_read(
        decide_information_request(
            session,
            get_case_or_404(session, case_id),
            request_id,
            payload,
            admin=actor.user,
        ),
        include_original=True,
    )


@router.get("/jobboard", response_model=list[CaseListItem])
def jobboard(
    session: Session = Depends(get_session), actor: Actor = Depends(get_current_actor)
) -> list[CaseListItem]:
    require_role(actor, "ADVISOR")
    cases = list_cases(session, status_filter=["PUBLISHED", "CLAIMED"])
    known_ids = {case.id for case in cases}
    cases.extend(
        case
        for case in list_selected_expert_cases(session, expert_id=actor.user.id)
        if case.id not in known_ids
    )
    return [case_to_list_item(case) for case in cases]


@router.get("/jobboard/{case_id}", response_model=CaseRead)
def jobboard_case(
    case_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    require_role(actor, "ADVISOR")
    case = get_case_or_404(session, case_id)
    selected_for_actor = any(
        claim.expert_id == actor.user.id and claim.status == "SELECTED"
        for claim in case.claims
    )
    if case.status not in {"PUBLISHED", "CLAIMED"} and not selected_for_actor:
        raise HTTPException(status_code=404, detail="Gepubliceerde casus niet gevonden")
    return case_to_read(case, include_original=False)


@router.get("/advisors", response_model=list[ExpertRead])
def advisors(
    session: Session = Depends(get_session), actor: Actor = Depends(get_current_actor)
) -> list[ExpertRead]:
    require_role(actor, "ADVISOR", "ADMIN")
    expert = ensure_demo_expert(session)
    return [
        ExpertRead(
            id=expert.id,
            display_name=expert.display_name,
            specialisation="Loonheffingen-specialist",
            rating=4.8,
            review_count=27,
            active=True,
        )
    ]


@router.post("/cases/{case_id}/claims", response_model=ClaimRead, status_code=201)
def create_case_claim(
    case_id: str,
    payload: ClaimCreate,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> ClaimRead:
    require_role(actor, "ADVISOR")
    claim = claim_case(session, get_case_or_404(session, case_id), payload, expert=actor.user)
    return claim_to_read(claim)


@router.post("/cases/{case_id}/claims/{claim_id}/select", response_model=CaseRead)
def choose_case_claim(
    case_id: str,
    claim_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    return case_to_read(
        select_claim(session, case, claim_id),
        include_original=True,
    )


@router.post("/cases/{case_id}/pay", response_model=CaseRead)
def pay_for_case(
    case_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    return case_to_read(pay_case(session, case), include_original=True)


@router.post("/cases/{case_id}/review", response_model=CaseRead)
def submit_case_review(
    case_id: str,
    payload: ExpertReviewCreate,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_selected_expert(session, actor, case)
    return case_to_read(
        submit_review(session, case, payload, expert=actor.user),
        include_original=False,
    )


@router.post(
    "/cases/{case_id}/information-requests",
    response_model=InformationRequestRead,
    status_code=201,
)
def create_information_request(
    case_id: str,
    payload: InformationRequestCreate,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> InformationRequestRead:
    case = get_case_or_404(session, case_id)
    require_selected_expert(session, actor, case)
    request = request_information(session, case, payload, expert=actor.user)
    return information_request_to_read(request)


@router.post("/cases/{case_id}/information-requests/{request_id}/answer", response_model=CaseRead)
def answer_information_request(
    case_id: str,
    request_id: str,
    payload: InformationAnswerCreate,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    return case_to_read(
        answer_information(session, case, request_id, payload),
        include_original=True,
    )


@router.post(
    "/cases/{case_id}/information-requests/{request_id}/accept-fee",
    response_model=CaseRead,
)
def accept_information_request_fee(
    case_id: str,
    request_id: str,
    session: Session = Depends(get_session),
    actor: Actor = Depends(get_current_actor),
) -> CaseRead:
    case = get_case_or_404(session, case_id)
    require_case_customer(actor, case)
    return case_to_read(
        accept_information_fee(session, case, request_id),
        include_original=True,
    )


@router.get("/admin/audit-logs", response_model=list[AuditLogRead])
def audit_logs(
    session: Session = Depends(get_session), actor: Actor = Depends(get_current_actor)
) -> list[AuditLogRead]:
    require_role(actor, "ADMIN")
    statement = select(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(200)
    return list(session.scalars(statement))
