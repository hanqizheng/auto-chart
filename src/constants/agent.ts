// AI Agent 相关常量定义

// AI chat type
export const AI_CHAT_TYPE = {
  ASSISTANT: "assistant",
  USER: "user",
} as const;

// Agent 执行状态
export const AGENT_STATUS = {
  IDLE: "idle",
  THINKING: "thinking",
  EXECUTING: "executing",
  SUCCESS: "success",
  ERROR: "error",
} as const;

// Agent 工具类型
export const AGENT_TOOL_TYPES = {
  GENERATE_CHART: "generate_chart",
  ANALYZE_DATA: "analyze_data_for_chart",
  GET_CAPABILITIES: "get_chart_capabilities",
  OPTIMIZE_CHART: "optimize_chart",
  RECOMMEND_CHARTS: "recommend_charts",
} as const;

// AI 框架支持
export const AI_FRAMEWORKS = {
  OPENAI: "openai",
  LANGCHAIN: "langchain",
  ANTHROPIC: "anthropic",
  CUSTOM: "custom",
} as const;

// Agent 推荐置信度等级
export const CONFIDENCE_LEVELS = {
  VERY_LOW: 0.2,
  LOW: 0.4,
  MEDIUM: 0.6,
  HIGH: 0.8,
  VERY_HIGH: 0.9,
} as const;

// Agent 推荐原因模板
export const RECOMMENDATION_REASONS = {
  DATA_TYPE_MATCH: "Data types match chart requirements perfectly",
  PATTERN_DETECTED: "Strong pattern detected in the data",
  CATEGORY_FIT: "Data structure fits this chart category well",
  HISTORICAL_SUCCESS: "Similar data has worked well with this chart type",
  USER_PREFERENCE: "Based on your previous chart selections",
  DEFAULT_CHOICE: "Good general-purpose option for this data",
} as const;

// Agent 能力类型
export const AGENT_CAPABILITIES = {
  CHART_GENERATION: "chart_generation",
  DATA_ANALYSIS: "data_analysis",
  PATTERN_RECOGNITION: "pattern_recognition",
  RECOMMENDATION: "recommendation",
  OPTIMIZATION: "optimization",
  NATURAL_LANGUAGE: "natural_language",
} as const;

// Tool 执行结果状态
export const TOOL_EXECUTION_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  TIMEOUT: "timeout",
} as const;

// 用户偏好设置
export const USER_PREFERENCE_KEYS = {
  PREFERRED_CHART_TYPES: "preferred_chart_types",
  COLOR_THEME: "color_theme",
  DEFAULT_OPTIONS: "default_options",
  AUTO_GENERATE: "auto_generate",
  SHOW_RECOMMENDATIONS: "show_recommendations",
} as const;

// Agent 交互模式
export const INTERACTION_MODES = {
  MANUAL: "manual", // 用户手动选择
  ASSISTED: "assisted", // AI 辅助建议
  AUTOMATIC: "automatic", // 完全自动
} as const;

// Agent 错误类型
export const AGENT_ERROR_TYPES = {
  TOOL_EXECUTION_FAILED: "tool_execution_failed",
  INVALID_PARAMETERS: "invalid_parameters",
  UNSUPPORTED_REQUEST: "unsupported_request",
  RATE_LIMITED: "rate_limited",
  API_ERROR: "api_error",
  TIMEOUT: "timeout",
  CONTEXT_TOO_LARGE: "context_too_large",
} as const;

// Agent 配置默认值
export const AGENT_DEFAULTS = {
  MAX_RETRIES: 3,
  TIMEOUT_SECONDS: 30,
  MAX_CONTEXT_LENGTH: 8000,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
  CONFIDENCE_THRESHOLD: CONFIDENCE_LEVELS.MEDIUM,
} as const;

// Agent 提示词模板
export const PROMPT_TEMPLATES = {
  CHART_GENERATION: `You are an expert data visualization assistant. 
Generate a chart configuration based on the provided data and user requirements.
Consider data types, patterns, and visualization best practices.`,

  DATA_ANALYSIS: `Analyze the provided dataset and identify key patterns, trends, and characteristics.
Focus on aspects relevant to data visualization and chart selection.`,

  CHART_RECOMMENDATION: `Based on the data analysis, recommend the most suitable chart types.
Explain your reasoning and provide confidence scores for each recommendation.`,

  OPTIMIZATION: `Review the current chart configuration and suggest optimizations.
Focus on clarity, readability, and effective data communication.`,
} as const;
