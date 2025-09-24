"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  SingleChatSession,
  ChatMessage,
  UserMessageContent,
  ProcessingMessageContent,
  ChartResultContent,
  FileAttachment,
  SerializableChatSession,
  AutoTriggerConfig,
  DemoReplayConfig,
} from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";
import { getSessionStorageService } from "@/lib/session-storage";
import { serializeSession, deserializeSession, exportSessionData } from "@/lib/session-serializer";
import { autoTriggerHandler, restoreFileFromAttachment } from "@/lib/auto-trigger-handler";
import { sessionTitleGenerator, generateSessionTitle } from "@/lib/session-title-generator";
import { aiDirector } from "@/lib/ai-agents";

/**
 * 增强的聊天会话管理 Hook
 * 支持序列化、自动触发、标题生成、Demo重放等功能
 */
export function useChatSession() {
  // 初始化会话状态
  const [session, setSession] = useState<SingleChatSession>(() => ({
    id: uuidv4(),
    title: undefined,
    messages: [],
    createdAt: new Date(),
    lastActivity: new Date(),
    version: "1.0",
    source: "dashboard",
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  /**
   * 添加用户消息
   */
  const addUserMessage = useCallback((text: string, files?: File[]) => {
    const messageId = uuidv4();

    // 处理文件附件
    const attachments: FileAttachment[] =
      files?.map(file => ({
        id: uuidv4(),
        name: file.name,
        type: getFileType(file),
        size: file.size,
        file,
        uploadedAt: new Date(),
      })) || [];

    // 确定消息子类型
    const subtype =
      files && files.length > 0
        ? text.trim()
          ? USER_MESSAGE_SUBTYPES.MIXED
          : USER_MESSAGE_SUBTYPES.FILE_UPLOAD
        : USER_MESSAGE_SUBTYPES.TEXT;

    const userContent: UserMessageContent = {
      text,
      subtype,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const userMessage: ChatMessage = {
      id: messageId,
      type: MESSAGE_TYPES.USER,
      content: userContent,
      timestamp: new Date(),
      status: MESSAGE_STATUS.SENT,
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      lastActivity: new Date(),
    }));

    return messageId;
  }, []);

  /**
   * 添加处理消息
   */
  const addProcessingMessage = useCallback((title: string) => {
    const messageId = uuidv4();

    const processingContent: ProcessingMessageContent = {
      title,
      isExpanded: true,
      flow: {
        id: uuidv4(),
        steps: [],
        currentStepIndex: 0,
        totalSteps: 0,
        startTime: new Date(),
        isCompleted: false,
        hasError: false,
      },
    };

    const processingMessage: ChatMessage = {
      id: messageId,
      type: MESSAGE_TYPES.PROCESSING,
      content: processingContent,
      timestamp: new Date(),
      status: MESSAGE_STATUS.PROCESSING,
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, processingMessage],
      lastActivity: new Date(),
    }));

    return messageId;
  }, []);

  /**
   * 添加图表结果消息
   */
  const addChartResultMessage = useCallback((chartResult: ChartResultContent) => {
    const messageId = uuidv4();

    const chartMessage: ChatMessage = {
      id: messageId,
      type: MESSAGE_TYPES.CHART_RESULT,
      content: chartResult,
      timestamp: new Date(),
      status: MESSAGE_STATUS.COMPLETED,
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, chartMessage],
      currentChart: chartResult,
      lastActivity: new Date(),
    }));

    return messageId;
  }, []);

  /**
   * 更新图表结果消息
   */
  const updateChartResultMessage = useCallback((updatedChart: ChartResultContent) => {
    console.log("📝 [ChatSession] 收到图表消息更新请求:", {
      title: updatedChart.title,
      hasImageUrl: !!updatedChart.imageInfo?.localBlobUrl,
    });

    setSession(prev => {

      // 🚨 修复：只更新最新的图表消息，而不是基于title+chartType匹配
      // 这样可以避免旧图表数据覆盖新图表数据的问题
      const chartMessages = prev.messages.filter(msg => msg.type === MESSAGE_TYPES.CHART_RESULT);
      const latestChartMessage = chartMessages[chartMessages.length - 1]; // 获取最新的图表消息


      const updatedMessages = prev.messages.map(msg => {
        if (msg.type === MESSAGE_TYPES.CHART_RESULT && msg.id === latestChartMessage?.id) {

          return {
            ...msg,
            content: updatedChart,
            timestamp: new Date(),
          };
        }
        return msg;
      });

      const hasUpdated =
        latestChartMessage &&
        updatedMessages.some(
          (msg, index) => msg !== prev.messages[index] && msg.type === MESSAGE_TYPES.CHART_RESULT
        );

      if (!hasUpdated) {
        console.warn("⚠️🐛 [ChatSession] 没有找到最新图表消息进行更新，或没有图表消息");
      }

      return {
        ...prev,
        messages: updatedMessages,
        currentChart: updatedChart,
        lastActivity: new Date(),
      };
    });
  }, []);

  /**
   * 更新处理消息
   */
  const updateProcessingMessage = useCallback(
    (messageId: string, updates: Partial<ProcessingMessageContent>) => {
      setSession(prev => ({
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id === messageId && msg.type === MESSAGE_TYPES.PROCESSING) {
            return {
              ...msg,
              content: {
                ...msg.content,
                ...updates,
              },
            };
          }
          return msg;
        }),
        lastActivity: new Date(),
      }));
    },
    []
  );

  /**
   * 切换处理消息的展开状态
   */
  const toggleProcessingExpanded = useCallback((messageId: string) => {
    setSession(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.id === messageId && msg.type === MESSAGE_TYPES.PROCESSING) {
          return {
            ...msg,
            content: {
              ...msg.content,
              isExpanded: !msg.content.isExpanded,
            },
          };
        }
        return msg;
      }),
    }));
  }, []);

  /**
   * 清空所有消息
   */
  const clearMessages = useCallback(() => {
    setSession(prev => ({
      ...prev,
      messages: [],
      currentChart: undefined,
      lastActivity: new Date(),
    }));
  }, []);

  /**
   * 设置加载状态
   */
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  /**
   * 从结构化数据加载会话
   */
  const loadSessionFromData = useCallback((sessionData: SingleChatSession) => {
    setSession({
      ...sessionData,
      lastActivity: new Date(),
    });
  }, []);

  /**
   * 生成并更新会话标题
   */
  const generateAndUpdateTitle = useCallback(async () => {
    console.log("🏷️ [ChatSession] 生成会话标题");

    try {
      const newTitle = await generateSessionTitle(session);

      setSession(prev => ({
        ...prev,
        title: newTitle,
        lastActivity: new Date(),
      }));

      console.log(`✅ [ChatSession] 标题生成成功: "${newTitle}"`);
      return newTitle;
    } catch (error) {
      console.error("❌ [ChatSession] 标题生成失败:", error);
      return null;
    }
  }, [session]);

  /**
   * 导出会话数据
   */
  const exportSession = useCallback(
    async (options?: {
      includeFiles?: boolean;
      includeCharts?: boolean;
      format?: "json" | "compressed";
    }) => {
      console.log("📤 [ChatSession] 导出会话数据:", session.id);

      try {
        const exportResult = await exportSessionData(session, options);
        return {
          success: true,
          data: exportResult.sessionData,
          size: exportResult.exportSize,
        };
      } catch (error) {
        console.error("❌ [ChatSession] 会话导出失败:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [session]
  );

  /**
   * 从导出数据恢复会话
   */
  const loadFromExportData = useCallback(async (exportData: SerializableChatSession) => {
    console.log("📥 [ChatSession] 从导出数据恢复会话:", exportData.id);

    try {
      const restoredSession = await deserializeSession(exportData);
      setSession({
        ...restoredSession,
        lastActivity: new Date(),
      });

      console.log("✅ [ChatSession] 会话恢复成功");
      return true;
    } catch (error) {
      console.error("❌ [ChatSession] 会话恢复失败:", error);
      return false;
    }
  }, []);

  /**
   * 保存会话到持久存储
   */
  const saveSessionToStorage = useCallback(async () => {
    if (!autoSaveEnabled) return;

    console.log("💾 [ChatSession] 保存会话到存储:", session.id);

    try {
      const storageService = getSessionStorageService();
      if (storageService) {
        await storageService.saveSession(session.id, session);
        console.log("✅ [ChatSession] 会话保存成功");
      } else {
        console.warn("⚠️ [ChatSession] 存储服务在当前环境中不可用，跳过保存");
      }
    } catch (error) {
      console.error("❌ [ChatSession] 会话保存失败:", error);
    }
  }, [session, autoSaveEnabled]);

  /**
   * 从存储加载会话
   */
  const loadSessionFromStorage = useCallback(async (sessionId: string) => {
    console.log("📖 [ChatSession] 从存储加载会话:", sessionId);

    try {
      const storageService = getSessionStorageService();
      if (!storageService) {
        console.warn("⚠️ [ChatSession] 存储服务在当前环境中不可用");
        return false;
      }
      const storedSession = await storageService.getSession(sessionId);
      if (storedSession) {
        setSession({
          ...storedSession,
          lastActivity: new Date(),
        });
        console.log("✅ [ChatSession] 会话加载成功");
        return true;
      } else {
        console.log("⚠️ [ChatSession] 会话不存在:", sessionId);
        return false;
      }
    } catch (error) {
      console.error("❌ [ChatSession] 会话加载失败:", error);
      return false;
    }
  }, []);

  /**
   * 处理自动触发
   */
  const handleAutoTrigger = useCallback(async () => {
    console.log("⚡ [ChatSession] 检查自动触发");

    try {
      const result = await autoTriggerHandler.checkPendingSessions();

      if (result.sessionRestored && result.restoredSession) {
        // 恢复会话
        setSession({
          ...result.restoredSession,
          lastActivity: new Date(),
        });

        if (result.triggerExecuted && result.restoredSession._autoTrigger?.enabled) {
          // 执行自动AI处理
          const processingId = addProcessingMessage("Processing your request...");

          // 用于捕获图表结果的变量
          let generatedChartResult: ChartResultContent | null = null;

          const success = await autoTriggerHandler.executeAutoProcessing(
            result.restoredSession,
            processingId,
            (messageId, updates) => updateProcessingMessage(messageId, updates),
            chartResult => {
              addChartResultMessage(chartResult);
              generatedChartResult = chartResult; // 捕获图表结果
              console.log("📊 [ChatSession] 自动触发生成图表:", chartResult.title);
            }
          );

          if (success) {
            console.log("✅ [ChatSession] 自动触发执行成功");
            // 生成会话标题
            await generateAndUpdateTitle();

            // 返回包含图表结果的结果
            return {
              ...result,
              chartResult: generatedChartResult,
            };
          } else {
            console.error("❌ [ChatSession] 自动触发执行失败");
          }
        }
      }

      return result;
    } catch (error) {
      console.error("❌ [ChatSession] 自动触发处理失败:", error);
      return {
        success: false,
        sessionRestored: false,
        triggerExecuted: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [
    addProcessingMessage,
    updateProcessingMessage,
    addChartResultMessage,
    generateAndUpdateTitle,
  ]);

  /**
   * 开始Demo重放
   */
  const startDemoReplay = useCallback(async () => {
    if (!session._demoReplay?.enabled) {
      console.warn("⚠️ [ChatSession] 当前会话未配置Demo重放");
      return false;
    }

    console.log("🎬 [ChatSession] 开始Demo重放");

    try {
      await autoTriggerHandler.startDemoReplay(session.id, session._demoReplay, {
        onStepUpdate: (step, stepIndex) => {
          console.log(`🎬 [ChatSession] Demo步骤 ${stepIndex + 1}: ${step.type}`);

          // 根据步骤类型执行相应操作
          switch (step.type) {
            case "add_processing_message":
              addProcessingMessage(step.data.title);
              break;
            case "add_chart_result":
              addChartResultMessage(step.data);
              break;
            default:
              console.log(`🎬 [ChatSession] Demo步骤数据:`, step.data);
          }
        },
        onComplete: () => {
          console.log("🎉 [ChatSession] Demo重放完成");
        },
      });

      return true;
    } catch (error) {
      console.error("❌ [ChatSession] Demo重放失败:", error);
      return false;
    }
  }, [session, addProcessingMessage, addChartResultMessage]);

  /**
   * 创建新会话
   */
  const createNewSession = useCallback(
    (options?: {
      source?: SingleChatSession["source"];
      autoTrigger?: AutoTriggerConfig;
      demoReplay?: DemoReplayConfig;
    }) => {
      const newSession: SingleChatSession = {
        id: uuidv4(),
        title: undefined,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        version: "1.0",
        source: options?.source || "dashboard",
        _autoTrigger: options?.autoTrigger,
        _demoReplay: options?.demoReplay,
      };

      setSession(newSession);
      console.log("✨ [ChatSession] 创建新会话:", newSession.id);

      return newSession.id;
    },
    []
  );

  /**
   * 更新会话配置
   */
  const updateSessionConfig = useCallback((updates: Partial<SingleChatSession>) => {
    setSession(prev => ({
      ...prev,
      ...updates,
      lastActivity: new Date(),
    }));
  }, []);

  // 自动保存会话（当消息发生变化时）
  useEffect(() => {
    if (session.messages.length > 0 && autoSaveEnabled) {
      const timeoutId = setTimeout(() => {
        saveSessionToStorage();
      }, 1000); // 1秒延迟保存，避免频繁保存

      return () => clearTimeout(timeoutId);
    }
  }, [session.messages, saveSessionToStorage, autoSaveEnabled]);

  // 当会话有图表生成时，自动生成标题
  useEffect(() => {
    if (session.currentChart && !session.title && session.messages.length > 0) {
      generateAndUpdateTitle();
    }
  }, [session.currentChart, session.title, session.messages.length, generateAndUpdateTitle]);

  return {
    // 基础功能
    session,
    isLoading,
    addUserMessage,
    addProcessingMessage,
    addChartResultMessage,
    updateChartResultMessage,
    updateProcessingMessage,
    toggleProcessingExpanded,
    clearMessages,
    setLoadingState,
    loadSessionFromData,

    // 扩展功能
    generateAndUpdateTitle,
    exportSession,
    loadFromExportData,
    saveSessionToStorage,
    loadSessionFromStorage,
    handleAutoTrigger,
    startDemoReplay,
    createNewSession,
    updateSessionConfig,

    // 配置
    autoSaveEnabled,
    setAutoSaveEnabled,
  };
}

/**
 * 根据文件类型确定附件类型
 */
function getFileType(file: File): FileAttachment["type"] {
  const extension = file.name.toLowerCase().split(".").pop();

  switch (extension) {
    case "xlsx":
    case "xls":
      return "excel";
    case "csv":
      return "csv";
    case "json":
      return "json";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "image";
    default:
      return "excel"; // 默认类型
  }
}
