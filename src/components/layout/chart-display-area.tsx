"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, AlertCircle, RotateCcw, RefreshCcw, Palette as PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartResultContent } from "@/types";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { useChartExport, useChartExportStatus } from "@/contexts/chart-export-context";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { chartExportService } from "@/services/chart-export-service";
import { normalizeHexColor } from "@/lib/colors";
import { useChartTheme } from "@/contexts/chart-theme-context";
import { globalChartManager } from "@/lib/global-chart-manager";

interface ChartDisplayAreaProps {
  chart: ChartResultContent | null;
  onClose: () => void;
  onUpdateChart?: (chart: ChartResultContent) => void;
}

const HEX_INPUT_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * 重构的图表展示区域组件
 * 只负责图表渲染，导出由 GlobalChartManager 统一管理
 */
export function ChartDisplayArea({ chart, onClose, onUpdateChart }: ChartDisplayAreaProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { registerChart } = useChartExport();
  const chartIdRef = useRef<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 生成稳定的图表ID
  useEffect(() => {
    if (chart) {
      chartIdRef.current = `${chart.title.replace(/[^a-zA-Z0-9]/g, "_")}_${chart.chartType}_${chart.chartData.length}`;
    }
  }, [chart]);

  // 获取导出状态
  const { isExporting, progress, stage, error, retry } = useChartExportStatus(chartIdRef.current);

  // 图表渲染完成后注册到全局管理器
  useEffect(() => {
    if (chart && chartRef.current && chartIdRef.current && !chart.imageInfo?.localBlobUrl) {
      console.log("📊 [ChartDisplayArea] Register chart with global manager:", {
        chartId: chartIdRef.current,
        title: chart.title,
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
          <h3 className="text-muted-foreground text-lg font-semibold">Waiting for chart</h3>
          <p className="text-muted-foreground text-sm">
            The generated chart will appear here once it is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChartThemeProvider
      chartType={chart.chartType}
      chartData={chart.chartData}
      chartConfig={chart.chartConfig}
      theme={chart.theme}
    >
      <ThemedChartContent
        chart={chart}
        chartRef={chartRef}
        chartId={chartIdRef.current}
        onClose={onClose}
        isExporting={isExporting}
        stage={stage}
        progress={progress}
        exportError={error}
        onRetry={retry}
        isRegenerating={isRegenerating}
        setIsRegenerating={setIsRegenerating}
        onUpdateChart={onUpdateChart}
      />
    </ChartThemeProvider>
  );
}

/**
 * 获取图表类型的标签
 */
function getChartTypeLabel(chartType: string): string {
  const labels: Record<string, string> = {
    bar: "Bar chart",
    line: "Line chart",
    area: "Area chart",
    pie: "Pie chart",
    scatter: "Scatter chart",
    radar: "Radar chart",
  };

  return labels[chartType] || chartType;
}

interface ThemedChartContentProps {
  chart: ChartResultContent;
  chartRef: React.RefObject<HTMLDivElement | null>;
  chartId: string;
  onClose: () => void;
  isExporting: boolean;
  stage: string;
  progress: number;
  exportError?: string;
  onRetry: () => void;
  isRegenerating: boolean;
  setIsRegenerating: (value: boolean) => void;
  onUpdateChart?: (chart: ChartResultContent) => void;
}

function ThemedChartContent({
  chart,
  chartRef,
  chartId,
  onClose,
  isExporting,
  stage,
  progress,
  exportError,
  onRetry,
  isRegenerating,
  setIsRegenerating,
  onUpdateChart,
}: ThemedChartContentProps) {
  const {
    baseColor,
    setBaseColor,
    palette,
    seriesKeys,
    seriesColorMap,
    pieSliceColors,
    theme,
    themedConfig,
    getSeriesColor,
  } = useChartTheme();
  const { toast } = useToast();
  const [hexInput, setHexInput] = useState(baseColor);
  const [hexError, setHexError] = useState<string | null>(null);
  const [pendingColor, setPendingColor] = useState(baseColor);

  useEffect(() => {
    setHexInput(baseColor);
    setPendingColor(baseColor);
  }, [baseColor]);

  useEffect(() => {
    if (!pendingColor) {
      return;
    }

    const trimmed = pendingColor.trim();
    if (!HEX_INPUT_PATTERN.test(trimmed)) {
      return;
    }

    const normalized = normalizeHexColor(trimmed);
    if (normalized === normalizeHexColor(baseColor)) {
      return;
    }

    const timer = setTimeout(() => {
      setBaseColor(normalized);
    }, 180);

    return () => clearTimeout(timer);
  }, [pendingColor, baseColor, setBaseColor]);

  const applyHexInput = useCallback(() => {
    if (!HEX_INPUT_PATTERN.test(hexInput.trim())) {
      setHexError("Please enter a valid hex color value");
      return;
    }
    const normalized = normalizeHexColor(hexInput);
    setHexError(null);
    setHexInput(normalized);
    setPendingColor(normalized);
  }, [hexInput]);

  const handleColorPickerChange = (value: string) => {
    setHexError(null);
    setHexInput(value);
    setPendingColor(value);
  };

  const handleRegenerateImage = useCallback(async () => {
    if (!chartRef.current || isRegenerating) {
      return;
    }

    setIsRegenerating(true);

    try {
      // 等待颜色应用完成
      await new Promise(resolve => setTimeout(resolve, 150));

      const exportId = chartId ? `${chartId}_theme_${Date.now()}` : `chart_theme_${Date.now()}`;
      const result = await chartExportService.exportChart(chartRef.current, exportId, chart.title);

      if (!result.success) {
        toast({
          title: "Regeneration failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const imageInfo = {
        filename: result.filename,
        localBlobUrl: result.blobUrl,
        size: result.size,
        format: "png" as const,
        dimensions: result.dimensions,
        createdAt: new Date(),
        metadata: {
          ...chart.imageInfo?.metadata,
          chartType: chart.chartType,
          dataPoints: chart.chartData.length,
          exportMethod: "theme-regenerate",
        },
      };

      const updatedChart: ChartResultContent = {
        ...chart,
        imageInfo,
        chartConfig: themedConfig,
        theme,
      };

      onUpdateChart?.(updatedChart);
      globalChartManager.appendChart(updatedChart);

      toast({
        title: "Chart updated",
        description: "A refreshed theme palette has been added to the conversation.",
      });
    } catch (error) {
      console.error("❌ [ChartDisplayArea] Failed to regenerate export:", error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Unable to regenerate the chart",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [
    chart,
    chartId,
    chartRef,
    isRegenerating,
    setIsRegenerating,
    themedConfig,
    theme,
    onUpdateChart,
    toast,
  ]);

  const palettePreview = [
    { label: "Primary", color: palette.primary },
    { label: "Accent", color: palette.accent },
    { label: "Background", color: palette.background },
    { label: "Grid", color: palette.grid },
  ];

  const seriesEntries = seriesKeys.length
    ? seriesKeys.map((key, index) => ({
        key,
        label: key,
        color: getSeriesColor(key, index),
      }))
    : Object.entries(seriesColorMap).map(([key, color], index) => ({
        key: `${key}-${index}`,
        label: key,
        color,
      }));

  const pieEntries =
    chart.chartType === "pie"
      ? (chart.chartData || []).map((item: any, index: number) => ({
          key: `${item?.name ?? `slice-${index + 1}`}`,
          label: item?.name ?? `Category ${index + 1}`,
          color:
            pieSliceColors[index % pieSliceColors.length] ||
            palette.series[index % palette.series.length] ||
            palette.primary,
        }))
      : [];

  return (
    <div className="bg-background flex h-full flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-muted/20 flex items-center justify-between border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground truncate text-lg font-semibold">{chart.title}</h2>

            {isExporting && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                {stage === "preparing" && "Preparing"}
                {stage === "capturing" && "Capturing"}
                {stage === "processing" && "Processing"}
                {progress > 0 && `${progress}%`}
              </Badge>
            )}

            {exportError && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Export failed
              </Badge>
            )}
          </div>

          {chart.description && (
            <p className="text-muted-foreground mt-1 truncate text-sm">{chart.description}</p>
          )}

          {isExporting && progress > 0 && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>

        <div className="ml-4 flex items-center space-x-2">
          {exportError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry()}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Retry</span>
            </Button>
          )}

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

      {/* 主题控制 */}
      <div className="bg-muted/10 space-y-3 border-b px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <PaletteIcon className="h-4 w-4" />
              Theme color
            </span>
            <input
              type="color"
              value={baseColor}
              onChange={event => handleColorPickerChange(event.target.value)}
              className="border-border h-9 w-9 cursor-pointer rounded border"
              aria-label="Select theme color"
            />
            <Input
              value={hexInput}
              onChange={event => {
                setHexInput(event.target.value);
                setHexError(null);
              }}
              onBlur={applyHexInput}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  applyHexInput();
                }
              }}
              className="w-28"
              placeholder="#3B82F6"
            />
            {hexError && <span className="text-xs text-red-500">{hexError}</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateImage}
              disabled={isRegenerating}
              className="flex items-center gap-1"
            >
              <RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Rendering..." : "Regenerate image"}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {palettePreview.map(item => (
              <ColorChip key={item.label} label={item.label} color={item.color} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(pieEntries.length ? pieEntries : seriesEntries).map(entry => (
              <ColorChip key={entry.key} label={entry.label} color={entry.color} subdued />
            ))}
          </div>
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
          <div className="flex flex-wrap items-center gap-4">
            <span>Type: {getChartTypeLabel(chart.chartType)}</span>
            <span>Rows: {chart.chartData.length}</span>
            {chart.imageInfo && (
              <span>
                Size: {chart.imageInfo.dimensions.width} × {chart.imageInfo.dimensions.height}
              </span>
            )}
            {isExporting && (
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Exporting...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {exportError && <span className="text-red-500">Export failed: {exportError}</span>}
            <span>
              Generated:
              {chart.imageInfo?.createdAt
                ? new Date(chart.imageInfo.createdAt).toLocaleTimeString()
                : "just now"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ColorChipProps {
  label: string;
  color: string;
  subdued?: boolean;
}

function ColorChip({ label, color, subdued }: ColorChipProps) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${subdued ? "border-border/70 bg-muted/40" : "border-border bg-background"}`}
    >
      <span
        className="h-3 w-3 rounded-full border"
        style={{ backgroundColor: color, borderColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
