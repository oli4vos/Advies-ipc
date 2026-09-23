"""Protect external AI input and force renewed publication review.

Previously published records may have been generated before the complete
presentation boundary was in place. They are deliberately returned to review
instead of remaining visible to advisers without a new anonymisation check.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "external_ai_answers",
        sa.Column("anonymized_answer_text", sa.Text(), nullable=True),
    )
    op.execute(
        "UPDATE external_ai_answers "
        "SET anonymized_answer_text = '[Bestaande externe AI-invoer moet opnieuw worden geanonimiseerd]' "
        "WHERE anonymized_answer_text IS NULL"
    )
    op.execute(
        "UPDATE cases SET status = 'PENDING_REVIEW', published_at = NULL "
        "WHERE status IN ('PUBLISHED', 'CLAIMED')"
    )


def downgrade() -> None:
    op.drop_column("external_ai_answers", "anonymized_answer_text")
