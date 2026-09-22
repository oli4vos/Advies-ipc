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
