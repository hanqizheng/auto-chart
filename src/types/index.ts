// Types barrel export file
// 统一导出所有类型定义

// 图表相关类型
export type {
  ChartType,
  SimpleChartType,
  ChartCategory,
  ColumnType,
  AxisType,
  ColorTheme,
  LegendPosition,
  ChartGenerationStatus,
  ChartIndicatorType,
} from "./chart";

// 数据处理相关类型
export type {
  UploadStatus,
  QualityIssueType,
  SeverityLevel,
  DataPatternType,
  CleaningAction,
  DataErrorType,
} from "./data";

// AI Agent 相关类型
export type {
  AgentStatus,
  AgentToolType,
  AIFramework,
  AgentCapability,
  ToolExecutionStatus,
  InteractionMode,
  AgentErrorType,
  AIChatType,
} from "./agent";

// 消息系统相关类型
export type {
  MessageType,
  AttachmentType,
  MessageStatus,
  UserMessageSubtype,
  ChatMessage,
  UserMessage,
  ProcessingMessage,
  ChartResultMessage,
  UserMessageContent,
  ProcessingMessageContent,
  ChartResultContent,
  MessageContent,
  FileAttachment,
  SingleChatSession,
  MessageListState,
  MessageActions,
  MessageHelpers,
  ErrorInfo,
  MessageMetadata,
} from "./message";

// 处理步骤相关类型
export type {
  ProcessingStepType,
  StepStatus,
  ProcessingStage,
  ProcessingStep,
  ProcessingFlow,
  ProcessingStepData,
  ThinkingData,
  FileParsingData,
  DataAnalysisData,
  ChartTypeDetectionData,
  ChartGenerationData,
  ImageExportData,
  ProgressCallback,
  StepBuilder,
  StepUpdateParams,
  ProcessingFlowActions,
} from "./processing";

// 存储系统相关类型
export type {
  LocalImageInfo,
  ExportFormat,
  ImageMetadata,
  StorageConfig,
  StorageService,
} from "./storage";

// 通用类型
export type { Size, State, MobileTabValue } from "./common";
