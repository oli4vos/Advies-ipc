import re
from dataclasses import dataclass


@dataclass(frozen=True)
class AnonymisationResult:
    text: str
    entity_counts: dict[str, int]


PATTERNS: tuple[tuple[str, re.Pattern[str], str], ...] = (
    (
        "EMAIL",
        re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE),
        "[E-MAIL]",
    ),
    (
        "IBAN",
        re.compile(r"\bNL\d{2}(?:\s?[A-Z]{4})(?:\s?\d{4}){2}\s?\d{2}\b", re.IGNORECASE),
        "[IBAN VERWIJDERD]",
    ),
    (
        "PHONE",
        re.compile(r"(?<!\w)(?:\+31|0031|0)[ -]?(?:\d[ -]?){8,9}(?!\w)"),
        "[TELEFOONNUMMER]",
    ),
    (
        "POSTCODE",
        re.compile(r"\b\d{4}\s?[A-Z]{2}\b", re.IGNORECASE),
        "[POSTCODE]",
    ),
    (
        "BSN",
        re.compile(r"(?i)(?P<prefix>\bbsn\s*[:=]?\s*)(?P<value>\d{8,9})\b"),
        "[BSN VERWIJDERD]",
    ),
    (
        "KVK",
        re.compile(r"(?i)(?P<prefix>\bkvk\s*[:=]?\s*)(?P<value>\d{8})\b"),
        "[KVK VERWIJDERD]",
    ),
    (
        "ADDRESS",
        re.compile(
            r"\b[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+(?:straat|laan|weg|plein|gracht|kade|singel)\s+\d{1,5}[a-zA-Z]?\b"
        ),
        "[ADRES]",
    ),
    (
        "PERSON",
        re.compile(
            r"(?P<prefix>(?i:\b(?:mijn naam is|de heer|mevrouw|"
            r"mijn (?:fictieve )?medewerker|werknemer(?: genaamd)?|contactpersoon)\s+))"
            r"(?P<value>[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+"
            r"(?:\s+(?:(?:de|den|der|van|von|te|ten|ter)\s+){0,2}"
            r"[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+){0,3})"
        ),
        "[PERSOON]",
    ),
    (
        "COMPANY",
        re.compile(
            r"(?i)(?P<prefix>\b(?:bedrijfsnaam|werkgever)\s*[:=])"
            r"(?P<value>(?!\s*\[[^\]]+\])\s*[^\n,.;]{2,100})"
        ),
        "[BEDRIJF]",
    ),
)


def anonymise(text: str) -> AnonymisationResult:
    anonymized = text
    counts: dict[str, int] = {}

    for entity_type, pattern, replacement in PATTERNS:
        if "prefix" in pattern.groupindex:
            def replace_marked(match: re.Match[str]) -> str:
                return f"{match.group('prefix')}{replacement}"

            anonymized, count = pattern.subn(replace_marked, anonymized)
        else:
            anonymized, count = pattern.subn(replacement, anonymized)

        if count:
            counts[entity_type] = counts.get(entity_type, 0) + count

    return AnonymisationResult(text=anonymized, entity_counts=counts)
