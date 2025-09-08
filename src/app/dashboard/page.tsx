"use client";

import { useState } from "react";
import Link from "next/link";
import { TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChartPreview } from "@/components/chart-preview";
import { ChartGenerationResult } from "@/lib/ai-chart-system";
import { UploadedFile } from "@/types/chat";
import { ExportFormat } from "@/types/common";

export default function Home() {
  const [currentChart, setCurrentChart] = useState<ChartGenerationResult | undefined>();

  const handleChartGenerate = (chartData: ChartGenerationResult) => {
    setCurrentChart(chartData);
  };

  // 转换为ChartPreview期望的格式
  const chartPreviewData = currentChart
    ? {
        type: currentChart.chartType,
        data: currentChart.data,
        title: currentChart.title,
        description: currentChart.description,
      }
    : undefined;

  const handleMessageSend = (message: string, files: UploadedFile[]) => {
    console.log("Message sent:", message, "Files:", files);
  };

  const handleChartExport = (format: ExportFormat) => {
    console.log("Exporting chart as:", format);
    // TODO: Implement actual export functionality
  };

  const handleRefresh = () => {
    setCurrentChart(undefined);
  };

  return (
    <div className="relative">
      <MainLayout
        chatPanel={
          <ChatPanel onChartGenerate={handleChartGenerate} onMessageSend={handleMessageSend} />
        }
        chartPanel={
          <ChartPreview
            chartData={chartPreviewData}
            onExport={handleChartExport}
            onRefresh={handleRefresh}
          />
        }
      />
      
      {/* TODO: 开发者测试按钮 */}
      <div className="fixed bottom-20 left-4 z-50">
        <Link href="/test-export">
          <Button
            variant="outline"
            size="sm"
            className="shadow-lg border-dashed border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-700"
          >
            <TestTube className="mr-2 h-4 w-4" />
            导出测试
          </Button>
        </Link>
      </div>
    </div>
  );
}
