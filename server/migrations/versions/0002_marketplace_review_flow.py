"""Add claims, customer selection, mock payment and expert review flow."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expert_claims",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("expert_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("match_score", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("selected_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("case_id", "expert_id"),
    )
    op.create_index(op.f("ix_expert_claims_case_id"), "expert_claims", ["case_id"])
    op.create_index(op.f("ix_expert_claims_expert_id"), "expert_claims", ["expert_id"])

    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_case_id"), "payments", ["case_id"])
    op.create_index(op.f("ix_payments_customer_id"), "payments", ["customer_id"])

    op.create_table(
        "expert_reviews",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("expert_id", sa.String(length=36), nullable=False),
        sa.Column("claim_id", sa.String(length=36), nullable=False),
        sa.Column("final_answer", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.ForeignKeyConstraint(["claim_id"], ["expert_claims.id"]),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expert_reviews_case_id"), "expert_reviews", ["case_id"])
    op.create_index(op.f("ix_expert_reviews_expert_id"), "expert_reviews", ["expert_id"])
    op.create_index(op.f("ix_expert_reviews_claim_id"), "expert_reviews", ["claim_id"])

    op.create_table(
        "expert_review_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("review_id", sa.String(length=36), nullable=False),
        sa.Column("ai_claim_id", sa.String(length=36), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("dimension", sa.String(length=80), nullable=False),
        sa.Column("verdict", sa.String(length=40), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["ai_claim_id"], ["ai_claims.id"]),
        sa.ForeignKeyConstraint(["review_id"], ["expert_reviews.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_expert_review_items_review_id"), "expert_review_items", ["review_id"]
    )
    op.create_index(
        op.f("ix_expert_review_items_ai_claim_id"), "expert_review_items", ["ai_claim_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_expert_review_items_ai_claim_id"), table_name="expert_review_items")
    op.drop_index(op.f("ix_expert_review_items_review_id"), table_name="expert_review_items")
    op.drop_table("expert_review_items")
    op.drop_index(op.f("ix_expert_reviews_claim_id"), table_name="expert_reviews")
    op.drop_index(op.f("ix_expert_reviews_expert_id"), table_name="expert_reviews")
    op.drop_index(op.f("ix_expert_reviews_case_id"), table_name="expert_reviews")
    op.drop_table("expert_reviews")
    op.drop_index(op.f("ix_payments_customer_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_case_id"), table_name="payments")
    op.drop_table("payments")
    op.drop_index(op.f("ix_expert_claims_expert_id"), table_name="expert_claims")
    op.drop_index(op.f("ix_expert_claims_case_id"), table_name="expert_claims")
    op.drop_table("expert_claims")
