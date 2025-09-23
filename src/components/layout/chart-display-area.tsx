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
import { ChartThemeProvider, useChartTheme } from "@/contexts/chart-theme-context";
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
import type { LineDotVariant } from "@/components/charts/line-chart/types";
import type { ChartPalette } from "@/types";
import { UnifiedChartConfig, UnifiedOptionConfig, ConfigChangeEvent } from "@/types/chart-config";
import {
  generateUnifiedChartConfig,
  generateColorsFromPrimary,
  convertToChartTheme,
  getChartConfigSchema,
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
 * ✅ 统一配置管理 Hook - 解决"双数据源"问题
 * 简单模式和复杂模式使用相同的数据结构，只在UI渲染上有差异
 */
function useConfigurableChartTheme(chart: ChartResultContent) {
  const { baseColor, setBaseColor } = useChartTheme();

  // 🎯 从图表数据中提取系列键信息
  const seriesKeys = useMemo(() => {
    const { chartType, chartData, chartConfig } = chart;
    if (chartType === "pie" || chartType === "radial") {
      return (chartData || []).map((item: any, index: number) => ({
        key: String(item?.name ?? `slice-${index + 1}`),
        label: String(item?.name ?? `Category ${index + 1}`),
      }));
    }
    const configKeys = Object.keys(chartConfig || {});
    if (configKeys.length > 0) {
      return configKeys.map(key => ({ key, label: key }));
    }
    // Derive numeric series keys from data when config is empty
    if (Array.isArray(chartData) && chartData.length > 0) {
      const first = chartData[0] || {};
      const keys = Object.keys(first).filter(k => k !== "name");
      const numericKeys = keys.filter(k => typeof first[k] === "number");
      const finalKeys = numericKeys.length > 0 ? numericKeys : keys;
      return finalKeys.map(key => ({ key, label: key }));
    }
    return [] as Array<{ key: string; label: string }>;
  }, [chart]);

  // 🎯 单一统一配置状态 - 这是核心！
  const [unifiedConfig, setUnifiedConfig] = useState<UnifiedChartConfig>(() => {
    return generateUnifiedChartConfig({
      baseColor,
      seriesCount: seriesKeys.length,
      chartType: chart.chartType,
      seriesKeys,
    });
  });

  // 🎯 当基础颜色或系列数量变化时，重新生成配置
  useEffect(() => {
    const newConfig = generateUnifiedChartConfig({
      baseColor,
      seriesCount: seriesKeys.length,
      chartType: chart.chartType,
      seriesKeys,
    });

    // 保持当前的模式和选项配置
    setUnifiedConfig(prev => ({
      ...newConfig,
      mode: prev.mode,
      options: { ...newConfig.options, ...prev.options },
      colors: prev.mode === "complex" ? prev.colors : newConfig.colors,
    }));
  }, [baseColor, seriesKeys, chart.chartType]);

  // 🎯 处理配置变更的统一接口
  const handleConfigChange = useCallback(
    (event: ConfigChangeEvent) => {
      setUnifiedConfig(prev => {
        const newConfig = { ...prev };

        if (event.type === "color") {
          if (event.key === "series" && event.index !== undefined) {
            newConfig.colors.series[event.index] = event.value;
          } else {
            (newConfig.colors as any)[event.key] = event.value;
          }
        } else if (event.type === "option") {
          (newConfig.options as any)[event.key] = event.value;
        } else if (event.type === "mode") {
          newConfig.mode = event.value;

          // 模式切换时的特殊处理
          if (event.value === "simple") {
            // 切换到简单模式：从主色调重新生成颜色
            const generatedColors = generateColorsFromPrimary(
              newConfig.colors.primary,
              seriesKeys.length
            );
            newConfig.colors = generatedColors;
          }
        }

        return newConfig;
      });
    },
    [seriesKeys.length]
  );

  // 🎯 简化的基础颜色变更处理
  const handleBaseColorChange = useCallback(
    (color: string) => {
      setBaseColor(color);
      handleConfigChange({
        type: "color",
        key: "primary",
        value: color,
      });
    },
    [setBaseColor, handleConfigChange]
  );

  // 🎯 为兼容性生成旧格式的配置和主题
  const legacyCompatibility = useMemo(() => {
    // 生成图表配置
    const chartConfig = { ...chart.chartConfig };
    seriesKeys.forEach((entry, index) => {
      chartConfig[entry.key] = {
        ...chartConfig[entry.key],
        color: unifiedConfig.colors.series[index % unifiedConfig.colors.series.length],
      };
    });

    if (chart.chartType === "pie" || chart.chartType === "radial") {
      chartConfig.colors = unifiedConfig.colors.series.slice(0, seriesKeys.length);
    }

    // 生成主题
    const theme = convertToChartTheme(unifiedConfig);

    // 生成系列颜色信息
    const seriesColors = seriesKeys.map((entry, index) => ({
      ...entry,
      color: unifiedConfig.colors.series[index % unifiedConfig.colors.series.length],
    }));

    return {
      finalConfig: chartConfig,
      finalPalette: theme.palette,
      finalTheme: theme,
      finalSeriesColors: seriesColors,
    };
  }, [unifiedConfig, seriesKeys, chart]);

  return {
    // 新的统一接口
    unifiedConfig,
    handleConfigChange,

    // 兼容旧接口
    themeMode: unifiedConfig.mode,
    setThemeMode: (mode: "simple" | "complex") =>
      handleConfigChange({ type: "mode", key: "mode", value: mode }),
    baseColor: unifiedConfig.colors.primary,
    setBaseColor: handleBaseColorChange,
    finalConfig: legacyCompatibility.finalConfig,
    finalPalette: legacyCompatibility.finalPalette,
    finalThemeForExport: legacyCompatibility.finalTheme,
    finalSeriesColors: legacyCompatibility.finalSeriesColors,

    // 简化的颜色变更处理
    handleCustomColorChange: (type: string, value: string, index?: number) => {
      handleConfigChange({
        type: "color",
        key: type,
        value,
        index,
      });
    },
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
  options: UnifiedOptionConfig;
}> = memo(({ chart, chartRef, config, options }) => {
  console.log("📊 [ChartRenderer] 传递给EnhancedChart的props:", {
    type: chart.chartType,
    dataLength: chart.chartData?.length,
    title: chart.title,
  });

  return (
    <div ref={chartRef} className="w-full rounded-lg border p-4">
      <EnhancedChart type={chart.chartType} data={chart.chartData} config={config} {...options} />
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
 * ✅ 新的统一主题配置面板
 * 基于 UnifiedChartConfig 和动态配置系统
 */
const UnifiedThemePanel: FC<{
  config: UnifiedChartConfig;
  onChange: (event: ConfigChangeEvent) => void;
  onRegenerateImage: () => void;
  isRegenerating: boolean;
}> = memo(({ config, onChange, onRegenerateImage, isRegenerating }) => {
  const [hexInput, setHexInput] = useState(config.colors.primary);
  const [hexError, setHexError] = useState<string | null>(null);

  useEffect(() => {
    setHexInput(config.colors.primary);
  }, [config.colors.primary]);

  const handleHexInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
    setHexError(null);
    if (HEX_INPUT_PATTERN.test(e.target.value.trim())) {
      onChange({
        type: "color",
        key: "primary",
        value: normalizeHexColor(e.target.value),
      });
    }
  };

  const applyHexInput = () => {
    if (!HEX_INPUT_PATTERN.test(hexInput.trim())) {
      setHexError("Invalid hex color");
    } else {
      onChange({
        type: "color",
        key: "primary",
        value: normalizeHexColor(hexInput),
      });
    }
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <PaletteIcon className="h-4 w-4" />
            Theme
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateImage}
            disabled={isRegenerating}
            className="flex items-center gap-1"
          >
            <RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Rendering..." : "Regenerate Image"}</span>
          </Button>
        </div>

        <Tabs
          value={config.mode}
          onValueChange={v =>
            onChange({ type: "mode", key: "mode", value: v as "simple" | "complex" })
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="complex">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm">Base Color</Label>
              <input
                type="color"
                value={config.colors.primary}
                onChange={e => onChange({ type: "color", key: "primary", value: e.target.value })}
                className="border-border h-9 w-9 cursor-pointer rounded border"
              />
              <Input
                value={hexInput}
                onChange={handleHexInputChange}
                onBlur={applyHexInput}
                onKeyDown={e => e.key === "Enter" && applyHexInput()}
                className="w-24"
                placeholder="#3B82F6"
              />
              {hexError && <span className="text-xs text-red-500">{hexError}</span>}
            </div>
          </TabsContent>

          <TabsContent value="complex" className="space-y-3 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Grid</Label>
                <ColorInput
                  label="Grid"
                  value={config.colors.grid}
                  onChange={v => onChange({ type: "color", key: "grid", value: v })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Series Colors</Label>
                <div className="max-h-32 space-y-2 overflow-y-auto pr-2">
                  {config.colors.series.map((color, index) => (
                    <ColorInput
                      key={index}
                      label={config.seriesKeys[index]?.label || `Series ${index + 1}`}
                      value={color}
                      onChange={v => onChange({ type: "color", key: "series", value: v, index })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
UnifiedThemePanel.displayName = "UnifiedThemePanel";

/**
 * ✅ 新的动态图表选项面板
 * 基于JSON配置描述自动生成UI
 */
const UnifiedOptionsPanel: FC<{
  config: UnifiedChartConfig;
  onChange: (event: ConfigChangeEvent) => void;
}> = memo(({ config, onChange }) => {
  const schema = getChartConfigSchema(config.chartType);

  // 如果没有选项配置，不渲染面板
  if (schema.options.length === 0) {
    return null;
  }

  return (
    <DynamicConfigRenderer
      schema={{ colors: [], options: schema.options }} // 只渲染选项，不渲染颜色
      config={config}
      onChange={onChange}
      className="space-y-0" // 移除额外间距
    />
  );
});
UnifiedOptionsPanel.displayName = "UnifiedOptionsPanel";

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

  const {
    unifiedConfig,
    handleConfigChange,
    // 保留兼容接口
    themeMode,
    setThemeMode,
    baseColor,
    setBaseColor,
    finalConfig,
    finalPalette,
    finalThemeForExport,
    finalSeriesColors,
    handleCustomColorChange,
  } = useConfigurableChartTheme(chart);

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

      // 🎯 简化：不再支持主题重新生成的复杂逻辑
      // 如果需要新主题，应该重新生成整个图表
      console.log("⚠️ [ChartDisplayArea] 主题重新生成功能已简化，请重新生成图表");

      // 只通知图片更新（如果有的话）
      if (updatedChart.imageInfo?.localBlobUrl) {
        onImageGenerated?.(updatedChart.imageInfo.localBlobUrl);
      }
      toast({
        title: "Chart updated",
        description: "A new version with the updated theme has been added.",
      });
    } catch (error) {
      console.error("❌ [ChartDisplayArea] Failed to regenerate export:", error);
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
        <ChartThemeProvider
          chartType={chart.chartType}
          chartData={chart.chartData}
          chartConfig={finalConfig}
          theme={finalThemeForExport}
        >
          <ChartRenderer
            chart={chart}
            chartRef={chartRef}
            config={finalConfig}
            options={unifiedConfig.options}
          />
        </ChartThemeProvider>
      </div>

      <div className="grid gap-3 border-t p-3 md:grid-cols-2">
        <UnifiedThemePanel
          config={unifiedConfig}
          onChange={handleConfigChange}
          onRegenerateImage={handleRegenerateImage}
          isRegenerating={isRegenerating}
        />
        <UnifiedOptionsPanel config={unifiedConfig} onChange={handleConfigChange} />
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
          console.log("🔧 [ChartDisplayArea] Registering chart for export:", {
            chartId,
            title: chart.title,
            hasExistingImage: !!chart.imageInfo?.localBlobUrl,
          });
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
    <ChartThemeProvider
      chartType={chart.chartType}
      chartData={chart.chartData}
      chartConfig={chart.chartConfig}
      theme={chart.theme}
    >
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
    </ChartThemeProvider>
  );
}
