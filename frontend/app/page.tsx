"use client";
import "./ux-extra.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApiCase,
  acceptInformationFee,
  answerInformation,
  claimCase,
  confirmCaseStructure,
  createCase,
  decideInformationRequest,
  getCase,
  hasLocalApi,
  listCaseDetails,
  listJobboardDetails,
  payCase,
  publishCase,
  requestInformation,
  ReviewInput,
  selectClaim,
  setDemoRole,
  submitReview,
} from "./lib/api";
import { anonymiseText, findSensitiveData } from "./lib/anonymisation";

type Role = "customer" | "advisor" | "admin";
type Status =
  | "PUBLISHED"
  | "CLAIMED"
  | "AWAITING_PAYMENT"
  | "AWAITING_INFORMATION_PAYMENT"
  | "NEEDS_INFORMATION"
  | "PAID"
  | "IN_REVIEW"
  | "ANSWER_SUBMITTED"
  | "DELIVERED"
  | "PENDING_REVIEW";
type CaseItem = {
  id: string;
  backendId?: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  facts: string[];
  clientType: string;
  year: string;
  complexity: string;
  minutes: string;
  fee: number;
  deadline: string;
  missing: number;
  match: number;
  status: Status;
  customerQuestion: string;
  aiAnswer: string;
  externalAi?: string;
  anonymizedCustomerQuestion?: string;
  anonymizedExternalAi?: string;
  attachments?: UploadedAttachment[];
  source: string;
  sourceType: string;
  history: { label: string; date: string }[];
  claims?: ApiCase["claims"];
  paymentStatus?: string;
  finalAnswer?: string;
  originalDescription?: string;
  anonymizedDescription?: string;
  informationRequests?: ApiCase["information_requests"];
};
type IntakeForm = {
  title: string;
  description: string;
  question: string;
  category: string;
  year: string;
  clientType: string;
  externalAi: string;
};
type UploadedAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};
type PitchScenario = "conservative" | "base" | "growth";

const DEMO_STORAGE_KEY = "fiscale-lijn-demo-state-v1";
const DEMO_DRAFT_KEY = "fiscale-lijn-intake-draft-v1";

const pitchYears = [
  {
    year: "Jaar 1",
    monthlyCases: 180,
    aov: 105,
    opex: 105000,
    focus: "Pilot en bewijs van herhaalgebruik",
  },
  {
    year: "Jaar 2",
    monthlyCases: 750,
    aov: 112,
    opex: 240000,
    focus: "Product-market fit in loonheffingen en btw",
  },
  {
    year: "Jaar 3",
    monthlyCases: 2400,
    aov: 122,
    opex: 480000,
    focus: "Opschalen naar meerdere fiscale disciplines",
  },
  {
    year: "Jaar 4",
    monthlyCases: 5800,
    aov: 134,
    opex: 950000,
    focus: "Landelijke dekking en werkgeverskanalen",
  },
  {
    year: "Jaar 5",
    monthlyCases: 11000,
    aov: 145,
    opex: 1650000,
    focus: "Categorieleider voor fiscale vooranalyse",
  },
];

const pitchScenarios: Record<
  PitchScenario,
  { label: string; volume: number; cost: number; note: string }
> = {
  conservative: {
    label: "Conservatief",
    volume: 0.55,
    cost: 0.85,
    note: "Langzamere acquisitie en beperkte uitbreiding buiten de eerste niches.",
  },
  base: {
    label: "Basisscenario",
    volume: 1,
    cost: 1,
    note: "Gecontroleerde groei via herhaalgebruik, adviseurs en werkgeverskanalen.",
  },
  growth: {
    label: "Groeiscenario",
    volume: 1.55,
    cost: 1.25,
    note: "Snellere distributie door partnerships en sterke aanbodliquiditeit.",
  },
};

const casesSeed: CaseItem[] = [
  {
    id: "LH-1042",
    title: "Werkgever ontdekt dubbele loonheffingskorting bij medewerker",
    category: "Loonheffingen",
    tags: ["meerdere dienstbetrekkingen", "loonheffingskorting"],
    summary:
      "Een mkb-werkgever ontdekt dat een nieuwe medewerker mogelijk bij twee werkgevers loonheffingskorting laat toepassen. De loonadministratie wil weten welke actie nodig is.",
    facts: [
      "Medewerker heeft twee dienstbetrekkingen",
      "Beide werkgevers passen vermoedelijk de loonheffingskorting toe",
      "Belastingjaar 2025",
    ],
    clientType: "Werkgever",
    year: "2025",
    complexity: "Gemiddeld",
    minutes: "20–30 min",
    fee: 45,
    deadline: "binnen 48 uur",
    missing: 1,
    match: 86,
    status: "PUBLISHED",
    customerQuestion:
      "Wat moeten wij in onze loonadministratie aanpassen en wat moet de medewerker zelf doen?",
    aiAnswer:
      "De loonheffingskorting mag in beginsel bij één werkgever worden toegepast. Bij dubbele toepassing kan bij de aangifte moeten worden bijbetaald. Controleer de loonstroken en pas de korting bij één werkgever aan.",
    source: "Wet op de loonbelasting 1964, art. 23",
    sourceType: "Wet- en regelgeving",
    history: [
      { label: "Gepubliceerd op jobboard", date: "Vandaag · 09:42" },
      { label: "AI-analyse afgerond", date: "Vandaag · 09:41" },
    ],
  },
  {
    id: "LH-1038",
    title: "Auto van de zaak en bijtelling bij beperkt privégebruik",
    category: "Loonheffingen",
    tags: ["auto van de zaak", "bijtelling"],
    summary:
      "Een werknemer rijdt in een elektrische auto van de zaak en stelt minder dan 500 privékilometers te rijden. De rittenregistratie is niet volledig.",
    facts: [
      "Elektrische auto ter beschikking gesteld door werkgever",
      "Privégebruik onder 500 km wordt gesteld",
      "Rittenregistratie is niet volledig",
    ],
    clientType: "Werkgever",
    year: "2025",
    complexity: "Gemiddeld",
    minutes: "30–45 min",
    fee: 62,
    deadline: "binnen 3 dagen",
    missing: 2,
    match: 79,
    status: "PUBLISHED",
    customerQuestion:
      "Kan de bijtelling achterwege blijven en welke bewijsstukken zijn nodig?",
    aiAnswer:
      "Bij minder dan 500 privékilometers kan onder voorwaarden geen bijtelling gelden. Een sluitende rittenregistratie en passende verklaring zijn belangrijk.",
    source: "Handboek Loonheffingen 2025, hoofdstuk auto",
    sourceType: "Officiële uitvoeringsinformatie",
    history: [{ label: "Gepubliceerd op jobboard", date: "Gisteren · 16:10" }],
  },
  {
    id: "LH-1034",
    title: "Buitenlandse werknemer start zonder Nederlandse loonhistorie",
    category: "Loonheffingen",
    tags: ["buitenlandse werknemer", "30%-regeling"],
    summary:
      "Een werkgever neemt een werknemer uit België aan. Startdatum en mogelijke toepassing van de 30%-regeling roepen vragen op over de loonadministratie.",
    facts: [
      "Werknemer woont momenteel in België",
      "Dienstbetrekking start in september 2025",
      "Werkgever onderzoekt toepassing van de 30%-regeling",
    ],
    clientType: "Werkgever",
    year: "2025",
    complexity: "Hoog",
    minutes: "45–60 min",
    fee: 95,
    deadline: "binnen 5 dagen",
    missing: 3,
    match: 91,
    status: "CLAIMED",
    customerQuestion:
      "Welke stappen moeten wij zetten voor een correcte start in de loonadministratie?",
    aiAnswer:
      "Voor de loonadministratie zijn identiteit, woonplaats, startdatum en de voorwaarden voor de beoogde regeling relevant. De feitelijke afstand tot Nederland moet worden gecontroleerd.",
    source: "Uitvoeringsregeling loonbelasting 2011, relevante bepalingen",
    sourceType: "Wet- en regelgeving",
    history: [
      {
        label: "Opdracht geaccepteerd door adviseur",
        date: "Gisteren · 14:23",
      },
      { label: "Gepubliceerd op jobboard", date: "Gisteren · 11:08" },
    ],
  },
  {
    id: "BTW-1019",
    title: "Btw bij combinatie van advies en digitale diensten",
    category: "Btw",
    tags: ["gemengde prestaties", "digitale diensten"],
    summary:
      "Een kleine onderneming verkoopt een adviestraject inclusief toegang tot een online leeromgeving. Er is onduidelijkheid over één of meerdere btw-behandelingen.",
    facts: [
      "Adviestraject met online content",
      "Klanten in Nederland en Duitsland",
      "Facturatie vindt als één pakket plaats",
    ],
    clientType: "Eenmanszaak",
    year: "2025",
    complexity: "Hoog",
    minutes: "45–60 min",
    fee: 110,
    deadline: "binnen 4 dagen",
    missing: 2,
    match: 74,
    status: "PUBLISHED",
    customerQuestion:
      "Moet dit pakket als één prestatie of als verschillende prestaties worden behandeld voor de btw?",
    aiAnswer:
      "De btw-behandeling hangt af van de economische realiteit, de samenhang en wat voor de klant de hoofdprestatie vormt. De plaats van dienst moet per klanttype worden vastgesteld.",
    externalAi:
      "Een ander AI-systeem adviseerde om voor alle onderdelen standaard 21% btw te rekenen, zonder onderscheid naar klantlocatie.",
    source: "Richtlijn 2006/112/EG, samengestelde prestaties",
    sourceType: "Wet- en regelgeving",
    history: [{ label: "Gepubliceerd op jobboard", date: "Maandag · 10:12" }],
  },
  {
    id: "BTW-1014",
    title: "Btw-vrijstelling bij gemengde zorg- en trainingsactiviteiten",
    category: "Btw",
    tags: ["btw-vrijstelling", "gemengde prestaties"],
    summary:
      "Een praktijk combineert vrijgestelde zorg met betaalde trainingen voor professionals. Er is behoefte aan scheiding in administratie en aftrek van voorbelasting.",
    facts: [
      "Zorgactiviteiten en trainingen vanuit één praktijk",
      "Deelnemers zijn deels ondernemers",
      "Gezamenlijke huur- en marketingkosten",
    ],
    clientType: "Bv",
    year: "2024",
    complexity: "Hoog",
    minutes: "60–90 min",
    fee: 135,
    deadline: "binnen 7 dagen",
    missing: 4,
    match: 68,
    status: "IN_REVIEW",
    customerQuestion:
      "Welke omzet valt onder de vrijstelling en hoe verdelen we de gezamenlijke kosten?",
    aiAnswer:
      "De vrijstelling moet per concrete prestatie worden beoordeeld. Voor gemengde kosten is een onderbouwde verdeelsleutel nodig; directe toerekening heeft de voorkeur.",
    source: "Wet op de omzetbelasting 1968, art. 11",
    sourceType: "Wet- en regelgeving",
    history: [
      { label: "In behandeling bij adviseur", date: "12 september · 15:30" },
      { label: "Betaling ontvangen", date: "12 september · 10:05" },
    ],
  },
  {
    id: "IB-1008",
    title: "Fiscale afwikkeling van een scheiding met eigen woning",
    category: "Inkomstenbelasting",
    tags: ["eigen woning", "scheiding"],
    summary:
      "Na een scheiding blijft één partner in de woning wonen. Overdracht, hypotheekrente en de verdeling van het eigenwoningforfait moeten correct worden verwerkt.",
    facts: [
      "Gezamenlijke woning en hypotheek",
      "Scheiding uitgesproken in 2024",
      "Eén partner blijft voorlopig wonen",
    ],
    clientType: "Particulier",
    year: "2024",
    complexity: "Hoog",
    minutes: "45–60 min",
    fee: 85,
    deadline: "binnen 5 dagen",
    missing: 1,
    match: 63,
    status: "DELIVERED",
    customerQuestion:
      "Hoe verwerken we de woning en hypotheek in de aangifte over het overgangsjaar?",
    aiAnswer:
      "De verwerking hangt af van eigendomsverhouding, moment van vertrek en afspraken over de woning. De renteaftrekperiode moet afzonderlijk worden gecontroleerd.",
    source: "Wet inkomstenbelasting 2001, hoofdstuk 3",
    sourceType: "Wet- en regelgeving",
    history: [
      { label: "Antwoord beschikbaar", date: "8 september · 11:20" },
      { label: "Definitief advies ingediend", date: "7 september · 17:02" },
    ],
  },
];

function Icon({ n }: { n: string }) {
  const p: Record<string, string> = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    check: "m5 12 4 4L19 6",
    shield: "M12 3 4.8 6v5c0 4.7 3 8.4 7.2 10 4.2-1.6 7.2-5.3 7.2-10V6L12 3Z",
    clock: "M12 7v5l3 2",
    file: "M6 3h8l4 4v14H6zM14 3v5h4",
    search: "m20 20-4-4m1-5a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
    lock: "M7 10V8a5 5 0 0 1 10 0v2m-9 0h8v10H8z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-7 13h4",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <path d={p[n] || p.arrow} />
    </svg>
  );
}

function ExampleButton({ onClick, label = "Voorbeeld invullen" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="example-button" onClick={onClick}>
      <Icon n="file" /> {label}
    </button>
  );
}

function apiCaseToItem(item: ApiCase): CaseItem {
  const source = item.sources[0];
  return {
    id: item.public_code,
    backendId: item.id,
    title: item.title,
    category: item.category,
    tags: item.specialization_tags,
    summary: item.summary,
    facts: item.facts.map((fact) => fact.value),
    clientType: item.client_type,
    year: item.tax_year,
    complexity: item.complexity,
    minutes: `${item.estimated_minutes_min}–${item.estimated_minutes_max} min`,
    fee: item.offered_fee_cents / 100,
    deadline: item.deadline_label,
    missing: item.issues.filter(
      (issue) => issue.resolution_status !== "RESOLVED",
    ).length,
    match:
      item.category === "Loonheffingen"
        ? 86
        : item.category === "Btw"
          ? 78
          : 70,
    status: item.status as Status,
    customerQuestion: item.concrete_question,
    anonymizedCustomerQuestion: item.concrete_question,
    aiAnswer: item.ai_answer,
    externalAi: item.external_ai_answer || undefined,
    anonymizedExternalAi: item.external_ai_answer || undefined,
    source: source?.citation || source?.title || "Nog geen bron gekoppeld",
    sourceType: source?.source_type || "Niet geverifieerd",
    claims: item.claims,
    paymentStatus: item.payment?.status,
    finalAnswer: item.reviews.at(-1)?.final_answer,
    originalDescription: item.original_description || undefined,
    anonymizedDescription: item.anonymized_description,
    informationRequests: item.information_requests,
    history: item.history
      .slice()
      .reverse()
      .map((entry) => ({
        label: entry.reason,
        date: new Intl.DateTimeFormat("nl-NL", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(entry.created_at)),
      })),
  };
}

export default function Home() {
  const [role, setRole] = useState<Role>("customer"),
    [view, setView] = useState("home"),
    [selectedId, setSelectedId] = useState("LH-1042"),
    [cases, setCases] = useState(casesSeed),
    [filter, setFilter] = useState("Alle specialisaties"),
    [notice, setNotice] = useState(""),
    [storageReady, setStorageReady] = useState(false),
    [draftReady, setDraftReady] = useState(false),
    [form, setForm] = useState({
      title: "",
      description: "",
      question: "",
      category: "Weet ik niet",
      year: "2025",
      clientType: "Eenmanszaak",
      externalAi: "",
    });
  const loadBackendCases = async (activeRole: Role) => {
    if (!hasLocalApi()) return;
    try {
      const items =
        activeRole === "advisor"
          ? await listJobboardDetails()
          : await listCaseDetails();
      setCases(items.map(apiCaseToItem));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Casussen konden niet worden geladen.");
    }
  };
  useEffect(() => {
    if (hasLocalApi()) {
      setStorageReady(true);
      void loadBackendCases("customer");
      return;
    }

    try {
      const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CaseItem[];
        if (Array.isArray(parsed) && parsed.length > 0) setCases(parsed);
      }
    } catch {
      setNotice("De demo-opslag kon niet worden geladen; de standaardcasussen zijn actief.");
    } finally {
      setStorageReady(true);
    }
  }, []);
  useEffect(() => {
    if (!storageReady || hasLocalApi()) return;
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(cases));
  }, [cases, storageReady]);
  useEffect(() => {
    try {
      const storedDraft = window.localStorage.getItem(DEMO_DRAFT_KEY);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        if (parsedDraft && typeof parsedDraft === "object") {
          setForm((current) => ({ ...current, ...parsedDraft }));
        }
      }
    } catch {
      setNotice("Het intakeconcept kon niet worden hersteld.");
    } finally {
      setDraftReady(true);
    }
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    const hasDraft = Object.values(form).some((value) => value.trim().length > 0);
    if (hasDraft) {
      window.localStorage.setItem(DEMO_DRAFT_KEY, JSON.stringify(form));
    } else {
      window.localStorage.removeItem(DEMO_DRAFT_KEY);
    }
  }, [draftReady, form]);
  const selected = cases.find((c) => c.id === selectedId) || cases[0],
    filtered = useMemo(
      () =>
        filter === "Alle specialisaties"
          ? cases
          : cases.filter((c) => c.category === filter),
      [cases, filter],
    );
  const changeRole = (r: Role) => {
      setRole(r);
      setDemoRole(r);
      if (hasLocalApi()) {
        setCases([]);
        void loadBackendCases(r);
      }
      setView(r === "advisor" ? "jobboard" : r === "admin" ? "admin" : "home");
    },
    resetDemo = () => {
      if (!hasLocalApi()) window.localStorage.removeItem(DEMO_STORAGE_KEY);
      window.localStorage.removeItem(DEMO_DRAFT_KEY);
      setCases(casesSeed);
      setSelectedId("LH-1042");
      setRole("customer");
      setDemoRole("customer");
      setFilter("Alle specialisaties");
      setView("home");
      setNotice("Demo teruggezet naar de startsituatie.");
    },
    open = (id: string) => {
      setSelectedId(id);
      setView("case");
    },
    update = async (
      id: string,
      status: Status,
      msg: string,
      anonymizedText?: string,
    ) => {
      const current = cases.find((item) => item.id === id);
      if (
        current?.backendId &&
        (status === "PUBLISHED" || msg.startsWith("Structuur bevestigd"))
      ) {
        try {
          const saved =
            status === "PUBLISHED"
              ? await publishCase(current.backendId)
              : await confirmCaseStructure(
                  current.backendId,
                  true,
                  anonymizedText || current.anonymizedDescription || "",
                );
          const mapped = apiCaseToItem(saved);
          setCases((items) =>
            items.map((item) => (item.id === id ? mapped : item)),
          );
          setNotice(msg);
          return;
        } catch (error) {
          setNotice(
            error instanceof Error
              ? error.message
              : "De status kon niet worden opgeslagen.",
          );
          return;
        }
      }
      setCases((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                anonymizedDescription: anonymizedText || item.anonymizedDescription,
                history: [{ label: msg, date: "Zojuist" }, ...item.history],
              }
            : item,
        ),
      );
      setNotice(msg);
    },
    saveCase = async (
      id: string,
      saver: (backendId: string) => Promise<ApiCase>,
      msg: string,
    ) => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        update(
          id,
          msg.startsWith("Mock")
            ? "PAID"
            : msg.startsWith("Interesse")
              ? "CLAIMED"
              : "DELIVERED",
          msg,
        );
        return;
      }
      try {
        const mapped = apiCaseToItem(await saver(current.backendId));
        setCases((items) =>
          items.map((item) => (item.id === id ? mapped : item)),
        );
        setNotice(msg);
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "De actie kon niet worden opgeslagen.",
        );
      }
    },
    claim = async (id: string, message = "Ik kan deze casus binnen één werkdag beoordelen en de broncontrole uitvoeren.") => {
      const current = cases.find((item) => item.id === id);
      if (!current) return;
      if (!current.backendId) {
        const demoClaim: ApiCase["claims"][number] = {
          id: `demo-claim-${id}`,
          expert_id: "demo-advisor",
          expert_name: "Mara van Dijk",
          expert_specialisation: "Loonheffingen-specialist",
          expert_rating: 4.8,
          status: "PENDING_CUSTOMER",
          match_score: current.match || 86,
          message,
          created_at: new Date().toISOString(),
          selected_at: null,
        };
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  claims: [...(item.claims || []), demoClaim],
                  status: "CLAIMED",
                  history: [
                    { label: "Adviseur heeft interesse getoond", date: "Zojuist" },
                    ...item.history,
                  ],
                }
              : item,
          ),
        );
        setNotice("Interesse geregistreerd. De klant kan adviseurs vergelijken.");
        return;
      }
      try {
        const result = await claimCase(
          current.backendId,
          message,
        );
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  claims: [...(item.claims || []), result],
                  status: "CLAIMED",
                }
              : item,
          ),
        );
        setNotice(
          "Interesse geregistreerd. De klant kan adviseurs vergelijken.",
        );
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Interesse kon niet worden geregistreerd.",
        );
      }
    },
    choose = async (id: string, claimId: string) => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "AWAITING_PAYMENT",
                  claims: item.claims?.map((claim) =>
                    claim.id === claimId
                      ? { ...claim, status: "SELECTED", selected_at: new Date().toISOString() }
                      : { ...claim, status: "DECLINED" },
                  ),
                  history: [
                    { label: "Adviseur gekozen; betaling nodig", date: "Zojuist" },
                    ...item.history,
                  ],
                }
              : item,
          ),
        );
        setNotice("Adviseur gekozen. Het mock-betaalverzoek staat klaar.");
        return;
      }
      await saveCase(
        id,
        (backendId) => selectClaim(backendId, claimId),
        "Adviseur gekozen. Het mock-betaalverzoek staat klaar.",
      );
    },
    pay = async (id: string) => {
      const current = cases.find((item) => item.id === id);
      if (!current) return;
      if (!current.backendId) {
        const hasInformationPayment = current.status === "AWAITING_INFORMATION_PAYMENT";
        update(
          id,
          hasInformationPayment ? "IN_REVIEW" : "PAID",
          hasInformationPayment
            ? "Aanvullende mockbetaling ontvangen. De adviseur kan verder reviewen."
            : "Mockbetaling ontvangen. De adviseur kan starten.",
        );
        return;
      }
      await saveCase(id, payCase, "Mockbetaling ontvangen. De adviseur kan starten.");
    },
    reviewSubmit = async (id: string, input: ReviewInput) => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "DELIVERED",
                  finalAnswer: input.final_answer,
                  history: [
                    { label: "Gecontroleerd antwoord afgeleverd", date: "Zojuist" },
                    ...item.history,
                  ],
                }
              : item,
          ),
        );
        setNotice("Definitief gecontroleerd antwoord afgeleverd.");
        setView("case");
        return;
      }
      try {
        const mapped = apiCaseToItem(
          await submitReview(current.backendId, input),
        );
        setCases((items) =>
          items.map((item) => (item.id === id ? mapped : item)),
        );
        setNotice("Definitief gecontroleerd antwoord afgeleverd.");
        setView("case");
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Het antwoord kon niet worden ingediend.",
        );
      }
    };
  const refreshBackendCase = async (id: string, action: (backendId: string) => Promise<unknown>) => {
    const current = cases.find((item) => item.id === id);
    if (!current?.backendId) return;
    try {
      await action(current.backendId);
      const mapped = apiCaseToItem(await getCase(current.backendId));
      setCases((items) => items.map((item) => (item.id === id ? mapped : item)));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "De aanvullende informatie kon niet worden opgeslagen.");
    }
  };
  const askInformation = (id: string, question: string) =>
    (() => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        const request: ApiCase["information_requests"][number] = {
          id: `demo-information-${id}`,
          expert_id: "demo-advisor",
          expert_name: "Mara van Dijk",
          status: "PENDING_CUSTOMER",
          question,
          rationale: "Deze informatie is volgens de demo-regelengine noodzakelijk om de fiscale conclusie verantwoord te kunnen controleren.",
          required_for_assessment: true,
          evaluation_origin: "RULE_ENGINE",
          evaluation_confidence: 91,
          proposed_fee_delta_cents: 3000,
          approved_fee_delta_cents: 3000,
          platform_decision_note: "Demo: noodzakelijke informatievraag automatisch goedgekeurd.",
          platform_decided_at: new Date().toISOString(),
          customer_answer: "",
          created_at: new Date().toISOString(),
          evaluated_at: new Date().toISOString(),
          answered_at: null,
          accepted_at: null,
        };
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "NEEDS_INFORMATION",
                  informationRequests: [...(item.informationRequests || []), request],
                  history: [
                    { label: "Aanvullende informatie nodig; toeslag beoordeeld", date: "Zojuist" },
                    ...item.history,
                  ],
                }
              : item,
          ),
        );
        setNotice("De aanvullende vraag is noodzakelijk verklaard. De klant kan antwoorden.");
        return;
      }
      void refreshBackendCase(id, (backendId) => requestInformation(backendId, question));
    })();
  const answerInfo = (id: string, requestId: string, answer: string) =>
    (() => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  informationRequests: item.informationRequests?.map((request) =>
                    request.id === requestId
                      ? { ...request, status: "ANSWERED", customer_answer: answer, answered_at: new Date().toISOString() }
                      : request,
                  ),
                  history: [{ label: "Aanvullende informatie ontvangen", date: "Zojuist" }, ...item.history],
                }
              : item,
          ),
        );
        setNotice("Informatie ontvangen. De klant kan de noodzakelijke toeslag bevestigen.");
        return;
      }
      void refreshBackendCase(id, (backendId) => answerInformation(backendId, requestId, answer));
    })();
  const acceptFee = (id: string, requestId: string) =>
    (() => {
      const current = cases.find((item) => item.id === id);
      if (!current?.backendId) {
        setCases((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "AWAITING_INFORMATION_PAYMENT",
                  informationRequests: item.informationRequests?.map((request) =>
                    request.id === requestId
                      ? { ...request, status: "ACCEPTED", accepted_at: new Date().toISOString() }
                      : request,
                  ),
                  history: [{ label: "Klant akkoord met noodzakelijke toeslag", date: "Zojuist" }, ...item.history],
                }
              : item,
          ),
        );
        setNotice("Toeslag bevestigd. De aanvullende mockbetaling staat klaar.");
        return;
      }
      void refreshBackendCase(id, (backendId) => acceptInformationFee(backendId, requestId));
    })();
  const decideInfo = (id: string, requestId: string, approve: boolean, feeDeltaCents = 0) =>
    refreshBackendCase(id, (backendId) =>
      decideInformationRequest(backendId, requestId, approve, feeDeltaCents),
    );
  const submit = async (e: React.FormEvent, attachments: UploadedAttachment[] = []) => {
    e.preventDefault();
    if (hasLocalApi()) {
      try {
        const saved = {
          ...apiCaseToItem(await createCase({
            title: form.title,
            description: form.description,
            question: form.question,
            category: form.category,
            tax_year: form.year,
            client_type: form.clientType,
            urgency: "Normaal",
            external_ai_answer: form.externalAi,
          })),
          attachments,
        };
        setCases((items) => [
          saved,
          ...items.filter((item) => item.id !== saved.id),
        ]);
        setSelectedId(saved.id);
        setView("structured");
        setNotice(
          "Casus veilig lokaal opgeslagen, geanonimiseerd en gestructureerd.",
        );
        setForm({
          title: "",
          description: "",
          question: "",
          category: "Weet ik niet",
          year: "2025",
          clientType: "Eenmanszaak",
          externalAi: "",
        });
        return;
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "De lokale Python-API is niet bereikbaar.",
        );
        return;
      }
    }
    const n: CaseItem = {
      id: `DEMO-${Math.floor(Math.random() * 800 + 100)}`,
      title: anonymiseText(form.title) || "Nieuwe belastingvraag",
      category: form.category,
      tags:
        form.category === "Btw"
          ? ["btw", "controle nodig"]
          : form.category === "Personeel & loon"
            ? ["loonheffingen", "controle nodig"]
            : ["mkb", "triage nodig"],
      summary: (form.description || "Nieuwe casus ter beoordeling.").slice(
        0,
        490,
      ),
      facts: [form.description || "Nog geen feiten bevestigd."],
      clientType: form.clientType,
      year: form.year,
      complexity: "Nog te bepalen",
      minutes: "Nog te bepalen",
      fee: 0,
      deadline: "Na triage",
      missing: 1,
      match: 0,
      status: "PENDING_REVIEW",
      customerQuestion: form.question || "Wat moet ik nu doen en wat is mijn risico?",
      anonymizedCustomerQuestion:
        anonymiseText(form.question) || "Wat moet ik nu doen en wat is mijn risico?",
      aiAnswer:
        "Er is nog geen fiscaal conceptantwoord opgesteld. Eerst moet de structuur door de klant worden bevestigd en door een adviseur worden beoordeeld.",
      externalAi: form.externalAi || undefined,
      anonymizedExternalAi: form.externalAi
        ? anonymiseText(form.externalAi)
        : undefined,
      attachments,
      originalDescription: form.description,
      anonymizedDescription: anonymiseText(form.description),
      source: "Nog te bepalen",
      sourceType: "Niet geverifieerd",
      history: [{ label: "Casus ingediend", date: "Zojuist" }],
    };
    setCases((items) => [n, ...items]);
    setSelectedId(n.id);
    setView("structured");
    setNotice(
      "Demo-casus opgeslagen in deze browser. De status blijft na verversen bewaard.",
    );
    setForm({
      title: "",
      description: "",
      question: "",
      category: "Weet ik niet",
      year: "2025",
      clientType: "Eenmanszaak",
      externalAi: "",
    });
  };
  return (
    <main id="main-content">
      <div className="demo-guard">
        <Icon n="shield" />
        <strong>Publieke demo — voer geen echte bedrijfs- of persoonsgegevens in.</strong>
        <span>Opslag in deze browser · geen beveiligde productieomgeving.</span>
        <label className="demo-role-select">
          <span>Bekijk demo als</span>
          <select value={role} onChange={(e) => changeRole(e.target.value as Role)}>
            <option value="customer">MKB-klant</option>
            <option value="advisor">Adviseur</option>
            <option value="admin">Beheerder</option>
          </select>
        </label>
        <button className="demo-reset" onClick={resetDemo}>
          Demo resetten
        </button>
      </div>
      <header className="topbar">
        <div className="brand" onClick={() => setView("home")}>
          <span className="brand-mark">F</span>
          <span>fiscale lijn</span>
          <small>belastinghulp voor mkb</small>
        </div>
        <nav>
          <button onClick={() => setView("home")}>{role === "customer" ? "Start" : "Overzicht"}</button>
          {role === "customer" && <button onClick={() => setView("dashboard")}>Mijn vragen</button>}
          {role === "customer" && <button onClick={() => setView("intake")}>Vraag voorleggen</button>}
          {role === "advisor" && <button onClick={() => setView("jobboard")}>Opdrachten</button>}
          {role === "admin" && <button onClick={() => setView("admin")}>Controle</button>}
        </nav>
        <button className="profile-shortcut" onClick={() => setView(role === "customer" ? "dashboard" : role === "advisor" ? "jobboard" : "admin")}>
          <span className="avatar">
            {role === "customer" ? "KD" : role === "advisor" ? "MV" : "BE"}
          </span>
          <span>{role === "customer" ? "Mijn omgeving" : role === "advisor" ? "Adviseur" : "Beheer"}</span>
        </button>
      </header>
      <DemoFlow role={role} view={view} onIntake={() => setView("intake")} onBoard={() => changeRole("advisor")} onAdmin={() => setView("admin")} />
      {notice && (
        <div className="notice">
          <Icon n="check" />
          {notice}
          <button onClick={() => setNotice("")}>Sluiten</button>
        </div>
      )}
      {view === "home" && (
        <HomeView
          onIntake={() => setView("intake")}
          onDashboard={() => setView("dashboard")}
          onAdvisor={() => changeRole("advisor")}
          onInvestor={() => setView("businesscase")}
          onPolicy={(policy) => setView(policy)}
          open={open}
          cases={cases}
        />
      )}{" "}
      {view === "dashboard" && role === "customer" && (
        <CustomerDashboard
          cases={cases}
          open={open}
          onIntake={() => setView("intake")}
        />
      )}{" "}
      {view === "intake" && (
        <Intake
          form={form}
          setForm={setForm}
          publicDemo={!hasLocalApi()}
          onSubmit={submit}
          onCancel={() => setView("home")}
        />
      )}{" "}
      {view === "structured" && (
        <StructuredCase
          item={selected}
          confirm={(anonymizedText) => {
            update(
              selected.id,
              "PENDING_REVIEW",
              "Structuur bevestigd. Casus wacht op beheercontrole.",
              anonymizedText,
            );
            setView("case");
          }}
          edit={() => setView("intake")}
        />
      )}{" "}
      {view === "jobboard" && (
        <Jobboard
          cases={filtered}
          filter={filter}
          setFilter={setFilter}
          open={open}
        />
      )}{" "}
      {view === "case" && (
        <CaseDetail
          item={selected}
          role={role}
          back={() => setView(role === "advisor" ? "jobboard" : "home")}
          accept={(message) => claim(selected.id, message)}
          pay={() =>
            pay(selected.id)
          }
          choose={choose}
          askInformation={askInformation}
          answerInformation={answerInfo}
          acceptInformationFee={acceptFee}
          decideInformation={decideInfo}
          review={() => setView("review")}
        />
      )}{" "}
      {view === "review" && (
        <Review
          item={selected}
          back={() => setView("case")}
          submit={(input: ReviewInput) => reviewSubmit(selected.id, input)}
        />
      )}{" "}
      {view === "admin" && (
        <Admin
          cases={cases}
          open={open}
          publish={(id) =>
            update(id, "PUBLISHED", "Casus door beheerder gepubliceerd.")
          }
        />
      )}{" "}
      {view === "businesscase" && <BusinessCase />}
      {view === "privacy" && <PolicyPage type="privacy" onBack={() => setView("home")} />}
      {view === "terms" && <PolicyPage type="terms" onBack={() => setView("home")} />}
      {view === "quality" && <PolicyPage type="quality" onBack={() => setView("home")} />}
    </main>
  );
}

function BusinessCase() {
  const [scenario, setScenario] = useState<PitchScenario>("base");
  const assumptions = pitchScenarios[scenario];
  const rows = pitchYears.map((item) => {
    const monthlyCases = Math.round(item.monthlyCases * assumptions.volume),
      gmv = monthlyCases * item.aov * 12,
      arr = gmv * 0.18,
      opex = Math.round(item.opex * assumptions.cost);
    return { ...item, monthlyCases, gmv, arr, opex, runRateMargin: arr - opex };
  });
  const money = (value: number) =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      notation: value >= 100000 ? "compact" : "standard",
      maximumFractionDigits: value >= 100000 ? 1 : 0,
    }).format(value);
  const yearThree = rows[2],
    yearFive = rows[4],
    maxArr = Math.max(...rows.map((row) => row.arr));
  return (
    <section className="investor-page">
      <div className="pitch-hero">
        <div className="pitch-copy">
          <p className="eyebrow">INVESTEERDERSCASE / MANAGEMENTAANNAMES</p>
          <h1>
            Belastinghulp voor het mkb,
            <br />
            <em>zonder zwaar adviestraject.</em>
          </h1>
          <p className="pitch-thesis">
            Fiscale Lijn begint bij concrete belastingvragen van kleine en
            middelgrote ondernemingen. Het platform maakt rommelige input
            beoordeelbaar; AI ondersteunt de vooranalyse en een passende
            specialist blijft verantwoordelijk voor het eindantwoord.
          </p>
          <div className="pitch-tags">
            <span>Marketplace</span>
            <span>Human-in-the-loop</span>
            <span>MKB · btw + werkgeversvragen als wedge</span>
          </div>
        </div>
        <aside className="investment-ask">
          <span className="ask-label">INDICATIEVE PRE-SEED</span>
          <strong>€250.000</strong>
          <p>
            18 maanden om aanbod, herhaalgebruik en unit economics in twee
            MKB-vraagtypen te bewijzen.
          </p>
          <div className="funding-split">
            <span>
              <b>45%</b> product & veiligheid
            </span>
            <span>
              <b>30%</b> distributie
            </span>
            <span>
              <b>15%</b> compliance
            </span>
            <span>
              <b>10%</b> operatie
            </span>
          </div>
        </aside>
      </div>

      <div className="problem-model">
        <div className="pitch-problem">
          <p className="eyebrow">HET PROBLEEM</p>
          <h2>
            De dure tijd van een fiscalist verdwijnt nu in het ordenen van
            rommelige input.
          </h2>
          <p>
            Ondernemers weten niet welke feiten of belastingsoort relevant zijn. Adviseurs moeten
            eerst een dossier uitpluizen voordat zij prijs, risico en expertise
            kunnen beoordelen. Daardoor zijn afgebakende belastingvragen te traag en
            relatief duur.
          </p>
        </div>
        <div className="model-steps">
          <div>
            <b>01</b>
            <span>
              De ondernemer deelt vrije tekst, documenten en eventueel een bestaand
              AI-antwoord.
            </span>
          </div>
          <div>
            <b>02</b>
            <span>
              Het platform structureert, anonimiseert en maakt risico en
              ontbrekende feiten zichtbaar.
            </span>
          </div>
          <div>
            <b>03</b>
            <span>
              Het platform adviseert één passende specialist en toont scope,
              vaste prijs en onderbouwing; alternatieven blijven mogelijk.
            </span>
          </div>
          <div>
            <b>04</b>
            <span>
              Na betaling controleert de adviseur het concept en levert een
              onderbouwd antwoord.
            </span>
          </div>
        </div>
      </div>

      <section className="economics-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">UNIT ECONOMICS / BASISSCENARIO</p>
            <h2>
              Omzet groeit met transacties, niet met een zware
              supportorganisatie.
            </h2>
          </div>
          <p className="section-note">
            Eerste verdienmodel: 18% platformvergoeding op de opdrachtwaarde.
            Abonnementen en B2B-licenties zijn niet in de raming opgenomen.
          </p>
        </div>
        <div className="metric-ribbon">
          <div>
            <small>Gem. opdrachtwaarde jaar 3</small>
            <strong>{money(yearThree.aov)}</strong>
            <span>incl. adviseursvergoeding</span>
          </div>
          <div>
            <small>Platform take rate</small>
            <strong>18%</strong>
            <span>transactiegedreven</span>
          </div>
          <div>
            <small>Variabele platformkosten</small>
            <strong>± €4</strong>
            <span>betaling, AI en opslag per casus</span>
          </div>
          <div>
            <small>Bijdrage per casus jaar 3</small>
            <strong>{money(yearThree.aov * 0.18 - 4)}</strong>
            <span>vóór vaste kosten</span>
          </div>
        </div>
      </section>

      <section className="forecast-section">
        <div className="forecast-head">
          <div>
            <p className="eyebrow">VIJFJARENPLAN</p>
            <h2>Een toetsbaar pad naar {money(yearFive.arr)} ARR.</h2>
            <p>{assumptions.note}</p>
          </div>
          <div
            className="scenario-control"
            aria-label="Kies financieel scenario"
          >
            {(Object.keys(pitchScenarios) as PitchScenario[]).map((key) => (
              <button
                key={key}
                className={scenario === key ? "active" : ""}
                onClick={() => setScenario(key)}
              >
                {pitchScenarios[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="forecast-table-wrap">
          <table className="forecast-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Casussen / maand</th>
                <th>Gem. opdracht</th>
                <th>GMV run-rate</th>
                <th>Platform-ARR</th>
                <th>Jaar-opex</th>
                <th>Run-rate ruimte</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <td>
                    <strong>{row.year}</strong>
                    <small>{row.focus}</small>
                  </td>
                  <td>
                    {new Intl.NumberFormat("nl-NL").format(row.monthlyCases)}
                  </td>
                  <td>{money(row.aov)}</td>
                  <td>{money(row.gmv)}</td>
                  <td className="arr-cell">
                    <b>{money(row.arr)}</b>
                    <span>
                      <i
                        style={{
                          width: `${Math.max(4, (row.arr / maxArr) * 100)}%`,
                        }}
                      />
                    </span>
                  </td>
                  <td>{money(row.opex)}</td>
                  <td
                    className={row.runRateMargin >= 0 ? "positive" : "negative"}
                  >
                    {row.runRateMargin >= 0 ? "+" : ""}
                    {money(row.runRateMargin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="forecast-footnote">
          ARR is de geannualiseerde platformomzet op basis van het volume aan
          het einde van ieder jaar: maandelijkse casussen × gemiddelde
          opdrachtwaarde × 18% × 12. GMV is de totale opdrachtwaarde. De
          run-rate ruimte is geen boekhoudkundige jaarwinst. Bedragen zijn
          exclusief btw en financieringskosten.
        </p>
      </section>

      <div className="milestone-grid">
        <section>
          <p className="eyebrow">UITVOERINGSPLAN</p>
          <h2>Bewijs vóór schaal.</h2>
          <div className="milestones">
            <div>
              <b>0—12 maanden</b>
              <strong>Transactie bewijzen</strong>
              <span>
                50 actieve adviseurs, 180 casussen per maand en aantoonbaar
                herhaalgebruik.
              </span>
            </div>
            <div>
              <b>12—24 maanden</b>
              <strong>Distributie bewijzen</strong>
              <span>
                Boekhouders-, werkgevers- en softwarekanalen openen; 750 casussen per
                maand.
              </span>
            </div>
            <div>
              <b>24—36 maanden</b>
              <strong>Categorie uitbreiden</strong>
              <span>
                Van btw en werkgeversvragen naar winst, bv en internationaal
                ondernemen; particuliere onderwerpen volgen pas later.
              </span>
            </div>
          </div>
        </section>
        <section className="defensibility">
          <p className="eyebrow">VERDEDIGBAARHEID</p>
          <h2>De voorsprong zit in workflowdata, niet in één model.</h2>
          <ul>
            <li>
              <b>Gestructureerde fiscale casusdata</b>
              <span>
                Feiten, ontbrekende informatie, bronnen en uitkomsten worden
                herbruikbaar.
              </span>
            </li>
            <li>
              <b>Vertrouwd adviseursnetwerk</b>
              <span>
                Geverifieerde specialisaties, responstijd en reviews verbeteren
                de match.
              </span>
            </li>
            <li>
              <b>Operationele leercurve</b>
              <span>
                Elke review scherpt intake, prijsinschatting en
                kwaliteitscontroles aan.
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="risk-section">
        <div>
          <p className="eyebrow">BELANGRIJKSTE RISICO'S</p>
          <h2>Investeer op meetpunten, niet op optimisme.</h2>
        </div>
        <div className="risk-list">
          <article>
            <b>Juridische positionering</b>
            <p>
              Platformvoorwaarden, beroepsaansprakelijkheid en facturatie namens
              adviseurs vóór betaalde pilot juridisch valideren.
            </p>
          </article>
          <article>
            <b>Marktplaatsliquiditeit</b>
            <p>
              Start met twee niches, maximaal drie gesloten aanbiedingen en
              harde responstijden.
            </p>
          </article>
          <article>
            <b>Vertrouwen en privacy</b>
            <p>
              Python-backend, EU-opslag, minimale dataverwerking en menselijke
              eindcontrole als harde poorten.
            </p>
          </article>
          <article>
            <b>Acquisitiekosten</b>
            <p>
              Eerst organische adviseurs- en partnerkanalen bewijzen; betaalde
              groei pas na positieve bijdrage per casus.
            </p>
          </article>
        </div>
      </section>

      <div className="assumption-banner">
        <Icon n="file" />
        <div>
          <b>Dit is een pitchmodel, geen voorspelling.</b>
          <span>
            Alle bedragen, volumes en mijlpalen zijn managementaannames voor
            discussie en moeten met pilots, interviews en echte conversiedata
            worden gevalideerd.
          </span>
        </div>
      </div>
      <footer>
        <span>fiscale lijn</span>
        <span>Investeerderscase · managementversie · september 2026</span>
      </footer>
    </section>
  );
}

function DemoFlow({
  role,
  view,
  onIntake,
  onBoard,
  onAdmin,
}: {
  role: Role;
  view: string;
  onIntake: () => void;
  onBoard: () => void;
  onAdmin: () => void;
}) {
  const steps =
    role === "advisor"
      ? ["Bekijk opdracht", "Claim casus", "Review antwoord"]
      : role === "admin"
        ? ["Controleer casus", "Publiceer", "Bewaak kwaliteit"]
        : ["Deel uw vraag", "Kies specialist", "Ontvang advies"];
  const activeIndex =
    role === "customer"
      ? view === "home"
        ? 0
        : view === "intake" || view === "structured"
          ? 0
          : view === "dashboard" || view === "case"
            ? 1
            : 0
      : role === "advisor"
        ? view === "jobboard"
          ? 0
          : view === "review"
            ? 2
            : 1
        : view === "admin"
          ? 0
          : 1;

  return (
    <div className="demo-flow" aria-label="Voortgang in demomodus">
      <div className="demo-flow-inner">
        <span className="demo-flow-label">{role === "customer" ? "KLANT" : role === "advisor" ? "ADVISEUR" : "BEHEERDER"} · DEMO</span>
        <div className="demo-flow-steps">
          {steps.map((step, index) => (
            <span className={index <= activeIndex ? "is-active" : ""} key={step}>
              <b>0{index + 1}</b> {step}
            </span>
          ))}
        </div>
        <button
          className="demo-flow-action"
          onClick={role === "advisor" ? onBoard : role === "admin" ? onAdmin : onIntake}
        >
          {role === "advisor" ? "Naar opdrachten" : role === "admin" ? "Naar controle" : "Start demo"} <Icon n="arrow" />
        </button>
      </div>
    </div>
  );
}

const customerStatusGroups: Array<{ key: string; label: string; statuses: Status[] }> = [
  { key: "draft", label: "Concept", statuses: ["PENDING_REVIEW"] },
  { key: "waiting", label: "Wacht op adviseur", statuses: ["PUBLISHED"] },
  { key: "found", label: "Adviseur gevonden", statuses: ["CLAIMED"] },
  { key: "payment", label: "Betaling nodig", statuses: ["AWAITING_PAYMENT", "AWAITING_INFORMATION_PAYMENT"] },
  { key: "review", label: "In behandeling", statuses: ["PAID", "IN_REVIEW", "NEEDS_INFORMATION"] },
  { key: "answered", label: "Antwoord beschikbaar", statuses: ["DELIVERED"] },
];

function customerStatusLabel(status: Status) {
  return (
    customerStatusGroups.find((group) => group.statuses.includes(status))?.label ||
    status.replaceAll("_", " ")
  );
}

function nextStepForCase(item: CaseItem) {
  switch (item.status) {
    case "PENDING_REVIEW":
      return "Controleer de anonimisering en wacht op publicatie.";
    case "PUBLISHED":
      return "Een passende adviseur kan deze casus claimen.";
    case "CLAIMED":
      return "Bekijk de geïnteresseerde adviseur en maak een keuze.";
    case "AWAITING_PAYMENT":
      return "Voer de mockbetaling uit om de beoordeling te starten.";
    case "NEEDS_INFORMATION":
      return "Beantwoord de noodzakelijke vraag van de adviseur.";
    case "AWAITING_INFORMATION_PAYMENT":
      return "Bevestig de noodzakelijke toeslag en voer de mockbetaling uit.";
    case "PAID":
    case "IN_REVIEW":
      return "De adviseur controleert de analyse en bronnen.";
    case "DELIVERED":
      return "Uw gecontroleerde antwoord staat klaar.";
    default:
      return "De casus wordt verwerkt.";
  }
}

function CustomerDashboard({ cases, open, onIntake }: { cases: CaseItem[]; open: (id: string) => void; onIntake: () => void }) {
  const actionCases = cases.filter((item) =>
    ["CLAIMED", "AWAITING_PAYMENT", "NEEDS_INFORMATION", "AWAITING_INFORMATION_PAYMENT", "DELIVERED"].includes(item.status),
  );
  return (
    <section className="page customer-dashboard">
      <div className="page-head dashboard-head">
        <div>
          <p className="eyebrow">KLANT / MIJN CASUSSEN</p>
          <h1>Uw belastingvragen op één plek.</h1>
          <p>Zie per vraag wat er is gebeurd, wat er nu nodig is en wat de volgende stap wordt.</p>
        </div>
        <button className="button primary" onClick={onIntake}>Nieuwe vraag <Icon n="arrow" /></button>
      </div>
      {actionCases.length > 0 && (
        <div className="customer-alert">
          <Icon n="bell" />
          <div>
            <strong>{actionCases.length} casus{actionCases.length === 1 ? " vraagt" : "sen vragen"} uw aandacht</strong>
            <span>Open een casus om de volgende stap uit te voeren.</span>
          </div>
        </div>
      )}
      <div className="dashboard-list">
        {customerStatusGroups.map((group) => {
          const groupedCases = cases.filter((item) => group.statuses.includes(item.status));
          if (groupedCases.length === 0) return null;
          return (
            <section className="dashboard-group" key={group.key}>
              <div className="dashboard-group-head">
                <h2>{group.label}</h2>
                <span>{groupedCases.length}</span>
              </div>
              {groupedCases.map((item) => (
                <button className="dashboard-case" key={item.id} onClick={() => open(item.id)}>
                  <span className={`status ${item.status.toLowerCase()}`}>{customerStatusLabel(item.status)}</span>
                  <span className="dashboard-case-copy">
                    <strong>{item.title}</strong>
                    <small>{nextStepForCase(item)}</small>
                  </span>
                  <span className="dashboard-case-meta">{item.category} · {item.year}<Icon n="arrow" /></span>
                </button>
              ))}
            </section>
          );
        })}
        {cases.length === 0 && (
          <div className="empty-state">
            <strong>Nog geen vragen</strong>
            <span>Begin met uw eerste vraag. U kunt ook een rommelig verhaal of bestaand AI-antwoord plaatsen.</span>
            <button className="button primary compact" onClick={onIntake}>Vraag voorleggen</button>
          </div>
        )}
      </div>
    </section>
  );
}

function HomeView({
  onIntake,
  onAdvisor,
  onInvestor,
  onPolicy,
  onDashboard,
  open,
  cases,
}: {
  onIntake: () => void;
  onAdvisor: () => void;
  onInvestor: () => void;
  onPolicy: (policy: "privacy" | "terms" | "quality") => void;
  onDashboard: () => void;
  open: (id: string) => void;
  cases: CaseItem[];
}) {
  const businessCases = cases.filter(
    (item) => item.clientType !== "Particulier" || item.category === "Btw",
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BELASTINGHULP VOOR HET MKB · PUBLIEKE DEMO</p>
          <h1>
            Een belastingvraag in uw bedrijf? <em>We maken duidelijk wat u moet doen.</em>
          </h1>
          <p className="lead">
            Deel uw verhaal, brief, document of een AI-antwoord dat u al heeft.
            U krijgt eerst een gratis routecheck. Is specialistische controle
            nodig, dan ziet u vooraf de vaste prijs en wie verantwoordelijk is.
          </p>
          <div className="actions">
            <button className="button primary" onClick={onIntake}>
              Leg uw belastingvraag voor <Icon n="arrow" />
            </button>
            <button
              className="button secondary"
              onClick={() => document.getElementById("hoe-het-werkt")?.scrollIntoView({ behavior: "smooth" })}
            >
              Bekijk hoe het werkt
            </button>
          </div>
          <div className="hero-assurances" aria-label="Belangrijkste zekerheden">
            <span><Icon n="check" /> Eerste routecheck gratis</span>
            <span><Icon n="check" /> Vooraf een vaste prijs</span>
            <span><Icon n="check" /> Specialist controleert</span>
          </div>
        </div>
        <aside className="hero-aside customer-route-card">
          <p className="eyebrow">U WEET VOORAF</p>
          <div className="customer-route">
            <div>
              <b>01</b>
              <span>Uw vraag is begrijpelijk gemaakt</span>
              <strong>Feiten, deadline en ontbrekende informatie</strong>
            </div>
            <div className="is-current">
              <b>02</b>
              <span>U ziet de route en prijs</span>
              <strong>Gratis zelf verder of specialist vanaf €49*</strong>
            </div>
            <div>
              <b>03</b>
              <span>U krijgt een actiegericht antwoord</span>
              <strong>Bronnen, risico, deadline en volgende stap</strong>
            </div>
          </div>
          <small>* Indicatieve demoprijs, exclusief btw. De echte prijs volgt pas na de routecheck.</small>
        </aside>
      </section>

      <section className="mkb-situations" aria-labelledby="situation-title">
        <div className="section-intro">
          <p className="eyebrow">WAARMEE KUNNEN WE HELPEN?</p>
          <h2 id="situation-title">Begin bij wat er speelt, niet bij de belastingwet.</h2>
          <p>U hoeft de juiste fiscale categorie niet te kennen. Kies herkenning of leg uw verhaal vrij voor.</p>
        </div>
        <div className="situation-grid">
          {[
            ["Btw & facturen", "Tarief, aftrek, vrijstelling of een factuur naar het buitenland."],
            ["Personeel & loon", "Loonheffingen, vergoedingen, auto van de zaak of een buitenlandse werknemer."],
            ["Winst & aangifte", "Zakelijke kosten, eerste jaar ondernemen of een onverwachte aanslag."],
            ["BV & ondernemen", "Vennootschapsbelasting, dga-vragen of geld tussen privé en de bv."],
            ["Brief of deadline", "Een brief, controle, naheffing of bezwaar waarop u moet reageren."],
            ["Ik weet het niet", "Geen probleem. Wij bepalen eerst waar uw vraag thuishoort."],
          ].map(([title, text], index) => (
            <button className="situation-card" key={title} onClick={onIntake}>
              <span>0{index + 1}</span>
              <strong>{title}</strong>
              <small>{text}</small>
              <Icon n="arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="process" id="hoe-het-werkt">
        <div>
          <p className="eyebrow">HOE HET WERKT</p>
          <h2>Van losse informatie naar een besluit waar u mee verder kunt.</h2>
        </div>
        <div className="process-grid">
          <Process
            n="01"
            title="Deel wat u heeft"
            text="Een rommelig verhaal, brief, document of eerder AI-antwoord is genoeg om te beginnen."
          />
          <Process
            n="02"
            title="Gratis routecheck"
            text="Wij ordenen de vraag, signaleren privacyrisico's en bepalen of gratis hulp volstaat."
          />
          <Process
            n="03"
            title="Vaste prijs en specialist"
            text="Als controle nodig is, ziet u de totale demoprijs en waarom de aanbevolen specialist past."
          />
          <Process
            n="04"
            title="Duidelijk antwoord en actie"
            text="U krijgt antwoord, onderbouwing, onzekerheden, deadline en concrete vervolgstappen."
          />
        </div>
      </section>

      <section className="service-ladder">
        <div className="section-intro">
          <p className="eyebrow">PASSENDE HULP, GEEN ZWAAR TRAJECT</p>
          <h2>Betaal alleen voor de controle die uw vraag nodig heeft.</h2>
        </div>
        <div className="service-grid">
          <article>
            <span className="service-number">01</span>
            <p className="eyebrow">ROUTECHECK</p>
            <h3>Gratis</h3>
            <p>Structuur, onderwerp, ontbrekende informatie en een duidelijke vervolgrichting.</p>
            <ul><li>Vrije intake</li><li>Privacycontrole</li><li>Doorverwijzing als specialist niet nodig is</li></ul>
            <button className="text-button" onClick={onIntake}>Start routecheck <Icon n="arrow" /></button>
          </article>
          <article className="recommended-service">
            <span className="service-badge">MEEST GESCHIKT VOOR EEN AFGEBAKENDE VRAAG</span>
            <p className="eyebrow">BELASTINGCHECK</p>
            <h3>Vanaf €49 <small>excl. btw*</small></h3>
            <p>Controle door een passende specialist, met bronnen en praktisch actieplan.</p>
            <ul><li>Vaste prijs vooraf</li><li>Eén gerichte verduidelijkingsronde</li><li>Gecontroleerd antwoord</li></ul>
          </article>
          <article>
            <span className="service-number">03</span>
            <p className="eyebrow">SPECIALISTISCH ADVIES</p>
            <h3>Vaste prijs</h3>
            <p>Voor meer feiten, hoger risico of een korte deadline. U beslist pas na de prijs.</p>
            <ul><li>Specialist op onderwerp</li><li>Scope en verantwoordelijkheid vastgelegd</li><li>Meerwerk alleen na akkoord</li></ul>
          </article>
        </div>
        <p className="price-note">* Dit zijn indicatieve prijzen in de MVP. In productie staat altijd het totale bedrag exclusief btw vóór betaling in beeld.</p>
      </section>

      <section className="quality-proof">
        <div className="quality-copy">
          <p className="eyebrow">WIE DRAAGT DE VERANTWOORDELIJKHEID?</p>
          <h2>Techniek ordent. Een mens beoordeelt.</h2>
          <p>Fiscale Lijn is bemiddelaar en organiseert intake, matching, betaling en kwaliteitscontrole. De gekozen specialist is verantwoordelijk voor het definitieve advies binnen de afgesproken scope.</p>
          <button className="text-button" onClick={() => onPolicy("quality")}>Lees hoe kwaliteit en klachten werken <Icon n="arrow" /></button>
        </div>
        <div className="quality-checks">
          <div><Icon n="shield" /><span><strong>Geverifieerde specialist</strong><small>Identiteit, vakgebied, ervaring en verzekering worden vóór productie gecontroleerd.</small></span></div>
          <div><Icon n="file" /><span><strong>Bronnen en onzekerheid zichtbaar</strong><small>Geen bron betekent geen stellige conclusie. Ontbrekende feiten blijven in beeld.</small></span></div>
          <div><Icon n="lock" /><span><strong>Minimale gegevensdeling</strong><small>De specialist ziet alleen wat voor de beoordeling noodzakelijk is.</small></span></div>
        </div>
      </section>

      <section className="demo-cases">
        <div className="section-head">
          <div>
            <p className="eyebrow">VOORBEELDEN UIT DE DEMO</p>
            <h2>Zo ziet een zakelijke belastingvraag eruit.</h2>
          </div>
          <button className="text-button" onClick={onDashboard}>
            Mijn vragen bekijken <Icon n="arrow" />
          </button>
        </div>
        <div className="mini-list">
          {(businessCases.length ? businessCases : cases).slice(0, 3).map((c) => (
            <button key={c.id} className="mini-case" onClick={() => open(c.id)}>
              <span className="case-code">{c.id}</span>
              <strong>{c.title}</strong>
              <span>
                {c.category} · {c.complexity} · {c.fee ? `vaste demoprijs €${c.fee} excl. btw` : "routecheck"}
              </span>
              <Icon n="arrow" />
            </button>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <div className="footer-brand"><strong>fiscale lijn</strong><span>Belastinghulp voor het mkb</span></div>
        <div className="footer-links" aria-label="Informatie">
          <button onClick={() => onPolicy("privacy")}>Privacy</button>
          <button onClick={() => onPolicy("terms")}>Platformrol & voorwaarden</button>
          <button onClick={() => onPolicy("quality")}>Kwaliteit & klachten</button>
        </div>
        <div className="footer-links secondary-links" aria-label="Andere omgevingen">
          <button onClick={onAdvisor}>Voor adviseurs</button>
          <button onClick={onInvestor}>Voor investeerders</button>
        </div>
        <span className="footer-disclaimer">Publieke demo · geen professioneel advies of beveiligde productieomgeving · 2026</span>
      </footer>
    </>
  );
}

function PolicyPage({
  type,
  onBack,
}: {
  type: "privacy" | "terms" | "quality";
  onBack: () => void;
}) {
  const content = {
    privacy: {
      eyebrow: "PRIVACY / DEMOBELEID",
      title: "Deel alleen wat nodig is voor uw belastingvraag.",
      intro:
        "Deze publieke MVP is geen beveiligde productieomgeving. Gebruik uitsluitend fictieve gegevens. De onderstaande principes beschrijven de bedoelde productwerking, niet een al afgeronde AVG-implementatie.",
      sections: [
        ["Wat de demo doet", "Vrije tekst wordt lokaal op herkenbare persoonsgegevens gecontroleerd. U ziet origineel en geanonimiseerd naast elkaar en moet de anonimisering zelf goedkeuren voordat de vraag verdergaat."],
        ["Wat de demo niet doet", "GitHub Pages biedt geen accountbeveiliging, versleutelde dossieropslag of gecontroleerde documentverwerking. Bestanden worden in deze versie niet geüpload; alleen bestandsnaam en grootte worden lokaal getoond."],
        ["Productieprincipe", "Originele klantinput en de geanonimiseerde expertversie blijven strikt gescheiden. Alleen noodzakelijke gegevens gaan naar een specialist. Bewaartermijnen, verwijdering, inzage en verwerkersafspraken moeten vóór een echte pilot formeel zijn ingericht."],
      ],
    },
    terms: {
      eyebrow: "PLATFORMROL / CONCEPT",
      title: "Duidelijk over wie wat doet.",
      intro:
        "Fiscale Lijn is ontworpen als bemiddelaar en tussenpartij voor intake, matching, betaling en facturatie. De specialist geeft het definitieve advies en is daarvoor verantwoordelijk binnen de afgesproken scope.",
      sections: [
        ["Rol van het platform", "Het platform structureert de vraag, ondersteunt anonimisering, doet een uitlegbare match en faciliteert betaling. Een AI-concept is nooit zelfstandig advies en wordt niet als eindantwoord geleverd."],
        ["Rol van de specialist", "De gekozen specialist controleert feiten, aannames en bronnen, benoemt onzekerheden en levert het eindantwoord. Beroepskwalificaties en aansprakelijkheidsdekking moeten vóór toelating tot een productieplatform zijn geverifieerd."],
        ["Prijs en meerwerk", "De klant ziet vóór betaling een vaste totaalprijs exclusief btw. Extra vragen mogen de prijs alleen verhogen als het platform de noodzaak controleert en de klant daarna expliciet akkoord gaat."],
      ],
    },
    quality: {
      eyebrow: "KWALITEIT / CONCEPTKADER",
      title: "Een controleerbaar antwoord, niet alleen een overtuigend antwoord.",
      intro:
        "Kwaliteit bestaat hier uit aantoonbare vakkennis, passende ervaring, brononderbouwing, transparante onzekerheid en een duidelijke route als iets misgaat.",
      sections: [
        ["Toelating van specialisten", "Voor productie worden identiteit, relevante opleiding of registratie, specialisaties, ervaring en beroepsaansprakelijkheidsverzekering gecontroleerd. Reviews tellen pas mee na een afgeronde opdracht."],
        ["Vaste antwoordstructuur", "Elk eindantwoord bevat: kort antwoord, betekenis voor de onderneming, concrete actie, deadline, onzekerheden, bronnen en het moment waarop aanvullende hulp nodig is."],
        ["Klacht of twijfel", "De klant moet een antwoord kunnen markeren, een inhoudelijke reactie ontvangen en waar nodig escaleren naar platformcontrole. Doorlooptijden, herbeoordeling en eventuele restitutie worden vóór de betaalde pilot in een klachtenregeling vastgelegd."],
      ],
    },
  }[type];

  return (
    <section className="page policy-page">
      <button className="back" onClick={onBack}>← Terug naar start</button>
      <div className="policy-hero">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </div>
      <div className="policy-sections">
        {content.sections.map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <div><h2>{title}</h2><p>{text}</p></div>
          </article>
        ))}
      </div>
      <div className="policy-warning"><Icon n="shield" /><span><strong>Belangrijk voor deze MVP</strong>Deze pagina is een product- en beleidsconcept, geen juridisch advies en geen vervanging voor definitieve voorwaarden, privacyverklaring of klachtenregeling.</span></div>
    </section>
  );
}

function Process({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="process-item">
      <b>{n}</b>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function StructuredCase({
  item,
  confirm,
  edit,
}: {
  item: CaseItem;
  confirm: (anonymizedText: string) => void;
  edit: () => void;
}) {
  const [anonymisationApproved, setAnonymisationApproved] = useState(false);
  const [anonymizedText, setAnonymizedText] = useState(
    item.anonymizedDescription || item.summary || "",
  );
  const originalText =
    item.originalDescription ||
    "Uw oorspronkelijke vrije tekst blijft alleen zichtbaar in uw klantomgeving.";
  const findings = findSensitiveData(anonymizedText);
  const previewParts: Array<React.ReactNode> = [];
  let previewCursor = 0;
  findings.forEach((finding, index) => {
    if (finding.index < previewCursor) return;
    previewParts.push(anonymizedText.slice(previewCursor, finding.index));
    previewParts.push(
      <mark className="sensitive-mark" key={`${finding.label}-${index}`}>
        {finding.value}
      </mark>,
    );
    previewCursor = finding.index + finding.value.length;
  });
  previewParts.push(anonymizedText.slice(previewCursor));
  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">KLANT / STRUCTUURCONTROLE</p>
          <h1>Uw verhaal, teruggebracht tot de kern.</h1>
          <p>
            Controleer eerst wat wij uit uw vrije tekst hebben gehaald. U hoeft
            geen fiscale samenvatting te schrijven; geef alleen aan of de feiten
            herkenbaar zijn.
          </p>
        </div>
      </div>
      <div className="structure-banner">
        <Icon n="check" />
        <div>
          <strong>Voorlopige structuur gemaakt</strong>
          <span>
            De volgende stap is nog geen publicatie. We wachten op uw
            bevestiging.
          </span>
        </div>
      </div>
      <section className="anonymisation-review">
        <div className="block-title">
          <span>PRIVACYCONTROLE</span>
          <h2>Controleer de anonimisering</h2>
          <small>verplicht vóór beoordeling</small>
        </div>
        <p>
          Controleer of de tekst hieronder geen namen, adressen, contactgegevens,
          bedrijfsnamen of andere herkenbare informatie meer bevat. Ontbreekt er
          iets of staat er nog een herkenbaar detail in? Kies dan voor aanpassen.
        </p>
        <div className="anonymisation-columns">
          <div>
            <span className="card-label">ALLEEN VOOR U</span>
            <p>{originalText}</p>
          </div>
          <div className="anonymised-preview">
            <span className="card-label">NAAR ADVISEURS</span>
            <div className="privacy-preview-text">{previewParts}</div>
            <label className="privacy-edit-label">
              Geanonimiseerde tekst aanpassen
              <textarea
                rows={6}
                value={anonymizedText}
                onChange={(event) => {
                  setAnonymizedText(event.target.value);
                  setAnonymisationApproved(false);
                }}
              />
            </label>
            {findings.length > 0 ? (
              <div className="privacy-warning">
                <b>{findings.length} mogelijk herkenbare gegevens gevonden</b>
                <span>{findings.map((finding) => finding.label).join(" · ")}</span>
              </div>
            ) : (
              <div className="privacy-safe">Geen herkenbare patronen gevonden.</div>
            )}
          </div>
        </div>
        <label className="approval-row">
          <input
            type="checkbox"
            checked={anonymisationApproved}
            onChange={(event) => setAnonymisationApproved(event.target.checked)}
          />
          <span>
            Ik heb de geanonimiseerde tekst gecontroleerd en ga ermee akkoord dat
            deze versie aan adviseurs wordt getoond.
          </span>
        </label>
        <div className="privacy-review-actions">
          <button type="button" className="text-button" onClick={edit}>
            Dit klopt niet — terug naar aanpassen
          </button>
          <span>{findings.length > 0 ? "Verwijder eerst de gemarkeerde gegevens." : "De tekst kan ter beoordeling worden aangeboden."}</span>
        </div>
      </section>
      <div className="structure-grid">
        <section className="structure-card">
          <div className="card-label">VOORGESTELDE KERNVRAAG</div>
          <h2>{item.customerQuestion}</h2>
          <small>Afgeleid uit de omschrijving en uw aanvullende vraag</small>
        </section>
        <section className="structure-card">
          <div className="card-label">VASTGESTELDE FEITEN</div>
          {item.facts.map((fact, i) => (
            <div className="fact-line" key={fact}>
              <span className="fact-check">✓</span>
              <span>{fact}</span>
              <small>uit klanttekst</small>
            </div>
          ))}
        </section>
        <section className="structure-card issue-card">
          <div className="card-label">NOG TE CONTROLEREN</div>
          <div className="issue">
            <b>{item.missing} ontbrekende feiten</b>
            <span>
              Een adviseur heeft extra informatie nodig om de conclusie te
              onderbouwen.
            </span>
          </div>
          <div className="issue">
            <b>Privacycontrole</b>
            <span>
              Herkenbare persoonsgegevens worden vóór publicatie vervangen door
              placeholders.
            </span>
          </div>
          <div className="issue">
            <b>Broncontrole</b>
            <span>
              De AI-analyse is een concept. Geen bron betekent geen stellige
              conclusie.
            </span>
          </div>
        </section>
        <section className="structure-card">
          <div className="card-label">VOORGESTELDE MATCH</div>
          <div className="match-preview">
            <strong>{item.category}</strong>
            <span>{item.tags.join(" · ")}</span>
            <b>
              {item.complexity} · {item.minutes}
            </b>
          </div>
          {item.externalAi && (
            <div className="external-mini">
              <b>Extern AI-antwoord apart gehouden</b>
              <span>
                De adviseur ziet dit als klantinput, niet als platformconclusie.
              </span>
            </div>
          )}
        </section>
      </div>
      <div className="structure-actions">
        <button className="button secondary" onClick={edit}>
          Structuur aanpassen
        </button>
        <button
          className="button primary"
          disabled={!anonymisationApproved || findings.length > 0}
          onClick={() => confirm(anonymizedText)}
        >
          Klopt, laat beoordelen <Icon n="arrow" />
        </button>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Intake({
  form,
  setForm,
  publicDemo,
  onSubmit,
  onCancel,
}: {
  form: IntakeForm;
  setForm: (v: IntakeForm) => void;
  publicDemo: boolean;
  onSubmit: (e: React.FormEvent, attachments: UploadedAttachment[]) => void;
  onCancel: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [demoAcknowledged, setDemoAcknowledged] = useState(false);
  const [demoInputError, setDemoInputError] = useState("");
  const set = (k: keyof IntakeForm, v: string) => {
    setForm({ ...form, [k]: v });
    setDemoInputError("");
  };
  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
    const rejected = nextFiles.find((file) => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (rejected) {
      setFileError("Gebruik pdf, Word, png of jpg-bestanden van maximaal 10 MB per bestand.");
      return;
    }
    setFileError("");
    setAttachments((current) => [
      ...current,
      ...nextFiles.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, size: file.size, type: file.type })),
    ].filter((file, index, all) => all.findIndex((candidate) => candidate.id === file.id) === index).slice(0, 5));
  };
  const handleSubmit = (event: React.FormEvent) => {
    if (publicDemo) {
      const inputForSafetyCheck = [
        form.title,
        form.description,
        form.question,
        form.externalAi,
        ...attachments.map((file) => file.name),
      ].join("\n");
      const findings = findSensitiveData(inputForSafetyCheck);
      if (!demoAcknowledged) {
        event.preventDefault();
        setDemoInputError("Bevestig eerst dat u uitsluitend fictieve gegevens gebruikt.");
        return;
      }
      if (findings.length > 0) {
        event.preventDefault();
        setDemoInputError(
          `Deze publieke demo verwerkt geen herkenbare gegevens. Controleer: ${findings
            .map((finding) => finding.label.toLowerCase())
            .join(", ")}.`,
        );
        return;
      }
    }
    onSubmit(event, attachments);
  };
  const fillExample = () =>
    setForm({
      ...form,
      title: "Btw op advies en online training",
      description:
        "Mijn eenmanszaak verkoopt adviesuren en een online training aan Nederlandse zakelijke klanten. Voor het advies bereken ik 21% btw. Een AI-tool zegt dat de training mogelijk is vrijgesteld, maar ik weet niet of dat klopt. Volgende maand moet ik aangifte doen.",
      question:
        "Welk btw-tarief geldt voor de online training en hoe moet ik dit op mijn factuur en aangifte verwerken?",
      category: "Btw",
      year: "2025",
      clientType: "Eenmanszaak",
      externalAi:
        "Een eerder AI-antwoord zei dat online onderwijs altijd is vrijgesteld van btw, maar noemde geen voorwaarden of bron. Kunnen jullie dit controleren?",
    });
  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">MKB / GRATIS ROUTECHECK</p>
          <h1>Vertel wat er speelt in uw bedrijf.</h1>
          <p>
            Plak gerust een brief, e-mail, losse notities of een eerder
            AI-antwoord. U hoeft de belastingregels of juiste categorie niet te kennen.
          </p>
        </div>
        <button className="text-button" onClick={onCancel}>
          Annuleren
        </button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="example-callout">
          <div>
            <strong>Even zien hoe dit werkt?</strong>
            <span>Vul een realistische fictieve casus in en pas daarna zelf aan.</span>
            <small className="draft-status"><Icon n="check" /> Uw concept wordt automatisch bewaard in deze browser.</small>
          </div>
          <ExampleButton onClick={fillExample} />
        </div>
        <label className="free-input">
          <span>
            Wat speelt er? <small>verplicht</small> <ExampleButton onClick={fillExample} label="Voorbeeld" />
          </span>
          <textarea
            required
            rows={10}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Bijvoorbeeld: 'Mijn eenmanszaak verkoopt advies en een online training. Ik twijfel over de btw...'. Alles wat relevant lijkt mag hier eerst in. Laat namen en persoonsgegevens weg."
          />
          <small className="helper">
            <Icon n="file" /> U hoeft zelf nog geen titel, categorie of fiscale
            samenvatting te maken.
          </small>
        </label>
        <div className="form-grid">
          <label>
            Voorlopige titel <small>optioneel</small> <ExampleButton onClick={() => set("title", "Btw op advies en online training")} label="Voorbeeld" />
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Bijv. btw op online training"
            />
          </label>
          <label>
            Waar lijkt uw vraag over te gaan? <small>optioneel</small>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option>Weet ik niet</option>
              <option value="Btw">Btw & facturen</option>
              <option value="Loonheffingen">Personeel & loon</option>
              <option value="Inkomstenbelasting">Winst & inkomstenbelasting</option>
              <option value="Vennootschapsbelasting">BV & vennootschapsbelasting</option>
              <option value="Internationaal">Internationaal ondernemen</option>
              <option value="Bezwaar">Brief, aanslag of bezwaar</option>
            </select>
          </label>
        </div>
          <label>
            Als u één ding zeker wilt weten <small>optioneel</small> <ExampleButton onClick={() => set("question", "Welk btw-tarief geldt en hoe verwerk ik dit op de factuur en aangifte?")} label="Voorbeeld" />
          <textarea
            rows={3}
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="Schrijf dit alleen als u het al scherp heeft. Anders structureren wij dit later."
          />
        </label>
        <div className="form-grid">
          <label>
            Belastingjaar <small>optioneel</small>
            <select
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            >
              <option>2025</option>
              <option>2024</option>
              <option>2026</option>
              <option>Weet ik niet</option>
            </select>
          </label>
          <label>
            Type klant <small>optioneel</small>
            <select
              value={form.clientType}
              onChange={(e) => set("clientType", e.target.value)}
            >
              <option>Eenmanszaak</option>
              <option>Bv</option>
              <option>Werkgever</option>
              <option>Stichting/vereniging</option>
              <option>Particulier</option>
              <option>Weet ik niet</option>
            </select>
          </label>
        </div>
        <label className="external">
          <span>
            AI-antwoord dat u al elders heeft gekregen <small>optioneel</small> <ExampleButton onClick={() => set("externalAi", "Een eerder AI-antwoord zei dat online onderwijs altijd is vrijgesteld van btw, maar noemde geen voorwaarden of bron. Kunnen jullie dit controleren?")} label="Voorbeeld" />
          </span>
          <textarea
            rows={5}
            value={form.externalAi}
            onChange={(e) => set("externalAi", e.target.value)}
            placeholder="Plak hier bijvoorbeeld een antwoord uit ChatGPT, Claude of een andere tool. Dit blijft zichtbaar als klantinput en wordt apart gecontroleerd."
          />
          <small className="helper">
            <Icon n="file" /> Wij nemen dit antwoord niet automatisch over.
          </small>
        </label>
        <div className="upload-block">
          <div className="field-heading">
            <span>Documenten toevoegen <small>optioneel</small></span>
            <small>maximaal 5 bestanden</small>
          </div>
          <div
            className={`dropzone${isDragging ? " is-dragging" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer.files); }}
          >
            <Icon n="file" />
            <div>
              <strong>Sleep bestanden hierheen</strong>
              <span>of kies een bestand vanaf uw apparaat</span>
            </div>
            <button type="button" className="button secondary compact" onClick={() => fileInput.current?.click()}>Bestand kiezen</button>
            <input ref={fileInput} type="file" className="visually-hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ""; }} />
          </div>
          <small className="helper"><Icon n="shield" /> Documenten zijn in deze publieke demo alleen lokaal als bestandsnaam zichtbaar en worden niet naar cloudopslag gestuurd. Deel geen echte persoonsgegevens.</small>
          {fileError && <span className="upload-error">{fileError}</span>}
          {attachments.length > 0 && <div className="attachment-list" aria-label="Geselecteerde documenten">
            {attachments.map((file) => <div className="attachment-row" key={file.id}><Icon n="file" /><span><b>{file.name}</b><small>{formatFileSize(file.size)}</small></span><button type="button" className="text-button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}>Verwijder</button></div>)}
          </div>}
        </div>
        <div className="privacy-note">
          <Icon n="shield" />
          <div>
            <strong>Publieke demo: gebruik alleen fictieve gegevens.</strong>
            <span>
              Deze GitHub Pages-versie heeft geen veilige opslag, authenticatie
              of productie-anonimisering. Verwijder namen, adressen,
              telefoonnummers, BSN's, KvK-nummers en andere vertrouwelijke
              gegevens.
            </span>
          </div>
        </div>
        {publicDemo && (
          <label className="demo-consent">
            <input
              type="checkbox"
              checked={demoAcknowledged}
              onChange={(event) => {
                setDemoAcknowledged(event.target.checked);
                setDemoInputError("");
              }}
            />
            <span>
              Ik begrijp dat dit een publieke demo is en gebruik uitsluitend fictieve
              gegevens en voorbeeldbestanden.
            </span>
          </label>
        )}
        {demoInputError && (
          <div className="demo-input-error" role="alert">
            <Icon n="shield" />
            <span>{demoInputError}</span>
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            Terug
          </button>
          <button className="button primary" type="submit" disabled={publicDemo && !demoAcknowledged}>
            Gratis routecheck maken <Icon n="arrow" />
          </button>
        </div>
      </form>
    </section>
  );
}

function Jobboard({
  cases,
  filter,
  setFilter,
  open,
}: {
  cases: CaseItem[];
  filter: string;
  setFilter: (v: string) => void;
  open: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("match");
  const [mode, setMode] = useState<"available" | "mine">("available");
  const [showProfile, setShowProfile] = useState(false);
  const availableCases = cases.filter(
    (item) =>
      mode === "mine"
        ? item.claims?.some((claim) => claim.expert_name === "Mara van Dijk")
        : item.status === "PUBLISHED" || item.status === "CLAIMED",
  );
  const visibleCases = [...availableCases]
    .filter((item) => {
      if (!search.trim()) return true;
      const haystack = [item.title, item.summary, item.category, ...item.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "fee") return Number(b.fee) - Number(a.fee);
      if (sort === "time") return Number(a.minutes.match(/\d+/)?.[0] || 999) - Number(b.minutes.match(/\d+/)?.[0] || 999);
      return b.match - a.match;
    });
  return (
    <section className="page">
      <div className="page-head board-head">
        <div>
          <p className="eyebrow">ADVISEUR / OPDRACHTEN</p>
          <h1>Opdrachten die bij u passen.</h1>
          <p>
            Compacte, geanonimiseerde casussen. Eerst de kern, dan pas het
            dossier.
          </p>
        </div>
        <button className="profile-chip profile-trigger" onClick={() => setShowProfile((value) => !value)}>
          <span className="avatar large">MV</span>
          <span>
            <b>Mara van Dijk</b>
            <small>Loonheffingen-specialist · actief</small>
          </span>
          <span className="profile-chevron">{showProfile ? "−" : "+"}</span>
        </button>
      </div>
      {showProfile && (
        <div className="profile-panel">
          <div>
            <p className="eyebrow">UW ADVISEURSPROFIEL</p>
            <h2>Mara van Dijk</h2>
            <p className="muted">Loonheffingen-specialist · 4,8★ uit 27 reviews · actief</p>
          </div>
          <div className="profile-details">
            <div><small>Specialisaties</small><b>Meerdere dienstbetrekkingen · werknemersverzekeringen · loonadministratie</b></div>
            <div><small>Voorkeur</small><b>Particulier en werkgever · 20–45 minuten · vanaf €40</b></div>
          </div>
        </div>
      )}
      <div className="board-mode" aria-label="Opdrachtenweergave">
        <button className={mode === "available" ? "active" : ""} onClick={() => setMode("available")}>Beschikbaar</button>
        <button className={mode === "mine" ? "active" : ""} onClick={() => setMode("mine")}>Mijn opdrachten</button>
      </div>
      <div className="board-toolbar">
        <div className="result-count">
          <strong>{visibleCases.length}</strong> {mode === "mine" ? "opdrachten in behandeling" : "passende demo-opdrachten"}
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>Alle specialisaties</option>
          <option>Loonheffingen</option>
          <option>Btw</option>
          <option>Inkomstenbelasting</option>
        </select>
        <label className="board-search">
          <Icon n="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op titel, tag of kernvraag" />
        </label>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sorteer opdrachten">
          <option value="match">Beste match</option>
          <option value="fee">Hoogste vergoeding</option>
          <option value="time">Kortste behandeltijd</option>
        </select>
      </div>
      <div className="job-list">
        {visibleCases.map((item, index) => (
          <article
            className="job-row"
            key={item.id}
            style={{ "--index": index } as React.CSSProperties}
          >
            <div className="job-main">
              <div className="job-meta">
                <span className="case-code">{item.id}</span>
                <span className="category">{item.category}</span>
                <span className={`status ${item.status.toLowerCase()}`}>
                  {item.status === "PUBLISHED"
                    ? "Open"
                    : item.status === "CLAIMED"
                      ? "Geclaimd"
                      : "In behandeling"}
                </span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <div className="tags">
                {item.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="job-facts">
              <div>
                <small>Complexiteit</small>
                <b>{item.complexity}</b>
              </div>
              <div>
                <small>Behandeltijd</small>
                <b>{item.minutes}</b>
              </div>
              <div>
                <small>Vergoeding</small>
                <b>€{item.fee}</b>
              </div>
              <div>
                <small>Match met profiel</small>
                <b className="match">{item.match}%</b>
              </div>
            </div>
            <button
              className="button secondary compact"
              onClick={() => open(item.id)}
            >
              Bekijk casus <Icon n="arrow" />
            </button>
          </article>
        ))}
        {visibleCases.length === 0 && (
          <div className="empty-state">
            <strong>{mode === "mine" ? "Nog geen eigen opdrachten" : search ? "Geen casus gevonden" : "Geen openstaande opdrachten"}</strong>
            <span>{mode === "mine" ? "Geclaimde opdrachten verschijnen hier zodra een klant uw interesse heeft geselecteerd." : "Pas uw zoekopdracht aan of publiceer eerst een casus via de beheerdersrol."}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function CaseDetail({
  item,
  role,
  back,
  accept,
  pay,
  choose,
  askInformation,
  answerInformation,
  acceptInformationFee,
  decideInformation,
  review,
}: {
  item: CaseItem;
  role: Role;
  back: () => void;
  accept: (message: string) => void;
  pay: () => void;
  choose: (id: string, claimId: string) => void;
  askInformation: (id: string, question: string) => void;
  answerInformation: (id: string, requestId: string, answer: string) => void;
  acceptInformationFee: (id: string, requestId: string) => void;
  decideInformation: (id: string, requestId: string, approve: boolean, feeDeltaCents?: number) => void;
  review: () => void;
}) {
  const customer = role === "customer";
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [claimMessage, setClaimMessage] = useState("Ik kan deze casus binnen één werkdag beoordelen en de broncontrole uitvoeren.");
  return (
    <section className="page">
      <div className="detail-head">
        <button className="back" onClick={back}>
          ← Terug
        </button>
        <div className="case-meta">
          <span className="case-code">{item.id}</span>
          <span className="category">{item.category}</span>
          <span className={`status ${item.status.toLowerCase()}`}>
            {item.status.replace("_", " ")}
          </span>
        </div>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.summary}</p>
      </div>
      <div className="detail-layout">
        <div className="detail-content">
          <section className="section-block">
            <div className="block-title">
              <span>01</span>
              <h2>Geanonimiseerde casus</h2>
              <small>zichtbaar voor adviseurs</small>
            </div>
            <div className="fact-grid">
              {item.facts.map((f, i) => (
                <div key={i}>
                  <small>Feit {i + 1}</small>
                  <p>{f}</p>
                </div>
              ))}
            </div>
            <div className="question">
              <small>Concrete adviesvraag</small>
              <p>{customer ? item.customerQuestion : item.anonymizedCustomerQuestion || item.customerQuestion}</p>
            </div>
          </section>
          <section className="section-block">
            <div className="block-title">
              <span>02</span>
              <h2>AI-conceptantwoord</h2>
              <small className="warning">altijd controleren</small>
            </div>
            <div className="ai-box">
              <div className="ai-label">
                <span className="pulse" /> PLATFORM-ANALYSE · MOCK
              </div>
              <p>{item.aiAnswer}</p>
              <div className="source-line">
                <Icon n="file" />
                <span>{item.source}</span>
                <small>{item.sourceType}</small>
              </div>
            </div>
            {item.externalAi && (
              <div className="external-box">
                <div className="ai-label">
                  KLANTINPUT · AI-ANTWOORD UIT ANDERE BRON
                </div>
                <p>{customer ? item.externalAi : item.anonymizedExternalAi || item.externalAi}</p>
                <small>
                  Dit is door de klant aangeleverde input. Het platform neemt de
                  inhoud niet automatisch over.
                </small>
              </div>
            )}
          </section>
          <section className="section-block">
            <div className="block-title">
              <span>03</span>
              <h2>Bronnen & onzekerheid</h2>
            </div>
            <div className="source-card">
              <div>
                <b>{item.source}</b>
                <span>{item.sourceType} · demo-verwijzing</span>
              </div>
              <span className="confidence">Te controleren</span>
            </div>
            <p className="muted">
              De demo gebruikt gemarkeerde bronverwijzingen. Een adviseur moet
              actuele wet- en regelgeving en ontbrekende feiten controleren.
            </p>
          </section>
          {customer && item.status === "DELIVERED" && item.finalAnswer && (
            <section className="section-block final-delivery">
              <div className="block-title">
                <span>04</span>
                <h2>Definitief gecontroleerd antwoord</h2>
                <small className="confidence">menselijke review afgerond</small>
              </div>
              <div className="final-answer-box">
                <div className="ai-label">
                  <Icon n="check" /> ADVISEURSCONTROLE · DEFINITIEF
                </div>
                <p>{item.finalAnswer}</p>
                <span>
                  Dit antwoord is gebaseerd op de geanonimiseerde casus en is
                  door de adviseur gecontroleerd. De demo is geen professioneel
                  advies of beveiligde productieomgeving.
                </span>
              </div>
            </section>
          )}
          {role === "advisor" &&
            (item.status === "PAID" || item.status === "IN_REVIEW") && (
              <section className="section-block">
                <div className="block-title">
                  <span>04</span>
                  <h2>Ontbrekend feit signaleren</h2>
                  <small>fee alleen na platformbeoordeling</small>
                </div>
                <p className="muted">
                  Stel alleen een vraag die noodzakelijk is voor een verantwoord oordeel.
                  De regelengine beoordeelt eerst of een toeslag gerechtvaardigd is.
                </p>
                <div className="field-heading">
                  <span>Vraag aan de klant</span>
                  <ExampleButton
                    onClick={() =>
                      setQuestion(
                        "Kunt u de loonstroken van beide werkgevers over 2025 aanleveren?",
                      )
                    }
                  />
                </div>
                <textarea
                  rows={3}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Bijvoorbeeld: kunt u de loonstroken van beide werkgevers aanleveren?"
                />
                <button
                  className="button secondary full"
                  disabled={question.trim().length < 10}
                  onClick={() => {
                    askInformation(item.id, question);
                    setQuestion("");
                  }}
                >
                  Vraag laten beoordelen
                </button>
              </section>
            )}
          {customer && item.informationRequests?.at(-1) && (
            <section className="section-block">
              <div className="block-title">
                <span>04</span>
                <h2>Aanvullende informatie</h2>
                <small>alleen noodzakelijk indien gemarkeerd</small>
              </div>
              <div className="ai-box">
                <b>{item.informationRequests.at(-1)?.question}</b>
                <p>{item.informationRequests.at(-1)?.rationale}</p>
                {item.informationRequests.at(-1)?.required_for_assessment && (
                  <small>
                    Platformbeslissing · {item.informationRequests.at(-1)?.evaluation_confidence}% confidence · toeslag €{((item.informationRequests.at(-1)?.approved_fee_delta_cents || 0) / 100).toFixed(2)}
                  </small>
                )}
              </div>
              {item.informationRequests.at(-1)?.status === "PENDING_CUSTOMER" && (
                <>
                  <div className="field-heading">
                    <span>Uw antwoord</span>
                    <ExampleButton
                      onClick={() =>
                        setAnswer(
                          "Ik lever de loonstroken van beide werkgevers over 2025 aan. De namen en contactgegevens zijn afgeschermd.",
                        )
                      }
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Geef alleen de informatie die voor deze vraag nodig is."
                  />
                  <button
                    className="button primary full"
                    disabled={answer.trim().length < 10}
                    onClick={() => {
                      answerInformation(item.id, item.informationRequests!.at(-1)!.id, answer);
                      setAnswer("");
                    }}
                  >
                    Informatie versturen
                  </button>
                </>
              )}
              {item.informationRequests.at(-1)?.status === "ANSWERED" && (
                <button
                  className="button primary full"
                  onClick={() => acceptInformationFee(item.id, item.informationRequests!.at(-1)!.id)}
                >
                  Akkoord met noodzakelijke toeslag
                </button>
              )}
            </section>
          )}
          {role === "admin" && item.informationRequests?.at(-1)?.status === "PENDING_PLATFORM_REVIEW" && (
            <section className="section-block">
              <div className="block-title">
                <span>04</span>
                <h2>Platformcontrole toeslag</h2>
                <small>menselijke beslissing vereist</small>
              </div>
              <div className="ai-box">
                <b>{item.informationRequests.at(-1)?.question}</b>
                <p>{item.informationRequests.at(-1)?.rationale}</p>
                <small>
                  Regelvoorstel · {item.informationRequests.at(-1)?.evaluation_confidence}% confidence · maximaal €{((item.informationRequests.at(-1)?.proposed_fee_delta_cents || 0) / 100).toFixed(2)}
                </small>
              </div>
              <p className="muted">
                Keur alleen goed wanneer de vraag noodzakelijk is voor een verantwoord oordeel. De klant ziet de vraag en toeslag pas na deze beslissing.
              </p>
              <div className="form-actions">
                <button
                  className="button secondary"
                  onClick={() => decideInformation(item.id, item.informationRequests!.at(-1)!.id, false)}
                >
                  Afwijzen
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    decideInformation(
                      item.id,
                      item.informationRequests!.at(-1)!.id,
                      true,
                      item.informationRequests!.at(-1)!.proposed_fee_delta_cents,
                    )
                  }
                >
                  Noodzaak en toeslag goedkeuren
                </button>
              </div>
            </section>
          )}
        </div>
        <aside className="detail-aside">
          <div className="summary-panel">
            <p className="eyebrow">OPDRACHT IN HET KORT</p>
            {[
              ["Type klant", item.clientType],
              ["Belastingjaar", item.year],
              ["Complexiteit", item.complexity],
              ["Geschatte tijd", item.minutes],
              [role === "advisor" ? "Vergoeding" : role === "customer" ? "Vaste demoprijs excl. btw" : "Opdrachtwaarde", `€${item.fee}`],
              ["Ontbrekende feiten", String(item.missing)],
            ].map(([a, b]) => (
              <div className="summary-row" key={a}>
                <span>{a}</span>
                <b className={a === "Ontbrekende feiten" ? "orange" : ""}>
                  {b}
                </b>
              </div>
            ))}
            {role === "advisor" && item.status === "PUBLISHED" && (
              <div className="claim-panel">
                <div className="field-heading">
                  <span>Uw reactie op deze casus</span>
                  <ExampleButton onClick={() => setClaimMessage("Deze casus sluit aan op mijn ervaring met meerdere dienstbetrekkingen. Ik kan de broncontrole binnen één werkdag uitvoeren.")} />
                </div>
                <p className="muted">Laat kort zien waarom deze opdracht bij uw profiel past. De klant ziet dit bericht voordat hij een adviseur kiest.</p>
                <textarea rows={4} value={claimMessage} onChange={(event) => setClaimMessage(event.target.value)} placeholder="Waarom past deze casus bij uw expertise?" />
                <button className="button primary full" disabled={claimMessage.trim().length < 20} onClick={() => accept(claimMessage.trim())}>
                  Interesse tonen <Icon n="arrow" />
                </button>
              </div>
            )}
            {customer &&
              (item.status === "AWAITING_PAYMENT" ||
                item.status === "AWAITING_INFORMATION_PAYMENT") && (
              <button className="button primary full" onClick={pay}>
                Mockbetaling uitvoeren <Icon n="lock" />
              </button>
            )}
            {customer && item.status === "CLAIMED" && item.claims?.length ? (
              <div className="claim-list">
                <p className="eyebrow">SPECIALIST VOOR DEZE VRAAG</p>
                <p className="claim-intro">Wij tonen eerst de beste inhoudelijke match. Alleen als er een reëel alternatief is, staat dat eronder.</p>
                {[...item.claims]
                  .sort((left, right) => right.match_score - left.match_score)
                  .slice(0, 3)
                  .map((claim, index) => (
                  <div className={`claim-card${index === 0 ? " recommended-claim" : ""}`} key={claim.id}>
                    <span className="claim-rank">{index === 0 ? "AANBEVOLEN" : `ALTERNATIEF ${index}`}</span>
                    <b>{claim.expert_name}</b>
                    <span>
                      {claim.expert_specialisation} · {claim.expert_rating.toFixed(1)}★ · {claim.match_score}% match
                    </span>
                    <small>{claim.message || "Beschikbaar voor deze casus."}</small>
                    <small className="verification-note"><Icon n="shield" /> Demo-profiel — identiteit, vakbekwaamheid en verzekering moeten vóór productie zijn geverifieerd.</small>
                    {claim.status === "PENDING_CUSTOMER" && (
                      <button className="button secondary full" onClick={() => choose(item.id, claim.id)}>
                        {index === 0 ? "Kies aanbevolen specialist" : "Kies dit alternatief"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            {role === "advisor" &&
              (item.status === "PAID" || item.status === "IN_REVIEW") && (
                <button className="button primary full" onClick={review}>
                  Open reviewomgeving <Icon n="arrow" />
                </button>
              )}
            {customer && item.status === "DELIVERED" && (
              <div className="delivered">
                <Icon n="check" />
                <b>Antwoord beschikbaar</b>
                <span>Het gecontroleerde antwoord staat klaar.</span>
              </div>
            )}
          </div>
          {role === "advisor" && (
            <div className="match-panel">
              <div className="match-score">
                {item.match}
                <small>%</small>
              </div>
              <div>
                <b>Waarom past dit?</b>
                <p>
                  De casus valt binnen loonheffingen en sluit aan op uw voorkeur
                  voor {item.minutes} opdrachten.
                </p>
              </div>
            </div>
          )}
          <div className="next-step-panel">
            <p className="eyebrow">WAT GEBEURT ER NU?</p>
            <strong>{nextStepForCase(item)}</strong>
            <span>De statusgeschiedenis hieronder laat zien wat al is afgerond.</span>
          </div>
          <div className="timeline">
            <p className="eyebrow">STATUSGESCHIEDENIS</p>
            {item.history.map((h, i) => (
              <div className="timeline-item" key={i}>
                <span className={i === 0 ? "dot current" : "dot"} />
                <div>
                  <b>{h.label}</b>
                  <small>{h.date}</small>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Review({
  item,
  back,
  submit,
}: {
  item: CaseItem;
  back: () => void;
  submit: (input: ReviewInput) => void;
}) {
  const [notes, setNotes] = useState("");
  const [finalAnswer, setFinalAnswer] = useState(
    `Kort antwoord\n\nWat dit voor uw onderneming betekent\n\nWat u nu moet doen\n\nDeadline\n\nOnzekerheden en ontbrekende informatie\n\nBronnen\n\nWanneer extra hulp nodig is`,
  );
  const [checks, setChecks] = useState([true, false, false, false]);
  const toggle = (i: number) =>
    setChecks((current) =>
      current.map((value, index) => (index === i ? !value : value)),
    );
  const canSubmit = checks.every(Boolean);
  const fillExample = () => {
    setFinalAnswer(
      `Kort antwoord\nDe conclusie uit het AI-concept is alleen bruikbaar nadat de onderliggende documenten zijn gecontroleerd.\n\nWat dit voor uw onderneming betekent\nEr kan een correctie of aangepaste verwerking nodig zijn; de precieze uitkomst hangt af van de bevestigde feiten.\n\nWat u nu moet doen\n1. Controleer de genoemde documenten.\n2. Leg de ontbrekende gegevens vast.\n3. Pas daarna de aangifte of administratie aan.\n\nDeadline\nHandel vóór de eerstvolgende aangifte- of reactiedatum.\n\nOnzekerheden en ontbrekende informatie\nDe relevante documenten zijn nog niet inhoudelijk geverifieerd.\n\nBronnen\n${item.source}.\n\nWanneer extra hulp nodig is\nLaat aanvullend beoordelen wanneer de documenten afwijken of de Belastingdienst al een standpunt heeft ingenomen.`,
    );
    setNotes(
      "De AI-conclusie is inhoudelijk bruikbaar, maar de loonstroken en jaaropgaven moeten worden gecontroleerd. De onzekerheid en vervolgstap zijn daarom expliciet aan de klant uitgelegd.",
    );
    setChecks([true, true, true, true]);
  };
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">ADVISEUR / REVIEW</p>
          <h1>Maak het antwoord betrouwbaar.</h1>
          <p>
            Vergelijk de platformanalyse met klantinput en leg vast wat u heeft
            gecontroleerd.
          </p>
        </div>
        <button className="text-button" onClick={back}>
          ← Terug naar casus
        </button>
      </div>
      <div className="review-grid">
        <div>
          <div className="example-callout review-example-callout">
            <div>
              <strong>Voorbeeldreview laden</strong>
              <span>Vult een controleerbaar antwoord, toelichting en controlepunten in.</span>
            </div>
            <ExampleButton onClick={fillExample} />
          </div>
          <div className="review-pane">
            <div className="pane-head">
              <span>PLATFORM-ANALYSE</span>
              <em>AI-CONCEPT</em>
            </div>
            <p>{item.aiAnswer}</p>
            <div className="review-choice">
              <button>✓ Correct</button>
              <button>Gedeeltelijk correct</button>
              <button>Onvoldoende onderbouwd</button>
            </div>
          </div>
          {item.externalAi && (
            <div className="review-pane external-pane">
              <div className="pane-head">
                <span>KLANTINPUT</span>
                <em>EXTERN AI-ANTWOORD</em>
              </div>
              <p>{item.anonymizedExternalAi || item.externalAi}</p>
              <small>
                Controleer vooral aannames, bronverwijzingen en ontbrekende
                feiten.
              </small>
            </div>
          )}
          <label className="final-answer">
            <span className="field-heading">
              <span>Definitief gecontroleerd antwoord</span>
              <ExampleButton onClick={fillExample} label="Voorbeeld" />
            </span>
            <textarea
              rows={9}
              value={finalAnswer}
              onChange={(event) => setFinalAnswer(event.target.value)}
            />
          </label>
        </div>
        <aside className="review-side">
          <div className="summary-panel">
            <p className="eyebrow">CONTROLEPUNTEN</p>
            {[
              "Feitenrelaas gecontroleerd",
              "Bron en versie geverifieerd",
              "Ontbrekende informatie benoemd",
              "Onzekerheid duidelijk gemaakt",
            ].map((x, i) => (
              <label className="check-row" key={x}>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => toggle(i)}
                />
                {x}
              </label>
            ))}
            <label>
              <span className="field-heading">
                <span>Toelichting voor klant</span>
                <ExampleButton onClick={() => setNotes("De belangrijkste feiten en bronnen zijn gecontroleerd. Waar informatie ontbreekt, is dat expliciet benoemd.")} label="Voorbeeld" />
              </span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Leg kort uit welke keuzes u heeft gemaakt."
              />
            </label>
            <button
              className="button primary full"
              disabled={!canSubmit}
              onClick={() =>
                submit({
                  final_answer: finalAnswer,
                  notes,
                  items: [
                    {
                      dimension: "AI-conclusie",
                      verdict: checks[0] ? "CORRECT" : "NEEDS_REVIEW",
                      comment: "Controlepunten door adviseur vastgelegd.",
                    },
                  ],
                })
              }
            >
              Definitief antwoord indienen <Icon n="check" />
            </button>
            {!canSubmit && (
              <small className="review-blocked">
                Vink alle vier controlepunten aan voordat u het antwoord
                indient.
              </small>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Admin({
  cases,
  open,
  publish,
}: {
  cases: CaseItem[];
  open: (id: string) => void;
  publish: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alle statussen");
  const visibleCases = [...cases]
    .filter((item) => statusFilter === "Alle statussen" || item.status === statusFilter)
    .filter((item) => {
      if (!search.trim()) return true;
      return `${item.id} ${item.title} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase());
    })
    .sort((a, b) => Number(b.status === "PENDING_REVIEW") - Number(a.status === "PENDING_REVIEW"));
  const auditItems = cases
    .flatMap((item) => item.history.slice(0, 2).map((event) => ({ ...event, id: item.id })))
    .slice(0, 6);
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">BEHEERDER / CONTROLE</p>
          <h1>Controle vóór publicatie.</h1>
          <p>
            Bekijk anonimisering, status en auditsporen voordat een casus voor
            adviseurs zichtbaar wordt.
          </p>
        </div>
        <div className="admin-stat">
          <strong>
            {cases.filter((c) => c.status === "PENDING_REVIEW").length}
          </strong>
          <span>wachten op controle</span>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="board-search">
          <Icon n="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op casus, titel of categorie" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter casussen op status">
          <option>Alle statussen</option>
          <option>PENDING_REVIEW</option>
          <option>PUBLISHED</option>
          <option>CLAIMED</option>
          <option>IN_REVIEW</option>
          <option>DELIVERED</option>
        </select>
        <span className="admin-result-count">{visibleCases.length} van {cases.length} casussen</span>
      </div>
      <div className="admin-grid">
        <div className="admin-list">
          {visibleCases.map((item) => (
            <div className="admin-row" key={item.id}>
              <div>
                <span className="case-code">{item.id}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.category} · status {item.status}
                </small>
              </div>
              <div className="admin-actions">
                <button className="text-button" onClick={() => open(item.id)}>
                  Bekijk
                </button>
                {item.status === "PENDING_REVIEW" && (
                  <button
                    className="button primary compact"
                    onClick={() => publish(item.id)}
                  >
                    Publiceren
                  </button>
                )}
              </div>
            </div>
          ))}
          {visibleCases.length === 0 && <div className="empty-state"><strong>Geen casussen gevonden</strong><span>Pas de zoekterm of statusfilter aan.</span></div>}
        </div>
        <div className="admin-note">
          <Icon n="shield" />
          <h3>Anonimiseringsvoorbeeld</h3>
          <div className="redacted">
            <span>Origineel</span>
            <p>De heer [PERSOON] werkt bij [WERKGEVER] op [ADRES].</p>
          </div>
          <div className="redacted safe">
            <span>Voor adviseurs</span>
            <p>
              Een werknemer werkt bij een werkgever op een niet nader genoemd
              adres.
            </p>
          </div>
          <small>
            Originele input blijft alleen zichtbaar voor klant en beheerder. De
            demo vervangt herkenbare patronen lokaal.
          </small>
        </div>
      </div>
      <div className="audit">
        <p className="eyebrow">AUDITLOG</p>
        {auditItems.length === 0 && <small>Nog geen statuswijzigingen beschikbaar.</small>}
        {auditItems.map((event, index) => (
          <div key={`${event.id}-${event.label}-${index}`}>
            <span>{event.date}</span>
            <b>Case {event.id}</b>
            <span>{event.label}</span>
            <small>{event.label.toLowerCase().includes("ai") ? "mock adapter · geen externe provider" : "statuswijziging · demo auditspoor"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
