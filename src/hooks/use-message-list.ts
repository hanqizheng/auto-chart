"use client";

import { useState, useCallback } from "react";
import {
  ChatMessage,
  UserMessage,
  ProcessingMessage,
  ChartResultMessage,
  UserMessageContent,
  ProcessingMessageContent,
  ChartResultContent,
  FileAttachment,
  MessageStatus,
  UserMessageSubtype,
} from "@/types/message";
import { ChartType } from "@/types/chart";
import {
  ATTACHMENT_TYPES,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  USER_MESSAGE_SUBTYPES,
} from "@/constants/message";
import { ProcessingStep, StepUpdateParams, ProcessingFlow } from "@/types/processing";
import { LocalImageInfo } from "@/types/storage";
import { UploadedFile } from "@/types/chat";

interface UseMessageListProps {
  initialMessages?: ChatMessage[];
  maxMessages?: number;
}

interface UseMessageListReturn {
  messages: ChatMessage[];
  isLoading: boolean;

  // 消息操作
  addUserMessage: (content: string, files?: UploadedFile[]) => string;
  addProcessingMessage: (title: string) => string;
  addImageResultMessage: (
    imageUrl: string,
    chartData: any[],
    metadata: { title: string; chartType?: string; dataPoints?: number; [key: string]: any }
  ) => string;

  // 处理步骤操作
  updateProcessingStep: (params: StepUpdateParams) => void;
  addProcessingStep: (messageId: string, step: Omit<ProcessingStep, "id">) => string;
  completeProcessing: (messageId: string) => void;

  // UI 操作
  toggleProcessingExpanded: (messageId: string) => void;
  clearMessages: () => void;
  removeMessage: (messageId: string) => void;

  // 工具函数
  findMessage: <T extends ChatMessage>(id: string) => T | undefined;
  getMessagesByType: <T extends ChatMessage>(type: ChatMessage["type"]) => T[];
}

export function useMessageList({
  initialMessages = [],
  maxMessages = 100,
}: UseMessageListProps = {}): UseMessageListReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 生成步骤ID
  const generateStepId = useCallback(() => {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 添加用户消息
  const addUserMessage = useCallback(
    (content: string, files?: UploadedFile[]): string => {
      const id = generateId();

      // 转换文件为新的附件格式
      const attachments: FileAttachment[] =
        files?.map(file => ({
          id: file.id,
          name: file.name,
          type:
            file.type.includes("excel") || file.type.includes("spreadsheet")
              ? ATTACHMENT_TYPES.EXCEL
              : file.type.includes("csv")
                ? ATTACHMENT_TYPES.CSV
                : file.type.includes("json")
                  ? ATTACHMENT_TYPES.JSON
                  : file.type.includes("image")
                    ? ATTACHMENT_TYPES.IMAGE
                    : ATTACHMENT_TYPES.EXCEL,
          size: file.size,
          file: file as any, // Cast to File for now
          uploadedAt: file.uploadedAt || new Date(),
        })) || [];

      const messageContent: UserMessageContent = {
        text: content,
        subtype:
          attachments.length > 0
            ? content.trim()
              ? USER_MESSAGE_SUBTYPES.MIXED
              : USER_MESSAGE_SUBTYPES.FILE_UPLOAD
            : USER_MESSAGE_SUBTYPES.TEXT,
        attachments,
      };

      const userMessage: UserMessage = {
        id,
        type: MESSAGE_TYPES.USER,
        content: messageContent,
        timestamp: new Date(),
        status: MESSAGE_STATUS.SENT,
      };

      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages;
      });

      return id;
    },
    [generateId, maxMessages]
  );

  // 添加处理过程消息
  const addProcessingMessage = useCallback(
    (title: string): string => {
      const id = generateId();
      const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const processingFlow: ProcessingFlow = {
        id: flowId,
        steps: [],
        currentStepIndex: 0,
        totalSteps: 0,
        startTime: new Date(),
        isCompleted: false,
        hasError: false,
      };

      const messageContent: ProcessingMessageContent = {
        flow: processingFlow,
        title,
        isExpanded: true,
      };

      const processingMessage: ProcessingMessage = {
        id,
        type: MESSAGE_TYPES.PROCESSING,
        content: messageContent,
        timestamp: new Date(),
        status: MESSAGE_STATUS.PROCESSING,
      };

      setMessages(prev => [...prev, processingMessage]);
      return id;
    },
    [generateId]
  );

  // 添加图片结果消息
  const addImageResultMessage = useCallback(
    (
      imageUrl: string,
      chartData: any[],
      metadata: { title: string; chartType?: string; dataPoints?: number; [key: string]: any }
    ): string => {
      const id = generateId();

      const chartResultContent: ChartResultContent = {
        chartData,
        chartConfig: {}, // Empty for now, could be populated based on chart type
        chartType: (metadata.chartType as any) || "bar", // Default to bar chart
        title: metadata.title,
        description: metadata.description,
        imageInfo: {
          filename: `chart_${Date.now()}.png`,
          localBlobUrl: imageUrl,
          size: 0, // Size not available in this context
          format: "png",
          dimensions: { width: 800, height: 600 }, // Default dimensions
          createdAt: new Date(),
          metadata: {
            chartType: metadata.chartType as ChartType,
            dataPoints: metadata.dataPoints || chartData.length,
            exportMethod: "screenshot",
          },
        },
      };

      const chartMessage: ChartResultMessage = {
        id,
        type: MESSAGE_TYPES.CHART_RESULT,
        content: chartResultContent,
        timestamp: new Date(),
        status: MESSAGE_STATUS.COMPLETED,
      };

      setMessages(prev => [...prev, chartMessage]);
      return id;
    },
    [generateId]
  );

  // 更新处理步骤
  const updateProcessingStep = useCallback(({ stepId, updates }: StepUpdateParams) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.type === MESSAGE_TYPES.PROCESSING) {
          const processingMsg = msg as ProcessingMessage;
          return {
            ...processingMsg,
            content: {
              ...processingMsg.content,
              flow: {
                ...processingMsg.content.flow,
                steps: processingMsg.content.flow.steps.map(step =>
                  step.id === stepId ? { ...step, ...updates } : step
                ),
              },
            },
          };
        }
        return msg;
      })
    );
  }, []);

  // 添加处理步骤
  const addProcessingStep = useCallback(
    (messageId: string, stepData: Omit<ProcessingStep, "id">): string => {
      const stepId = generateStepId();
      const newStep: ProcessingStep = {
        ...stepData,
        id: stepId,
        startTime: stepData.startTime || new Date(),
      };

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId && msg.type === MESSAGE_TYPES.PROCESSING) {
            const processingMsg = msg as ProcessingMessage;
            return {
              ...processingMsg,
              content: {
                ...processingMsg.content,
                flow: {
                  ...processingMsg.content.flow,
                  steps: [...processingMsg.content.flow.steps, newStep],
                  totalSteps: processingMsg.content.flow.steps.length + 1,
                  currentStepIndex: processingMsg.content.flow.steps.length,
                },
              },
            };
          }
          return msg;
        })
      );

      return stepId;
    },
    [generateStepId]
  );

  // 完成处理
  const completeProcessing = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.type === MESSAGE_TYPES.PROCESSING) {
          const processingMsg = msg as ProcessingMessage;
          return {
            ...processingMsg,
            content: {
              ...processingMsg.content,
              flow: {
                ...processingMsg.content.flow,
                isCompleted: true,
                endTime: new Date(),
                steps: processingMsg.content.flow.steps.map(step =>
                  step.status === "running"
                    ? { ...step, status: "completed" as const, endTime: new Date() }
                    : step
                ),
              },
            },
            status: MESSAGE_STATUS.COMPLETED,
          };
        }
        return msg;
      })
    );
  }, []);

  // 切换展开/收起
  const toggleProcessingExpanded = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.type === MESSAGE_TYPES.PROCESSING) {
          const processingMsg = msg as ProcessingMessage;
          return {
            ...processingMsg,
            content: {
              ...processingMsg.content,
              isExpanded: !processingMsg.content.isExpanded,
            },
          };
        }
        return msg;
      })
    );
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 删除消息
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // 查找消息
  const findMessage = useCallback(
    <T extends ChatMessage>(id: string): T | undefined => {
      return messages.find(msg => msg.id === id) as T | undefined;
    },
    [messages]
  );

  // 按类型获取消息
  const getMessagesByType = useCallback(
    <T extends ChatMessage>(type: ChatMessage["type"]): T[] => {
      return messages.filter(msg => msg.type === type) as T[];
    },
    [messages]
  );

  return {
    messages,
    isLoading,

    // 消息操作
    addUserMessage,
    addProcessingMessage,
    addImageResultMessage,

    // 处理步骤操作
    updateProcessingStep,
    addProcessingStep,
    completeProcessing,

    // UI 操作
    toggleProcessingExpanded,
    clearMessages,
    removeMessage,

    // 工具函数
    findMessage,
    getMessagesByType,
  };
}
