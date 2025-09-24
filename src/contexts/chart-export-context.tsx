"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { ChartResultContent } from "@/types";
import { globalChartManager } from "@/lib/global-chart-manager";
import { ExportState } from "@/services/chart-export-service";

/**
 * 图表导出状态接口
 */
export interface ChartExportStatus {
  chartId: string;
  status: ExportState;
  lastUpdated: Date;
}

/**
 * 图表导出上下文接口
 * 🎯 精简版：只管理导出状态，不管理图表数据
 */
export interface ChartExportContextType {
  // 状态
  exportStatuses: Map<string, ChartExportStatus>;
  // 🚫 移除currentChart - 现在由DashboardLayout统一管理

  // 操作
  registerChart: (chartId: string, element: HTMLElement, chartData: ChartResultContent) => void;
  retryExport: (chartId: string) => void;
  cancelExport: (chartId: string) => void;
  clearChart: (chartId: string) => void;

  // 查询
  getExportStatus: (chartId: string) => ChartExportStatus | null;
  isExporting: (chartId: string) => boolean;

  // 统计
  getStats: () => {
    totalCharts: number;
    exportingCharts: number;
    completedCharts: number;
    failedCharts: number;
  };
}

const ChartExportContext = createContext<ChartExportContextType | undefined>(undefined);

/**
 * 图表导出状态提供者
 */
export function ChartExportProvider({ children }: { children: React.ReactNode }) {
  const [exportStatuses, setExportStatuses] = useState<Map<string, ChartExportStatus>>(new Map());
  // 🚫 移除currentChart状态 - 由DashboardLayout统一管理单一数据源
  const initRef = useRef(false);

  // 初始化全局管理器
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("🔧 [ChartExportContext] 初始化 - 精简版（只管理导出状态）");

    // 🚫 图表更新处理器现在在CenteredChatPanel中设置，这里不再需要

    const exportStatusHandler = (chartId: string, status: ExportState) => {
      console.log("📈 [ChartExportContext] 导出状态变化:", {
        chartId,
        stage: status.stage,
        progress: status.progress,
        isExporting: status.isExporting,
      });

      setExportStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(chartId, {
          chartId,
          status,
          lastUpdated: new Date(),
        });
        return newMap;
      });
    };
    globalChartManager.setExportStatusHandler(exportStatusHandler);

    // 清理函数
    return () => {
      console.log("🧹 [ChartExportContext] 清理 - 精简版");
      globalChartManager.setExportStatusHandler(null);
    };
  }, []);

  // 注册图表
  const registerChart = useCallback((chartId: string, element: HTMLElement, chartData: ChartResultContent) => {
    console.log("📝 [ChartExportContext] 注册图表:", {
      chartId,
      title: chartData.title,
    });

    // 🎯 Demo图表不自动导出
    const autoExport = !chartId.startsWith("demo-");
    globalChartManager.registerChartRender(chartId, element, chartData, autoExport);
  }, []);

  // 重试导出
  const retryExport = useCallback((chartId: string) => {
    console.log("🔄 [ChartExportContext] 重试导出:", { chartId });
    globalChartManager.retryExport(chartId);
  }, []);

  // 取消导出
  const cancelExport = useCallback((chartId: string) => {
    console.log("🚫 [ChartExportContext] 取消导出:", { chartId });
    globalChartManager.cancelExport(chartId);
  }, []);

  // 清除图表
  const clearChart = useCallback((chartId: string) => {
    console.log("🧹 [ChartExportContext] 清除图表:", { chartId });

    globalChartManager.clearChart(chartId);

    setExportStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(chartId);
      return newMap;
    });
  }, []);

  // 获取导出状态
  const getExportStatus = useCallback((chartId: string): ChartExportStatus | null => {
    return exportStatuses.get(chartId) || null;
  }, [exportStatuses]);

  // 检查是否正在导出
  const isExporting = useCallback((chartId: string): boolean => {
    const status = exportStatuses.get(chartId);
    return status?.status.isExporting || false;
  }, [exportStatuses]);

  // 获取统计信息
  const getStats = useCallback(() => {
    let exportingCharts = 0;
    let completedCharts = 0;
    let failedCharts = 0;

    exportStatuses.forEach(({ status }) => {
      if (status.isExporting) {
        exportingCharts++;
      } else if (status.stage === "completed") {
        completedCharts++;
      } else if (status.stage === "error") {
        failedCharts++;
      }
    });

    return {
      totalCharts: exportStatuses.size,
      exportingCharts,
      completedCharts,
      failedCharts,
    };
  }, [exportStatuses]);

  const contextValue: ChartExportContextType = {
    // 状态
    exportStatuses,
    // 🚫 移除currentChart引用 - 由DashboardLayout统一管理

    // 操作
    registerChart,
    retryExport,
    cancelExport,
    clearChart,

    // 查询
    getExportStatus,
    isExporting,

    // 统计
    getStats,
  };

  return <ChartExportContext.Provider value={contextValue}>{children}</ChartExportContext.Provider>;
}

/**
 * 使用图表导出上下文的 Hook
 */
export function useChartExport(): ChartExportContextType {
  const context = useContext(ChartExportContext);
  if (context === undefined) {
    throw new Error("useChartExport must be used within a ChartExportProvider");
  }
  return context;
}

/**
 * 使用特定图表导出状态的 Hook
 */
export function useChartExportStatus(chartId: string) {
  const { getExportStatus, isExporting, retryExport, cancelExport } = useChartExport();

  const status = getExportStatus(chartId);

  return {
    status,
    isExporting: isExporting(chartId),
    stage: status?.status.stage || "idle",
    progress: status?.status.progress || 0,
    error: status?.status.error,
    lastUpdated: status?.lastUpdated,

    // 操作
    retry: () => retryExport(chartId),
    cancel: () => cancelExport(chartId),
  };
}
