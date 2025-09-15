/**
 * 自动触发处理器
 * 处理路由跳转后的会话恢复和AI处理自动触发
 * 支持首页跳转和Demo重放场景
 */

import {
  SingleChatSession,
  AutoTriggerConfig,
  DemoReplayConfig,
  DemoReplayStep,
  ChatMessage,
  UserMessage,
  ProcessingMessageContent,
  ChartResultContent,
  FileAttachment,
  SerializableFileAttachment,
  ProcessingFlow,
  ProcessingStep,
} from "@/types";
import { MESSAGE_TYPES } from "@/constants/message";
import { PROCESSING_STEPS, STEP_STATUS } from "@/constants/processing";
import { getSessionStorageService, TEMP_STORAGE_KEYS } from "./session-storage";
import { deserializeSession } from "./session-serializer";
import { generateChart } from "./ai-chart-system/ai-chart-director";

/**
 * 自动触发处理结果
 */
export interface AutoTriggerResult {
  success: boolean;
  sessionRestored: boolean;
  triggerExecuted: boolean;
  error?: string;
  restoredSession?: SingleChatSession;
  chartResult?: ChartResultContent;
}

/**
 * Demo重放控制器
 */
class DemoReplayController {
  private isReplaying = false;
  private currentStep = 0;
  private replayConfig: DemoReplayConfig | null = null;
  private sessionId: string | null = null;
  private onStepUpdate: ((step: DemoReplayStep, stepIndex: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  /**
   * 开始Demo重放
   */
  async startReplay(
    sessionId: string,
    config: DemoReplayConfig,
    callbacks: {
      onStepUpdate: (step: DemoReplayStep, stepIndex: number) => void;
      onComplete: () => void;
    }
  ): Promise<void> {
    console.log(`🎬 [AutoTrigger] 开始Demo重放 ${sessionId}`);

    if (this.isReplaying) {
      console.warn("⚠️ [AutoTrigger] Demo重放已在进行中");
      return;
    }

    this.isReplaying = true;
    this.currentStep = 0;
    this.replayConfig = config;
    this.sessionId = sessionId;
    this.onStepUpdate = callbacks.onStepUpdate;
    this.onComplete = callbacks.onComplete;

    try {
      if (config.mode === "instant") {
        // 立即执行所有步骤
        await this.executeAllStepsInstantly();
      } else {
        // 逐步执行
        await this.executeStepsSequentially();
      }
    } catch (error) {
      console.error("❌ [AutoTrigger] Demo重放失败:", error);
      this.stopReplay();
    }
  }

  /**
   * 停止Demo重放
   */
  stopReplay(): void {
    console.log("⏹️ [AutoTrigger] 停止Demo重放");
    this.isReplaying = false;
    this.currentStep = 0;
    this.replayConfig = null;
    this.sessionId = null;
    this.onStepUpdate = null;
    this.onComplete = null;
  }

  /**
   * 立即执行所有步骤
   */
  private async executeAllStepsInstantly(): Promise<void> {
    if (!this.replayConfig) return;

    for (let i = 0; i < this.replayConfig.predefinedSteps.length; i++) {
      const step = this.replayConfig.predefinedSteps[i];
      await this.executeStep(step, i);
    }

    this.completeReplay();
  }

  /**
   * 按序执行步骤（带延迟）
   */
  private async executeStepsSequentially(): Promise<void> {
    if (!this.replayConfig) return;

    for (let i = 0; i < this.replayConfig.predefinedSteps.length; i++) {
      const step = this.replayConfig.predefinedSteps[i];

      // 等待步骤延迟
      if (step.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }

      // 等待配置的步骤间隔
      if (i > 0 && this.replayConfig && this.replayConfig.stepDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.replayConfig!.stepDelay));
      }

      if (!this.isReplaying) break; // 检查是否被停止

      await this.executeStep(step, i);
      this.currentStep = i + 1;
    }

    if (this.isReplaying) {
      this.completeReplay();
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: DemoReplayStep, stepIndex: number): Promise<void> {
    console.log(
      `🎬 [AutoTrigger] 执行Demo步骤 ${stepIndex + 1}/${this.replayConfig?.predefinedSteps.length}: ${step.type}`
    );

    try {
      // 通知外部更新
      this.onStepUpdate?.(step, stepIndex);

      // 根据步骤类型执行相应操作
      switch (step.type) {
        case "add_processing_message":
          // 这个操作需要通过回调函数由外部的Hook来执行
          // 因为我们不能直接操作Hook状态
          break;

        case "update_processing_step":
          // 同样需要通过回调函数执行
          break;

        case "add_chart_result":
          // 同样需要通过回调函数执行
          break;

        default:
          console.warn(`⚠️ [AutoTrigger] 未知的Demo步骤类型: ${step.type}`);
      }

      console.log(`✅ [AutoTrigger] Demo步骤执行完成: ${step.type}`);
    } catch (error) {
      console.error(`❌ [AutoTrigger] Demo步骤执行失败 ${stepIndex}:`, error);
      throw error;
    }
  }

  /**
   * 完成重放
   */
  private completeReplay(): void {
    console.log("🎉 [AutoTrigger] Demo重放完成");
    this.onComplete?.();
    this.stopReplay();
  }

  /**
   * 获取重放状态
   */
  getReplayStatus(): {
    isReplaying: boolean;
    currentStep: number;
    totalSteps: number;
    progress: number;
  } {
    return {
      isReplaying: this.isReplaying,
      currentStep: this.currentStep,
      totalSteps: this.replayConfig?.predefinedSteps.length || 0,
      progress: this.replayConfig
        ? (this.currentStep / this.replayConfig.predefinedSteps.length) * 100
        : 0,
    };
  }
}

/**
 * 自动触发处理器类
 */
class AutoTriggerHandler {
  private demoController: DemoReplayController;

  constructor() {
    this.demoController = new DemoReplayController();
  }

  /**
   * 检查并处理待处理的会话
   */
  async checkPendingSessions(): Promise<AutoTriggerResult> {
    console.log("🔍 [AutoTrigger] 检查待处理的会话");

    // 检查首页跳转的会话
    const pendingSession = this.checkHomepageSession();
    if (pendingSession) {
      return this.handleHomepageSession(pendingSession);
    }

    // 检查Demo会话
    const demoSession = this.checkDemoSession();
    if (demoSession) {
      return this.handleDemoSession(demoSession);
    }

    // 检查URL参数中的会话信息
    const urlSession = this.checkUrlParams();
    if (urlSession) {
      return urlSession;
    }

    return {
      success: true,
      sessionRestored: false,
      triggerExecuted: false,
    };
  }

  /**
   * 检查首页跳转的会话
   */
  private checkHomepageSession(): any | null {
    try {
      const stored = localStorage.getItem(TEMP_STORAGE_KEYS.PENDING_SESSION);
      if (stored) {
        const sessionData = JSON.parse(stored);
        console.log("📨 [AutoTrigger] 发现首页待处理会话:", sessionData.id);
        return sessionData;
      }
    } catch (error) {
      console.error("❌ [AutoTrigger] 读取首页会话失败:", error);
    }
    return null;
  }

  /**
   * 检查Demo会话
   */
  private checkDemoSession(): any | null {
    try {
      const stored = localStorage.getItem(TEMP_STORAGE_KEYS.DEMO_SESSION);
      if (stored) {
        const sessionData = JSON.parse(stored);
        console.log("🎭 [AutoTrigger] 发现Demo会话:", sessionData.id);
        return sessionData;
      }
    } catch (error) {
      console.error("❌ [AutoTrigger] 读取Demo会话失败:", error);
    }
    return null;
  }

  /**
   * 检查URL参数
   */
  private checkUrlParams(): AutoTriggerResult | null {
    if (typeof window === "undefined") return null;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session");
    const demoId = urlParams.get("demo");

    if (sessionId) {
      console.log(`🔗 [AutoTrigger] URL参数中发现会话ID: ${sessionId}`);
      // TODO: 从存储中加载会话
      return {
        success: false,
        sessionRestored: false,
        triggerExecuted: false,
        error: "URL会话加载暂未实现",
      };
    }

    if (demoId) {
      console.log(`🔗 [AutoTrigger] URL参数中发现Demo ID: ${demoId}`);
      // TODO: 加载对应的Demo会话
      return {
        success: false,
        sessionRestored: false,
        triggerExecuted: false,
        error: "URL Demo加载暂未实现",
      };
    }

    return null;
  }

  /**
   * 处理首页跳转的会话
   */
  private async handleHomepageSession(sessionData: any): Promise<AutoTriggerResult> {
    console.log("🏠 [AutoTrigger] 处理首页跳转会话");

    try {
      // 反序列化会话数据
      const session = await deserializeSession(sessionData);

      // 清理临时存储
      localStorage.removeItem(TEMP_STORAGE_KEYS.PENDING_SESSION);

      // 检查是否需要自动触发
      if (session._autoTrigger?.enabled) {
        console.log("⚡ [AutoTrigger] 准备执行自动AI处理");

        // 查找触发消息
        const triggerMessage = session.messages.find(
          msg => msg.id === session._autoTrigger?.triggerMessage
        );

        if (triggerMessage && triggerMessage.type === MESSAGE_TYPES.USER) {
          return {
            success: true,
            sessionRestored: true,
            triggerExecuted: true,
            restoredSession: session,
            // 触发信息存储在会话中，由调用者处理
          };
        } else {
          console.warn("⚠️ [AutoTrigger] 找不到触发消息");
        }
      }

      return {
        success: true,
        sessionRestored: true,
        triggerExecuted: false,
        restoredSession: session,
      };
    } catch (error) {
      console.error("❌ [AutoTrigger] 首页会话处理失败:", error);
      // 清理损坏的数据
      localStorage.removeItem(TEMP_STORAGE_KEYS.PENDING_SESSION);

      return {
        success: false,
        sessionRestored: false,
        triggerExecuted: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 处理Demo会话
   */
  private async handleDemoSession(sessionData: any): Promise<AutoTriggerResult> {
    console.log("🎭 [AutoTrigger] 处理Demo会话");

    try {
      // 反序列化会话数据
      const session = await deserializeSession(sessionData);

      // 清理临时存储
      localStorage.removeItem(TEMP_STORAGE_KEYS.DEMO_SESSION);

      // 清理URL参数
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("demo");
        window.history.replaceState({}, "", url.toString());
      }

      // 检查是否需要自动触发AI处理
      const shouldTrigger = Boolean(session._autoTrigger?.enabled && session._autoTrigger?.triggerMessage);

      return {
        success: true,
        sessionRestored: true,
        triggerExecuted: shouldTrigger, // 如果配置了自动触发则返回true
        restoredSession: session,
      };
    } catch (error) {
      console.error("❌ [AutoTrigger] Demo会话处理失败:", error);
      localStorage.removeItem(TEMP_STORAGE_KEYS.DEMO_SESSION);

      return {
        success: false,
        sessionRestored: false,
        triggerExecuted: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 执行AI自动处理
   */
  async executeAutoProcessing(
    session: SingleChatSession,
    processingMessageId: string,
    onProgressUpdate: (messageId: string, updates: Partial<ProcessingMessageContent>) => void,
    onChartResult: (result: ChartResultContent) => void
  ): Promise<boolean> {
    if (!session._autoTrigger?.enabled) {
      console.warn("⚠️ [AutoTrigger] 会话未启用自动触发");
      return false;
    }

    console.log("⚡ [AutoTrigger] 执行AI自动处理");

    try {
      const triggerMessage = session.messages.find(
        msg => msg.id === session._autoTrigger?.triggerMessage
      ) as UserMessage;

      if (!triggerMessage) {
        throw new Error("找不到触发消息");
      }

      console.log("📋 [AutoTrigger] 使用处理消息ID:", processingMessageId);

      // 初始化处理流程
      const flow: ProcessingFlow = {
        id: `flow_${Date.now()}`,
        steps: [],
        totalSteps: 4,
        currentStepIndex: 0,
        startTime: new Date(),
        isCompleted: false,
        hasError: false,
      };

      // 步骤1：数据分析
      console.log("📊 [AutoTrigger] 步骤1: 数据分析");
      const step1: ProcessingStep = {
        id: `step_1_${Date.now()}`,
        type: PROCESSING_STEPS.DATA_ANALYSIS,
        title: "分析输入数据",
        description: "正在分析输入数据",
        status: STEP_STATUS.RUNNING,
        startTime: new Date(),
      };
      flow.steps.push(step1);
      flow.currentStepIndex = 0;
      onProgressUpdate(processingMessageId, {
        title: "正在分析您的数据...",
        flow: { ...flow },
      });

      // 模拟数据分析延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      flow.steps[0].status = STEP_STATUS.COMPLETED;
      flow.steps[0].endTime = new Date();
      onProgressUpdate(processingMessageId, { flow: { ...flow } });

      // 恢复文件附件
      const restoredFiles: File[] = [];
      if (triggerMessage.content.attachments) {
        for (const attachment of triggerMessage.content.attachments) {
          if (attachment.file) {
            // 直接的File对象
            restoredFiles.push(attachment.file);
          } else {
            // SerializableFileAttachment，需要恢复为File对象
            const restoredFile = await restoreFileFromAttachment(attachment as any);
            if (restoredFile) {
              restoredFiles.push(restoredFile);
            }
          }
        }
      }

      // 步骤2：意图分析
      console.log("🎯 [AutoTrigger] 步骤2: 意图分析");
      const step2: ProcessingStep = {
        id: `step_2_${Date.now()}`,
        type: PROCESSING_STEPS.CHART_TYPE_DETECTION,
        title: "分析图表类型需求",
        description: "正在分析图表类型需求",
        status: STEP_STATUS.RUNNING,
        startTime: new Date(),
      };
      flow.steps.push(step2);
      flow.currentStepIndex = 1;
      onProgressUpdate(processingMessageId, {
        title: "正在分析图表类型...",
        flow: { ...flow },
      });

      // 模拟意图分析延迟
      await new Promise(resolve => setTimeout(resolve, 600));

      flow.steps[1].status = STEP_STATUS.COMPLETED;
      flow.steps[1].endTime = new Date();
      onProgressUpdate(processingMessageId, { flow: { ...flow } });

      // 步骤3：图表生成
      console.log("🎨 [AutoTrigger] 步骤3: 图表生成");
      const step3: ProcessingStep = {
        id: `step_3_${Date.now()}`,
        type: PROCESSING_STEPS.CHART_GENERATION,
        title: "生成图表配置",
        description: "正在生成图表配置",
        status: STEP_STATUS.RUNNING,
        startTime: new Date(),
      };
      flow.steps.push(step3);
      flow.currentStepIndex = 2;
      onProgressUpdate(processingMessageId, {
        title: "正在生成图表...",
        flow: { ...flow },
      });

      // 构造AI处理请求
      const request = {
        prompt: triggerMessage.content.text,
        files: restoredFiles, // 支持多文件
      };

      // 执行AI处理
      const result = await generateChart(request);

      if (!result.success) {
        flow.steps[2].status = STEP_STATUS.ERROR;
        flow.steps[2].endTime = new Date();
        flow.hasError = true;
        onProgressUpdate(processingMessageId, {
          title: "图表生成失败",
          flow: { ...flow },
        });
        throw new Error(result.error?.message || "AI处理失败");
      }

      flow.steps[2].status = STEP_STATUS.COMPLETED;
      flow.steps[2].endTime = new Date();
      onProgressUpdate(processingMessageId, { flow: { ...flow } });

      // 步骤4：图片导出
      console.log("📸 [AutoTrigger] 步骤4: 图片导出");
      const step4: ProcessingStep = {
        id: `step_4_${Date.now()}`,
        type: PROCESSING_STEPS.IMAGE_EXPORT,
        title: "导出图表图片",
        description: "正在导出图表图片",
        status: STEP_STATUS.RUNNING,
        startTime: new Date(),
      };
      flow.steps.push(step4);
      flow.currentStepIndex = 3;
      onProgressUpdate(processingMessageId, {
        title: "正在导出图片...",
        flow: { ...flow },
      });

      // 模拟图片导出延迟（实际导出将在图表显示区域进行）
      await new Promise(resolve => setTimeout(resolve, 500));

      flow.steps[3].status = STEP_STATUS.COMPLETED;
      flow.steps[3].endTime = new Date();
      flow.isCompleted = true;
      flow.endTime = new Date();

      onProgressUpdate(processingMessageId, {
        title: "处理完成",
        flow: { ...flow },
      });

      // 构造图表结果
      console.log("📊 [AutoTrigger] AI图表生成结果检查:", {
        hasData: !!result.data,
        dataLength: result.data?.length || 0,
        dataType: Array.isArray(result.data) ? "array" : typeof result.data,
        sampleData: result.data?.slice(0, 2),
        hasConfig: !!result.config,
        chartType: result.chartType,
        title: result.title,
      });

      const chartResult: ChartResultContent = {
        chartData: result.data,
        chartConfig: result.config,
        chartType: result.chartType,
        title: result.title,
        description: result.description,
        imageInfo: {
          filename: `chart_${Date.now()}.png`,
          localBlobUrl: "", // 需要在图表生成后设置
          size: 0,
          format: "png",
          dimensions: { width: 800, height: 600 },
          createdAt: new Date(),
        },
      };

      onChartResult(chartResult);
      console.log("✅ [AutoTrigger] AI自动处理完成");
      return true;
    } catch (error) {
      console.error("❌ [AutoTrigger] AI自动处理失败:", error);
      return false;
    }
  }

  /**
   * 开始Demo重放
   */
  async startDemoReplay(
    sessionId: string,
    config: DemoReplayConfig,
    callbacks: {
      onStepUpdate: (step: DemoReplayStep, stepIndex: number) => void;
      onComplete: () => void;
    }
  ): Promise<void> {
    return this.demoController.startReplay(sessionId, config, callbacks);
  }

  /**
   * 停止Demo重放
   */
  stopDemoReplay(): void {
    this.demoController.stopReplay();
  }

  /**
   * 获取Demo重放状态
   */
  getDemoReplayStatus() {
    return this.demoController.getReplayStatus();
  }
}

// 导出单例实例
export const autoTriggerHandler = new AutoTriggerHandler();

// 导出工具函数
export async function restoreFileFromAttachment(
  attachment: SerializableFileAttachment
): Promise<File | null> {
  if (!attachment) return null;

  console.log("🔄 [FileRestore] 开始恢复文件:", {
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    storageType: attachment.storageType,
    hasDataUrl: !!attachment.dataUrl,
    dataUrlPrefix: attachment.dataUrl?.substring(0, 50) + "...",
  });

  try {
    if (attachment.storageType === "base64" && attachment.dataUrl) {
      // 从Base64恢复
      const arr = attachment.dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      const restoredFile = new File([u8arr], attachment.name, { type: mime });

      console.log("✅ [FileRestore] 文件恢复成功:", {
        name: restoredFile.name,
        size: restoredFile.size,
        type: restoredFile.type,
        originalSize: attachment.size,
      });

      return restoredFile;
    } else if (attachment.storageType === "indexeddb" && attachment.storageKey) {
      // 从IndexedDB恢复
      const storageService = getSessionStorageService();
      if (!storageService) {
        console.warn("存储服务在当前环境中不可用");
        return null;
      }
      const fileData = await storageService.getFile(attachment.storageKey);
      if (fileData instanceof File) {
        return fileData;
      } else if (fileData instanceof Blob) {
        return new File([fileData], attachment.name, { type: fileData.type });
      }
    }

    console.warn(`⚠️ [AutoTrigger] 无法恢复文件: ${attachment.name}`);
    return null;
  } catch (error) {
    console.error(`❌ [AutoTrigger] 文件恢复失败: ${attachment.name}`, error);
    return null;
  }
}
