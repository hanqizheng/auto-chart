"use client";

import { useEffect, useRef } from "react";
import { X, Download, Share2, Maximize2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartResultContent } from "@/types";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { cn } from "@/lib/utils";
import { useChartExport, useChartExportStatus } from "@/contexts/chart-export-context";

interface ChartDisplayAreaProps {
  chart: ChartResultContent | null;
  onClose: () => void;
}

/**
 * 重构的图表展示区域组件
 * 只负责图表渲染，导出由 GlobalChartManager 统一管理
 */
export function ChartDisplayArea({ chart, onClose }: ChartDisplayAreaProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { registerChart } = useChartExport();
  const chartIdRef = useRef<string>("");

  // 生成稳定的图表ID
  useEffect(() => {
    if (chart) {
      chartIdRef.current = `${chart.title.replace(/[^a-zA-Z0-9]/g, '_')}_${chart.chartType}_${chart.chartData.length}`;
    }
  }, [chart]);

  // 获取导出状态
  const { isExporting, progress, stage, error, retry } = useChartExportStatus(chartIdRef.current);

  // 图表渲染完成后注册到全局管理器
  useEffect(() => {
    if (chart && chartRef.current && chartIdRef.current) {
      console.log("📊 [ChartDisplayArea] 注册图表到全局管理器:", {
        chartId: chartIdRef.current,
        title: chart.title
      });

      // 等待图表完全渲染后注册
      const timer = setTimeout(() => {
        if (chartRef.current) {
          registerChart(chartIdRef.current, chartRef.current, chart);
        }
      }, 800);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [chart, registerChart]);

  if (!chart) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="text-muted-foreground h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-muted-foreground text-lg font-semibold">等待图表生成</h3>
          <p className="text-muted-foreground text-sm">图表生成完成后将在这里显示</p>
        </div>
      </div>
    );
  }

  /**
   * 处理手动图表导出
   */
  const handleManualExport = () => {
    if (!chart || !chartRef.current) return;
    
    // TODO: 实现手动导出
    console.log("🎯 [ChartDisplay] 手动导出图表:", chart.title);
  };

  /**
   * 处理图表分享
   */
  const handleShare = async () => {
    try {
      // TODO: 实现图表分享功能
      console.log("分享图表:", chart.title);
    } catch (error) {
      console.error("分享失败:", error);
    }
  };

  /**
   * 处理全屏显示
   */
  const handleFullscreen = () => {
    try {
      // TODO: 实现全屏显示功能
      console.log("全屏显示:", chart.title);
    } catch (error) {
      console.error("全屏显示失败:", error);
    }
  };

  return (
    <div className="bg-background flex h-full flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-muted/20 flex items-center justify-between border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground truncate text-lg font-semibold">{chart.title}</h2>
            
            {/* 导出状态指示器 */}
            {isExporting && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                {stage === 'preparing' && '准备中'}
                {stage === 'capturing' && '截图中'}
                {stage === 'processing' && '处理中'}
                {progress > 0 && `${progress}%`}
              </Badge>
            )}
            
            {error && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                导出失败
              </Badge>
            )}
          </div>
          
          {chart.description && (
            <p className="text-muted-foreground truncate text-sm mt-1">{chart.description}</p>
          )}
          
          {/* 进度条 */}
          {isExporting && progress > 0 && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>

        <div className="ml-4 flex items-center space-x-2">
          {/* 重试按钮 */}
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retry()}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重试</span>
            </Button>
          )}
          
          {/* 导出按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualExport}
            disabled={isExporting}
            className="flex items-center space-x-1"
          >
            <Download className={cn("h-4 w-4", isExporting && "animate-pulse")} />
            <span className="hidden sm:inline">
              {isExporting ? "导出中..." : "导出"}
            </span>
          </Button>

          {/* 分享按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center space-x-1"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">分享</span>
          </Button>

          {/* 全屏按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className="flex items-center space-x-1"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">全屏</span>
          </Button>

          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 图表展示区域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div 
            ref={chartRef}
            className="bg-background border-border/50 w-full rounded-lg border p-4"
          >
            <EnhancedChart
              type={chart.chartType}
              data={chart.chartData}
              config={chart.chartConfig}
              title={chart.title}
              description={chart.description}
            />
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="bg-muted/10 border-t px-4 py-3">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span>类型: {getChartTypeLabel(chart.chartType)}</span>
            <span>数据量: {chart.chartData.length} 条</span>
            {chart.imageInfo && (
              <span>
                尺寸: {chart.imageInfo.dimensions.width} × {chart.imageInfo.dimensions.height}
              </span>
            )}
            {isExporting && (
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                正在导出...
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {error && (
              <span className="text-red-500">导出失败: {error}</span>
            )}
            <span>
              生成时间:{" "}
              {chart.imageInfo?.createdAt
                ? new Date(chart.imageInfo.createdAt).toLocaleTimeString()
                : "刚刚"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 获取图表类型的中文标签
 */
function getChartTypeLabel(chartType: string): string {
  const labels: Record<string, string> = {
    bar: "柱状图",
    line: "折线图",
    area: "面积图",
    pie: "饼图",
    scatter: "散点图",
    radar: "雷达图",
  };

  return labels[chartType] || chartType;
}