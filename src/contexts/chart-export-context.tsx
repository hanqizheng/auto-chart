"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
 */
export interface ChartExportContextType {
  // 状态
  exportStatuses: Map<string, ChartExportStatus>;
  currentChart: ChartResultContent | null;
  
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
  const [currentChart, setCurrentChart] = useState<ChartResultContent | null>(null);
  const initRef = useRef(false);

  // 初始化全局管理器
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("🔧 [ChartExportContext] 初始化");

    const updateHandler = (updatedChart: ChartResultContent) => {
      console.log("📊 [ChartExportContext] 收到图表更新:", {
        title: updatedChart.title,
        hasImageUrl: !!updatedChart.imageInfo?.localBlobUrl
      });
      
      setCurrentChart(updatedChart);
    };
    globalChartManager.setUpdateHandler(updateHandler);

    const exportStatusHandler = (chartId: string, status: ExportState) => {
      console.log("📈 [ChartExportContext] 导出状态变化:", {
        chartId,
        stage: status.stage,
        progress: status.progress,
        isExporting: status.isExporting
      });

      setExportStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(chartId, {
          chartId,
          status,
          lastUpdated: new Date()
        });
        return newMap;
      });
    };
    globalChartManager.setExportStatusHandler(exportStatusHandler);

    // 清理函数
    return () => {
      console.log("🧹 [ChartExportContext] 清理");
      globalChartManager.removeUpdateHandler(updateHandler);
      globalChartManager.setExportStatusHandler(null);
    };
  }, []);

  // 注册图表
  const registerChart = (chartId: string, element: HTMLElement, chartData: ChartResultContent) => {
    console.log("📝 [ChartExportContext] 注册图表:", {
      chartId,
      title: chartData.title
    });

    globalChartManager.registerChartRender(chartId, element, chartData);
  };

  // 重试导出
  const retryExport = (chartId: string) => {
    console.log("🔄 [ChartExportContext] 重试导出:", { chartId });
    globalChartManager.retryExport(chartId);
  };

  // 取消导出
  const cancelExport = (chartId: string) => {
    console.log("🚫 [ChartExportContext] 取消导出:", { chartId });
    globalChartManager.cancelExport(chartId);
  };

  // 清除图表
  const clearChart = (chartId: string) => {
    console.log("🧹 [ChartExportContext] 清除图表:", { chartId });
    
    globalChartManager.clearChart(chartId);
    
    setExportStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(chartId);
      return newMap;
    });
  };

  // 获取导出状态
  const getExportStatus = (chartId: string): ChartExportStatus | null => {
    return exportStatuses.get(chartId) || null;
  };

  // 检查是否正在导出
  const isExporting = (chartId: string): boolean => {
    const status = exportStatuses.get(chartId);
    return status?.status.isExporting || false;
  };

  // 获取统计信息
  const getStats = () => {
    let exportingCharts = 0;
    let completedCharts = 0;
    let failedCharts = 0;

    exportStatuses.forEach(({ status }) => {
      if (status.isExporting) {
        exportingCharts++;
      } else if (status.stage === 'completed') {
        completedCharts++;
      } else if (status.stage === 'error') {
        failedCharts++;
      }
    });

    return {
      totalCharts: exportStatuses.size,
      exportingCharts,
      completedCharts,
      failedCharts
    };
  };

  const contextValue: ChartExportContextType = {
    // 状态
    exportStatuses,
    currentChart,
    
    // 操作
    registerChart,
    retryExport,
    cancelExport,
    clearChart,
    
    // 查询
    getExportStatus,
    isExporting,
    
    // 统计
    getStats
  };

  return (
    <ChartExportContext.Provider value={contextValue}>
      {children}
    </ChartExportContext.Provider>
  );
}

/**
 * 使用图表导出上下文的 Hook
 */
export function useChartExport(): ChartExportContextType {
  const context = useContext(ChartExportContext);
  if (context === undefined) {
    throw new Error('useChartExport must be used within a ChartExportProvider');
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
    stage: status?.status.stage || 'idle',
    progress: status?.status.progress || 0,
    error: status?.status.error,
    lastUpdated: status?.lastUpdated,
    
    // 操作
    retry: () => retryExport(chartId),
    cancel: () => cancelExport(chartId),
  };
}
