"""Require a platform decision before an information-request surcharge."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("information_requests") as batch:
        batch.add_column(sa.Column("platform_decision_note", sa.Text(), nullable=False, server_default=""))
        batch.add_column(sa.Column("platform_decided_by", sa.String(length=36), nullable=True))
        batch.add_column(sa.Column("platform_decided_at", sa.DateTime(timezone=True), nullable=True))
        batch.create_foreign_key(
            "fk_information_requests_platform_decided_by",
            "users",
            ["platform_decided_by"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("information_requests") as batch:
        batch.drop_constraint("fk_information_requests_platform_decided_by", type_="foreignkey")
        batch.drop_column("platform_decided_at")
        batch.drop_column("platform_decided_by")
        batch.drop_column("platform_decision_note")
