"use client";

import { BeautifulAreaChart } from "../area-chart";
import { BeautifulBarChart } from "../bar-chart";
import { BeautifulLineChart } from "../line-chart";
import { BeautifulPieChart } from "../pie-chart";
import { BeautifulRadarChart } from "../radar-chart";
import { BeautifulRadialChart } from "../radial-chart";
import {
  EnhancedChartProps,
  StandardChartData,
  ChartTypeValidationResult,
  ENHANCED_CHART_DEFAULTS,
} from "./types";
import { PieChartData } from "../pie-chart/types";
import { RadialChartData } from "../radial-chart/types";
import { useChartConfig } from "@/components/charts/simple-chart-wrapper";

/**
 * 验证数据与图表类型的兼容性
 */
export function validateChartTypeCompatibility(
  data: EnhancedChartProps["data"],
  type: EnhancedChartProps["type"]
): ChartTypeValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // 基础数据检查
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    isValid = false;
    return {
      isValid,
      errors,
      dataStats: {
        pointCount: 0,
        seriesCount: 0,
        hasTimeData: false,
        hasCategoryData: false,
        hasNumericalData: false,
      },
    };
  }

  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const pointCount = data.length;

  // 检查数据格式
  const isPieFormat = "name" in firstItem && "value" in firstItem;
  const isStandardFormat = keys.length >= 2 && !isPieFormat;

  let seriesCount = 0;
  let hasTimeData = false;
  let hasCategoryData = false;
  let hasNumericalData = false;

  if (isPieFormat) {
    seriesCount = 1;
    hasCategoryData = true;
    hasNumericalData = true;
  } else if (isStandardFormat) {
    seriesCount = keys.length - 1; // 除去第一个键（通常是分类/时间）

    // 检查第一个键是否是时间数据
    const firstKey = keys[0];
    const firstValue = firstItem[firstKey];
    if (typeof firstValue === "string") {
      hasTimeData = /\d{4}|\d{1,2}月|Q\d|week|day|年|季度/i.test(firstValue);
      hasCategoryData = !hasTimeData;
    }

    // 检查是否有数值数据
    hasNumericalData = keys
      .slice(1)
      .some(key => data.some(item => typeof (item as any)[key] === "number"));
  }

  // 图表类型兼容性验证
  switch (type) {
    case "pie":
      if (!isPieFormat && !isStandardFormat) {
        errors.push("饼图需要包含 name 和 value 字段，或标准的分类数据格式");
        isValid = false;
      }
      if (pointCount < 2) {
        errors.push("饼图至少需要2个数据点");
        isValid = false;
      }
      break;

    case "radial":
      if (!isPieFormat && !isStandardFormat) {
        errors.push("径向图需要包含 name 和 value 字段，或标准的分类数据格式");
        isValid = false;
      }
      if (pointCount < 2) {
        errors.push("径向图建议至少包含2个数据点");
        isValid = false;
      }
      break;

    case "bar":
    case "line":
    case "area":
      if (isPieFormat) {
        errors.push(`${type}图不支持饼图数据格式，请使用标准数据格式`);
        isValid = false;
      }
      if (pointCount < 2) {
        errors.push(`${type}图至少需要2个数据点`);
        isValid = false;
      }
      if (seriesCount < 1) {
        errors.push(`${type}图至少需要1个数值系列`);
        isValid = false;
      }
      break;

    case "radar":
      if (!isStandardFormat) {
        errors.push("雷达图需要标准的分类数据格式");
        isValid = false;
      }
      if (pointCount < 3) {
        errors.push("雷达图至少需要3个数据点");
        isValid = false;
      }
      if (seriesCount < 2) {
        errors.push("雷达图至少需要2个数值系列用于比较");
        isValid = false;
      }
      break;

    default:
      errors.push(`不支持的图表类型: ${type}`);
      isValid = false;
  }

  return {
    isValid,
    errors,
    dataStats: {
      pointCount,
      seriesCount,
      hasTimeData,
      hasCategoryData,
      hasNumericalData,
    },
  };
}

/**
 * 数据格式转换：标准数据转饼图数据
 */
export function transformToPieData(data: StandardChartData): PieChartData {
  if (data.length === 0) return [];

  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const nameKey = keys[0]; // 第一个键作为名称
  const valueKeys = keys.slice(1); // 其余键作为数值

  // 如果只有一个数值列，直接转换
  if (valueKeys.length === 1) {
    const valueKey = valueKeys[0];
    return data.map(item => ({
      name: String(item[nameKey]),
      value: Number(item[valueKey]) || 0,
    }));
  }

  // 如果有多个数值列，聚合所有数值
  return data.map(item => {
    const total = valueKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    return {
      name: String(item[nameKey]),
      value: total,
    };
  });
}

/**
 * 增强图表组件
 * 统一的图表包装器，支持所有图表类型
 */
export function EnhancedChart({
  type,
  data,
  config,
  title,
  description,
  className = ENHANCED_CHART_DEFAULTS.className,
  stacked = ENHANCED_CHART_DEFAULTS.stacked,
  fillOpacity = ENHANCED_CHART_DEFAULTS.fillOpacity,
  innerRadius = ENHANCED_CHART_DEFAULTS.innerRadius,
  outerRadius = ENHANCED_CHART_DEFAULTS.outerRadius,
  showPercentage = ENHANCED_CHART_DEFAULTS.showPercentage,
  showLegend = ENHANCED_CHART_DEFAULTS.showLegend,
  barRadius = ENHANCED_CHART_DEFAULTS.bar.radius,
  barShowValues = ENHANCED_CHART_DEFAULTS.bar.showValues,
  barShowGrid = ENHANCED_CHART_DEFAULTS.bar.showGrid,
  lineCurveType = ENHANCED_CHART_DEFAULTS.line.curveType,
  lineShowDots = ENHANCED_CHART_DEFAULTS.line.showDots,
  lineDotSize = ENHANCED_CHART_DEFAULTS.line.dotSize,
  lineDotVariant = ENHANCED_CHART_DEFAULTS.line.dotVariant,
  lineShowGrid = ENHANCED_CHART_DEFAULTS.line.showGrid,
  radarShowGrid = ENHANCED_CHART_DEFAULTS.radar.showGrid,
  radarShowLegend = ENHANCED_CHART_DEFAULTS.radar.showLegend,
  radarShowDots = ENHANCED_CHART_DEFAULTS.radar.showDots,
  radarShowArea = ENHANCED_CHART_DEFAULTS.radar.showArea,
  radarFillOpacity = ENHANCED_CHART_DEFAULTS.radar.fillOpacity,
  radarStrokeWidth = ENHANCED_CHART_DEFAULTS.radar.strokeWidth,
  radarMaxValue,
  radialBarSize = ENHANCED_CHART_DEFAULTS.radial.barSize,
  radialCornerRadius = ENHANCED_CHART_DEFAULTS.radial.cornerRadius,
  radialStartAngle = ENHANCED_CHART_DEFAULTS.radial.startAngle,
  radialEndAngle = ENHANCED_CHART_DEFAULTS.radial.endAngle,
  radialShowBackground = ENHANCED_CHART_DEFAULTS.radial.showBackground,
  radialShowLabels = ENHANCED_CHART_DEFAULTS.radial.showLabels,
  radialInnerRadius = ENHANCED_CHART_DEFAULTS.radial.innerRadius,
  radialOuterRadius = ENHANCED_CHART_DEFAULTS.radial.outerRadius,
  exportMode = false,
  areaUseGradient = ENHANCED_CHART_DEFAULTS.area.useGradient,
  areaShowGrid = ENHANCED_CHART_DEFAULTS.area.showGrid,
  unifiedConfig,
  primaryColor = "#22c55e",
  ...props
}: EnhancedChartProps & { unifiedConfig?: any; primaryColor?: string }) {
  // 使用新的图表配置hook生成配置（作为fallback）
  // 转换ChartConfig为简化的config格式
  const simplifiedConfig: Record<string, { label?: string; color?: string; show?: boolean }> = {};
  if (config) {
    Object.entries(config).forEach(([key, value]) => {
      simplifiedConfig[key] = {
        label: typeof value.label === "string" ? value.label : undefined,
        color: value.color,
        show: true,
      };
    });
  }
  const { colors: generatedColors } = useChartConfig(type, data, simplifiedConfig, primaryColor);

  // 🎯 优先使用统一配置，其次使用生成的配置，最后使用传入的config
  let activeConfig = config;
  let activeOptions: Record<string, any> = { ...props };
  let activeColors = generatedColors;

  if (unifiedConfig) {
    // 使用统一配置的颜色
    activeColors = unifiedConfig.colors;

    // 生成带颜色的配置
    activeConfig = { ...config };

    // 为系列添加颜色配置
    if (unifiedConfig.seriesKeys && unifiedConfig.colors.series) {
      unifiedConfig.seriesKeys.forEach((entry: any, index: number) => {
        const key = entry.key || entry;
        const existingConfig = activeConfig[key] || {};
        // Only set color if theme is not already defined (ChartConfig type constraint)
        activeConfig[key] = existingConfig.theme
          ? existingConfig
          : {
              ...existingConfig,
              color: unifiedConfig.colors.series[index % unifiedConfig.colors.series.length],
            };
      });
    }

    // 注意：饼图和径向图的颜色数组通过activeColors.series直接传递给组件
    // 不需要添加到activeConfig中，因为ChartConfig结构不支持这些属性

    // 使用统一配置的选项
    activeOptions = { ...props, ...unifiedConfig.options };
  } else {
    // 使用生成的颜色配置更新activeConfig
    const dataKeys =
      Array.isArray(data) && data.length > 0
        ? Object.keys(data[0]).filter(key => key !== "name")
        : [];

    dataKeys.forEach((key, index) => {
      const existingConfig = activeConfig[key] || {};
      // Only set color if theme is not already defined (ChartConfig type constraint)
      activeConfig[key] = existingConfig.theme
        ? existingConfig
        : {
            ...existingConfig,
            color: activeColors.series[index % activeColors.series.length],
          };
    });

    // 注意：饼图和径向图的颜色数组通过activeColors.series直接传递给组件
    // 不需要添加到activeConfig中，因为ChartConfig结构不支持这些属性
  }


  // 验证数据兼容性
  const validation = validateChartTypeCompatibility(data, type);

  if (!validation.isValid) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">数据格式错误</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {validation.errors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 渲染对应的图表组件
  switch (type) {
    case "bar":
      return (
        <BeautifulBarChart
          data={data as StandardChartData}
          config={activeConfig}
          title={title}
          description={description}
          barRadius={activeOptions.barRadius ?? barRadius}
          showValueLabels={activeOptions.barShowValues ?? barShowValues}
          showGrid={activeOptions.barShowGrid ?? barShowGrid}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    case "line":
      return (
        <BeautifulLineChart
          data={data as StandardChartData}
          config={activeConfig}
          title={title}
          description={description}
          curveType={activeOptions.lineCurveType ?? lineCurveType}
          showDots={activeOptions.lineShowDots ?? lineShowDots}
          dotSize={activeOptions.lineDotSize ?? lineDotSize}
          dotVariant={activeOptions.lineDotVariant ?? lineDotVariant}
          showGrid={activeOptions.lineShowGrid ?? lineShowGrid}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    case "pie":
      // 数据格式转换处理
      let pieData: PieChartData;
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if ("name" in firstItem && "value" in firstItem) {
          // 已经是饼图格式
          pieData = data as PieChartData;
        } else {
          // 转换标准数据为饼图格式
          pieData = transformToPieData(data as StandardChartData);
        }
      } else {
        pieData = [];
      }

      return (
        <BeautifulPieChart
          data={pieData}
          config={activeConfig}
          title={title}
          description={description}
          showPercentage={activeOptions.showPercentage ?? showPercentage}
          showLegend={activeOptions.showLegend ?? showLegend}
          innerRadius={activeOptions.innerRadius ?? innerRadius}
          outerRadius={activeOptions.outerRadius ?? outerRadius}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    case "radial":
      let radialData: RadialChartData;
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if ("name" in firstItem && "value" in firstItem) {
          radialData = data as RadialChartData;
        } else {
          radialData = transformToPieData(data as StandardChartData) as RadialChartData;
        }
      } else {
        radialData = [];
      }

      return (
        <BeautifulRadialChart
          data={radialData}
          config={activeConfig}
          title={title}
          description={description}
          innerRadius={activeOptions.radialInnerRadius ?? radialInnerRadius ?? innerRadius}
          outerRadius={activeOptions.radialOuterRadius ?? radialOuterRadius ?? outerRadius}
          barSize={activeOptions.radialBarSize ?? radialBarSize}
          cornerRadius={activeOptions.radialCornerRadius ?? radialCornerRadius}
          startAngle={activeOptions.radialStartAngle ?? radialStartAngle}
          endAngle={activeOptions.radialEndAngle ?? radialEndAngle}
          showLegend={activeOptions.showLegend ?? showLegend}
          showBackground={activeOptions.radialShowBackground ?? radialShowBackground}
          showLabels={activeOptions.radialShowLabels ?? radialShowLabels}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    case "area":
      return (
        <BeautifulAreaChart
          data={data as StandardChartData}
          config={activeConfig}
          title={title}
          description={description}
          stacked={activeOptions.stacked ?? stacked}
          fillOpacity={activeOptions.areaFillOpacity ?? activeOptions.fillOpacity ?? fillOpacity}
          useGradient={activeOptions.areaUseGradient ?? areaUseGradient}
          showGrid={activeOptions.areaShowGrid ?? areaShowGrid}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    case "radar":
      return (
        <BeautifulRadarChart
          data={data as StandardChartData}
          config={activeConfig}
          title={title}
          description={description}
          showGrid={activeOptions.radarShowGrid ?? radarShowGrid}
          showLegend={activeOptions.radarShowLegend ?? radarShowLegend}
          showDots={activeOptions.radarShowDots ?? radarShowDots}
          showArea={activeOptions.radarShowArea ?? radarShowArea}
          fillOpacity={activeOptions.radarFillOpacity ?? radarFillOpacity}
          strokeWidth={activeOptions.radarStrokeWidth ?? radarStrokeWidth}
          maxValue={activeOptions.radarMaxValue ?? radarMaxValue}
          colors={activeColors}
          primaryColor={primaryColor}
        />
      );

    default:
      return (
        <div className="bg-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">不支持的图表类型: {type}</p>
        </div>
      );
  }
}

// 默认导出
export default EnhancedChart;
