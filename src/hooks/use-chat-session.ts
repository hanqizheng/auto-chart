"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  SingleChatSession,
  ChatMessage,
  UserMessageContent,
  ProcessingMessageContent,
  ChartResultContent,
  FileAttachment,
} from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";

/**
 * 聊天会话管理 Hook
 * 处理单次对话的消息状态管理
 */
export function useChatSession() {
  // 初始化会话状态
  const [session, setSession] = useState<SingleChatSession>(() => ({
    id: uuidv4(),
    messages: [],
    createdAt: new Date(),
    lastActivity: new Date(),
  }));

  const [isLoading, setIsLoading] = useState(false);

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

  return {
    session,
    isLoading,
    addUserMessage,
    addProcessingMessage,
    addChartResultMessage,
    updateProcessingMessage,
    toggleProcessingExpanded,
    clearMessages,
    setLoadingState,
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
