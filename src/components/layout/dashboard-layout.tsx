"use client";

import { useState, useEffect, useCallback } from "react";
import { ChartResultContent } from "@/types";
import { CenteredChatPanel } from "./centered-chat-panel";
import { ChartDisplayArea } from "./chart-display-area";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { globalChartManager } from "@/lib/global-chart-manager";

/**
 * 主仪表板布局组件
 * 实现居中聊天面板和滑出式图表展示区域
 */
export function DashboardLayout() {
  const [isChartVisible, setIsChartVisible] = useState(false);

  // 🎯 单一数据源：只维护一个图表状态
  const [currentChart, setCurrentChart] = useState<ChartResultContent | null>(null);

  console.log("✅ [DashboardLayout] 简化数据流 - 单一图表状态:", {
    hasChart: !!currentChart,
    chartTitle: currentChart?.title,
    chartType: currentChart?.chartType,
    dataSample: currentChart?.chartData?.slice?.(0, 1),
  });

  // ✅ 图片生成完成回调：只更新图片URL，核心数据不变
  const handleImageGenerated = useCallback((payload: {
    imageUrl: string;
    chartId?: string;
    messageId?: string;
    title?: string;
  }) => {
    const { imageUrl, chartId, messageId, title } = payload;

    console.log("✅ [DashboardLayout] 图片生成完成 - 更新图片URL:", {
      imageUrl: imageUrl.substring(0, 50) + "...",
      chartId,
      messageId,
      title,
    });

    setCurrentChart(prev => {
      if (!prev) return null;

      if (messageId && prev.messageId && messageId !== prev.messageId) {
        console.warn("⚠️ [DashboardLayout] 忽略非当前图表的图片更新", {
          currentMessageId: prev.messageId,
          incomingMessageId: messageId,
          chartId,
          title,
        });
        return prev;
      }

      if (chartId && prev.chartId && chartId !== prev.chartId) {
        console.warn("⚠️ [DashboardLayout] 忽略chartId不匹配的图片更新", {
          currentChartId: prev.chartId,
          incomingChartId: chartId,
          title,
        });
        return prev;
      }

      // 检查是否真的需要更新，避免不必要的重新渲染
      if (prev.imageInfo?.localBlobUrl === imageUrl) {
        return prev; // 返回原对象，避免重新创建
      }

      return {
        ...prev,
        imageInfo: {
          ...prev.imageInfo,
          localBlobUrl: imageUrl,
          createdAt: new Date(),
        },
      };
    });
  }, []);

  // 🎯 注册自动导出完成后的图片更新回调
  useEffect(() => {
    const imageUpdateHandler = (payload: {
      imageUrl: string;
      chartId: string;
      messageId?: string;
      title: string;
    }) => {
      const { imageUrl, chartId, messageId, title } = payload;
      console.log("🎯 [DashboardLayout] 收到自动导出的图片更新:", {
        imageUrl: imageUrl.substring(0, 50) + "...",
        chartId,
        messageId,
        title,
      });

      // 使用现有的handleImageGenerated逻辑
      handleImageGenerated(payload);
    };

    globalChartManager.setCurrentChartImageUpdateHandler(imageUpdateHandler);

    return () => {
      globalChartManager.setCurrentChartImageUpdateHandler(null);
    };
  }, []); // 🎯 不需要依赖handleImageGenerated，因为它内部只使用setState

  /**
   * 处理图表生成完成事件
   */
  const handleChartGenerated = useCallback((chart: ChartResultContent) => {
    console.log("✅ [DashboardLayout] 图表生成完成 - 设置为当前图表:", {
      title: chart.title,
      chartType: chart.chartType,
      dataSample: chart.chartData?.slice?.(0, 1),
    });

    // 🎯 直接设置为当前图表，数据流简单清晰
    setCurrentChart(chart);
    setIsChartVisible(true);
  }, []);

  /**
   * 处理关闭图表显示
   */
  const handleCloseChart = useCallback(() => {
    setIsChartVisible(false);
    // 不清空数据，保持图表数据以便重新打开
  }, []);

  /**
   * 处理打开图表显示
   */
  const handleOpenChart = useCallback(() => {
    if (currentChart) {
      setIsChartVisible(true);
    }
  }, [currentChart]);

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
        {isChartVisible && currentChart && (
          <div className="bg-muted/10 border-border/50 animate-slide-in w-1/2 border-l">
            <ChartDisplayArea
              chart={currentChart}
              onClose={handleCloseChart}
              onImageGenerated={handleImageGenerated}
            />
          </div>
        )}
      </div>

      {/* 配置面板开关按钮 */}
      {!isChartVisible && currentChart && (
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
