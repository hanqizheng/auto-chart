"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChartPreview } from "@/components/chart-preview";
import { ChartGenerationResult } from "@/types/ai";
import { UploadedFile } from "@/types/chat";
import { ExportFormat } from "@/types/common";

export default function Home() {
  const [currentChart, setCurrentChart] = useState<ChartGenerationResult | undefined>();

  const handleChartGenerate = (chartData: ChartGenerationResult) => {
    setCurrentChart(chartData);
  };

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
    <MainLayout
      chatPanel={
        <ChatPanel onChartGenerate={handleChartGenerate} onMessageSend={handleMessageSend} />
      }
      chartPanel={
        <ChartPreview
          chartData={currentChart}
          onExport={handleChartExport}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}
