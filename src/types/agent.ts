// AI Agent 相关类型定义

import {
  AGENT_STATUS,
  AGENT_TOOL_TYPES,
  AI_FRAMEWORKS,
  AGENT_CAPABILITIES,
  TOOL_EXECUTION_STATUS,
  INTERACTION_MODES,
  AGENT_ERROR_TYPES,
  AI_CHAT_TYPE,
} from "@/constants/agent";

export type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export type AgentToolType = (typeof AGENT_TOOL_TYPES)[keyof typeof AGENT_TOOL_TYPES];

export type AIFramework = (typeof AI_FRAMEWORKS)[keyof typeof AI_FRAMEWORKS];

export type AgentCapability = (typeof AGENT_CAPABILITIES)[keyof typeof AGENT_CAPABILITIES];

export type ToolExecutionStatus =
  (typeof TOOL_EXECUTION_STATUS)[keyof typeof TOOL_EXECUTION_STATUS];

export type InteractionMode = (typeof INTERACTION_MODES)[keyof typeof INTERACTION_MODES];

export type AgentErrorType = (typeof AGENT_ERROR_TYPES)[keyof typeof AGENT_ERROR_TYPES];

export type AIChatType = (typeof AI_CHAT_TYPE)[keyof typeof AI_CHAT_TYPE];
