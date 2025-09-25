/**
 * 简化的图表配置包装器 - 重构版本
 * 使用新的简化颜色配置系统，避免复杂的动态key逻辑
 */

import React from "react";
import { ChartType } from "@/types/chart";
import { generateChartConfig } from "@/lib/data-standardization";
import { generateChartColors, SimplifiedColorConfig } from "@/lib/simplified-color-config";

interface SimpleChartWrapperProps {
  /** 图表类型 */
  chartType: ChartType;
  /** 图表数据 */
  data: unknown[];
  /** 图表配置 */
  config?: Record<string, { label?: string; color?: string; show?: boolean }>;
  /** 主色调（可选） */
  primaryColor?: string;
  /** 子组件 - 实际的图表组件 */
  children: (props: {
    standardizedData: unknown[];
    standardizedConfig: Record<string, { label?: string; color?: string; show?: boolean }>;
    colors: SimplifiedColorConfig;
    seriesCount: number;
  }) => React.ReactNode;
  /** 额外的样式类名 */
  className?: string;
}

/**
 * 简化的图表配置包装器组件 - 重构版本
 * 使用新的数据流：数据标准化 -> 系列数量计算 -> 颜色生成
 */
export function SimpleChartWrapper({
  chartType,
  data,
  config = {},
  primaryColor,
  children,
  className,
}: SimpleChartWrapperProps) {
  console.log(
    `🎯 [SimpleChartWrapper] Rendering ${chartType} chart with ${data.length} data points`
  );

  // 使用新的统一配置生成函数
  const baseChartConfig = React.useMemo(() => {
    return generateChartConfig(chartType, data, config);
  }, [chartType, data, config]);

  const resolvedPrimaryColor = primaryColor ?? baseChartConfig.primaryColor;

  // 基于系列数量生成颜色配置
  const colors = React.useMemo(() => {
    return generateChartColors(chartType, baseChartConfig.seriesCount, resolvedPrimaryColor);
  }, [chartType, baseChartConfig.seriesCount, resolvedPrimaryColor]);

  // 构建标准化的props
  const chartProps = React.useMemo(() => {
    return {
      standardizedData: baseChartConfig.data,
      standardizedConfig: baseChartConfig.config,
      colors,
      seriesCount: baseChartConfig.seriesCount,
    };
  }, [baseChartConfig.data, baseChartConfig.config, colors, baseChartConfig.seriesCount]);

  console.log(`✅ [SimpleChartWrapper] Generated config for ${chartType}:`, {
    seriesCount: baseChartConfig.seriesCount,
    colorsCount: colors.series.length,
    hasStroke: !!colors.seriesStroke,
  });

  return <div className={className}>{children(chartProps)}</div>;
}

/**
 * 用于直接生成颜色配置的工具函数 - 重构版本
 * 可以在不使用包装器的情况下获取颜色配置
 */
export function generateChartColorsFromData(
  chartType: ChartType,
  data: unknown[],
  config?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor?: string
): SimplifiedColorConfig {
  const baseChartConfig = generateChartConfig(chartType, data, config);
  const resolvedPrimaryColor = primaryColor ?? baseChartConfig.primaryColor;
  return generateChartColors(chartType, baseChartConfig.seriesCount, resolvedPrimaryColor);
}

/**
 * 生成适用于Recharts的颜色数组 - 重构版本
 * 简化的颜色提取，避免复杂的Context逻辑
 */
export function getSeriesColors(
  chartType: ChartType,
  data: unknown[],
  config?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor?: string
): string[] {
  const colors = generateChartColorsFromData(chartType, data, config, primaryColor);
  return colors.series;
}

/**
 * 生成适用于图表组件的标准化props - 重构版本
 */
export function generateStandardChartProps(
  chartType: ChartType,
  data: unknown[],
  config?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor?: string
) {
  const baseChartConfig = generateChartConfig(chartType, data, config);
  const resolvedPrimaryColor = primaryColor ?? baseChartConfig.primaryColor;
  const colors = generateChartColors(chartType, baseChartConfig.seriesCount, resolvedPrimaryColor);

  return {
    data: baseChartConfig.data,
    config: baseChartConfig.config,
    colors,
    seriesCount: baseChartConfig.seriesCount,
  };
}

/**
 * React Hook版本 - 重构版本，用于函数组件中生成图表配置
 */
export function useChartConfig(
  chartType: ChartType,
  data: unknown[],
  config?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor?: string
) {
  const baseChartConfig = React.useMemo(() => {
    return generateChartConfig(chartType, data, config);
  }, [chartType, data, config]);

  const resolvedPrimaryColor = primaryColor ?? baseChartConfig.primaryColor;

  const chartConfig = React.useMemo(
    () => ({
      ...baseChartConfig,
      primaryColor: resolvedPrimaryColor,
    }),
    [baseChartConfig, resolvedPrimaryColor]
  );

  const colors = React.useMemo(() => {
    return generateChartColors(chartType, chartConfig.seriesCount, resolvedPrimaryColor);
  }, [chartType, chartConfig.seriesCount, resolvedPrimaryColor]);

  const standardProps = React.useMemo(
    () => ({
      data: chartConfig.data,
      config: chartConfig.config,
      colors,
      seriesCount: chartConfig.seriesCount,
    }),
    [chartConfig.data, chartConfig.config, colors, chartConfig.seriesCount]
  );

  return {
    chartConfig,
    standardProps,
    colors,
    seriesCount: chartConfig.seriesCount,
    seriesKeys: chartConfig.seriesKeys,
  };
}
