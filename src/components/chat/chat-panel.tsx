"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatMessage, UploadedFile } from "@/types/chat";
import { generateChart, AIChartError, ChartGenerationResult } from "@/lib/ai-chart-system";

interface ChatPanelProps {
  onMessageSend?: (message: string, files: UploadedFile[]) => void;
  onChartGenerate?: (data: ChartGenerationResult) => void;
}

export function ChatPanel({ onMessageSend, onChartGenerate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const t = useTranslations();

  const processAIResponse = useCallback(
    async (userMessage: string, files: UploadedFile[]) => {
      try {
        console.log("🚀 [ChatPanel] 开始处理AI请求:", {
          message: userMessage,
          fileCount: files.length,
        });

        // 转换文件格式为新系统需要的格式
        const fileObjects: File[] = files.map(f => f.data as File).filter(Boolean);

        // 使用新的AI图表系统
        const result = await generateChart({
          prompt: userMessage,
          files: fileObjects,
        });

        if (result.success) {
          // 成功生成图表
          console.log("✅ [ChatPanel] 图表生成成功:", result.chartType);

          // 直接传递新的统一格式结果
          onChartGenerate?.(result);

          // 生成AI响应消息
          const responseMessage = generateSuccessMessage(result, userMessage, files.length);
          return responseMessage;
        } else {
          // 处理失败情况
          console.error("❌ [ChatPanel] 图表生成失败:", result.error);
          throw result.error;
        }
      } catch (error) {
        console.error("❌ [ChatPanel] AI处理失败:", error);

        if (error instanceof AIChartError) {
          // 专业错误处理
          throw new Error(formatAIChartError(error));
        } else {
          throw new Error("图表生成过程中出现错误，请稍后重试");
        }
      }
    },
    [onChartGenerate]
  );

  /**
   * 生成成功响应消息
   */
  const generateSuccessMessage = (
    result: ChartGenerationResult,
    prompt: string,
    fileCount: number
  ): string => {
    let message = `我已经为您生成了一个${getChartTypeName(result.chartType)}。\n\n`;

    message += `**${result.title}**\n`;
    message += `${result.description}\n\n`;

    // 添加关键洞察
    if (result.insights.length > 0) {
      message += "**关键洞察：**\n";
      result.insights.slice(0, 3).forEach((insight, index) => {
        message += `${index + 1}. ${insight}\n`;
      });
      message += "\n";
    }

    // 添加数据来源信息
    if (fileCount > 0) {
      message += `数据来源：已上传的 ${fileCount} 个文件`;
    } else {
      message += "数据来源：从您的描述中提取";
    }

    message += `\n处理时间：${result.metadata.processingTime}ms`;

    return message;
  };

  /**
   * 格式化AI图表错误
   */
  const formatAIChartError = (error: AIChartError): string => {
    let message = error.message;

    // 根据失败阶段提供更具体的指导
    switch (error.stage) {
      case "input_validation":
        message += "\n\n💡 **建议：**\n";
        message += "• 请检查输入的描述或文件格式\n";
        message += "• 确保文件为Excel (.xlsx, .xls) 或CSV格式";
        break;

      case "data_extraction":
        message += "\n\n💡 **建议：**\n";
        message += "• 请提供更明确的数据信息\n";
        message += "• 如果使用文件，请确保包含有效的数值数据\n";
        message += "• 尝试提供具体的数字、表格或数据列表";
        break;

      case "intent_analysis":
        message += "\n\n💡 **建议：**\n";
        message += "• 请提供更具体的图表需求描述\n";
        message += "• 明确指出要对比、分析或展示的内容";
        break;

      case "chart_generation":
        message += "\n\n💡 **建议：**\n";
        message += "• 请检查数据格式和完整性\n";
        message += "• 尝试简化数据或调整图表要求";
        break;
    }

    return message;
  };

  /**
   * 获取图表类型中文名称
   */
  const getChartTypeName = (chartType: string): string => {
    const names: Record<string, string> = {
      bar: "柱状图",
      line: "折线图",
      pie: "饼图",
      area: "面积图",
    };
    return names[chartType] || "图表";
  };

  const handleSendMessage = useCallback(
    async (message: string, files: UploadedFile[]) => {
      if (isLoading) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: "user",
        content: message,
        timestamp: new Date(),
        files: files.length > 0 ? files : undefined,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Call external handler if provided
        onMessageSend?.(message, files);

        // Process AI response
        const aiResponse = await processAIResponse(message, files);

        // Add AI response
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error processing message:", error);

        // Add error message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "assistant",
          content: t("errors.aiError"),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsCancelling(false);
      }
    },
    [isLoading, onMessageSend, processAIResponse, t]
  );

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    // TODO: Implement actual cancellation logic
    setTimeout(() => {
      setIsLoading(false);
      setIsCancelling(false);
    }, 500);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ChatMessages messages={messages} isLoading={isLoading} />

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onCancel={handleCancel}
        isLoading={isLoading}
        isCancelling={isCancelling}
      />
    </div>
  );
}
