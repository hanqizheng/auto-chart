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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
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
  const chartRef = useRef<{
    exportChart: (config?: any) => Promise<void>;
    shareChart: (config?: any) => Promise<void>;
  }>(null);
  const t = useTranslations();

  const handleExport = async () => {
    if (chartRef.current) {
      await chartRef.current.exportChart();
    } else if (onExport) {
      onExport("png");
    }
  };

  const handleShare = async () => {
    if (chartRef.current) {
      await chartRef.current.shareChart();
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
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>{t("common.export")}</span>
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
        <CardContent className="h-full">
          <div className="h-[400px] w-full">
            <EnhancedChart
              ref={chartRef}
              type={currentChartType}
              data={chartData.data}
              title={chartData.title}
              className="h-full w-full"
              config={{}}
            />
          </div>
        </CardContent>
      </div>
    </div>
  );
}
