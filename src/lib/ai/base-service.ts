// AI 服务抽象基类

import {
  AIService,
  AIServiceProvider,
  AIModelConfig,
  AIRequest,
  AIResponse,
  AIServiceError,
  AIServiceErrorType,
  AIServiceStats,
  AIServiceEvents,
  AI_SERVICE_DEFAULTS,
  AI_ERROR_MESSAGES,
} from "./types";

/**
 * AI 服务抽象基类
 * 提供通用的功能实现和模板方法
 */
export abstract class BaseAIService implements AIService {
  protected _stats: AIServiceStats;
  protected _events: Partial<AIServiceEvents> = {};

  constructor(
    public readonly provider: AIServiceProvider,
    public readonly config: AIModelConfig
  ) {
    this._stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
    };

    // 合并默认配置
    this.config = {
      ...AI_SERVICE_DEFAULTS,
      ...config,
      requestParams: {
        ...AI_SERVICE_DEFAULTS.requestParams,
        ...config.requestParams,
      },
    };
  }

  get stats(): AIServiceStats {
    return { ...this._stats };
  }

  /**
   * 主要的聊天接口 - 模板方法
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this._stats.totalRequests++;
    this._stats.lastRequestTime = new Date();

    // 触发请求开始事件
    this._events.requestStart?.(request);

    try {
      // 验证请求
      this.validateRequest(request);

      // 预处理请求
      const processedRequest = await this.preprocessRequest(request);

      // 发送请求（子类实现）
      const response = await this.sendRequest(processedRequest);

      // 后处理响应
      const processedResponse = await this.postprocessResponse(response);

      // 更新统计信息
      const duration = Date.now() - startTime;
      this.updateSuccessStats(duration, processedResponse);

      // 触发成功事件
      this._events.requestComplete?.(processedResponse, duration);

      return processedResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._stats.failedRequests++;

      // 处理错误
      const aiError = this.handleError(error);

      // 触发错误事件
      this._events.requestError?.(aiError, duration);

      throw aiError;
    }
  }

  /**
   * 流式聊天接口 - 子类可选实现
   */
  async *chatStream(request: AIRequest): AsyncIterable<AIResponse> {
    throw new AIServiceError("SERVICE_UNAVAILABLE", "当前服务不支持流式响应", undefined, false);
  }

  /**
   * 验证连接 - 子类实现
   */
  abstract validateConnection(): Promise<boolean>;

  /**
   * 获取可用模型 - 子类实现
   */
  abstract getAvailableModels(): Promise<string[]>;

  /**
   * 发送请求 - 子类实现核心逻辑
   */
  protected abstract sendRequest(request: AIRequest): Promise<AIResponse>;

  /**
   * 验证请求参数
   */
  protected validateRequest(request: AIRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new AIServiceError("INVALID_REQUEST", "消息列表不能为空", { request }, false);
    }

    // 验证消息格式
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new AIServiceError(
          "INVALID_REQUEST",
          "消息必须包含 role 和 content 字段",
          { message },
          false
        );
      }
    }

    // 验证 API Key
    if (!this.config.apiKey) {
      throw new AIServiceError("INVALID_API_KEY", "API 密钥未配置", undefined, false);
    }
  }

  /**
   * 预处理请求
   */
  protected async preprocessRequest(request: AIRequest): Promise<AIRequest> {
    const processed = { ...request };

    // 添加系统提示词
    if (request.systemPrompt) {
      processed.messages = [
        { role: "system", content: request.systemPrompt },
        ...processed.messages,
      ];
    }

    // 合并参数
    processed.params = {
      ...this.config.requestParams,
      ...request.params,
    };

    return processed;
  }

  /**
   * 后处理响应
   */
  protected async postprocessResponse(response: AIResponse): Promise<AIResponse> {
    // 子类可以重写此方法添加后处理逻辑
    return response;
  }

  /**
   * 处理错误
   */
  protected handleError(error: any): AIServiceError {
    // 如果已经是 AIServiceError，直接返回
    if (error instanceof AIServiceError) {
      return error;
    }

    // 根据不同类型的错误进行分类
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return new AIServiceError("NETWORK_ERROR", AI_ERROR_MESSAGES.NETWORK_ERROR, error, true);
    }

    if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
      return new AIServiceError("TIMEOUT", AI_ERROR_MESSAGES.TIMEOUT, error, true);
    }

    // HTTP 状态码错误
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return new AIServiceError(
            "INVALID_API_KEY",
            AI_ERROR_MESSAGES.INVALID_API_KEY,
            data,
            false
          );
        case 429:
          return new AIServiceError("RATE_LIMITED", AI_ERROR_MESSAGES.RATE_LIMITED, data, true);
        case 404:
          return new AIServiceError(
            "MODEL_NOT_FOUND",
            AI_ERROR_MESSAGES.MODEL_NOT_FOUND,
            data,
            false
          );
        case 402:
        case 403:
          return new AIServiceError(
            "QUOTA_EXCEEDED",
            AI_ERROR_MESSAGES.QUOTA_EXCEEDED,
            data,
            false
          );
        case 400:
          return new AIServiceError(
            "INVALID_REQUEST",
            data?.error?.message || AI_ERROR_MESSAGES.INVALID_REQUEST,
            data,
            false
          );
        case 500:
        case 502:
        case 503:
          return new AIServiceError(
            "SERVICE_UNAVAILABLE",
            AI_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
            data,
            true
          );
        default:
          return new AIServiceError(
            "UNKNOWN_ERROR",
            `HTTP ${status}: ${data?.error?.message || error.message}`,
            data,
            false
          );
      }
    }

    // 其他未知错误
    return new AIServiceError(
      "UNKNOWN_ERROR",
      error.message || AI_ERROR_MESSAGES.UNKNOWN_ERROR,
      error,
      false
    );
  }

  /**
   * 更新成功统计
   */
  private updateSuccessStats(duration: number, response: AIResponse): void {
    this._stats.successfulRequests++;

    // 更新平均响应时间
    const totalSuccessful = this._stats.successfulRequests;
    this._stats.averageResponseTime =
      (this._stats.averageResponseTime * (totalSuccessful - 1) + duration) / totalSuccessful;

    // 更新 Token 使用量
    if (response.usage) {
      this._stats.totalTokensUsed += response.usage.totalTokens;
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this._stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
    };
  }

  /**
   * 注册事件监听器
   */
  on<K extends keyof AIServiceEvents>(event: K, handler: AIServiceEvents[K]): void {
    this._events[event] = handler;
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof AIServiceEvents>(event: K): void {
    delete this._events[event];
  }

  /**
   * 重试机制
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // 检查是否可重试
        if (error instanceof AIServiceError && !error.retryable) {
          throw error;
        }

        // 最后一次尝试失败时抛出错误
        if (attempt === maxRetries) {
          break;
        }

        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * HTTP 请求辅助方法
   */
  protected async makeHttpRequest<T>(
    url: string,
    options: {
      method: "GET" | "POST";
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message: `HTTP ${response.status}`,
        };
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as any).name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  /**
   * 销毁服务实例
   */
  destroy(): void {
    this._events = {};
  }
}
