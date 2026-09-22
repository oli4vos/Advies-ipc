"""Initial vertical slice schema.

Revision ID: 0001
Revises: None
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("actor_type", sa.String(length=40), nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("object_type", sa.String(length=80), nullable=False),
        sa.Column("object_id", sa.String(length=36), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"])
    op.create_index(op.f("ix_audit_logs_object_id"), "audit_logs", ["object_id"])
    op.create_table(
        "sources",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("source_type", sa.String(length=60), nullable=False),
        sa.Column("citation", sa.String(length=500), nullable=False),
        sa.Column("version_or_date", sa.String(length=80), nullable=False),
        sa.Column("official", sa.Boolean(), nullable=False),
        sa.Column("demo_only", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"])
    op.create_table(
        "cases",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("public_code", sa.String(length=24), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("specialization_tags", sa.JSON(), nullable=False),
        sa.Column("client_type", sa.String(length=80), nullable=False),
        sa.Column("tax_year", sa.String(length=16), nullable=False),
        sa.Column("urgency", sa.String(length=80), nullable=False),
        sa.Column("complexity", sa.String(length=32), nullable=False),
        sa.Column("estimated_minutes_min", sa.Integer(), nullable=False),
        sa.Column("estimated_minutes_max", sa.Integer(), nullable=False),
        sa.Column("offered_fee_cents", sa.Integer(), nullable=False),
        sa.Column("deadline_label", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cases_category"), "cases", ["category"])
    op.create_index(op.f("ix_cases_customer_id"), "cases", ["customer_id"])
    op.create_index(op.f("ix_cases_public_code"), "cases", ["public_code"], unique=True)
    op.create_index(op.f("ix_cases_status"), "cases", ["status"])
    op.create_table(
        "ai_executions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("task_type", sa.String(length=40), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=80), nullable=False),
        sa.Column("prompt_version", sa.String(length=40), nullable=False),
        sa.Column("input_snapshot_hash", sa.String(length=64), nullable=False),
        sa.Column("output_schema_version", sa.String(length=40), nullable=False),
        sa.Column("output_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_executions_case_id"), "ai_executions", ["case_id"])
    op.create_table(
        "anonymized_cases",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("anonymized_text", sa.Text(), nullable=False),
        sa.Column("detected_entity_counts", sa.JSON(), nullable=False),
        sa.Column("review_status", sa.String(length=32), nullable=False),
        sa.Column("published_version", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_anonymized_cases_case_id"), "anonymized_cases", ["case_id"], unique=True
    )
    op.create_table(
        "case_issues",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("issue_type", sa.String(length=40), nullable=False),
        sa.Column("severity", sa.String(length=24), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("resolution_status", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_case_issues_case_id"), "case_issues", ["case_id"])
    op.create_table(
        "case_status_history",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("from_status", sa.String(length=40), nullable=True),
        sa.Column("to_status", sa.String(length=40), nullable=False),
        sa.Column("actor_type", sa.String(length=40), nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=True),
        sa.Column("reason", sa.String(length=300), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_case_status_history_case_id"), "case_status_history", ["case_id"]
    )
    op.create_table(
        "case_summaries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("short_title", sa.String(length=240), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("concrete_question", sa.Text(), nullable=False),
        sa.Column("generated_by", sa.String(length=40), nullable=False),
        sa.Column("schema_version", sa.String(length=24), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_case_summaries_case_id"), "case_summaries", ["case_id"], unique=True
    )
    op.create_table(
        "external_ai_answers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("provider_label", sa.String(length=120), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("assessment_status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_external_ai_answers_case_id"), "external_ai_answers", ["case_id"]
    )
    op.create_table(
        "raw_case_inputs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("concrete_question", sa.Text(), nullable=False),
        sa.Column("submitted_by", sa.String(length=36), nullable=False),
        sa.Column("input_version", sa.Integer(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("case_id", "input_version"),
    )
    op.create_index(op.f("ix_raw_case_inputs_case_id"), "raw_case_inputs", ["case_id"])
    op.create_table(
        "structured_facts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("fact_type", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("source_type", sa.String(length=40), nullable=False),
        sa.Column("source_reference", sa.String(length=160), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False),
        sa.Column("customer_confirmation", sa.String(length=32), nullable=False),
        sa.Column("required_for_advice", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_structured_facts_case_id"), "structured_facts", ["case_id"])
    op.create_table(
        "ai_answers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("ai_execution_id", sa.String(length=36), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("answer_schema_version", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["ai_execution_id"], ["ai_executions.id"]),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_answers_ai_execution_id"), "ai_answers", ["ai_execution_id"])
    op.create_index(op.f("ix_ai_answers_case_id"), "ai_answers", ["case_id"])
    op.create_table(
        "provenance_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("entity_version", sa.Integer(), nullable=False),
        sa.Column("origin_type", sa.String(length=40), nullable=False),
        sa.Column("producer_user_id", sa.String(length=36), nullable=True),
        sa.Column("ai_execution_id", sa.String(length=36), nullable=True),
        sa.Column("creation_method", sa.String(length=40), nullable=False),
        sa.Column("schema_version", sa.String(length=40), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["ai_execution_id"], ["ai_executions.id"]),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_provenance_records_case_id"), "provenance_records", ["case_id"]
    )
    op.create_index(
        op.f("ix_provenance_records_entity_id"), "provenance_records", ["entity_id"]
    )
    op.create_index(
        op.f("ix_provenance_records_entity_type"), "provenance_records", ["entity_type"]
    )
    op.create_index(
        op.f("ix_provenance_records_origin_type"), "provenance_records", ["origin_type"]
    )
    op.create_table(
        "ai_claims",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("ai_answer_id", sa.String(length=36), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("claim_key", sa.String(length=80), nullable=False),
        sa.Column("claim_text", sa.Text(), nullable=False),
        sa.Column("certainty", sa.String(length=24), nullable=False),
        sa.Column("requires_missing_fact", sa.Boolean(), nullable=False),
        sa.Column("review_status", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["ai_answer_id"], ["ai_answers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_claims_ai_answer_id"), "ai_claims", ["ai_answer_id"])
    op.create_table(
        "ai_claim_sources",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("claim_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["claim_id"], ["ai_claims.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("claim_id", "source_id"),
    )
    op.create_index(op.f("ix_ai_claim_sources_claim_id"), "ai_claim_sources", ["claim_id"])
    op.create_index(op.f("ix_ai_claim_sources_source_id"), "ai_claim_sources", ["source_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_claim_sources_source_id"), table_name="ai_claim_sources")
    op.drop_index(op.f("ix_ai_claim_sources_claim_id"), table_name="ai_claim_sources")
    op.drop_table("ai_claim_sources")
    op.drop_index(op.f("ix_ai_claims_ai_answer_id"), table_name="ai_claims")
    op.drop_table("ai_claims")
    op.drop_index(op.f("ix_provenance_records_origin_type"), table_name="provenance_records")
    op.drop_index(op.f("ix_provenance_records_entity_type"), table_name="provenance_records")
    op.drop_index(op.f("ix_provenance_records_entity_id"), table_name="provenance_records")
    op.drop_index(op.f("ix_provenance_records_case_id"), table_name="provenance_records")
    op.drop_table("provenance_records")
    op.drop_index(op.f("ix_ai_answers_case_id"), table_name="ai_answers")
    op.drop_index(op.f("ix_ai_answers_ai_execution_id"), table_name="ai_answers")
    op.drop_table("ai_answers")
    op.drop_index(op.f("ix_structured_facts_case_id"), table_name="structured_facts")
    op.drop_table("structured_facts")
    op.drop_index(op.f("ix_raw_case_inputs_case_id"), table_name="raw_case_inputs")
    op.drop_table("raw_case_inputs")
    op.drop_index(op.f("ix_external_ai_answers_case_id"), table_name="external_ai_answers")
    op.drop_table("external_ai_answers")
    op.drop_index(op.f("ix_case_summaries_case_id"), table_name="case_summaries")
    op.drop_table("case_summaries")
    op.drop_index(op.f("ix_case_status_history_case_id"), table_name="case_status_history")
    op.drop_table("case_status_history")
    op.drop_index(op.f("ix_case_issues_case_id"), table_name="case_issues")
    op.drop_table("case_issues")
    op.drop_index(op.f("ix_anonymized_cases_case_id"), table_name="anonymized_cases")
    op.drop_table("anonymized_cases")
    op.drop_index(op.f("ix_ai_executions_case_id"), table_name="ai_executions")
    op.drop_table("ai_executions")
    op.drop_index(op.f("ix_cases_status"), table_name="cases")
    op.drop_index(op.f("ix_cases_public_code"), table_name="cases")
    op.drop_index(op.f("ix_cases_customer_id"), table_name="cases")
    op.drop_index(op.f("ix_cases_category"), table_name="cases")
    op.drop_table("cases")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_table("sources")
    op.drop_index(op.f("ix_audit_logs_object_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")
