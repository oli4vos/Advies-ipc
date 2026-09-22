"""Add evaluated information requests and conditional fee adjustments."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "information_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("review_id", sa.String(length=36), nullable=True),
        sa.Column("expert_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("required_for_assessment", sa.Boolean(), nullable=False),
        sa.Column("evaluation_origin", sa.String(length=40), nullable=False),
        sa.Column("evaluation_confidence", sa.Integer(), nullable=False),
        sa.Column("proposed_fee_delta_cents", sa.Integer(), nullable=False),
        sa.Column("approved_fee_delta_cents", sa.Integer(), nullable=False),
        sa.Column("customer_answer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
        sa.ForeignKeyConstraint(["review_id"], ["expert_reviews.id"]),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_information_requests_case_id"), "information_requests", ["case_id"])
    op.create_index(op.f("ix_information_requests_review_id"), "information_requests", ["review_id"])
    op.create_index(op.f("ix_information_requests_expert_id"), "information_requests", ["expert_id"])
    with op.batch_alter_table("payments") as batch:
        batch.add_column(
            sa.Column("payment_type", sa.String(length=40), nullable=False, server_default="BASE_CASE")
        )
        batch.add_column(sa.Column("information_request_id", sa.String(length=36), nullable=True))
        batch.create_foreign_key(
            "fk_payments_information_request_id",
            "information_requests",
            ["information_request_id"],
            ["id"],
        )
    op.create_index(op.f("ix_payments_information_request_id"), "payments", ["information_request_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_information_request_id"), table_name="payments")
    with op.batch_alter_table("payments") as batch:
        batch.drop_constraint("fk_payments_information_request_id", type_="foreignkey")
        batch.drop_column("information_request_id")
        batch.drop_column("payment_type")
    op.drop_index(op.f("ix_information_requests_expert_id"), table_name="information_requests")
    op.drop_index(op.f("ix_information_requests_review_id"), table_name="information_requests")
    op.drop_index(op.f("ix_information_requests_case_id"), table_name="information_requests")
    op.drop_table("information_requests")
