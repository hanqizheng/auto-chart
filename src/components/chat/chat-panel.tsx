"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
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

  const parseExcelFile = async (file: File): Promise<{ data: any[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            resolve({ data: [], headers: [] });
            return;
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          const parsedData = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve({ data: parsedData, headers });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processAIResponse = useCallback(
    async (userMessage: string, files: UploadedFile[]) => {
      try {
        // Convert UploadedFile objects to File objects for AI service
        const fileObjects: File[] = files.map(f => f.data as File).filter(Boolean);

        // Parse file data if files exist
        const fileDataPromises = files.map(async (f) => {
          if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
            try {
              const { data, headers } = await parseExcelFile(f.data as File);
              return {
                name: f.name,
                data,
                headers,
                rowCount: data.length,
                fileType: f.type,
              };
            } catch (error) {
              console.error(`解析文件 ${f.name} 失败:`, error);
              return {
                name: f.name,
                data: [],
                headers: [],
                rowCount: 0,
                fileType: f.type,
              };
            }
          }
          return {
            name: f.name,
            data: [],
            headers: [],
            rowCount: 0,
            fileType: f.type,
          };
        });

        const fileData = await Promise.all(fileDataPromises);

        // Build context data from conversation history and files
        const contextData = {
          fileData,
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
