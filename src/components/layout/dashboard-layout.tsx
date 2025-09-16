"use client";

import { useState } from "react";
import { ChartResultContent } from "@/types";
import { CenteredChatPanel } from "./centered-chat-panel";
import { ChartDisplayArea } from "./chart-display-area";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";
import { useChartExport } from "@/contexts/chart-export-context";

/**
 * 主仪表板布局组件
 * 实现居中聊天面板和滑出式图表展示区域
 */
export function DashboardLayout() {
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [localChart, setLocalChart] = useState<ChartResultContent | null>(null);
  const { currentChart } = useChartExport();

  // 优先使用 ChartExportContext 中的图表，如果没有则使用本地图表
  const displayChart = currentChart || localChart;

  /**
   * 处理图表生成完成事件
   */
  const handleChartGenerated = (chart: ChartResultContent) => {
    console.log("📊 [DashboardLayout] 图表生成完成:", {
      title: chart.title,
      chartType: chart.chartType
    });
    
    setLocalChart(chart);
    setIsChartVisible(true);
  };

  const handleChartUpdated = (chart: ChartResultContent) => {
    setLocalChart(chart);
  };

  /**
   * 处理关闭图表显示
   */
  const handleCloseChart = () => {
    setIsChartVisible(false);
    // 不清空数据，保持图表数据以便重新打开
  };

  /**
   * 处理打开图表显示
   */
  const handleOpenChart = () => {
    if (displayChart) {
      setIsChartVisible(true);
    }
  };

  return (
    <div className="bg-background h-screen overflow-hidden">
      <div className="flex h-full">
        {/* 聊天区域 - 动态宽度 */}
        <div
          className={`bg-background border-border/50 border-r transition-all duration-500 ease-in-out ${
            isChartVisible ? "w-1/2" : "w-full"
          }`}
        >
          <CenteredChatPanel
            onChartGenerated={handleChartGenerated}
            isChartVisible={isChartVisible}
          />
        </div>

        {/* 图表展示区域 - 滑出动画 */}
        {isChartVisible && displayChart && (
          <div className="bg-muted/10 border-border/50 animate-slide-in w-1/2 border-l">
            <ChartDisplayArea
              chart={displayChart}
              onClose={handleCloseChart}
              onUpdateChart={handleChartUpdated}
            />
          </div>
        )}
      </div>

      {/* 配置面板开关按钮 */}
      {!isChartVisible && displayChart && (
        <div className="animate-fade-in fixed top-1/2 right-0 z-50 -translate-y-1/2">
          <Button
            onClick={handleOpenChart}
            variant="outline"
            size="sm"
            className="bg-muted/80 hover:bg-muted h-20 w-8 rounded-l-lg rounded-r-none border-t border-r-0 border-b border-l-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
          >
            <Settings className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
}
