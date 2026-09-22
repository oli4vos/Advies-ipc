from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CaseCreate(BaseModel):
    title: str = Field(default="", max_length=240)
    description: str = Field(min_length=20, max_length=20_000)
    question: str = Field(default="", max_length=2_000)
    category: str = Field(default="Weet ik niet", max_length=80)
    tax_year: str = Field(default="Weet ik niet", max_length=16)
    client_type: str = Field(default="Weet ik niet", max_length=80)
    urgency: str = Field(default="Normaal", max_length=80)
    external_ai_answer: str = Field(default="", max_length=20_000)

    @field_validator("title", "description", "question", "external_ai_answer")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class FactRead(BaseModel):
    id: str
    label: str
    value: str
    source_type: str
    confidence: int
    customer_confirmation: str

    model_config = ConfigDict(from_attributes=True)


class IssueRead(BaseModel):
    id: str
    issue_type: str
    severity: str
    description: str
    resolution_status: str

    model_config = ConfigDict(from_attributes=True)


class SourceRead(BaseModel):
    title: str
    source_type: str
    citation: str
    version_or_date: str
    official: bool
    demo_only: bool

    model_config = ConfigDict(from_attributes=True)


class ProvenanceRead(BaseModel):
    entity_type: str
    entity_id: str
    entity_version: int
    origin_type: str
    creation_method: str
    schema_version: str
    content_hash: str
    ai_execution_id: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HistoryRead(BaseModel):
    from_status: str | None
    to_status: str
    actor_type: str
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIExecutionRead(BaseModel):
    id: str
    task_type: str
    provider: str
    model: str
    prompt_version: str
    input_snapshot_hash: str
    output_schema_version: str
    output_hash: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class ClaimRead(BaseModel):
    id: str
    expert_id: str
    expert_name: str
    expert_specialisation: str
    expert_rating: float
    status: str
    match_score: int
    message: str
    created_at: datetime
    selected_at: datetime | None


class PaymentRead(BaseModel):
    id: str
    amount_cents: int
    status: str
    provider: str
    payment_type: str
    information_request_id: str | None
    created_at: datetime
    paid_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ReviewItemRead(BaseModel):
    id: str
    ai_claim_id: str | None
    position: int
    dimension: str
    verdict: str
    comment: str

    model_config = ConfigDict(from_attributes=True)


class ExpertReviewRead(BaseModel):
    id: str
    expert_id: str
    expert_name: str
    final_answer: str
    notes: str
    status: str
    created_at: datetime
    submitted_at: datetime
    items: list[ReviewItemRead]


class ReviewItemCreate(BaseModel):
    ai_claim_id: str | None = None
    dimension: str = Field(max_length=80)
    verdict: str = Field(max_length=40)
    comment: str = Field(default="", max_length=2_000)


class ExpertReviewCreate(BaseModel):
    final_answer: str = Field(min_length=20, max_length=20_000)
    notes: str = Field(default="", max_length=5_000)
    items: list[ReviewItemCreate] = Field(default_factory=list, max_length=20)

    @field_validator("final_answer", "notes")
    @classmethod
    def strip_review_text(cls, value: str) -> str:
        return value.strip()


class ExpertRead(BaseModel):
    id: str
    display_name: str
    specialisation: str
    rating: float
    review_count: int
    active: bool


class ClaimCreate(BaseModel):
    expert_id: str | None = None
    message: str = Field(default="", max_length=500)

    @field_validator("message")
    @classmethod
    def strip_message(cls, value: str) -> str:
        return value.strip()


class InformationRequestRead(BaseModel):
    id: str
    expert_id: str
    expert_name: str
    status: str
    question: str
    rationale: str
    required_for_assessment: bool
    evaluation_origin: str
    evaluation_confidence: int
    proposed_fee_delta_cents: int
    approved_fee_delta_cents: int
    customer_answer: str
    created_at: datetime
    evaluated_at: datetime | None
    answered_at: datetime | None
    accepted_at: datetime | None


class InformationRequestCreate(BaseModel):
    question: str = Field(min_length=10, max_length=2_000)
    estimated_extra_minutes: int = Field(default=15, ge=5, le=120)

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        return value.strip()


class InformationAnswerCreate(BaseModel):
    answer: str = Field(min_length=10, max_length=10_000)

    @field_validator("answer")
    @classmethod
    def strip_answer(cls, value: str) -> str:
        return value.strip()


class CaseRead(BaseModel):
    id: str
    public_code: str
    title: str
    category: str
    specialization_tags: list[str]
    client_type: str
    tax_year: str
    urgency: str
    complexity: str
    estimated_minutes_min: int
    estimated_minutes_max: int
    offered_fee_cents: int
    deadline_label: str
    status: str
    version: int
    created_at: datetime
    published_at: datetime | None
    summary: str
    concrete_question: str
    anonymized_description: str
    original_description: str | None = None
    external_ai_answer: str | None = None
    ai_answer: str
    facts: list[FactRead]
    issues: list[IssueRead]
    sources: list[SourceRead]
    provenance: list[ProvenanceRead]
    ai_executions: list[AIExecutionRead]
    history: list[HistoryRead]
    claims: list[ClaimRead]
    payment: PaymentRead | None
    reviews: list[ExpertReviewRead]
    information_requests: list[InformationRequestRead]


class CaseListItem(BaseModel):
    id: str
    public_code: str
    title: str
    category: str
    specialization_tags: list[str]
    summary: str
    client_type: str
    tax_year: str
    complexity: str
    estimated_minutes_min: int
    estimated_minutes_max: int
    offered_fee_cents: int
    deadline_label: str
    missing_information_count: int
    status: str
    created_at: datetime


class StatusCommandResult(BaseModel):
    case_id: str
    public_code: str
    status: str
    version: int
    message: str


class AnonymisationPreview(BaseModel):
    case_id: str
    original_text: str
    anonymized_text: str
    detected_entity_counts: dict[str, int]
    review_status: str


class AuditLogRead(BaseModel):
    id: str
    actor_type: str
    action: str
    object_type: str
    object_id: str
    metadata_json: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


CaseStatus = Literal["PENDING_REVIEW", "PUBLISHED"]
