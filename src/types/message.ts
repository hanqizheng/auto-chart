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
import { ChartTheme } from "./chart-theme";
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
 * 可序列化的文件附件（用于会话存储）
 */
export interface SerializableFileAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  uploadedAt: Date;
  // 存储策略
  storageType: 'base64' | 'indexeddb' | 'demo_static';
  // Base64数据（小文件）或存储引用（大文件）
  dataUrl?: string;
  storageKey?: string;
  staticPath?: string;
  // 文件元数据
  metadata?: Record<string, any>;
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
  theme?: ChartTheme;
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
 * 自动触发配置
 */
export interface AutoTriggerConfig {
  enabled: boolean;
  type: 'ai_processing';
  triggerMessage: string; // 触发消息ID
  expectedFlow: string[]; // 预期处理步骤
}

/**
 * Demo重放配置
 */
export interface DemoReplayConfig {
  enabled: boolean;
  mode: 'step_by_step' | 'instant';
  stepDelay: number; // 步骤间延迟（毫秒）
  predefinedSteps: DemoReplayStep[];
}

/**
 * Demo重放步骤
 */
export interface DemoReplayStep {
  type: 'add_processing_message' | 'update_processing_step' | 'add_chart_result';
  delay: number;
  data: any;
}

/**
 * 会话存储依赖信息
 */
export interface SessionStorageInfo {
  totalFiles: number;
  totalCharts: number;
  storageTypes: string[];
  indexeddbKeys: string[];
}

/**
 * 单次聊天会话 (无数据库，内存存储)
 */
export interface SingleChatSession {
  id: string;
  title?: string; // 会话标题（AI自动生成或用户设置）
  messages: ChatMessage[];
  currentChart?: ChartResultContent;
  createdAt: Date;
  lastActivity: Date;
  
  // 会话结构化字段
  version: string; // 数据版本，用于后续升级
  source?: 'homepage' | 'dashboard' | 'demo' | 'shared'; // 会话来源
  
  // 自动触发配置（用于首页跳转场景）
  _autoTrigger?: AutoTriggerConfig;
  
  // Demo重放配置（用于Demo演示场景）
  _demoReplay?: DemoReplayConfig;
  
  // 存储依赖信息
  _storage?: SessionStorageInfo;
  
  // 标记是否正在等待处理（首页跳转时）
  _pendingProcessing?: boolean;

  // 安全验证信息（用于自动触发时复用验证码）
  _security?: {
    turnstileToken?: string | null;
    issuedAt?: string;
  };
}

/**
 * 可序列化的会话（用于导出/导入）
 */
export interface SerializableChatSession extends Omit<SingleChatSession, 'messages'> {
  messages: SerializableChatMessage[];
}

/**
 * 可序列化的消息（替换File对象）
 */
export type SerializableChatMessage = 
  | (Omit<UserMessage, 'content'> & {
      content: Omit<UserMessageContent, 'attachments'> & {
        attachments?: SerializableFileAttachment[];
      };
    })
  | ProcessingMessage
  | ChartResultMessage;

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
