export type SensitiveFinding = {
  label: string;
  value: string;
  index: number;
};

type AnonymisationPattern = {
  label: string;
  pattern: RegExp;
  replacement: string;
};

// Keep this fallback aligned with server/app/services/anonymisation.py. The
// public Pages demo cannot call FastAPI, but it must still fail closed for the
// same common identifiers as the local MVP.
const anonymisationPatterns: AnonymisationPattern[] = [
  {
    label: "E-mailadres",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[E-MAIL]",
  },
  {
    label: "IBAN",
    pattern: /\bNL\d{2}(?:\s?[A-Z]{4})(?:\s?\d{4}){2}\s?\d{2}\b/gi,
    replacement: "[IBAN VERWIJDERD]",
  },
  {
    label: "Telefoonnummer",
    pattern: /(?<!\w)(?:\+31|0031|0)[ -]?(?:\d[ -]?){8,9}(?!\w)/g,
    replacement: "[TELEFOONNUMMER]",
  },
  {
    label: "Postcode",
    pattern: /\b\d{4}\s?[A-Z]{2}\b/gi,
    replacement: "[POSTCODE]",
  },
  {
    label: "BSN",
    pattern: /\bBSN\s*[:=]?\s*\d{8,9}\b/gi,
    replacement: "BSN [BSN VERWIJDERD]",
  },
  {
    label: "KvK-nummer",
    pattern: /\bKVK\s*[:=]?\s*\d{8}\b/gi,
    replacement: "KvK [KVK VERWIJDERD]",
  },
  {
    label: "Adres",
    pattern:
      /\b[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+(?:straat|laan|weg|plein|gracht|kade|singel)\s+\d{1,5}[a-zA-Z]?\b/g,
    replacement: "[ADRES]",
  },
  {
    label: "Naam",
    pattern:
      /(\b(?:mijn naam is|ik heet|naam\s*[:=]|de heer|mevrouw|mijn (?:fictieve )?medewerker|werknemer(?: genaamd)?|contactpersoon\s*[:=]?)\s*)([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+(?:\s+(?:(?:de|den|der|van|von|te|ten|ter)\s+){0,2}[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+){0,3})/gi,
    replacement: "$1[PERSOON]",
  },
  {
    label: "Bedrijfsnaam",
    pattern:
      /(\b(?:bedrijfsnaam|werkgever)\s*[:=]\s*|(?:mijn )?bedrijfsnaam\s+is\s+|(?:mijn )?bedrijf\s+heet\s+)(?!\[[^\]]+\])[^\n,.;]{2,100}/gi,
    replacement: "$1[BEDRIJF]",
  },
];

export function anonymiseText(text: string): string {
  return anonymisationPatterns.reduce(
    (value, { pattern, replacement }) => value.replace(pattern, replacement),
    text,
  );
}

export function findSensitiveData(text: string): SensitiveFinding[] {
  return anonymisationPatterns
    .flatMap(({ label, pattern }) =>
      Array.from(text.matchAll(new RegExp(pattern.source, pattern.flags))).map(
        (match) => ({
          label,
          value: match[0],
          index: match.index || 0,
        }),
      ),
    )
    .sort((a, b) => a.index - b.index);
}
