import { randomUUID } from "crypto";
import {
  ConversationContextPayload,
  ConversationMessageSummary,
  ConversationChartSnapshot,
  ChartResultContent,
} from "@/types";
import {
  mapChartToSnapshot,
  truncateHistory,
  CONVERSATION_HISTORY_LIMIT,
} from "@/lib/conversation-context";

interface ConversationMemoryEntry extends ConversationContextPayload {
  updatedAt: Date;
}

const conversationMemory = new Map<string, ConversationMemoryEntry>();
const conversationDataMemory = new Map<string, UnifiedDataSnapshot>();

interface UnifiedDataSnapshot {
  data: any[];
  schema: Record<string, any>;
  metadata?: Record<string, any>;
  storedAt: Date;
}

export function resolveConversationContext(
  incoming?: ConversationContextPayload
): ConversationContextPayload | undefined {
  if (!incoming?.sessionId) {
    return incoming;
  }

  const stored = conversationMemory.get(incoming.sessionId);
  if (!stored) {
    return incoming;
  }

  const mergedHistory = mergeHistory(stored.history, incoming.history ?? []);
  const mergedLastChart = incoming.lastChart ?? stored.lastChart;

  const merged: ConversationContextPayload = {
    sessionId: incoming.sessionId,
    history: truncateHistory(mergedHistory),
    lastChart: mergedLastChart,
    metadata: computeMetadata(truncateHistory(mergedHistory), mergedLastChart),
  };

  return merged;
}

export function persistConversationResult(params: {
  sessionId: string;
  prompt: string;
  conversation?: ConversationContextPayload;
  chartResult: ChartResultContent;
}): ConversationContextPayload {
  const { sessionId, prompt, conversation, chartResult } = params;
  const baseHistory = conversation?.history ?? [];
  const stored = conversationMemory.get(sessionId);
  const mergedHistory = mergeHistory(stored?.history ?? [], baseHistory);

  const historyWithUser = ensureLatestUserMessage(mergedHistory, prompt, conversation);
  const assistantMessage = createAssistantChartMessage(chartResult);
  const fullHistory = [...historyWithUser, assistantMessage];
  const truncatedHistory = truncateHistory(fullHistory);

  const payload: ConversationContextPayload = {
    sessionId,
    history: truncatedHistory,
    lastChart: assistantMessage.chart,
    metadata: computeMetadata(truncatedHistory, assistantMessage.chart),
  };

  conversationMemory.set(sessionId, { ...payload, updatedAt: new Date() });
  return payload;
}

export function getConversationMemory(sessionId: string): ConversationContextPayload | undefined {
  const stored = conversationMemory.get(sessionId);
  if (!stored) return undefined;
  const history = truncateHistory(stored.history);
  return {
    sessionId,
    history,
    lastChart: stored.lastChart,
    metadata: computeMetadata(history, stored.lastChart),
  };
}

export function ensureSessionId(
  conversation: ConversationContextPayload | undefined,
  fallback?: string
): string {
  return conversation?.sessionId || fallback || randomUUID();
}

function mergeHistory(
  base: ConversationMessageSummary[],
  incoming: ConversationMessageSummary[]
): ConversationMessageSummary[] {
  const byId = new Map<string, ConversationMessageSummary>();

  base.forEach(message => {
    const id = message?.id ?? randomUUID();
    if (!byId.has(id)) {
      byId.set(id, { ...message, id });
    }
  });

  incoming.forEach(message => {
    const id = message?.id ?? randomUUID();
    byId.set(id, { ...message, id });
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });
}

function ensureLatestUserMessage(
  history: ConversationMessageSummary[],
  prompt: string,
  conversation?: ConversationContextPayload
): ConversationMessageSummary[] {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return history;
  }

  const hasMatchingUserMessage = history.some(message => {
    if (message.role !== "user" || message.kind !== "user_text") {
      return false;
    }
    if (!message.text) {
      return false;
    }
    return message.text.trim() === trimmedPrompt;
  });

  if (hasMatchingUserMessage) {
    return history;
  }

  const attachments = conversation?.history?.filter(msg => msg.role === "user").at(-1)?.attachments;

  const newMessage: ConversationMessageSummary = {
    id: randomUUID(),
    role: "user",
    kind: "user_text",
    text: trimmedPrompt,
    attachments,
    timestamp: new Date().toISOString(),
  };

  return [...history, newMessage];
}

function createAssistantChartMessage(chart: ChartResultContent): ConversationMessageSummary {
  const snapshot: ConversationChartSnapshot = mapChartToSnapshot(chart);

  return {
    id: randomUUID(),
    role: "assistant",
    kind: "assistant_chart",
    chart: snapshot,
    timestamp: new Date().toISOString(),
  };
}

function computeMetadata(
  history: ConversationMessageSummary[],
  lastChart?: ConversationChartSnapshot
): ConversationContextPayload["metadata"] {
  const totalMessages = history.length;
  const chartMessages = history.filter(message => message.kind === "assistant_chart").length;
  const userMessages = history.filter(message => message.role === "user").length;

  return {
    totalMessages,
    chartMessages,
    userMessages,
  };
}

export function summarizeConversationMemory() {
  return {
    size: conversationMemory.size,
    sessions: Array.from(conversationMemory.entries()).map(([sessionId, value]) => ({
      sessionId,
      historyLength: value.history.length,
      lastUpdated: value.updatedAt,
    })),
    historyLimit: CONVERSATION_HISTORY_LIMIT,
    dataSnapshots: conversationDataMemory.size,
  };
}

export function storeUnifiedDataSnapshot(
  sessionId: string,
  unifiedData: {
    data: any[];
    schema: Record<string, any>;
    metadata?: Record<string, any>;
  }
) {
  conversationDataMemory.set(sessionId, {
    data: deepClone(unifiedData.data),
    schema: deepClone(unifiedData.schema ?? {}),
    metadata: unifiedData.metadata ? deepClone(unifiedData.metadata) : undefined,
    storedAt: new Date(),
  });
}

export function getUnifiedDataSnapshot(sessionId: string): UnifiedDataSnapshot | undefined {
  const snapshot = conversationDataMemory.get(sessionId);
  if (!snapshot) return undefined;
  return {
    data: deepClone(snapshot.data),
    schema: deepClone(snapshot.schema),
    metadata: snapshot.metadata ? deepClone(snapshot.metadata) : undefined,
    storedAt: snapshot.storedAt,
  };
}

function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}
