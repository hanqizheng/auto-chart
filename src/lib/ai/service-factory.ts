// AI 服务工厂实现

import {
  AIService,
  AIServiceProvider,
  AIModelConfig,
  AIServiceFactory,
  AIServiceError,
  PROVIDER_DEFAULTS,
} from "./types";
import { DeepseekAIService } from "./deepseek-service";

/**
 * AI 服务工厂类
 * 负责创建和管理不同 AI 服务提供商的实例
 */
export class DefaultAIServiceFactory implements AIServiceFactory {
  private static instance: DefaultAIServiceFactory;
  private serviceInstances: Map<string, AIService> = new Map();

  /**
   * 获取工厂单例实例
   */
  static getInstance(): DefaultAIServiceFactory {
    if (!DefaultAIServiceFactory.instance) {
      DefaultAIServiceFactory.instance = new DefaultAIServiceFactory();
    }
    return DefaultAIServiceFactory.instance;
  }

  /**
   * 创建 AI 服务实例
   */
  createService(provider: AIServiceProvider, config: AIModelConfig): AIService {

    // 合并默认配置
    const mergedConfig = this.mergeWithDefaults(provider, config);

    // 创建服务实例
    let service: AIService;

    switch (provider) {
      case "deepseek":
        service = new DeepseekAIService(mergedConfig);
        break;

      case "openai":
        // TODO: 实现 OpenAI 服务
        throw new AIServiceError("SERVICE_UNAVAILABLE", "OpenAI 服务暂未实现", { provider }, false);

      case "anthropic":
        // TODO: 实现 Anthropic 服务
        throw new AIServiceError(
          "SERVICE_UNAVAILABLE",
          "Anthropic 服务暂未实现",
          { provider },
          false
        );

      case "custom":
        // TODO: 实现自定义服务
        throw new AIServiceError("SERVICE_UNAVAILABLE", "自定义服务暂未实现", { provider }, false);

      default:
        throw new AIServiceError(
          "SERVICE_UNAVAILABLE",
          `不支持的服务提供商: ${provider}`,
          { provider },
          false
        );
    }

    // 缓存服务实例（可选）
    const cacheKey = `${provider}-${config.modelName}`;
    this.serviceInstances.set(cacheKey, service);

    return service;
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(provider: AIServiceProvider): Partial<AIModelConfig> {
    return { ...PROVIDER_DEFAULTS[provider] };
  }

  /**
   * 验证配置
   */
  validateConfig(provider: AIServiceProvider, config: AIModelConfig): boolean {
    // 通用验证
    if (!config.apiKey || config.apiKey.trim() === "") {
      return false;
    }

    if (!config.modelName || config.modelName.trim() === "") {
      return false;
    }

    // 特定提供商验证
    switch (provider) {
      case "deepseek":
        return this.validateDeepseekConfig(config);
      case "openai":
        return this.validateOpenAIConfig(config);
      case "anthropic":
        return this.validateAnthropicConfig(config);
      case "custom":
        return this.validateCustomConfig(config);
      default:
        return false;
    }
  }

  /**
   * 获取支持的提供商列表
   */
  getSupportedProviders(): AIServiceProvider[] {
    return ["deepseek"]; // 目前只支持 Deepseek
  }

  /**
   * 获取缓存的服务实例
   */
  getCachedService(provider: AIServiceProvider, modelName: string): AIService | undefined {
    const cacheKey = `${provider}-${modelName}`;
    return this.serviceInstances.get(cacheKey);
  }

  /**
   * 清除缓存的服务实例
   */
  clearCache(): void {
    this.serviceInstances.forEach(service => service.destroy());
    this.serviceInstances.clear();
  }

  /**
   * 创建带有自动重连的服务实例
   */
  createResilientService(
    provider: AIServiceProvider,
    config: AIModelConfig,
    options?: {
      autoReconnect?: boolean;
      healthCheckInterval?: number;
    }
  ): AIService {
    const service = this.createService(provider, config);

    if (options?.autoReconnect) {
      this.setupHealthCheck(service, options.healthCheckInterval);
    }

    return service;
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(provider: AIServiceProvider, config: AIModelConfig): AIModelConfig {
    const defaults = this.getDefaultConfig(provider);

    return {
      ...defaults,
      ...config,
      requestParams: {
        ...defaults.requestParams,
        ...config.requestParams,
      },
    } as AIModelConfig;
  }

  /**
   * 验证 Deepseek 配置
   */
  private validateDeepseekConfig(config: AIModelConfig): boolean {
    // 验证 baseURL
    if (config.baseURL && !config.baseURL.includes("deepseek.com")) {
      return false;
    }

    // 验证模型名称
    const supportedModels = ["deepseek-chat", "deepseek-coder"];
    if (config.modelName && !supportedModels.includes(config.modelName)) {
      console.warn(`未知的 Deepseek 模型: ${config.modelName}`);
    }

    // 验证参数范围
    const params = config.requestParams;
    if (params) {
      if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
        return false;
      }
      if (params.maxTokens !== undefined && (params.maxTokens < 1 || params.maxTokens > 4000)) {
        return false;
      }
      if (params.topP !== undefined && (params.topP < 0 || params.topP > 1)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证 OpenAI 配置
   */
  private validateOpenAIConfig(config: AIModelConfig): boolean {
    // TODO: 实现 OpenAI 配置验证
    return true;
  }

  /**
   * 验证 Anthropic 配置
   */
  private validateAnthropicConfig(config: AIModelConfig): boolean {
    // TODO: 实现 Anthropic 配置验证
    return true;
  }

  /**
   * 验证自定义配置
   */
  private validateCustomConfig(config: AIModelConfig): boolean {
    // 自定义服务需要提供 baseURL
    if (!config.baseURL || config.baseURL.trim() === "") {
      return false;
    }

    try {
      new URL(config.baseURL);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * 设置健康检查
   */
  private setupHealthCheck(service: AIService, interval: number = 60000): void {
    const healthCheck = async () => {
      try {
        await service.validateConnection();
      } catch (error) {
        console.warn("AI 服务连接检查失败:", error);
        // 可以在这里添加重连逻辑
      }
    };

    // 立即执行一次
    healthCheck();

    // 定期执行
    setInterval(healthCheck, interval);
  }
}

/**
 * 导出工厂单例实例
 */
export const aiServiceFactory = DefaultAIServiceFactory.getInstance();

/**
 * 便捷函数：创建 AI 服务
 */
export function createAIService(provider: AIServiceProvider, config: AIModelConfig): AIService {
  return aiServiceFactory.createService(provider, config);
}

/**
 * 便捷函数：创建 Deepseek 服务
 */
export function createDeepseekService(config: {
  apiKey: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}): AIService {
  return createAIService("deepseek", {
    apiKey: config.apiKey,
    modelName: config.modelName || "deepseek-chat",
    requestParams: {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    },
  });
}

/**
 * 便捷函数：使用环境变量创建服务
 */
export function createServiceFromEnv(provider: AIServiceProvider = "deepseek"): AIService {
  console.log('provider: ', provider);
  let apiKey: string;
  let modelName: string;

  switch (provider) {
    case "deepseek":
      apiKey = process.env.DEEPSEEK_API_KEY || "";
      modelName = process.env.DEEPSEEK_MODEL || "deepseek-chat";
      break;
    case "openai":
      apiKey = process.env.OPENAI_API_KEY || "";
      modelName = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      break;
    case "anthropic":
      apiKey = process.env.ANTHROPIC_API_KEY || "";
      modelName = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
      break;
    default:
      throw new Error(`不支持从环境变量创建 ${provider} 服务`);
  }

  console.log('apiKey: ', apiKey, !apiKey);

  return createAIService(provider, {
    apiKey,
    modelName,
  });
}
