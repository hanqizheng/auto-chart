/**
 * 消息系统类型定义
 * 基于新的常量系统，支持简化的单次对话流程
 */

import { ChartType } from "./chart";
import {
  MESSAGE_TYPES,
  ATTACHMENT_TYPES,
  MESSAGE_STATUS,
  USER_MESSAGE_SUBTYPES,
} from "@/constants/message";
import { ProcessingFlow } from "./processing";
import { LocalImageInfo } from "./storage";

/**
 * 从常量派生的类型
 */
export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
export type AttachmentType = (typeof ATTACHMENT_TYPES)[keyof typeof ATTACHMENT_TYPES];
export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
export type UserMessageSubtype = (typeof USER_MESSAGE_SUBTYPES)[keyof typeof USER_MESSAGE_SUBTYPES];

/**
 * 文件附件接口
 */
export interface FileAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  file: File;
  uploadedAt: Date;
}

/**
 * 用户消息内容
 */
export interface UserMessageContent {
  text: string;
  subtype: UserMessageSubtype;
  attachments?: FileAttachment[];
}

/**
 * 处理消息内容
 */
export interface ProcessingMessageContent {
  flow: ProcessingFlow;
  title: string;
  isExpanded: boolean;
}

/**
 * 图表结果内容
 */
export interface ChartResultContent {
  chartData: any[];
  chartConfig: Record<string, any>;
  chartType: ChartType;
  title: string;
  description?: string;
  imageInfo: LocalImageInfo;
}

/**
 * 消息内容联合类型
 */
export type MessageContent = UserMessageContent | ProcessingMessageContent | ChartResultContent;

/**
 * 基础消息接口
 */
export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: Date;
  status: MessageStatus;
}

/**
 * 用户消息
 */
export interface UserMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.USER;
  content: UserMessageContent;
}

/**
 * 处理消息
 */
export interface ProcessingMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.PROCESSING;
  content: ProcessingMessageContent;
}

/**
 * 图表结果消息
 */
export interface ChartResultMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.CHART_RESULT;
  content: ChartResultContent;
}

/**
 * 联合消息类型
 */
export type ChatMessage = UserMessage | ProcessingMessage | ChartResultMessage;

/**
 * 单次聊天会话 (无数据库，内存存储)
 */
export interface SingleChatSession {
  id: string;
  messages: ChatMessage[];
  currentChart?: ChartResultContent;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * 消息列表状态
 */
export interface MessageListState {
  messages: ChatMessage[];
  isLoading: boolean;
  hasError: boolean;
  error?: string;
}

/**
 * 消息操作接口
 */
export interface MessageActions {
  addUserMessage: (text: string, attachments?: FileAttachment[]) => string;
  addProcessingMessage: (title: string) => string;
  addChartResultMessage: (content: ChartResultContent) => string;
  updateProcessingMessage: (messageId: string, updates: Partial<ProcessingMessageContent>) => void;
  toggleProcessingExpanded: (messageId: string) => void;
  clearMessages: () => void;
}

/**
 * 消息工具函数接口
 */
export interface MessageHelpers {
  generateMessageId: () => string;
  formatTimestamp: (timestamp: Date) => string;
  validateFileAttachment: (file: File) => { valid: boolean; error?: string };
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  processingDuration?: number;
  exportable: boolean;
  replayable: boolean;
  version: string;
}
