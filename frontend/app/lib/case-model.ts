import type { ApiCase } from "./api";

export type Role = "customer" | "advisor" | "admin";

export type Status =
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

export type UploadedAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type CaseItem = {
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

export type IntakeForm = {
  title: string;
  description: string;
  question: string;
  category: string;
  year: string;
  clientType: string;
  externalAi: string;
};
