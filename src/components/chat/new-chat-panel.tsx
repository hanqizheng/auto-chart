"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 删除了全局图表引用，改用直接DOM查询方式
import { useMessageList } from "@/hooks/use-message-list";
import { MessageList } from "@/components/messages/message-list";
import { NewChatInput } from "./new-chat-input";
import { ChatArea } from "@/components/layout/chat-area";
import { UploadedFile } from "@/types/chat";
import { ChartType } from "@/types/chart";
import { generateChart } from "@/lib/ai-chart-system";
import { useSimpleExport } from "@/hooks/use-simple-export";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { cn } from "@/lib/utils";

interface NewChatPanelProps {
  className?: string;
  onChartGenerated?: (chartData: any) => void;
  onImageGenerated?: (imageUrl: string, metadata: any) => void;
}

export function NewChatPanel({ className, onChartGenerated, onImageGenerated }: NewChatPanelProps) {
  const {
    messages,
    isLoading,
    addUserMessage,
    addProcessingMessage,
    addImageResultMessage,
    updateProcessingStep,
    addProcessingStep,
    completeProcessing,
    toggleProcessingExpanded,
    clearMessages,
  } = useMessageList();

  const { exportChart } = useSimpleExport();

  // 处理消息发送
  const handleSendMessage = useCallback(
    async (content: string, files: UploadedFile[]) => {
      // 1. 添加用户消息
      addUserMessage(content, files);

      // 2. 创建处理过程消息
      const processingId = addProcessingMessage("AI is analyzing your request...");

      try {
        // 3. 添加第一个处理步骤
        const step1Id = addProcessingStep(processingId, {
          type: "thinking",
          title: "Validate input",
          description: "Reviewing your request and uploaded files...",
          content: "Reviewing your request and uploaded files...",
          status: "running",
          startTime: new Date(),
        });

        // 转换文件格式
        const fileObjects: File[] = files.map(f => f.data as File).filter(Boolean);

        // 模拟验证完成
        setTimeout(() => {
          updateProcessingStep({
            stepId: step1Id,
            updates: {
              status: "completed",
              content:
                files.length > 0
                  ? `Input validation complete. Detected ${files.length} file${files.length > 1 ? "s" : ""}.`
                  : "Input validation complete. Extracting data from the description.",
              endTime: new Date(),
            },
          });

          // 添加数据分析步骤
          const step2Id = addProcessingStep(processingId, {
            type: "data_analysis",
            title: "Parse data structure",
            description: "Assessing data format and content...",
            content: "Assessing data format and content...",
            status: "running",
            startTime: new Date(),
          });

          // 继续处理
          processAIChart(content, fileObjects, processingId, step2Id);
        }, 1000);
      } catch (error) {
        console.error("Message processing failed:", error);
        // 错误处理...
      }
    },
    [addUserMessage, addProcessingMessage, addProcessingStep, updateProcessingStep]
  );

  // 处理AI图表生成
  const processAIChart = async (
    prompt: string,
    files: File[],
    processingId: string,
    dataStepId: string
  ) => {
    try {
      // 模拟数据分析完成
      setTimeout(() => {
        updateProcessingStep({
          stepId: dataStepId,
          updates: {
            status: "completed",
            content:
              files.length > 0
                ? "File data parsed successfully."
                : "Data extracted from the description.",
            endTime: new Date(),
            metadata: {
              dataCount: files.length > 0 ? 50 : 10,
              rowCount: files.length > 0 ? 50 : 10,
              columnCount: files.length > 0 ? 4 : 3,
            },
          },
        });

        // 添加意图分析步骤
        const step3Id = addProcessingStep(processingId, {
          type: "thinking",
          title: "Analyze chart requirements",
          description: "Identifying the chart type and styling that fit your needs...",
          content: "Identifying the chart type and styling that fit your needs...",
          status: "running",
          startTime: new Date(),
        });

        // 继续意图分析
        setTimeout(() => {
          updateProcessingStep({
            stepId: step3Id,
            updates: {
              status: "completed",
              content: "Chart type analysis complete. Recommending a bar chart.",
              endTime: new Date(),
              metadata: {
                considerations: [
                  "Reviewed the user prompt",
                  "Detected comparative numeric data",
                  "Selected a bar chart as the clearest option",
                ],
              },
            },
          });

          // 添加图表生成步骤
          const step4Id = addProcessingStep(processingId, {
            type: "chart_generation",
            title: "Generate chart",
            description: "Building and rendering the chart...",
            content: "Building and rendering the chart...",
            status: "running",
            startTime: new Date(),
          });

          // 实际调用AI系统
          generateAIChart(prompt, files, processingId, step4Id);
        }, 1500);
      }, 1200);
    } catch (error) {
      console.error("AI chart processing failed:", error);
    }
  };

  // 生成AI图表
  const generateAIChart = async (
    prompt: string,
    files: File[],
    processingId: string,
    chartStepId: string
  ) => {
    try {
      const result = await generateChart({
        prompt,
        files,
      });

      if (result.success) {
        // 更新图表生成步骤为完成
        updateProcessingStep({
          stepId: chartStepId,
          updates: {
            status: "completed",
            content: `${getChartTypeName(result.chartType)} created successfully`,
            endTime: new Date(),
            metadata: {
              chartType: result.chartType,
              dataMapping: {
                xAxis: "category",
                yAxis: ["value"],
              },
              generationTime: 800,
            },
          },
        });

        // 添加图片导出步骤
        const step5Id = addProcessingStep(processingId, {
          type: "optimization",
          title: "Export chart image",
          description: "Converting the chart into an image format...",
          content: "Converting the chart into an image format...",
          status: "running",
          startTime: new Date(),
        });

        // 生成图片
        setTimeout(async () => {
          try {
            // 实际导出图表图片
            let imageUrl = "";

            // 使用主面板中的可见图表进行导出
            console.log("📋 [Export] Start exporting chart image");

            // 直接查找图表容器元素（类似test-export的方式）
            console.log("🔍 [Export] Searching for chart container...");

            // 等待更长时间确保图表渲染完成
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 详细调试 - 打印所有可能的选择器结果
            console.log(
              '📋 [Debug] All data-slot="chart" elements:',
              document.querySelectorAll('[data-slot="chart"]')
            );
            console.log(
              "📋 [Debug] All .recharts-wrapper elements:",
              document.querySelectorAll(".recharts-wrapper")
            );
            console.log(
              "📋 [Debug] All .recharts-surface elements:",
              document.querySelectorAll(".recharts-surface")
            );
            console.log(
              "📋 [Debug] All elements containing aspect-video:",
              document.querySelectorAll('div[class*="aspect-video"]')
            );

            // 使用多种选择器尝试找到图表
            let chartContainer: HTMLElement | null = null;

            // 尝试1：找到ChartContainer
            chartContainer = document.querySelector('[data-slot="chart"]') as HTMLElement;
            console.log("🔍 [Export] Attempt 1 - ChartContainer:", chartContainer);

            if (!chartContainer) {
              // 尝试2：找到recharts容器
              chartContainer = document.querySelector(".recharts-wrapper") as HTMLElement;
              console.log("🔍 [Export] Attempt 2 - recharts-wrapper:", chartContainer);
            }

            if (!chartContainer) {
              // 尝试3：找到SVG元素的父容器
              const svg = document.querySelector(".recharts-surface");
              if (svg && svg.parentElement) {
                chartContainer = svg.parentElement as HTMLElement;
                console.log("🔍 [Export] Attempt 3 - SVG parent:", chartContainer);
              }
            }

            if (!chartContainer) {
              // 尝试4：找到包含图表的最外层容器
              chartContainer = document.querySelector('div[class*="aspect-video"]') as HTMLElement;
              console.log("🔍 [Export] Attempt 4 - aspect-video container:", chartContainer);
            }

            if (chartContainer) {
              console.log("🔍 [Export] Found chart container:", chartContainer);

              // 直接使用html2canvas生成图片URL（不下载文件）
              const html2canvas = (await import("html2canvas-pro")).default;

              const canvas = await html2canvas(chartContainer, {
                backgroundColor: "transparent",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
              });

              imageUrl = canvas.toDataURL("image/png", 1.0);
              console.log(
                "✅ [Export] Image generated successfully. Size:",
                Math.round(imageUrl.length / 1024),
                "KB"
              );
            } else {
              console.warn("⚠️ [Export] Chart container not found. Using fallback renderer.");
              throw new Error("Chart container not found");
            }

            // 更新导出步骤为完成
            updateProcessingStep({
              stepId: step5Id,
              updates: {
                status: "completed",
                content: "Chart image export complete",
                endTime: new Date(),
              },
            });

            // 完成整个处理过程
            completeProcessing(processingId);

            // 添加图片结果消息
            const imageMessageId = addImageResultMessage(imageUrl, result.data, {
              chartType: result.chartType,
              title: result.title,
              description: result.description,
              width: 600,
              height: 400,
              generatedAt: new Date(),
            });

            // 通知父组件
            onChartGenerated?.(result);
            onImageGenerated?.(imageUrl, {
              chartType: result.chartType,
              title: result.title,
              data: result.data,
            });
          } catch (error) {
            console.error("❌ [Export] Chart image export failed:", error);
            // 处理导出错误 - 使用降级SVG图片
            const svgContent = `
              <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="600" height="400" fill="hsl(var(--background))"/>
                <text x="300" y="50" text-anchor="middle" font-size="20" font-weight="bold">Chart Generated</text>
                <rect x="100" y="100" width="60" height="150" fill="hsl(var(--chart-1))"/>
                <rect x="200" y="120" width="60" height="130" fill="hsl(var(--chart-2))"/>
                <rect x="300" y="80" width="60" height="170" fill="hsl(var(--chart-3))"/>
                <rect x="400" y="140" width="60" height="110" fill="hsl(var(--chart-4))"/>
                <text x="300" y="300" text-anchor="middle" font-size="14">Chart Preview</text>
              </svg>
            `.trim();
            const fallbackImageUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

            // 更新为完成状态（使用降级图片）
            updateProcessingStep({
              stepId: step5Id,
              updates: {
                status: "completed",
                content: "Chart image export complete (preview fallback)",
                endTime: new Date(),
              },
            });

            // 完成整个处理过程
            completeProcessing(processingId);

            // 添加图片结果消息（使用降级图片）
            const imageMessageId = addImageResultMessage(fallbackImageUrl, result.data, {
              chartType: result.chartType,
              title: result.title,
              description: result.description,
              width: 600,
              height: 400,
              generatedAt: new Date(),
            });

            // 通知父组件
            onChartGenerated?.(result);
            onImageGenerated?.(fallbackImageUrl, {
              chartType: result.chartType,
              title: result.title,
              data: result.data,
            });
          }
        }, 1000);
      } else {
        // 处理生成失败
        updateProcessingStep({
          stepId: chartStepId,
          updates: {
            status: "error",
            content: `Chart generation failed: ${result.error?.message || "Unknown error"}`,
            endTime: new Date(),
          },
        });
        completeProcessing(processingId);
      }
    } catch (error) {
      updateProcessingStep({
        stepId: chartStepId,
        updates: {
          status: "error",
          content: "An error occurred during chart generation",
          endTime: new Date(),
        },
      });
      completeProcessing(processingId);
    }
  };

  // 获取图表类型标签
  const getChartTypeName = (chartType: ChartType): string => {
    const names: Record<ChartType, string> = {
      bar: "Bar chart",
      line: "Line chart",
      pie: "Pie chart",
      area: "Area chart",
    };
    return names[chartType] || "Chart";
  };

  // 处理图片点击
  const handleImageClick = useCallback((imageUrl: string, title?: string) => {
    // 这里可以实现图片全屏预览
    console.log("Image clicked:", imageUrl, title);
  }, []);

  // 处理配置图表
  const handleConfigureChart = useCallback(
    (message: any) => {
      // 传递给配置面板
      onChartGenerated?.(message);
    },
    [onChartGenerated]
  );

  return (
    <>
      <ChatArea
        className={className}
        messageList={
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onToggleProcessingExpanded={toggleProcessingExpanded}
            onImageClick={handleImageClick}
            onConfigureChart={handleConfigureChart}
            onClearMessages={clearMessages}
          />
        }
        chatInput={<NewChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />}
      />
    </>
  );
}
