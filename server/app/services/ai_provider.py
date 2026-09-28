"""Provider boundary for case structuring.

The local rule engine is deliberately the default so development and demo
workflows never incur external AI costs. A future provider can implement the
same small interface and return the existing AnalysisResult contract.
"""

from dataclasses import dataclass
from typing import Protocol

from .analysis import AnalysisResult, analyse


class CaseAnalysisProvider(Protocol):
    name: str
    model: str

    def analyse(
        self,
        *,
        anonymized_text: str,
        supplied_title: str,
        supplied_question: str,
        supplied_category: str,
        urgency: str,
    ) -> AnalysisResult: ...


@dataclass(frozen=True)
class LocalRuleAnalysisProvider:
    """Deterministic, zero-cost provider used in local/test/demo environments."""

    name: str = "mock-local"
    model: str = "deterministic-rules-v1"

    def analyse(
        self,
        *,
        anonymized_text: str,
        supplied_title: str,
        supplied_question: str,
        supplied_category: str,
        urgency: str,
    ) -> AnalysisResult:
        return analyse(
            anonymized_text=anonymized_text,
            supplied_title=supplied_title,
            supplied_question=supplied_question,
            supplied_category=supplied_category,
            urgency=urgency,
        )


def get_case_analysis_provider() -> CaseAnalysisProvider:
    """Return the configured local provider without making external calls.

    External providers are intentionally not activated by configuration alone.
    They must be implemented behind this boundary with privacy, budget and
    schema tests before they can be enabled.
    """

    return LocalRuleAnalysisProvider()
