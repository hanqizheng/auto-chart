/**
 * 消息系统相关常量
 * 用于聊天消息类型和附件处理
 */

/**
 * 消息类型
 */
export const MESSAGE_TYPES = {
  USER: "user",
  PROCESSING: "processing",
  CHART_RESULT: "chart_result",
} as const;

/**
 * 用户消息子类型
 */
export const USER_MESSAGE_SUBTYPES = {
  TEXT: "text",
  FILE_UPLOAD: "file_upload",
  MIXED: "mixed", // 文本 + 文件
} as const;

/**
 * 附件类型
 */
export const ATTACHMENT_TYPES = {
  EXCEL: "excel",
  CSV: "csv",
  JSON: "json",
  IMAGE: "image",
} as const;

/**
 * 支持的文件扩展名（按类型分组）
 */
export const SUPPORTED_FILE_EXTENSIONS_BY_TYPE = {
  [ATTACHMENT_TYPES.EXCEL]: [".xlsx", ".xls"],
  [ATTACHMENT_TYPES.CSV]: [".csv"],
  [ATTACHMENT_TYPES.JSON]: [".json"],
  [ATTACHMENT_TYPES.IMAGE]: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
} as const;

/**
 * 文件大小限制 (字节)
 */
export const FILE_SIZE_LIMITS = {
  [ATTACHMENT_TYPES.EXCEL]: 10 * 1024 * 1024, // 10MB
  [ATTACHMENT_TYPES.CSV]: 5 * 1024 * 1024, // 5MB
  [ATTACHMENT_TYPES.JSON]: 2 * 1024 * 1024, // 2MB
  [ATTACHMENT_TYPES.IMAGE]: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * 消息状态
 */
export const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  PROCESSING: "processing",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

/**
 * 消息优先级
 */
export const MESSAGE_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

/**
 * 消息类型配置 - UI 显示信息
 */
export const MESSAGE_TYPE_CONFIG = {
  [MESSAGE_TYPES.USER]: {
    icon: "👤",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    alignment: "right",
  },
  [MESSAGE_TYPES.PROCESSING]: {
    icon: "⚙️",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    alignment: "left",
  },
  [MESSAGE_TYPES.CHART_RESULT]: {
    icon: "📊",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    alignment: "left",
  },
} as const;

/**
 * 附件类型配置 - UI 显示信息
 */
export const ATTACHMENT_TYPE_CONFIG = {
  [ATTACHMENT_TYPES.EXCEL]: {
    icon: "📊",
    color: "text-green-600",
    bgColor: "bg-green-100",
    name: "Excel 文件",
  },
  [ATTACHMENT_TYPES.CSV]: {
    icon: "📄",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    name: "CSV 文件",
  },
  [ATTACHMENT_TYPES.JSON]: {
    icon: "🔧",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    name: "JSON 文件",
  },
  [ATTACHMENT_TYPES.IMAGE]: {
    icon: "🖼️",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    name: "图片文件",
  },
} as const;

/**
 * 错误类型
 */
export const MESSAGE_ERROR_TYPES = {
  FILE_TOO_LARGE: "file_too_large",
  UNSUPPORTED_FORMAT: "unsupported_format",
  PARSING_ERROR: "parsing_error",
  NETWORK_ERROR: "network_error",
  PROCESSING_ERROR: "processing_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

/**
 * 错误消息配置
 */
export const ERROR_MESSAGE_CONFIG = {
  [MESSAGE_ERROR_TYPES.FILE_TOO_LARGE]: "文件大小超出限制",
  [MESSAGE_ERROR_TYPES.UNSUPPORTED_FORMAT]: "不支持的文件格式",
  [MESSAGE_ERROR_TYPES.PARSING_ERROR]: "文件解析失败",
  [MESSAGE_ERROR_TYPES.NETWORK_ERROR]: "网络连接错误",
  [MESSAGE_ERROR_TYPES.PROCESSING_ERROR]: "数据处理失败",
  [MESSAGE_ERROR_TYPES.UNKNOWN_ERROR]: "未知错误",
} as const;
