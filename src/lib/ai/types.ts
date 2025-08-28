// AI 服务通用接口定义

/**
 * AI 服务提供商类型
 */
export type AIServiceProvider = "deepseek" | "openai" | "anthropic" | "custom";

/**
 * AI 模型配置
 */
export interface AIModelConfig {
  /** 模型名称 */
  modelName: string;

  /** API 密钥 */
  apiKey: string;

  /** API 基础 URL */
  baseURL?: string;

  /** 请求超时时间（毫秒） */
  timeout?: number;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 请求参数 */
  requestParams?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    response_format?: {
      type: "text" | "json_object";
    };
  };
}

/**
 * AI 请求消息
 */
export interface AIMessage {
  /** 消息角色 */
  role: "system" | "user" | "assistant";

  /** 消息内容 */
  content: string;

  /** 消息名称（可选） */
  name?: string;

  /** 函数调用（可选） */
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * AI 请求参数
 */
export interface AIRequest {
  /** 消息列表 */
  messages: AIMessage[];

  /** 系统提示词 */
  systemPrompt?: string;

  /** 请求参数覆盖 */
  params?: AIModelConfig["requestParams"];

  /** 是否流式响应 */
  stream?: boolean;

  /** 函数定义（用于 Function Calling） */
  functions?: AIFunction[];
}

/**
 * AI 函数定义
 */
export interface AIFunction {
  /** 函数名称 */
  name: string;

  /** 函数描述 */
  description: string;

  /** 参数 schema */
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * AI 响应结果
 */
export interface AIResponse {
  /** 响应内容 */
  content: string;

  /** 响应角色 */
  role: "assistant";

  /** 函数调用结果 */
  functionCall?: {
    name: string;
    arguments: string;
  };

  /** 完成原因 */
  finishReason?: "stop" | "length" | "function_call" | "content_filter";

  /** Token 使用情况 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** 请求 ID */
  requestId?: string;
}

/**
 * AI 服务错误类型
 */
export type AIServiceErrorType =
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "MODEL_NOT_FOUND"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "SERVICE_UNAVAILABLE"
  | "INSUFFICIENT_DATA"
  | "DATA_INCOMPATIBLE"
  | "UNKNOWN_ERROR";

/**
 * AI 服务错误
 */
export class AIServiceError extends Error {
  constructor(
    public type: AIServiceErrorType,
    public message: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * AI 服务统计信息
 */
export interface AIServiceStats {
  /** 请求总数 */
  totalRequests: number;

  /** 成功请求数 */
  successfulRequests: number;

  /** 失败请求数 */
  failedRequests: number;

  /** 平均响应时间（毫秒） */
  averageResponseTime: number;

  /** 总 Token 使用量 */
  totalTokensUsed: number;

  /** 最后请求时间 */
  lastRequestTime?: Date;
}

/**
 * AI 服务接口
 */
export interface AIService {
  /** 服务提供商 */
  readonly provider: AIServiceProvider;

  /** 服务配置 */
  readonly config: AIModelConfig;

  /** 服务统计 */
  readonly stats: AIServiceStats;

  /**
   * 发送 AI 请求
   */
  chat(request: AIRequest): Promise<AIResponse>;

  /**
   * 流式 AI 请求
   */
  chatStream(request: AIRequest): AsyncIterable<AIResponse>;

  /**
   * 验证服务可用性
   */
  validateConnection(): Promise<boolean>;

  /**
   * 获取支持的模型列表
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * 重置统计信息
   */
  resetStats(): void;

  /**
   * 销毁服务实例
   */
  destroy(): void;
}

/**
 * AI 服务工厂接口
 */
export interface AIServiceFactory {
  /**
   * 创建 AI 服务实例
   */
  createService(provider: AIServiceProvider, config: AIModelConfig): AIService;

  /**
   * 获取默认配置
   */
  getDefaultConfig(provider: AIServiceProvider): Partial<AIModelConfig>;

  /**
   * 验证配置
   */
  validateConfig(provider: AIServiceProvider, config: AIModelConfig): boolean;

  /**
   * 获取支持的提供商列表
   */
  getSupportedProviders(): AIServiceProvider[];
}

/**
 * AI 服务事件
 */
export interface AIServiceEvents {
  /** 请求开始 */
  requestStart: (request: AIRequest) => void;

  /** 请求完成 */
  requestComplete: (response: AIResponse, duration: number) => void;

  /** 请求失败 */
  requestError: (error: AIServiceError, duration: number) => void;

  /** 连接状态变化 */
  connectionChange: (connected: boolean) => void;
}

/**
 * 默认配置常量
 */
export const AI_SERVICE_DEFAULTS = {
  timeout: 30000, // 30秒
  maxRetries: 3,
  requestParams: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
} as const;

/**
 * 错误消息映射
 */
export const AI_ERROR_MESSAGES: Record<AIServiceErrorType, string> = {
  INVALID_API_KEY: "API 密钥无效",
  QUOTA_EXCEEDED: "API 配额已用完",
  RATE_LIMITED: "请求频率过高，请稍后重试",
  MODEL_NOT_FOUND: "指定的模型不存在",
  TIMEOUT: "请求超时",
  NETWORK_ERROR: "网络连接错误",
  INVALID_REQUEST: "请求参数无效",
  SERVICE_UNAVAILABLE: "AI 服务暂不可用",
  INSUFFICIENT_DATA: "数据不足，无法生成图表",
  DATA_INCOMPATIBLE: "数据格式不兼容",
  UNKNOWN_ERROR: "未知错误",
};

/**
 * 提供商默认配置
 */
export const PROVIDER_DEFAULTS: Record<AIServiceProvider, Partial<AIModelConfig>> = {
  deepseek: {
    baseURL: "https://api.deepseek.com",
    modelName: "deepseek-chat",
    timeout: 30000,
    maxRetries: 3,
    requestParams: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    modelName: "gpt-3.5-turbo",
    timeout: 30000,
    maxRetries: 3,
    requestParams: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  anthropic: {
    baseURL: "https://api.anthropic.com",
    modelName: "claude-3-haiku-20240307",
    timeout: 30000,
    maxRetries: 3,
    requestParams: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  custom: {
    timeout: 30000,
    maxRetries: 3,
    requestParams: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
};
