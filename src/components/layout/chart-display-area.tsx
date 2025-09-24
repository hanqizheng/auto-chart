"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo, FC, ChangeEvent } from "react";
import { X, AlertCircle, RotateCcw, RefreshCcw, Palette as PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ChartResultContent, ChartType } from "@/types";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { useChartExport, useChartExportStatus } from "@/contexts/chart-export-context";
// ChartThemeProvider removed - using direct color configs now
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { chartExportService } from "@/services/chart-export-service";
import { normalizeHexColor, applyPaletteToConfig } from "@/lib/colors";
import { globalChartManager } from "@/lib/global-chart-manager";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENHANCED_CHART_DEFAULTS } from "@/components/charts/enhanced-chart/types";
import { CHART_TYPE_LABELS } from "@/constants/chart";
import { CHART_CONFIG_SCHEMAS } from "@/constants/chart-config";
import type { LineDotVariant } from "@/components/charts/line-chart/types";
import type { ChartPalette } from "@/types";
import {
  UnifiedChartConfig,
  UnifiedOptionConfig,
  ConfigChangeEvent,
  UnifiedColorConfig,
  ColorConfigItem,
} from "@/types/chart-config";
import {
  generateUnifiedChartConfig,
  generateColorsFromPrimary,
  convertToChartTheme,
  getChartConfigSchema,
  generateDataDrivenConfigSchema,
} from "@/lib/chart-config-utils";
import { DynamicConfigRenderer } from "@/components/config/dynamic-config-renderer";
import { ColorInput } from "@/components/config/color-input";

// --- REFACTORED TYPES AND CONSTANTS ---

// ✅ 常量已移至 @/constants/chart-config.ts
const HEX_INPUT_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

// ✅ ChartOptionState 已被 UnifiedOptionConfig 替代

interface ChartDisplayAreaProps {
  chart: ChartResultContent | null;
  onClose: () => void;
  onImageGenerated?: (imageUrl: string) => void;
}

// ✅ CustomPalette 已被 UnifiedColorConfig 替代

// --- REFACTORED HOOKS ---

// ✅ useDebouncedOptions 已删除，统一配置中直接管理所有状态

/**
 * 数据驱动的图表配置管理 Hook - 单一数据源，只支持复杂配置
 */
function useConfigurableChartTheme(chart: ChartResultContent) {

  // 🎯 单一统一配置状态 - 基于数据驱动生成
  const [unifiedConfig, setUnifiedConfig] = useState<UnifiedChartConfig>(() => {
    const config = generateUnifiedChartConfig(chart.chartType, chart.chartData, chart.chartConfig);
    return config;
  });

  // 🎯 当图表数据变化时重新生成配置
  useEffect(() => {
    const newConfig = generateUnifiedChartConfig(
      chart.chartType,
      chart.chartData,
      chart.chartConfig
    );

    // 保持用户的自定义配置
    setUnifiedConfig(prev => ({
      ...newConfig,
      // 保留用户修改过的选项配置
      options: { ...newConfig.options, ...prev.options },
      // 保留用户修改过的颜色配置
      colors: {
        ...newConfig.colors,
        // 如果用户修改过 dynamic 配置，保留它们
        dynamic: { ...newConfig.colors.dynamic, ...prev.colors.dynamic },
      },
    }));
  }, [chart.chartType, chart.chartData, chart.chartConfig]);

  // 🎯 处理配置变更的统一接口
  const handleConfigChange = useCallback(
    (event: ConfigChangeEvent) => {
      setUnifiedConfig(prev => {
        const nextConfig = { ...prev };

        if (event.type === "color") {
          if (event.key === "primary") {
            const normalizedPrimary = normalizeHexColor(event.value, nextConfig.colors.primary);
            const regeneratedColors = generateColorsFromPrimary(
              normalizedPrimary,
              nextConfig.seriesKeys.length,
              chart.chartType
            );

            nextConfig.colors = {
              ...regeneratedColors,
              dynamic: {},
            };

            return nextConfig;
          }

          if (event.colorType && event.seriesKey) {
            const dynamicKey = `series-${event.seriesKey}-${event.colorType}`;
            const nextDynamic = { ...(nextConfig.colors.dynamic || {}) };
            nextDynamic[dynamicKey] = event.value;

            const updatedColors: typeof nextConfig.colors = {
              ...nextConfig.colors,
              dynamic: nextDynamic,
            };

            if (event.index !== undefined) {
              if (event.colorType === "fill") {
                const nextSeries = [...nextConfig.colors.series];
                nextSeries[event.index] = event.value;
                updatedColors.series = nextSeries;
              } else if (event.colorType === "stroke") {
                const nextStroke = nextConfig.colors.seriesStroke
                  ? [...nextConfig.colors.seriesStroke]
                  : [];
                nextStroke[event.index] = event.value;
                updatedColors.seriesStroke = nextStroke;
              }
            }

            nextConfig.colors = updatedColors;
            return nextConfig;
          }

          if (event.key === "series" && event.index !== undefined) {
            const nextSeries = [...nextConfig.colors.series];
            nextSeries[event.index] = event.value;
            nextConfig.colors = {
              ...nextConfig.colors,
              series: nextSeries,
            };
            return nextConfig;
          }

          if (event.key === "seriesStroke" && event.index !== undefined) {
            const nextStroke = nextConfig.colors.seriesStroke
              ? [...nextConfig.colors.seriesStroke]
              : [...nextConfig.colors.series];
            nextStroke[event.index] = event.value;
            nextConfig.colors = {
              ...nextConfig.colors,
              seriesStroke: nextStroke,
            };
            return nextConfig;
          }

          nextConfig.colors = {
            ...nextConfig.colors,
            [event.key]: event.value,
          } as UnifiedColorConfig;
          return nextConfig;
        }

        if (event.type === "option") {
          nextConfig.options = {
            ...nextConfig.options,
            [event.key]: event.value,
          };
        }

        return nextConfig;
      });
    },
    [chart.chartType]
  );

  // 🎯 为兼容性生成旧格式的配置和主题
  const legacyCompatibility = useMemo(() => {

    // 生成图表配置 - 使用动态配置优先
    const chartConfig = { ...chart.chartConfig };

    unifiedConfig.seriesKeys.forEach((entry, index) => {
      // 优先使用动态配置中的颜色
      const fillKey = `series-${entry.key}-fill`;
      const strokeKey = `series-${entry.key}-stroke`;

      const fillColor =
        unifiedConfig.colors.dynamic?.[fillKey] || unifiedConfig.colors.series[index];
      const strokeColor =
        unifiedConfig.colors.dynamic?.[strokeKey] ||
        unifiedConfig.colors.seriesStroke?.[index] ||
        fillColor;

      chartConfig[entry.key] = {
        ...chartConfig[entry.key],
        color: fillColor,
        stroke: strokeColor,
      };
    });

    if (chart.chartType === "pie" || chart.chartType === "radial") {
      // 对于饼图和径向图，colors数组包含所有切片的颜色
      chartConfig.colors = unifiedConfig.seriesKeys.map((entry, index) => {
        const fillKey = `series-${entry.key}-fill`;
        return unifiedConfig.colors.dynamic?.[fillKey] || unifiedConfig.colors.series[index];
      });
    }

    // 生成主题
    const theme = convertToChartTheme(unifiedConfig);


    return {
      finalConfig: chartConfig,
      finalPalette: theme.palette,
      finalTheme: theme,
    };
  }, [unifiedConfig, chart.chartConfig, chart.chartType]);

  return {
    // 新的统一接口
    unifiedConfig,
    handleConfigChange,

    // 兼容旧接口（删除了简单模式相关的接口）
    finalConfig: legacyCompatibility.finalConfig,
    finalPalette: legacyCompatibility.finalPalette,
    finalThemeForExport: legacyCompatibility.finalTheme,
  };
}

// --- HELPER FUNCTIONS ---

// ✅ getDefaultOptions 已被 generateOptionConfig 替代

function getChartTypeLabel(chartType: ChartType): string {
  return CHART_TYPE_LABELS[chartType]?.en || chartType;
}

// --- DECOMPOSED CHILD COMPONENTS ---

const ChartHeader: FC<{
  chart: ChartResultContent;
  isExporting: boolean;
  stage: string;
  progress: number;
  exportError?: string;
  onRetry: () => void;
  onClose: () => void;
}> = memo(({ chart, isExporting, stage, progress, exportError, onRetry, onClose }) => (
  <div className="bg-muted/20 flex items-center justify-between border-b p-4">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h2 className="text-foreground truncate text-lg font-semibold">{chart.title}</h2>
        {isExporting && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            {stage} {progress > 0 && `${progress}%`}
          </Badge>
        )}
        {exportError && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Export failed
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
          onClick={onRetry}
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
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  </div>
));
ChartHeader.displayName = "ChartHeader";

const ChartRenderer: FC<{
  chart: ChartResultContent;
  chartRef: React.RefObject<HTMLDivElement | null>;
  config: any;
  unifiedConfig: UnifiedChartConfig;
}> = memo(({ chart, chartRef, config, unifiedConfig }) => {

  return (
    <div ref={chartRef} className="w-full rounded-lg border p-4">
      <EnhancedChart
        type={chart.chartType}
        data={chart.chartData}
        config={config}
        unifiedConfig={unifiedConfig}
        {...unifiedConfig.options}
      />
    </div>
  );
});
ChartRenderer.displayName = "ChartRenderer";

const ChartFooter: FC<{
  chart: ChartResultContent;
  isExporting: boolean;
  exportError?: string;
}> = memo(({ chart, isExporting, exportError }) => (
  <div className="bg-muted/10 border-t px-4 py-3">
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
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
          Generated:{" "}
          {chart.imageInfo?.createdAt
            ? new Date(chart.imageInfo.createdAt).toLocaleTimeString()
            : "just now"}
        </span>
      </div>
    </div>
  </div>
));
ChartFooter.displayName = "ChartFooter";

// ✅ 旧的 ColorChip 和内嵌 ColorInput 已删除，使用 @/components/config/color-input

/**
 * 数据驱动的主题配置面板 - 删除简单/复杂模式切换
 */
const DataDrivenThemePanel: FC<{
  config: UnifiedChartConfig;
  onChange: (event: ConfigChangeEvent) => void;
}> = memo(({ config, onChange }) => {
  const chartTypeHasStroke = (chartType: string): boolean => {
    return ["area", "radar", "line"].includes(chartType);
  };

  const themeColor = useMemo(
    () => normalizeHexColor(config.colors.primary),
    [config.colors.primary]
  );

  const schema = useMemo(() => {
    const colorConfigs: ColorConfigItem[] = [];

    if (!["pie", "radial"].includes(config.chartType)) {
      colorConfigs.push({
        key: "grid",
        label: "Grid Color",
        category: "grid" as const,
      });
    }

    if (config.chartType === "radial") {
      colorConfigs.push({
        key: "background",
        label: "Track Background",
        category: "background" as const,
      });
    }

    colorConfigs.push({
      key: "series",
      label: "Series Colors",
      category: "series" as const,
      isArray: true,
    });

    if (chartTypeHasStroke(config.chartType)) {
      colorConfigs.push({
        key: "seriesStroke",
        label: "Series Stroke Colors",
        category: "series" as const,
        isArray: true,
      });
    }

    return {
      colors: colorConfigs,
      options: [],
    };
  }, [config.chartType]);

  return (
    <Card className="bg-muted/20">
      <CardContent className="space-y-4 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <PaletteIcon className="h-4 w-4" />
              Theme Color
            </Label>
          </div>
          <ColorInput
            label="Primary"
            value={themeColor}
            onChange={value =>
              onChange({
                type: "color",
                key: "primary",
                value,
              })
            }
          />
          <Label className="flex items-center gap-2 text-sm font-medium">
            Series & Grid Colors
          </Label>
          <DynamicConfigRenderer
            schema={schema}
            config={config}
            onChange={onChange}
            className="space-y-0"
          />
        </div>
      </CardContent>
    </Card>
  );
});
DataDrivenThemePanel.displayName = "DataDrivenThemePanel";

/**
 * 动态图表选项面板 - 基于JSON配置描述自动生成UI
 */
const DataDrivenOptionsPanel: FC<{
  config: UnifiedChartConfig;
  onChange: (event: ConfigChangeEvent) => void;
}> = memo(({ config, onChange }) => {
  // 使用静态配置中的选项，因为选项配置不依赖于数据
  const schema = useMemo(() => {
    const baseSchema = CHART_CONFIG_SCHEMAS[config.chartType];
    return {
      colors: [],
      options: baseSchema?.options || [],
    };
  }, [config.chartType]);


  // 如果没有选项配置，不渲染面板
  if (!schema.options) {
    return null;
  }

  return (
    <Card className="bg-muted/20">
      <CardContent className="space-y-4 p-4">
        <Label className="text-sm font-medium">Options</Label>
        <DynamicConfigRenderer
          schema={schema} // 只渲染选项，不渲染颜色
          config={config}
          onChange={onChange}
          className="space-y-0"
        />
      </CardContent>
    </Card>
  );
});
DataDrivenOptionsPanel.displayName = "DataDrivenOptionsPanel";

// --- MAIN COMPONENTS ---

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
  onImageGenerated,
}: Omit<ThemedChartContentProps, "isRegenerating" | "setIsRegenerating">) {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { unifiedConfig, handleConfigChange, finalConfig, finalPalette, finalThemeForExport } =
    useConfigurableChartTheme(chart);

  // 不再需要单独的选项状态，统一在 unifiedConfig 中管理

  const handleRegenerateImage = useCallback(async () => {
    if (!chartRef.current || isRegenerating) return;
    setIsRegenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait for render updates
      const exportId = `${chartId}_theme_${Date.now()}`;
      const result = await chartExportService.exportChart(chartRef.current, exportId, chart.title);

      if (!result.success) throw new Error(result.error);

      const updatedChart: ChartResultContent = {
        ...chart,
        imageInfo: {
          filename: result.filename,
          localBlobUrl: result.blobUrl,
          size: result.size,
          format: "png",
          dimensions: result.dimensions,
          createdAt: new Date(),
          metadata: { ...chart.imageInfo?.metadata, exportMethod: "theme-regenerate" },
        },
        chartConfig: { ...finalConfig, ...unifiedConfig.options },
        theme: finalThemeForExport,
      };

      // 将新的图表作为新消息添加到消息列表中

      // 使用 globalChartManager 将新图表添加到消息列表
      globalChartManager.appendChart(updatedChart);

      // 同时通知图片更新（用于当前图表显示）
      if (updatedChart.imageInfo?.localBlobUrl) {
        onImageGenerated?.(updatedChart.imageInfo.localBlobUrl);
      }

      toast({
        title: "Chart regenerated successfully",
        description: "A new chart image has been generated and added to the conversation.",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Unknown error",
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
    finalConfig,
    unifiedConfig.options,
    finalThemeForExport,
    onImageGenerated,
    toast,
  ]);

  return (
    <div className="bg-background flex h-full flex-col overflow-auto">
      <ChartHeader
        chart={chart}
        isExporting={isExporting}
        stage={stage}
        progress={progress}
        exportError={exportError}
        onRetry={onRetry}
        onClose={onClose}
      />

      <div className="flex-1 p-4 md:p-6">
        <ChartRenderer
          chart={chart}
          chartRef={chartRef}
          config={finalConfig}
          unifiedConfig={unifiedConfig}
        />
      </div>
      <div className="mb-4 flex justify-center">
        <Button
          variant="default"
          size="sm"
          onClick={handleRegenerateImage}
          disabled={isRegenerating}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
          <span>{isRegenerating ? "Rendering..." : "Regenerate Image"}</span>
        </Button>
      </div>
      <div className="grid gap-3 border-t p-3 md:grid-cols-2">
        <DataDrivenThemePanel config={unifiedConfig} onChange={handleConfigChange} />
        <DataDrivenOptionsPanel config={unifiedConfig} onChange={handleConfigChange} />
      </div>

      <ChartFooter chart={chart} isExporting={isExporting} exportError={exportError} />
    </div>
  );
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
  onImageGenerated?: (imageUrl: string) => void;
}

export function ChartDisplayArea({ chart, onClose, onImageGenerated }: ChartDisplayAreaProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { registerChart } = useChartExport();
  const chartId = useMemo(
    () =>
      chart
        ? `${chart.title.replace(/[^a-zA-Z0-9]/g, "_")}_${chart.chartType}_${chart.chartData.length}`
        : "",
    [chart]
  );
  const { isExporting, progress, stage, error, retry } = useChartExportStatus(chartId);

  // 🎯 提取稳定的标识符，避免对象引用变化导致的重新注册
  const chartStableId = useMemo(() => {
    if (!chart) return null;
    return `${chart.title}_${chart.chartType}_${chart.chartData.length}`;
  }, [chart?.title, chart?.chartType, chart?.chartData.length]);

  useEffect(() => {
    if (chart && chartRef.current && chartId && chartStableId) {
      // 🔧 Always register chart for export, regardless of existing imageInfo
      // This fixes the issue where charts get stuck with broken imageInfo
      const timer = setTimeout(() => {
        if (chartRef.current) {
          registerChart(chartId, chartRef.current, chart);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [chartStableId, chartId, registerChart]); // 只依赖稳定的标识符，不依赖chart对象本身

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
          <p className="text-muted-foreground text-sm">The generated chart will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemedChartContent
      chart={chart}
      chartRef={chartRef}
      chartId={chartId}
      onClose={onClose}
      isExporting={isExporting}
      stage={stage}
      progress={progress}
      exportError={error}
      onRetry={retry}
      onImageGenerated={onImageGenerated}
    />
  );
}
