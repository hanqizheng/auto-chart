"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { X, AlertCircle, RotateCcw, RefreshCcw, Palette as PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartResultContent, ChartType } from "@/types";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { useChartExport, useChartExportStatus } from "@/contexts/chart-export-context";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { chartExportService } from "@/services/chart-export-service";
import { normalizeHexColor } from "@/lib/colors";
import { useChartTheme } from "@/contexts/chart-theme-context";
import { globalChartManager } from "@/lib/global-chart-manager";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ENHANCED_CHART_DEFAULTS } from "@/components/charts/enhanced-chart/types";
import { CHART_TYPE_LABELS } from "@/constants/chart";
import type { LineDotVariant } from "@/components/charts/line-chart/types";

interface ChartDisplayAreaProps {
  chart: ChartResultContent | null;
  onClose: () => void;
  onUpdateChart?: (chart: ChartResultContent) => void;
}

const HEX_INPUT_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const BAR_RADIUS_MAX = 24;

const LINE_DOT_VARIANTS: Array<{ value: LineDotVariant; label: string }> = [
  { value: "default", label: "Default" },
  { value: "solid", label: "Solid" },
  { value: "icon", label: "Icon" },
];

type ChartOptionState = {
  barRadius?: number;
  barShowValues?: boolean;
  barShowGrid?: boolean;
  lineCurveType?: "monotone" | "linear";
  lineShowDots?: boolean;
  lineDotSize?: number;
  lineDotVariant?: LineDotVariant;
  lineShowGrid?: boolean;
  areaFillOpacity?: number;
  areaStacked?: boolean;
  areaUseGradient?: boolean;
  areaShowGrid?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  showPercentage?: boolean;
  showLegend?: boolean;
  radialInnerRadius?: number;
  radialOuterRadius?: number;
  radialBarSize?: number;
  radialCornerRadius?: number;
  radialShowBackground?: boolean;
  radialShowLabels?: boolean;
  radarShowArea?: boolean;
  radarShowDots?: boolean;
  radarShowGrid?: boolean;
  radarShowLegend?: boolean;
  radarFillOpacity?: number;
  radarStrokeWidth?: number;
};

function getDefaultOptions(chartType: ChartType): ChartOptionState {
  switch (chartType) {
    case "bar":
      return {
        barRadius: ENHANCED_CHART_DEFAULTS.bar.radius,
        barShowValues: ENHANCED_CHART_DEFAULTS.bar.showValues,
        barShowGrid: ENHANCED_CHART_DEFAULTS.bar.showGrid,
      };
    case "line":
      return {
        lineCurveType: ENHANCED_CHART_DEFAULTS.line.curveType,
        lineShowDots: ENHANCED_CHART_DEFAULTS.line.showDots,
        lineDotSize: ENHANCED_CHART_DEFAULTS.line.dotSize,
        lineDotVariant: ENHANCED_CHART_DEFAULTS.line.dotVariant,
        lineShowGrid: ENHANCED_CHART_DEFAULTS.line.showGrid,
      };
    case "area":
      return {
        areaFillOpacity: ENHANCED_CHART_DEFAULTS.fillOpacity,
        areaStacked: ENHANCED_CHART_DEFAULTS.stacked,
        areaUseGradient: ENHANCED_CHART_DEFAULTS.area.useGradient,
        areaShowGrid: ENHANCED_CHART_DEFAULTS.area.showGrid,
      };
    case "pie":
      return {
        innerRadius: ENHANCED_CHART_DEFAULTS.innerRadius,
        outerRadius: ENHANCED_CHART_DEFAULTS.outerRadius,
        showPercentage: ENHANCED_CHART_DEFAULTS.showPercentage,
        showLegend: ENHANCED_CHART_DEFAULTS.showLegend,
      };
    case "radial":
      return {
        radialInnerRadius: ENHANCED_CHART_DEFAULTS.radial.innerRadius,
        radialOuterRadius: ENHANCED_CHART_DEFAULTS.radial.outerRadius,
        radialBarSize: ENHANCED_CHART_DEFAULTS.radial.barSize,
        radialCornerRadius: ENHANCED_CHART_DEFAULTS.radial.cornerRadius,
        radialShowBackground: ENHANCED_CHART_DEFAULTS.radial.showBackground,
        radialShowLabels: ENHANCED_CHART_DEFAULTS.radial.showLabels,
        showLegend: ENHANCED_CHART_DEFAULTS.showLegend,
      };
    case "radar":
      return {
        radarShowArea: ENHANCED_CHART_DEFAULTS.radar.showArea,
        radarShowDots: ENHANCED_CHART_DEFAULTS.radar.showDots,
        radarShowGrid: ENHANCED_CHART_DEFAULTS.radar.showGrid,
        radarShowLegend: ENHANCED_CHART_DEFAULTS.radar.showLegend,
        radarFillOpacity: ENHANCED_CHART_DEFAULTS.radar.fillOpacity,
        radarStrokeWidth: ENHANCED_CHART_DEFAULTS.radar.strokeWidth,
      };
    default:
      return {};
  }
}

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
function getChartTypeLabel(chartType: ChartType): string {
  return CHART_TYPE_LABELS[chartType]?.en || chartType;
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

  const defaultOptions = useMemo(() => getDefaultOptions(chart.chartType), [chart.chartType]);

  // Debounced state for chart rendering
  const [chartOptions, setChartOptions] = useState<ChartOptionState>(defaultOptions);
  // Immediate state for responsive UI controls
  const [pendingOptions, setPendingOptions] = useState<ChartOptionState>(defaultOptions);

  // Reset states when chart type changes
  useEffect(() => {
    const newDefaults = getDefaultOptions(chart.chartType);
    setChartOptions(newDefaults);
    setPendingOptions(newDefaults);
  }, [chart.chartType, defaultOptions]);

  // Debounce effect: apply pending options to chart options after a delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setChartOptions(pendingOptions);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [pendingOptions]);

  const updatePendingOptions = useCallback((partial: Partial<ChartOptionState>) => {
    setPendingOptions(prev => ({ ...prev, ...partial }));
  }, []);

  // For chart rendering (uses debounced state)
  const getOption = useCallback(
    <K extends keyof ChartOptionState>(key: K, fallback?: ChartOptionState[K]) =>
      (chartOptions[key] ?? defaultOptions[key] ?? fallback) as ChartOptionState[K],
    [chartOptions, defaultOptions]
  );

  // For UI controls (uses immediate state)
  const getPendingOption = useCallback(
    <K extends keyof ChartOptionState>(key: K, fallback?: ChartOptionState[K]) =>
      (pendingOptions[key] ?? defaultOptions[key] ?? fallback) as ChartOptionState[K],
    [pendingOptions, defaultOptions]
  );

  const resolvedOptions = useMemo(
    () => ({
      barRadius: getOption("barRadius", ENHANCED_CHART_DEFAULTS.bar.radius),
      barShowValues: getOption("barShowValues", ENHANCED_CHART_DEFAULTS.bar.showValues),
      barShowGrid: getOption("barShowGrid", ENHANCED_CHART_DEFAULTS.bar.showGrid),
      lineCurveType: getOption("lineCurveType", ENHANCED_CHART_DEFAULTS.line.curveType),
      lineShowDots: getOption("lineShowDots", ENHANCED_CHART_DEFAULTS.line.showDots),
      lineDotSize: getOption("lineDotSize", ENHANCED_CHART_DEFAULTS.line.dotSize),
      lineDotVariant: getOption("lineDotVariant", ENHANCED_CHART_DEFAULTS.line.dotVariant),
      lineShowGrid: getOption("lineShowGrid", ENHANCED_CHART_DEFAULTS.line.showGrid),
      areaFillOpacity: getOption("areaFillOpacity", ENHANCED_CHART_DEFAULTS.fillOpacity),
      areaStacked: getOption("areaStacked", ENHANCED_CHART_DEFAULTS.stacked),
      areaUseGradient: getOption("areaUseGradient", ENHANCED_CHART_DEFAULTS.area.useGradient),
      areaShowGrid: getOption("areaShowGrid", ENHANCED_CHART_DEFAULTS.area.showGrid),
      innerRadius: getOption("innerRadius", ENHANCED_CHART_DEFAULTS.innerRadius),
      outerRadius: getOption("outerRadius", ENHANCED_CHART_DEFAULTS.outerRadius),
      showPercentage: getOption("showPercentage", ENHANCED_CHART_DEFAULTS.showPercentage),
      showLegend: getOption("showLegend", ENHANCED_CHART_DEFAULTS.showLegend),
      radialInnerRadius: getOption("radialInnerRadius", ENHANCED_CHART_DEFAULTS.radial.innerRadius),
      radialOuterRadius: getOption("radialOuterRadius", ENHANCED_CHART_DEFAULTS.radial.outerRadius),
      radialBarSize: getOption("radialBarSize", ENHANCED_CHART_DEFAULTS.radial.barSize),
      radialCornerRadius: getOption(
        "radialCornerRadius",
        ENHANCED_CHART_DEFAULTS.radial.cornerRadius
      ),
      radialShowBackground: getOption(
        "radialShowBackground",
        ENHANCED_CHART_DEFAULTS.radial.showBackground
      ),
      radialShowLabels: getOption("radialShowLabels", ENHANCED_CHART_DEFAULTS.radial.showLabels),
      radarShowArea: getOption("radarShowArea", ENHANCED_CHART_DEFAULTS.radar.showArea),
      radarShowDots: getOption("radarShowDots", ENHANCED_CHART_DEFAULTS.radar.showDots),
      radarShowGrid: getOption("radarShowGrid", ENHANCED_CHART_DEFAULTS.radar.showGrid),
      radarShowLegend: getOption("radarShowLegend", ENHANCED_CHART_DEFAULTS.radar.showLegend),
      radarFillOpacity: getOption("radarFillOpacity", ENHANCED_CHART_DEFAULTS.radar.fillOpacity),
      radarStrokeWidth: getOption("radarStrokeWidth", ENHANCED_CHART_DEFAULTS.radar.strokeWidth),
    }),
    [getOption]
  );

  const renderChartControls = () => {
    const sectionClass =
      "flex flex-wrap items-center gap-4 border-t border-dashed border-border/50 pt-3";
    switch (chart.chartType) {
      case "bar":
        return (
          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Bar radius</Label>
              <Slider
                value={[getPendingOption("barRadius", ENHANCED_CHART_DEFAULTS.bar.radius) ?? 0]}
                min={0}
                max={BAR_RADIUS_MAX}
                step={1}
                className="w-32"
                onValueChange={value => updatePendingOptions({ barRadius: value[0] })}
              />
              <span className="text-muted-foreground text-xs">
                {(getPendingOption("barRadius", ENHANCED_CHART_DEFAULTS.bar.radius) ?? 0).toFixed(0)}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="bar-show-values"
                checked={getPendingOption("barShowValues", ENHANCED_CHART_DEFAULTS.bar.showValues) ?? true}
                onCheckedChange={value => updatePendingOptions({ barShowValues: value })}
              />
              <Label htmlFor="bar-show-values" className="text-muted-foreground text-sm">
                Show value labels
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="bar-grid"
                checked={getPendingOption("barShowGrid", ENHANCED_CHART_DEFAULTS.bar.showGrid) ?? true}
                onCheckedChange={value => updatePendingOptions({ barShowGrid: value })}
              />
              <Label htmlFor="bar-grid" className="text-muted-foreground text-sm">
                Show background grid
              </Label>
            </div>
          </div>
        );

      case "line": {
        const dotsEnabled =
          getPendingOption("lineShowDots", ENHANCED_CHART_DEFAULTS.line.showDots) ?? true;
        const currentVariant = getPendingOption(
          "lineDotVariant",
          ENHANCED_CHART_DEFAULTS.line.dotVariant
        ) as LineDotVariant;

        return (
          <div className={sectionClass}>
            <div className="flex items-center gap-2">
              <Switch
                id="line-smooth"
                checked={
                  getPendingOption("lineCurveType", ENHANCED_CHART_DEFAULTS.line.curveType) !== "linear"
                }
                onCheckedChange={value =>
                  updatePendingOptions({ lineCurveType: value ? "monotone" : "linear" })
                }
              />
              <Label htmlFor="line-smooth" className="text-muted-foreground text-sm">
                Smooth curves
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="line-grid"
                checked={getPendingOption("lineShowGrid", ENHANCED_CHART_DEFAULTS.line.showGrid) ?? true}
                onCheckedChange={value => updatePendingOptions({ lineShowGrid: value })}
              />
              <Label htmlFor="line-grid" className="text-muted-foreground text-sm">
                Show background grid
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="line-dots"
                checked={dotsEnabled}
                onCheckedChange={value => updatePendingOptions({ lineShowDots: value })}
              />
              <Label htmlFor="line-dots" className="text-muted-foreground text-sm">
                Show points
              </Label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-muted-foreground text-sm font-medium">Point style</Label>
              <div className="flex flex-wrap items-center gap-2">
                {LINE_DOT_VARIANTS.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={currentVariant === option.value ? "default" : "outline"}
                    disabled={!dotsEnabled}
                    onClick={() => updatePendingOptions({ lineDotVariant: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "area":
        return (
          <div className={sectionClass}>
            <div className="flex items-center gap-2">
              <Switch
                id="area-stacked"
                checked={getPendingOption("areaStacked", ENHANCED_CHART_DEFAULTS.stacked) ?? false}
                onCheckedChange={value => updatePendingOptions({ areaStacked: value })}
              />
              <Label htmlFor="area-stacked" className="text-muted-foreground text-sm">
                Stacked series
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="area-gradient"
                checked={
                  getPendingOption("areaUseGradient", ENHANCED_CHART_DEFAULTS.area.useGradient) ?? true
                }
                onCheckedChange={value => updatePendingOptions({ areaUseGradient: value })}
              />
              <Label htmlFor="area-gradient" className="text-muted-foreground text-sm">
                Gradient fill
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Fill opacity</Label>
              <Slider
                value={[getPendingOption("areaFillOpacity", ENHANCED_CHART_DEFAULTS.fillOpacity) ?? 0.6]}
                min={0.1}
                max={1}
                step={0.05}
                className="w-36"
                onValueChange={value =>
                  updatePendingOptions({ areaFillOpacity: Number(value[0].toFixed(2)) })
                }
              />
              <span className="text-muted-foreground text-xs">
                {Math.round(
                  (getPendingOption("areaFillOpacity", ENHANCED_CHART_DEFAULTS.fillOpacity) ?? 0.6) * 100
                )}
                %
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="area-grid"
                checked={getPendingOption("areaShowGrid", ENHANCED_CHART_DEFAULTS.area.showGrid) ?? true}
                onCheckedChange={value => updatePendingOptions({ areaShowGrid: value })}
              />
              <Label htmlFor="area-grid" className="text-muted-foreground text-sm">
                Show background grid
              </Label>
            </div>
          </div>
        );

      case "pie":
        return (
          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Inner radius</Label>
              <Slider
                value={[getPendingOption("innerRadius", ENHANCED_CHART_DEFAULTS.innerRadius) ?? 0]}
                min={0}
                max={90}
                step={5}
                className="w-36"
                onValueChange={value => updatePendingOptions({ innerRadius: value[0] })}
              />
              <span className="text-muted-foreground text-xs">
                {getPendingOption("innerRadius", ENHANCED_CHART_DEFAULTS.innerRadius) ?? 0}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="pie-percentage"
                checked={
                  getPendingOption("showPercentage", ENHANCED_CHART_DEFAULTS.showPercentage) ?? true
                }
                onCheckedChange={value => updatePendingOptions({ showPercentage: value })}
              />
              <Label htmlFor="pie-percentage" className="text-muted-foreground text-sm">
                Show percentage labels
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="pie-legend"
                checked={getPendingOption("showLegend", ENHANCED_CHART_DEFAULTS.showLegend) ?? true}
                onCheckedChange={value => updatePendingOptions({ showLegend: value })}
              />
              <Label htmlFor="pie-legend" className="text-muted-foreground text-sm">
                Show legend
              </Label>
            </div>
          </div>
        );

      case "radial":
        return (
          <div className="border-border/50 flex flex-col gap-3 border-t border-dashed pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Inner radius</Label>
              <Slider
                value={[
                  getPendingOption("radialInnerRadius", ENHANCED_CHART_DEFAULTS.radial.innerRadius) ?? 40,
                ]}
                min={10}
                max={100}
                step={5}
                className="w-32"
                onValueChange={value => updatePendingOptions({ radialInnerRadius: value[0] })}
              />
              <span className="text-muted-foreground text-xs">
                {getPendingOption("radialInnerRadius", ENHANCED_CHART_DEFAULTS.radial.innerRadius) ?? 40}px
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Bar thickness</Label>
              <Slider
                value={[getPendingOption("radialBarSize", ENHANCED_CHART_DEFAULTS.radial.barSize) ?? 14]}
                min={6}
                max={30}
                step={1}
                className="w-32"
                onValueChange={value => updatePendingOptions({ radialBarSize: value[0] })}
              />
              <span className="text-muted-foreground text-xs">
                {getPendingOption("radialBarSize", ENHANCED_CHART_DEFAULTS.radial.barSize) ?? 14}px
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Corner radius</Label>
              <Slider
                value={[
                  getPendingOption("radialCornerRadius", ENHANCED_CHART_DEFAULTS.radial.cornerRadius) ?? 6,
                ]}
                min={0}
                max={16}
                step={1}
                className="w-32"
                onValueChange={value => updatePendingOptions({ radialCornerRadius: value[0] })}
              />
              <span className="text-muted-foreground text-xs">
                {getPendingOption("radialCornerRadius", ENHANCED_CHART_DEFAULTS.radial.cornerRadius) ?? 6}
                px
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="radial-labels"
                  checked={
                    getPendingOption("radialShowLabels", ENHANCED_CHART_DEFAULTS.radial.showLabels) ?? true
                  }
                  onCheckedChange={value => updatePendingOptions({ radialShowLabels: value })}
                />
                <Label htmlFor="radial-labels" className="text-muted-foreground text-sm">
                  Show value labels
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="radial-background"
                  checked={
                    getPendingOption(
                      "radialShowBackground",
                      ENHANCED_CHART_DEFAULTS.radial.showBackground
                    ) ?? true
                  }
                  onCheckedChange={value => updatePendingOptions({ radialShowBackground: value })}
                />
                <Label htmlFor="radial-background" className="text-muted-foreground text-sm">
                  Show background track
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="radial-legend"
                  checked={getPendingOption("showLegend", ENHANCED_CHART_DEFAULTS.showLegend) ?? true}
                  onCheckedChange={value => updatePendingOptions({ showLegend: value })}
                />
                <Label htmlFor="radial-legend" className="text-muted-foreground text-sm">
                  Show legend
                </Label>
              </div>
            </div>
          </div>
        );

      case "radar":
        return (
          <div className="border-border/50 flex flex-col gap-3 border-t border-dashed pt-3">
            <div className="flex items-center gap-2">
              <Switch
                id="radar-area"
                checked={getPendingOption("radarShowArea", ENHANCED_CHART_DEFAULTS.radar.showArea) ?? true}
                onCheckedChange={value => updatePendingOptions({ radarShowArea: value })}
              />
              <Label htmlFor="radar-area" className="text-muted-foreground text-sm">
                Fill polygon area
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="radar-dots"
                checked={getPendingOption("radarShowDots", ENHANCED_CHART_DEFAULTS.radar.showDots) ?? true}
                onCheckedChange={value => updatePendingOptions({ radarShowDots: value })}
              />
              <Label htmlFor="radar-dots" className="text-muted-foreground text-sm">
                Show points
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="radar-grid"
                checked={getPendingOption("radarShowGrid", ENHANCED_CHART_DEFAULTS.radar.showGrid) ?? true}
                onCheckedChange={value => updatePendingOptions({ radarShowGrid: value })}
              />
              <Label htmlFor="radar-grid" className="text-muted-foreground text-sm">
                Show polar grid
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="radar-legend"
                checked={
                  getPendingOption("radarShowLegend", ENHANCED_CHART_DEFAULTS.radar.showLegend) ?? true
                }
                onCheckedChange={value => updatePendingOptions({ radarShowLegend: value })}
              />
              <Label htmlFor="radar-legend" className="text-muted-foreground text-sm">
                Show legend
              </Label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Fill opacity</Label>
              <Slider
                value={[
                  getPendingOption("radarFillOpacity", ENHANCED_CHART_DEFAULTS.radar.fillOpacity) ?? 0.25,
                ]}
                min={0.1}
                max={0.8}
                step={0.05}
                className="w-32"
                onValueChange={value =>
                  updatePendingOptions({ radarFillOpacity: Number(value[0].toFixed(2)) })
                }
              />
              <span className="text-muted-foreground text-xs">
                {Math.round(
                  (getPendingOption("radarFillOpacity", ENHANCED_CHART_DEFAULTS.radar.fillOpacity) ??
                    0.25) * 100
                )}
                %
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-muted-foreground text-sm font-medium">Outline width</Label>
              <Slider
                value={[
                  getPendingOption("radarStrokeWidth", ENHANCED_CHART_DEFAULTS.radar.strokeWidth) ?? 2,
                ]}
                min={1}
                max={5}
                step={0.5}
                className="w-32"
                onValueChange={value => updatePendingOptions({ radarStrokeWidth: Number(value[0]) })}
              />
              <span className="text-muted-foreground text-xs">
                {(
                  getPendingOption("radarStrokeWidth", ENHANCED_CHART_DEFAULTS.radar.strokeWidth) ?? 2
                ).toFixed(1)}
                px
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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

      // Combine themedConfig with the latest resolvedOptions for the new chart object
      const newChartConfig = { ...themedConfig, ...resolvedOptions };

      const updatedChart: ChartResultContent = {
        ...chart,
        imageInfo,
        chartConfig: newChartConfig,
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
    resolvedOptions,
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

        {renderChartControls()}
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
              barRadius={chart.chartType === "bar" ? resolvedOptions.barRadius : undefined}
              barShowValues={chart.chartType === "bar" ? resolvedOptions.barShowValues : undefined}
              barShowGrid={chart.chartType === "bar" ? resolvedOptions.barShowGrid : undefined}
              lineCurveType={chart.chartType === "line" ? resolvedOptions.lineCurveType : undefined}
              lineShowDots={chart.chartType === "line" ? resolvedOptions.lineShowDots : undefined}
              lineDotSize={chart.chartType === "line" ? resolvedOptions.lineDotSize : undefined}
              lineDotVariant={
                chart.chartType === "line" ? resolvedOptions.lineDotVariant : undefined
              }
              lineShowGrid={chart.chartType === "line" ? resolvedOptions.lineShowGrid : undefined}
              stacked={chart.chartType === "area" ? resolvedOptions.areaStacked : undefined}
              fillOpacity={chart.chartType === "area" ? resolvedOptions.areaFillOpacity : undefined}
              areaUseGradient={
                chart.chartType === "area" ? resolvedOptions.areaUseGradient : undefined
              }
              areaShowGrid={chart.chartType === "area" ? resolvedOptions.areaShowGrid : undefined}
              innerRadius={chart.chartType === "pie" ? resolvedOptions.innerRadius : undefined}
              outerRadius={chart.chartType === "pie" ? resolvedOptions.outerRadius : undefined}
              showPercentage={
                chart.chartType === "pie" ? resolvedOptions.showPercentage : undefined
              }
              showLegend={
                chart.chartType === "pie" || chart.chartType === "radial"
                  ? resolvedOptions.showLegend
                  : chart.chartType === "radar"
                    ? resolvedOptions.radarShowLegend
                    : undefined
              }
              radialInnerRadius={
                chart.chartType === "radial" ? resolvedOptions.radialInnerRadius : undefined
              }
              radialOuterRadius={
                chart.chartType === "radial" ? resolvedOptions.radialOuterRadius : undefined
              }
              radialBarSize={
                chart.chartType === "radial" ? resolvedOptions.radialBarSize : undefined
              }
              radialCornerRadius={
                chart.chartType === "radial" ? resolvedOptions.radialCornerRadius : undefined
              }
              radialShowBackground={
                chart.chartType === "radial" ? resolvedOptions.radialShowBackground : undefined
              }
              radialShowLabels={
                chart.chartType === "radial" ? resolvedOptions.radialShowLabels : undefined
              }
              radarShowArea={
                chart.chartType === "radar" ? resolvedOptions.radarShowArea : undefined
              }
              radarShowDots={
                chart.chartType === "radar" ? resolvedOptions.radarShowDots : undefined
              }
              radarShowGrid={
                chart.chartType === "radar" ? resolvedOptions.radarShowGrid : undefined
              }
              radarShowLegend={
                chart.chartType === "radar" ? resolvedOptions.radarShowLegend : undefined
              }
              radarFillOpacity={
                chart.chartType === "radar" ? resolvedOptions.radarFillOpacity : undefined
              }
              radarStrokeWidth={
                chart.chartType === "radar" ? resolvedOptions.radarStrokeWidth : undefined
              }
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
