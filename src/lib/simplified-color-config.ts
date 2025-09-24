/**
 * 简化的颜色配置生成器
 * 移除复杂的动态key逻辑，基于系列数量生成稳定的颜色配置
 */

import { ChartType } from "@/types/chart";
import { generateSeriesConfigs, generateCommonColors } from "@/lib/colors";
import { CHART_CONFIG_DEFAULTS } from "@/constants/chart-config";

/**
 * 简化的颜色配置接口
 */
export interface SimplifiedColorConfig {
  /** 主色调 */
  primary: string;
  /** 系列填充颜色数组 */
  series: string[];
  /** 系列描边颜色数组（仅某些图表类型） */
  seriesStroke?: string[];
  /** 网格颜色 */
  grid: string;
  /** 背景颜色 */
  background: string;
  /** 文本颜色 */
  text: string;
}

/**
 * 判断图表类型是否需要描边颜色
 */
function chartTypeHasStroke(chartType: ChartType): boolean {
  return ["area", "radar", "line"].includes(chartType);
}

/**
 * 生成简化的系列颜色配置
 * 基于系列数量，而不是动态key
 */
export function generateSeriesColors(
  chartType: ChartType,
  seriesCount: number,
  primaryColor: string = CHART_CONFIG_DEFAULTS.PRIMARY_COLOR
): SimplifiedColorConfig {

  // 使用现有的generateSeriesConfigs生成结构化颜色
  const seriesConfigs = generateSeriesConfigs(primaryColor, seriesCount);

  // 提取填充颜色
  const fillColors = (seriesConfigs ?? [])
    .map(config => {
      // 对于rgba颜色，使用stroke作为主色，避免透明度问题
      if (config.fill?.startsWith("rgba")) {
        return config.stroke;
      }
      return config.fill;
    })
    .filter((color): color is string => !!color);

  // 提取描边颜色（仅某些图表类型需要）
  const strokeColors = chartTypeHasStroke(chartType)
    ? seriesConfigs.map(config => config.stroke).filter((color): color is string => !!color)
    : undefined;

  // 生成通用颜色
  const commonColors = generateCommonColors(primaryColor);

  const result: SimplifiedColorConfig = {
    primary: primaryColor,
    series: fillColors.length > 0 ? fillColors : [primaryColor],
    seriesStroke: strokeColors,
    grid: commonColors.grid,
    background: commonColors.background,
    text: commonColors.label,
  };


  return result;
}

/**
 * 为图表配置生成完整的颜色方案
 * 这是主要的外部API
 */
export function generateChartColors(
  chartType: ChartType,
  seriesCount: number,
  primaryColor?: string
): SimplifiedColorConfig {
  const effectivePrimaryColor = primaryColor || CHART_CONFIG_DEFAULTS.PRIMARY_COLOR;


  return generateSeriesColors(chartType, seriesCount, effectivePrimaryColor);
}

/**
 * 从颜色配置中获取特定系列的颜色
 */
export function getSeriesColor(
  colors: SimplifiedColorConfig,
  seriesIndex: number,
  type: "fill" | "stroke" = "fill"
): string {
  if (type === "stroke" && colors.seriesStroke) {
    return colors.seriesStroke[seriesIndex % colors.seriesStroke.length];
  }

  return colors.series[seriesIndex % colors.series.length];
}

/**
 * 验证颜色配置的有效性
 */
export function validateColorConfig(colors: SimplifiedColorConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!colors.primary) {
    errors.push("Primary color is required");
  }

  if (!colors.series || colors.series.length === 0) {
    errors.push("At least one series color is required");
  }

  if (!colors.grid) {
    errors.push("Grid color is required");
  }

  if (!colors.background) {
    errors.push("Background color is required");
  }

  if (!colors.text) {
    errors.push("Text color is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 创建默认颜色配置
 */
export function createDefaultColorConfig(): SimplifiedColorConfig {
  return {
    primary: CHART_CONFIG_DEFAULTS.PRIMARY_COLOR,
    series: [...CHART_CONFIG_DEFAULTS.SERIES_COLORS],
    grid: CHART_CONFIG_DEFAULTS.GRID_COLOR,
    background: CHART_CONFIG_DEFAULTS.BACKGROUND_COLOR,
    text: CHART_CONFIG_DEFAULTS.TEXT_COLOR,
  };
}