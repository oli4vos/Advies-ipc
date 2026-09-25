import type { ApiCase } from "./api";
import type { CaseItem, Status } from "./case-model";

export function apiCaseToItem(item: ApiCase): CaseItem {
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
