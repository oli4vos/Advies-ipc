import re
from dataclasses import dataclass


@dataclass(frozen=True)
class AnalysisResult:
    title: str
    category: str
    tags: list[str]
    summary: str
    facts: list[str]
    concrete_question: str
    complexity: str
    minutes_min: int
    minutes_max: int
    fee_cents: int
    deadline_label: str
    missing_information: list[str]
    draft_answer: str
    source_title: str
    source_type: str
    source_citation: str
    source_version: str


CATEGORY_KEYWORDS = {
    "Loonheffingen": (
        "loonheffing",
        "loonheffingskorting",
        "werkgever",
        "werknemer",
        "loonstrook",
        "dienstbetrekking",
        "bijtelling",
        "30%-regeling",
    ),
    "Btw": ("btw", "omzetbelasting", "factuur", "vrijstelling", "voorbelasting"),
    "Inkomstenbelasting": ("inkomstenbelasting", "aangifte", "eigen woning", "scheiding"),
}

TAG_KEYWORDS = {
    "meerdere dienstbetrekkingen": ("twee werkgevers", "meerdere werkgevers", "dienstbetrekkingen"),
    "loonheffingskorting": ("loonheffingskorting",),
    "auto van de zaak": ("auto van de zaak", "bijtelling", "rittenregistratie"),
    "buitenlandse werknemer": ("buitenland", "belgië", "duitsland", "30%-regeling"),
    "gemengde prestaties": ("combinatie", "gemengde", "pakket", "zorg", "training"),
    "internationale btw": ("duitsland", "belgië", "eu", "buitenland"),
    "btw-vrijstelling": ("vrijstelling", "vrijgesteld"),
    "eigen woning": ("eigen woning", "hypotheek", "woning"),
    "scheiding": ("scheiding", "ex-partner", "partner"),
}


def _sentences(text: str) -> list[str]:
    compact = re.sub(r"\s+", " ", text).strip()
    return [part.strip(" -•") for part in re.split(r"(?<=[.!?])\s+|\n+", compact) if part.strip()]


def _category(text: str, supplied: str) -> str:
    if supplied and supplied != "Weet ik niet":
        return supplied
    lowered = text.lower()
    scores = {
        category: sum(1 for word in words if word in lowered)
        for category, words in CATEGORY_KEYWORDS.items()
    }
    return max(scores, key=scores.get) if max(scores.values(), default=0) else "Loonheffingen"


def analyse(
    *,
    anonymized_text: str,
    supplied_title: str,
    supplied_question: str,
    supplied_category: str,
    urgency: str,
) -> AnalysisResult:
    sentences = _sentences(anonymized_text)
    lowered = anonymized_text.lower()
    category = _category(anonymized_text, supplied_category)
    tags = [tag for tag, words in TAG_KEYWORDS.items() if any(word in lowered for word in words)]
    if not tags:
        tags = [category.lower(), "inhoudelijke controle nodig"]

    facts = sentences[:5] or ["De klant heeft nog onvoldoende feitelijke informatie gegeven."]
    summary = " ".join(facts)[:497].rstrip() + ("..." if len(" ".join(facts)) > 497 else "")
    title = supplied_title.strip() or (facts[0][:87].rstrip() + ("..." if len(facts[0]) > 87 else ""))
    question = supplied_question.strip() or "Wat is de fiscale behandeling en welke actie is nodig?"

    risk_signals = sum(
        token in lowered
        for token in ("buitenland", "vrijstelling", "scheiding", "meerdere", "correctie", "bezwaar")
    )
    if len(anonymized_text) > 1500 or risk_signals >= 3:
        complexity, minutes_min, minutes_max, fee_cents = "Hoog", 60, 90, 13500
    elif len(anonymized_text) > 500 or risk_signals >= 1:
        complexity, minutes_min, minutes_max, fee_cents = "Gemiddeld", 30, 45, 6500
    else:
        complexity, minutes_min, minutes_max, fee_cents = "Laag", 20, 30, 4500

    missing: list[str] = []
    if not re.search(r"\b20\d{2}\b", anonymized_text):
        missing.append("Bevestig het relevante belastingjaar.")
    if category == "Loonheffingen" and "loonstrook" not in lowered:
        missing.append("Geef aan welke loonstroken of werkgeversgegevens beschikbaar zijn.")
    if category == "Btw" and not any(word in lowered for word in ("klant", "afnemer", "factuur")):
        missing.append("Beschrijf wie de afnemer is en hoe wordt gefactureerd.")
    if not missing:
        missing.append("Een adviseur moet de genoemde feiten en bewijsstukken nog verifiëren.")

    if category == "Btw":
        draft = (
            "De btw-behandeling hangt af van de concrete prestatie, de positie en locatie van de "
            "afnemer en eventuele vrijstellingen. Dit concept bevat nog geen stellige conclusie; "
            "een btw-specialist moet de feiten en actuele bronnen controleren."
        )
        source_title = "Wet op de omzetbelasting 1968"
        source_type = "LAW"
        citation = "Demo-verwijzing; relevante bepaling nog door adviseur vast te stellen"
    else:
        draft = (
            "De loonheffingsgevolgen hangen af van de feitelijke arbeids- en loonadministratie. "
            "Dit concept benoemt alleen de waarschijnlijke beoordelingsrichting; een specialist "
            "moet de feiten, het belastingjaar en de actuele regelgeving controleren."
        )
        source_title = "Wet op de loonbelasting 1964"
        source_type = "LAW"
        citation = "Demo-verwijzing; relevante bepaling nog door adviseur vast te stellen"

    deadline = "binnen 24 uur" if urgency.lower() in {"spoed", "hoog"} else "binnen 3 werkdagen"
    return AnalysisResult(
        title=title,
        category=category,
        tags=tags[:5],
        summary=summary,
        facts=facts,
        concrete_question=question,
        complexity=complexity,
        minutes_min=minutes_min,
        minutes_max=minutes_max,
        fee_cents=fee_cents,
        deadline_label=deadline,
        missing_information=missing,
        draft_answer=draft,
        source_title=source_title,
        source_type=source_type,
        source_citation=citation,
        source_version="Demo — niet live juridisch gecontroleerd",
    )
