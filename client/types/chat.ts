export type ChatRole = "user" | "model";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatHistoryItem = {
  id: number;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ProjectContextPayload = Record<string, unknown> | null;

export type ProjectContextEvent = CustomEvent<ProjectContextPayload>;
