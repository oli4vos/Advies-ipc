"""Add private case attachment metadata."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "case_attachments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("case_id", sa.String(length=36), sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("uploaded_by", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("scan_status", sa.String(length=32), nullable=False, server_default="NOT_SCANNED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index("ix_case_attachments_case_id", "case_attachments", ["case_id"])
    op.create_index("ix_case_attachments_uploaded_by", "case_attachments", ["uploaded_by"])


def downgrade() -> None:
    op.drop_index("ix_case_attachments_uploaded_by", table_name="case_attachments")
    op.drop_index("ix_case_attachments_case_id", table_name="case_attachments")
    op.drop_table("case_attachments")
