from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def new_id() -> str:
    return str(uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    auth_provider_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    role: Mapped[str] = mapped_column(String(32), index=True)
    display_name: Mapped[str] = mapped_column(String(160))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    public_code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(240))
    category: Mapped[str] = mapped_column(String(80), index=True)
    specialization_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    client_type: Mapped[str] = mapped_column(String(80))
    tax_year: Mapped[str] = mapped_column(String(16))
    urgency: Mapped[str] = mapped_column(String(80), default="Normaal")
    complexity: Mapped[str] = mapped_column(String(32))
    estimated_minutes_min: Mapped[int] = mapped_column(Integer)
    estimated_minutes_max: Mapped[int] = mapped_column(Integer)
    offered_fee_cents: Mapped[int] = mapped_column(Integer)
    deadline_label: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), index=True, default="PENDING_REVIEW")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    customer: Mapped[User] = relationship()
    raw_inputs: Mapped[list[RawCaseInput]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="RawCaseInput.input_version"
    )
    external_ai_answers: Mapped[list[ExternalAIAnswer]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    facts: Mapped[list[StructuredFact]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="StructuredFact.position"
    )
    issues: Mapped[list[CaseIssue]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    summary: Mapped[CaseSummary | None] = relationship(
        back_populates="case", cascade="all, delete-orphan", uselist=False
    )
    anonymized: Mapped[AnonymizedCase | None] = relationship(
        back_populates="case", cascade="all, delete-orphan", uselist=False
    )
    ai_executions: Mapped[list[AIExecution]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    ai_answers: Mapped[list[AIAnswer]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    provenance: Mapped[list[ProvenanceRecord]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    history: Mapped[list[CaseStatusHistory]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="CaseStatusHistory.created_at"
    )
    claims: Mapped[list[ExpertClaim]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="ExpertClaim.created_at"
    )
    payments: Mapped[list[Payment]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="Payment.created_at"
    )
    information_requests: Mapped[list[InformationRequest]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="InformationRequest.created_at"
    )
    reviews: Mapped[list[ExpertReview]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="ExpertReview.created_at"
    )


class ExpertClaim(Base):
    __tablename__ = "expert_claims"
    __table_args__ = (UniqueConstraint("case_id", "expert_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    expert_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING_CUSTOMER")
    match_score: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    selected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped[Case] = relationship(back_populates="claims")
    expert: Mapped[User] = relationship(foreign_keys=[expert_id])


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(24), default="PENDING")
    provider: Mapped[str] = mapped_column(String(40), default="mock")
    payment_type: Mapped[str] = mapped_column(String(40), default="BASE_CASE")
    information_request_id: Mapped[str | None] = mapped_column(
        ForeignKey("information_requests.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped[Case] = relationship(back_populates="payments")
    customer: Mapped[User] = relationship()
    information_request: Mapped[InformationRequest | None] = relationship()


class InformationRequest(Base):
    __tablename__ = "information_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    review_id: Mapped[str | None] = mapped_column(ForeignKey("expert_reviews.id"), index=True)
    expert_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="PENDING_PLATFORM_REVIEW")
    question: Mapped[str] = mapped_column(Text)
    rationale: Mapped[str] = mapped_column(Text, default="")
    required_for_assessment: Mapped[bool] = mapped_column(Boolean, default=False)
    evaluation_origin: Mapped[str] = mapped_column(String(40), default="RULE_ENGINE")
    evaluation_confidence: Mapped[int] = mapped_column(Integer, default=0)
    proposed_fee_delta_cents: Mapped[int] = mapped_column(Integer, default=0)
    approved_fee_delta_cents: Mapped[int] = mapped_column(Integer, default=0)
    platform_decision_note: Mapped[str] = mapped_column(Text, default="")
    platform_decided_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    platform_decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    customer_answer: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped[Case] = relationship(back_populates="information_requests")
    expert: Mapped[User] = relationship(foreign_keys=[expert_id])


class RawCaseInput(Base):
    __tablename__ = "raw_case_inputs"
    __table_args__ = (UniqueConstraint("case_id", "input_version"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    raw_text: Mapped[str] = mapped_column(Text)
    concrete_question: Mapped[str] = mapped_column(Text, default="")
    submitted_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    input_version: Mapped[int] = mapped_column(Integer, default=1)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="raw_inputs")


class ExternalAIAnswer(Base):
    __tablename__ = "external_ai_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    provider_label: Mapped[str] = mapped_column(String(120), default="Door klant aangeleverd")
    answer_text: Mapped[str] = mapped_column(Text)
    anonymized_answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_status: Mapped[str] = mapped_column(String(40), default="UNREVIEWED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="external_ai_answers")


class StructuredFact(Base):
    __tablename__ = "structured_facts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    fact_type: Mapped[str] = mapped_column(String(80), default="CUSTOMER_STATEMENT")
    label: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(40), default="CUSTOMER_TEXT")
    source_reference: Mapped[str] = mapped_column(String(160), default="raw_input:v1")
    confidence: Mapped[int] = mapped_column(Integer, default=75)
    customer_confirmation: Mapped[str] = mapped_column(String(32), default="PENDING")
    required_for_advice: Mapped[bool] = mapped_column(Boolean, default=True)

    case: Mapped[Case] = relationship(back_populates="facts")


class CaseIssue(Base):
    __tablename__ = "case_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    issue_type: Mapped[str] = mapped_column(String(40))
    severity: Mapped[str] = mapped_column(String(24), default="MEDIUM")
    description: Mapped[str] = mapped_column(Text)
    resolution_status: Mapped[str] = mapped_column(String(32), default="OPEN")

    case: Mapped[Case] = relationship(back_populates="issues")


class CaseSummary(Base):
    __tablename__ = "case_summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), unique=True, index=True)
    short_title: Mapped[str] = mapped_column(String(240))
    summary: Mapped[str] = mapped_column(String(500))
    concrete_question: Mapped[str] = mapped_column(Text)
    generated_by: Mapped[str] = mapped_column(String(40), default="MOCK_AI")
    schema_version: Mapped[str] = mapped_column(String(24), default="case-summary.v1")
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped[Case] = relationship(back_populates="summary")


class AnonymizedCase(Base):
    __tablename__ = "anonymized_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), unique=True, index=True)
    anonymized_text: Mapped[str] = mapped_column(Text)
    detected_entity_counts: Mapped[dict[str, int]] = mapped_column(JSON, default=dict)
    review_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    published_version: Mapped[int] = mapped_column(Integer, default=1)

    case: Mapped[Case] = relationship(back_populates="anonymized")


class AIExecution(Base):
    __tablename__ = "ai_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    task_type: Mapped[str] = mapped_column(String(40))
    provider: Mapped[str] = mapped_column(String(80), default="mock-local")
    model: Mapped[str] = mapped_column(String(80), default="deterministic-rules-v1")
    prompt_version: Mapped[str] = mapped_column(String(40), default="structure-v1")
    input_snapshot_hash: Mapped[str] = mapped_column(String(64))
    output_schema_version: Mapped[str] = mapped_column(String(40), default="case-structure.v1")
    output_hash: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(24), default="COMPLETED")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="ai_executions")


class AIAnswer(Base):
    __tablename__ = "ai_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    ai_execution_id: Mapped[str] = mapped_column(ForeignKey("ai_executions.id"), index=True)
    answer_text: Mapped[str] = mapped_column(Text)
    answer_schema_version: Mapped[str] = mapped_column(String(40), default="draft-answer.v1")
    status: Mapped[str] = mapped_column(String(32), default="DRAFT_REQUIRES_REVIEW")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="ai_answers")
    claims: Mapped[list[AIClaim]] = relationship(
        back_populates="answer", cascade="all, delete-orphan", order_by="AIClaim.position"
    )


class AIClaim(Base):
    __tablename__ = "ai_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    ai_answer_id: Mapped[str] = mapped_column(ForeignKey("ai_answers.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    claim_key: Mapped[str] = mapped_column(String(80))
    claim_text: Mapped[str] = mapped_column(Text)
    certainty: Mapped[str] = mapped_column(String(24), default="LOW")
    requires_missing_fact: Mapped[bool] = mapped_column(Boolean, default=True)
    review_status: Mapped[str] = mapped_column(String(32), default="UNREVIEWED")

    answer: Mapped[AIAnswer] = relationship(back_populates="claims")
    source_links: Mapped[list[AIClaimSource]] = relationship(
        back_populates="claim", cascade="all, delete-orphan"
    )


class ExpertReview(Base):
    __tablename__ = "expert_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    expert_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    claim_id: Mapped[str] = mapped_column(ForeignKey("expert_claims.id"), index=True)
    final_answer: Mapped[str] = mapped_column(Text)
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="SUBMITTED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="reviews")
    expert: Mapped[User] = relationship()
    claim: Mapped[ExpertClaim] = relationship()
    items: Mapped[list[ExpertReviewItem]] = relationship(
        back_populates="review", cascade="all, delete-orphan", order_by="ExpertReviewItem.position"
    )


class ExpertReviewItem(Base):
    __tablename__ = "expert_review_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    review_id: Mapped[str] = mapped_column(ForeignKey("expert_reviews.id"), index=True)
    ai_claim_id: Mapped[str | None] = mapped_column(ForeignKey("ai_claims.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    dimension: Mapped[str] = mapped_column(String(80))
    verdict: Mapped[str] = mapped_column(String(40))
    comment: Mapped[str] = mapped_column(Text, default="")

    review: Mapped[ExpertReview] = relationship(back_populates="items")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(300))
    source_type: Mapped[str] = mapped_column(String(60))
    citation: Mapped[str] = mapped_column(String(500))
    version_or_date: Mapped[str] = mapped_column(String(80))
    official: Mapped[bool] = mapped_column(Boolean, default=False)
    demo_only: Mapped[bool] = mapped_column(Boolean, default=True)


class AIClaimSource(Base):
    __tablename__ = "ai_claim_sources"
    __table_args__ = (UniqueConstraint("claim_id", "source_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    claim_id: Mapped[str] = mapped_column(ForeignKey("ai_claims.id"), index=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), index=True)

    claim: Mapped[AIClaim] = relationship(back_populates="source_links")
    source: Mapped[Source] = relationship()


class ProvenanceRecord(Base):
    __tablename__ = "provenance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    entity_version: Mapped[int] = mapped_column(Integer, default=1)
    origin_type: Mapped[str] = mapped_column(String(40), index=True)
    producer_user_id: Mapped[str | None] = mapped_column(String(36))
    ai_execution_id: Mapped[str | None] = mapped_column(ForeignKey("ai_executions.id"))
    creation_method: Mapped[str] = mapped_column(String(40))
    schema_version: Mapped[str] = mapped_column(String(40))
    content_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="provenance")


class CaseStatusHistory(Base):
    __tablename__ = "case_status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(40))
    to_status: Mapped[str] = mapped_column(String(40))
    actor_type: Mapped[str] = mapped_column(String(40))
    actor_id: Mapped[str | None] = mapped_column(String(36))
    reason: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped[Case] = relationship(back_populates="history")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_type: Mapped[str] = mapped_column(String(40))
    actor_id: Mapped[str | None] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(100), index=True)
    object_type: Mapped[str] = mapped_column(String(80))
    object_id: Mapped[str] = mapped_column(String(36), index=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
