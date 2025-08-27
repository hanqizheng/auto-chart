"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatMessage, UploadedFile } from "@/types/chat";
import { mockAIService } from "@/lib/mock-ai-service";
import { ChartGenerationResult } from "@/types/ai";

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
        // Convert UploadedFile objects to File objects for AI service
        const fileObjects: File[] = files.map(f => f.data as File).filter(Boolean);

        // Build context data from conversation history and files
        const contextData = {
          fileData: files.map(f => ({
            name: f.name,
            data: [], // TODO: Parse actual file data
            headers: [],
            rowCount: 0,
            fileType: f.type,
          })),
          previousCharts: [], // TODO: Track previous chart generations
          userPreferences: {
            preferredChartTypes: ["bar" as const, "line" as const],
            language: "zh",
          },
        };

        // Create AI request
        const aiRequest = {
          message: userMessage,
          files: fileObjects,
          conversationId: crypto.randomUUID(),
        };

        // Process with mock AI service
        const aiResponse = await mockAIService.processMessage(aiRequest, contextData);

        // If chart data is generated, trigger chart generation
        if (aiResponse.chartData) {
          onChartGenerate?.(aiResponse.chartData);
        }

        return aiResponse.message;
      } catch (error) {
        console.error("Error processing AI response:", error);
        throw new Error("AI processing failed");
      }
    },
    [onChartGenerate]
  );

  const handleSendMessage = useCallback(
    async (message: string, files: UploadedFile[]) => {
      if (isLoading) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: "user",
        content: message,
        timestamp: new Date(),
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
