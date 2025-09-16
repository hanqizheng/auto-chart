"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Download,
  RotateCcw,
  Share,
} from "lucide-react";
import { useSimpleExport } from "@/hooks/use-simple-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { ChartType } from "@/types/chart";
import { ExportFormat } from "@/types/common";
import { CHART_TYPES } from "@/constants/chart";

interface ChartData {
  type: ChartType;
  data: any[];
  title?: string;
  description?: string;
}

interface ChartPreviewProps {
  chartData?: ChartData;
  onExport?: (format: ExportFormat) => void;
  onRefresh?: () => void;
}

export function ChartPreview({ chartData, onExport, onRefresh }: ChartPreviewProps) {
  const [selectedType, setSelectedType] = useState<ChartType>(CHART_TYPES.BAR);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { exportChart, isExporting, error } = useSimpleExport();
  const t = useTranslations();

  const handleExport = async () => {
    if (chartContainerRef.current) {
      try {
        const filename = `${chartData?.title?.replace(/[^a-z0-9]/gi, "_") || "chart"}.png`;
        await exportChart(chartContainerRef.current, filename);
      } catch (error) {
        console.error("Export failed:", error);
      }
    } else if (onExport) {
      onExport("png");
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: chartData?.title || "图表",
        text: chartData?.description || "查看这个图表",
        url: window.location.href,
      };

      if (navigator.share && typeof navigator.canShare === "function") {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("链接已复制到剪贴板!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (!chartData) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">{t("chart.noChart")}</h3>
          <p className="text-muted-foreground max-w-md">{t("chart.generateChart")}</p>
        </div>
      </div>
    );
  }

  const chartTypeButtons = [
    { type: "bar" as ChartType, icon: BarChart3, label: t("chart.chartTypes.bar") },
    { type: "line" as ChartType, icon: LineChart, label: t("chart.chartTypes.line") },
    { type: "pie" as ChartType, icon: PieChart, label: t("chart.chartTypes.pie") },
    { type: "area" as ChartType, icon: TrendingUp, label: t("chart.chartTypes.area") },
  ];

  const currentChartType = selectedType || chartData.type;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("chart.preview")}</h2>
            {chartData.title && <p className="text-muted-foreground text-sm">{chartData.title}</p>}
          </div>

          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{t("common.refresh")}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-1"
            >
              <Share className="h-4 w-4" />
              <span>{t("common.share") || "分享"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-1"
            >
              {isExporting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExporting ? "导出中..." : t("common.export")}</span>
            </Button>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex space-x-2">
          {chartTypeButtons.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={currentChartType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="flex items-center space-x-1"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 overflow-hidden p-6">
        {/* 错误显示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">❌ 导出错误</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <CardContent className="h-full">
          <div ref={chartContainerRef} className="h-[400px] w-full">
            <ChartThemeProvider
              chartType={currentChartType}
              chartData={chartData.data}
              chartConfig={{}}
            >
              <EnhancedChart
                type={currentChartType}
                data={chartData.data}
                title={chartData.title}
                className="h-full w-full"
                config={{}}
              />
            </ChartThemeProvider>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
