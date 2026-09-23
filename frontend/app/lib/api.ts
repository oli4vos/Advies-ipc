export type ApiFact = {
  id: string;
  label: string;
  value: string;
  source_type: string;
  confidence: number;
  customer_confirmation: string;
};

export type ApiIssue = {
  id: string;
  issue_type: string;
  severity: string;
  description: string;
  resolution_status: string;
};

export type ApiSource = {
  title: string;
  source_type: string;
  citation: string;
  version_or_date: string;
  official: boolean;
  demo_only: boolean;
};

export type ApiHistory = {
  from_status: string | null;
  to_status: string;
  actor_type: string;
  reason: string;
  created_at: string;
};

export type ApiClaim = {
  id: string;
  expert_id: string;
  expert_name: string;
  expert_specialisation: string;
  expert_rating: number;
  status: string;
  match_score: number;
  message: string;
  created_at: string;
  selected_at: string | null;
};

export type ApiPayment = {
  id: string;
  amount_cents: number;
  status: string;
  provider: string;
  payment_type: string;
  information_request_id: string | null;
  created_at: string;
  paid_at: string | null;
};

export type ApiReviewItem = {
  id: string;
  ai_claim_id: string | null;
  position: number;
  dimension: string;
  verdict: string;
  comment: string;
};

export type ApiReview = {
  id: string;
  expert_id: string;
  expert_name: string;
  final_answer: string;
  notes: string;
  status: string;
  created_at: string;
  submitted_at: string;
  items: ApiReviewItem[];
};

export type ApiInformationRequest = {
  id: string;
  expert_id: string;
  expert_name: string;
  status: string;
  question: string;
  rationale: string;
  required_for_assessment: boolean;
  evaluation_origin: string;
  evaluation_confidence: number;
  proposed_fee_delta_cents: number;
  approved_fee_delta_cents: number;
  platform_decision_note: string;
  platform_decided_at: string | null;
  customer_answer: string;
  created_at: string;
  evaluated_at: string | null;
  answered_at: string | null;
  accepted_at: string | null;
};

export type ApiCase = {
  id: string;
  public_code: string;
  title: string;
  category: string;
  specialization_tags: string[];
  client_type: string;
  tax_year: string;
  urgency: string;
  complexity: string;
  estimated_minutes_min: number;
  estimated_minutes_max: number;
  offered_fee_cents: number;
  deadline_label: string;
  status: string;
  summary: string;
  concrete_question: string;
  anonymized_description: string;
  original_description: string | null;
  external_ai_answer: string | null;
  ai_answer: string;
  facts: ApiFact[];
  issues: ApiIssue[];
  sources: ApiSource[];
  history: ApiHistory[];
  claims: ApiClaim[];
  payment: ApiPayment | null;
  reviews: ApiReview[];
  information_requests: ApiInformationRequest[];
};

export type CaseInput = {
  title: string;
  description: string;
  question: string;
  category: string;
  tax_year: string;
  client_type: string;
  urgency: string;
  external_ai_answer: string;
};

export type DemoRole = "customer" | "advisor" | "admin";

let currentDemoRole: DemoRole = "customer";

export function setDemoRole(role: DemoRole) {
  currentDemoRole = role;
}

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window === "undefined") return null;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "/api/v1"
    : null;
}

export function hasLocalApi() {
  return apiBaseUrl() !== null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error("De lokale Python-API is niet geconfigureerd.");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer demo-${currentDemoRole}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || `API-fout ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function createCase(input: CaseInput) {
  return request<ApiCase>("/cases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCase(caseId: string) {
  return request<ApiCase>(`/cases/${caseId}`);
}

export async function listCaseDetails() {
  const cases = await request<Array<{ id: string }>>("/cases");
  return Promise.all(cases.map((item) => getCase(item.id)));
}

export async function getJobboardCase(caseId: string) {
  return request<ApiCase>(`/jobboard/${caseId}`);
}

export async function listJobboardDetails() {
  const cases = await request<Array<{ id: string }>>("/jobboard");
  return Promise.all(cases.map((item) => getJobboardCase(item.id)));
}

export async function confirmCaseStructure(caseId: string) {
  return request<ApiCase>(`/cases/${caseId}/confirm-structure`, {
    method: "POST",
  });
}

export async function publishCase(caseId: string) {
  return request<ApiCase>(`/admin/cases/${caseId}/publish`, { method: "POST" });
}

export async function claimCase(caseId: string, message = "") {
  return request<ApiClaim>(`/cases/${caseId}/claims`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function selectClaim(caseId: string, claimId: string) {
  return request<ApiCase>(`/cases/${caseId}/claims/${claimId}/select`, {
    method: "POST",
  });
}

export async function payCase(caseId: string) {
  return request<ApiCase>(`/cases/${caseId}/pay`, { method: "POST" });
}

export async function requestInformation(
  caseId: string,
  question: string,
  estimated_extra_minutes = 15,
) {
  return request<ApiInformationRequest>(`/cases/${caseId}/information-requests`, {
    method: "POST",
    body: JSON.stringify({ question, estimated_extra_minutes }),
  });
}

export async function answerInformation(
  caseId: string,
  requestId: string,
  answer: string,
) {
  return request<ApiCase>(
    `/cases/${caseId}/information-requests/${requestId}/answer`,
    { method: "POST", body: JSON.stringify({ answer }) },
  );
}

export async function acceptInformationFee(caseId: string, requestId: string) {
  return request<ApiCase>(
    `/cases/${caseId}/information-requests/${requestId}/accept-fee`,
    { method: "POST" },
  );
}

export async function decideInformationRequest(
  caseId: string,
  requestId: string,
  approve: boolean,
  approvedFeeDeltaCents = 0,
) {
  return request<ApiCase>(
    `/admin/cases/${caseId}/information-requests/${requestId}/decision`,
    {
      method: "POST",
      body: JSON.stringify({
        approve,
        approved_fee_delta_cents: approvedFeeDeltaCents,
      }),
    },
  );
}

export type ReviewInput = {
  final_answer: string;
  notes: string;
  items: Array<{
    ai_claim_id?: string | null;
    dimension: string;
    verdict: string;
    comment: string;
  }>;
};

export async function submitReview(caseId: string, input: ReviewInput) {
  return request<ApiCase>(`/cases/${caseId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
