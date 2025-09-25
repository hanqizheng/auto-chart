import { ChartType } from "./chart";
import { ChartTheme } from "./chart-theme";
import { AttachmentType } from "./message";

export interface ConversationAttachmentSummary {
  id: string;
  name: string;
  type: AttachmentType | string;
  size: number;
  uploadedAt?: string;
}

export interface ConversationChartSnapshot {
  chartType: ChartType;
  title: string;
  description?: string;
  data: any[];
  config: Record<string, any>;
  theme?: ChartTheme;
  imageInfo?: {
    filename?: string;
    localBlobUrl?: string;
  };
}

export type ConversationMessageKind =
  | "user_text"
  | "assistant_chart"
  | "assistant_processing"
  | "assistant_text";

export interface ConversationMessageSummary {
  id: string;
  role: "user" | "assistant";
  kind: ConversationMessageKind;
  text?: string;
  chart?: ConversationChartSnapshot;
  attachments?: ConversationAttachmentSummary[];
  timestamp?: string;
}

export interface ConversationContextMetadata {
  totalMessages: number;
  chartMessages: number;
  userMessages: number;
}

export interface ConversationContextPayload {
  sessionId: string;
  history: ConversationMessageSummary[];
  lastChart?: ConversationChartSnapshot;
  metadata: ConversationContextMetadata;
}

export interface PendingUserMessageInput {
  id: string;
  text: string;
  attachments?: ConversationAttachmentSummary[];
  createdAt?: Date;
}
