"""Bind users to the subject from the configured identity provider."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("auth_provider_id", sa.String(length=255), nullable=True))
        batch.create_index("ix_users_auth_provider_id", ["auth_provider_id"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_index("ix_users_auth_provider_id")
        batch.drop_column("auth_provider_id")
