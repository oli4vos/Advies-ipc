export type ChatMessageRecord = {
  id: string;
  role: "user" | "ai" | "expert";
  content: string;
  timestamp: Date;
};
