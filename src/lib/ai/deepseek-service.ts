// Deepseek AI 服务具体实现

import { BaseAIService } from "./base-service";
import { AIRequest, AIResponse, AIServiceError, AIModelConfig } from "./types";

/**
 * Deepseek API 请求格式
 */
interface DeepseekRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  response_format?: {
    type: "text" | "json_object";
  };
}

/**
 * Deepseek API 响应格式
 */
interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Deepseek 模型列表响应
 */
interface DeepseekModelsResponse {
  object: "list";
  data: Array<{
    id: string;
    object: "model";
    created: number;
    owned_by: string;
  }>;
}

/**
 * Deepseek AI 服务实现
 */
export class DeepseekAIService extends BaseAIService {
  constructor(config: AIModelConfig) {
    super("deepseek", {
      baseURL: "https://api.deepseek.com",
      ...config,
      modelName: config.modelName || "deepseek-chat",
    });
  }

  protected async sendRequest(request: AIRequest): Promise<AIResponse> {
    // 转换为 Deepseek API 格式
    const deepseekRequest: DeepseekRequest = {
      model: this.config.modelName,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.params?.temperature || 0.7,
      max_tokens: request.params?.maxTokens || 2000,
      top_p: request.params?.topP,
      frequency_penalty: request.params?.frequencyPenalty,
      presence_penalty: request.params?.presencePenalty,
      stream: false,
      response_format: request.params?.response_format,
    };

    // 使用重试机制发送请求
    return this.withRetry(async () => {
      const response = await this.makeHttpRequest<DeepseekResponse>(
        `${this.config.baseURL}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: deepseekRequest,
        }
      );

      // 转换为标准 AIResponse 格式
      return {
        content: response.choices[0]?.message?.content || "",
        role: "assistant",
        finishReason: response.choices[0]?.finish_reason || "stop",
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: response.model,
        timestamp: new Date(),
      };
    });
  }

  async validateConnection(): Promise<boolean> {
    try {
      // 发送简单的测试请求来验证 API 密钥
      const testRequest: AIRequest = {
        messages: [{ role: "user", content: "Hello" }],
        params: {
          maxTokens: 10,
          temperature: 0.1,
        },
      };

      await this.sendRequest(testRequest);
      return true;
    } catch (error) {
      // 如果是认证错误，返回 false，其他错误重新抛出
      if (error instanceof AIServiceError && error.type === "INVALID_API_KEY") {
        return false;
      }
      // 网络错误等也可能导致连接验证失败，但不代表 API 密钥无效
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.makeHttpRequest<DeepseekModelsResponse>(
        `${this.config.baseURL}/v1/models`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      return response.data.map(model => model.id);
    } catch (error) {
      // 如果获取失败，返回默认模型列表
      console.warn("获取 Deepseek 模型列表失败，使用默认列表:", error);
      return ["deepseek-chat", "deepseek-coder"];
    }
  }
}
