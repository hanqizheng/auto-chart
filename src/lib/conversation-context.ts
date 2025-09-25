import {
  SingleChatSession,
  ChatMessage,
  ChartResultContent,
  FileAttachment,
  ConversationAttachmentSummary,
  ConversationChartSnapshot,
  ConversationContextPayload,
  ConversationMessageSummary,
  PendingUserMessageInput,
} from "@/types";
import { MESSAGE_TYPES } from "@/constants/message";

export const CONVERSATION_HISTORY_LIMIT = 20;
export const CONVERSATION_DATA_ROW_LIMIT = 150;

interface BuildContextOptions {
  pendingUserMessage?: PendingUserMessageInput;
}

export function buildConversationContext(
  session: SingleChatSession,
  options: BuildContextOptions = {}
): ConversationContextPayload {
  const mappedHistory = session.messages
    .map(mapMessageToSummary)
    .filter((msg): msg is ConversationMessageSummary => msg !== null);

  if (options.pendingUserMessage) {
    const pendingAttachments = options.pendingUserMessage.attachments?.map(att => ({
      ...att,
      uploadedAt: att.uploadedAt || new Date().toISOString(),
    }));

    mappedHistory.push({
      id: options.pendingUserMessage.id,
      role: "user",
      kind: "user_text",
      text: options.pendingUserMessage.text,
      attachments: pendingAttachments,
      timestamp: (options.pendingUserMessage.createdAt || new Date()).toISOString(),
    });
  }

  const history = truncateHistory(mappedHistory);
  const metadata = {
    totalMessages: history.length,
    chartMessages: history.filter(msg => msg.kind === "assistant_chart").length,
    userMessages: history.filter(msg => msg.role === "user").length,
  };

  const lastChartContent = findLastChartContent(session);
  const lastChart = lastChartContent ? mapChartToSnapshot(lastChartContent) : undefined;

  return {
    sessionId: session.id,
    history,
    lastChart,
    metadata,
  };
}

function mapMessageToSummary(message: ChatMessage): ConversationMessageSummary | null {
  const timestamp = toIsoString(message.timestamp);

  switch (message.type) {
    case MESSAGE_TYPES.USER: {
      const attachments = message.content.attachments?.map(mapAttachmentToSummary);
      return {
        id: message.id,
        role: "user",
        kind: "user_text",
        text: message.content.text,
        attachments,
        timestamp,
      };
    }
    case MESSAGE_TYPES.CHART_RESULT: {
      return {
        id: message.id,
        role: "assistant",
        kind: "assistant_chart",
        chart: mapChartToSnapshot(message.content),
        timestamp,
      };
    }
    case MESSAGE_TYPES.PROCESSING: {
      return {
        id: message.id,
        role: "assistant",
        kind: "assistant_processing",
        text: message.content.title,
        timestamp,
      };
    }
    default:
      return null;
  }
}

function mapAttachmentToSummary(attachment: FileAttachment): ConversationAttachmentSummary {
  return {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    uploadedAt: toIsoString(attachment.uploadedAt),
  };
}

export function mapChartToSnapshot(chart: ChartResultContent): ConversationChartSnapshot {
  return {
    chartType: chart.chartType,
    title: chart.title,
    description: chart.description,
    data: sanitizeChartData(chart.chartData),
    config: sanitizeConfig(chart.chartConfig),
    theme: chart.theme,
    imageInfo: chart.imageInfo
      ? {
          filename: chart.imageInfo.filename,
          localBlobUrl: chart.imageInfo.localBlobUrl,
        }
      : undefined,
  };
}

export function sanitizeChartData(data: any[]): any[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.slice(0, CONVERSATION_DATA_ROW_LIMIT).map(row => sanitizeRow(row));
}

function sanitizeRow(row: any): Record<string, any> {
  if (!row || typeof row !== "object") {
    return row;
  }

  return Object.entries(row).reduce<Record<string, any>>((acc, [key, value]) => {
    if (value instanceof Date || typeof value === "string") {
      const iso = toIsoOrNull(value);
      acc[key] = iso ?? value;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function sanitizeConfig(config: Record<string, any>): Record<string, any> {
  if (!config || typeof config !== "object") {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    console.warn(
      "[ConversationContext] Failed to clone chart config, returning shallow copy",
      error
    );
    return { ...config };
  }
}

function findLastChartContent(session: SingleChatSession): ChartResultContent | undefined {
  for (let i = session.messages.length - 1; i >= 0; i -= 1) {
    const message = session.messages[i];
    if (message.type === MESSAGE_TYPES.CHART_RESULT) {
      return message.content;
    }
  }

  return session.currentChart;
}

export function truncateHistory(
  history: ConversationMessageSummary[]
): ConversationMessageSummary[] {
  return history.slice(-CONVERSATION_HISTORY_LIMIT);
}

function toIsoString(value: Date | string | undefined): string {
  const iso = toIsoOrNull(value);
  return iso ?? new Date().toISOString();
}

function toIsoOrNull(value: Date | string | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}
