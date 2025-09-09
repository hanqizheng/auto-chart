// 统一导出所有常量
export * from "./chart";
export * from "./data";
export * from "./agent";
export * from "./processing";
export * from "./message";

// 应用全局常量
export const APP_CONFIG = {
  NAME: "Auto Chart Generator",
  VERSION: "0.1.0",
  DESCRIPTION: "AI-powered chart generation from Excel data",
  AUTHOR: "Auto Chart Team",
} as const;

// 环境配置
export const ENV = {
  DEV: "development",
  PROD: "production",
  TEST: "test",
} as const;

// API 配置
export const API_ENDPOINTS = {
  CHART_GENERATE: "/api/chart/generate",
  DATA_ANALYZE: "/api/data/analyze",
  FILE_UPLOAD: "/api/file/upload",
  AGENT_EXECUTE: "/api/agent/execute",
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  USER_PREFERENCES: "auto_chart_user_preferences",
  CHART_HISTORY: "auto_chart_history",
  UPLOAD_CACHE: "auto_chart_upload_cache",
  AGENT_STATE: "auto_chart_agent_state",
} as const;

// 事件类型
export const EVENT_TYPES = {
  FILE_UPLOADED: "file_uploaded",
  CHART_GENERATED: "chart_generated",
  ERROR_OCCURRED: "error_occurred",
  AGENT_INVOKED: "agent_invoked",
} as const;

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

// 通用尺寸常量
export const SIZES = {
  XS: "xs",
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
} as const;

// 通用状态常量
export const STATES = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  IDLE: "idle",
} as const;

// 导出格式常量
export const EXPORT_FORMATS = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
} as const;

// 移动端标签常量
export const MOBILE_TAB_VALUES = {
  CHAT: "chat",
  CHART: "chart",
} as const;
