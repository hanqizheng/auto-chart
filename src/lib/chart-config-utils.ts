/**
 * 图表配置工具函数 - 简化的单一配置源系统
 * 删除简单模式，只保留自定义配置，避免Context依赖
 */

import {
  UnifiedChartConfig,
  UnifiedColorConfig,
  UnifiedOptionConfig,
  ConfigGenerationOptions,
  ColorGenerationResult,
  ConfigValidationResult,
  ChartConfigSchema,
  ColorConfigItem,
} from "@/types/chart-config";
import { CHART_CONFIG_SCHEMAS, CHART_CONFIG_DEFAULTS } from "@/constants/chart-config";
import { ChartType } from "@/types/chart";
import { generateSeriesConfigs, generateCommonColors, createChartTheme } from "@/lib/colors";
import { extractSeriesKeys, validateSeriesKeys, type SeriesKey } from "@/lib/data-analysis-utils";
import { standardizeChartData, getSeriesCount } from "@/lib/data-standardization";

/**
 * 数据驱动的配置生成 - 核心函数
 */
export function generateDataDrivenConfigSchema(
  chartType: ChartType,
  chartData: unknown[],
  chartConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): ChartConfigSchema {
  if (!chartData || chartData.length === 0) {
    return { colors: [], options: [] };
  }

  // 1. 从数据中提取系列键
  const seriesKeys = extractSeriesKeys(chartType, chartData, chartConfig || {});

  if (seriesKeys.length === 0) {
    return { colors: [], options: [] };
  }

  // 2. 根据图表类型生成颜色配置项
  const colorConfigs = generateSeriesColorConfigs(chartType, seriesKeys);

  // 3. 获取基础选项配置
  const baseSchema = CHART_CONFIG_SCHEMAS[chartType];
  const optionConfigs = baseSchema?.options || [];

  // 4. 添加网格等通用配置
  const additionalConfigs = generateAdditionalColorConfigs(chartType);

  const result: ChartConfigSchema = {
    colors: [...additionalConfigs, ...colorConfigs],
    options: optionConfigs,
  };

  return result;
}

/**
 * 为系列数据生成颜色配置项 - 简化版本
 */
function generateSeriesColorConfigs(
  chartType: ChartType,
  seriesKeys: SeriesKey[]
): ColorConfigItem[] {
  // 简化：只生成一个系列颜色配置数组，而不是复杂的动态key配置
  const configs: ColorConfigItem[] = [
    {
      key: "series",
      label: "Series Colors",
      category: "series",
      isArray: true,
      hasStroke: chartTypeHasStroke(chartType),
    },
  ];

  // 如果图表类型支持描边，添加单独的描边颜色配置
  if (chartTypeHasStroke(chartType)) {
    configs.push({
      key: "seriesStroke",
      label: "Series Stroke Colors",
      category: "series",
      isArray: true,
    });
  }

  return configs;
}

/**
 * 生成额外的颜色配置项（网格、背景等）
 */
function generateAdditionalColorConfigs(chartType: ChartType): ColorConfigItem[] {
  const configs: ColorConfigItem[] = [];

  // 大部分图表需要网格配置
  if (!["pie", "radial"].includes(chartType)) {
    configs.push({
      key: "grid",
      label: "Grid Color",
      category: "grid",
      isArray: false,
    });
  }

  // 径向图需要背景轨道颜色
  if (chartType === "radial") {
    configs.push({
      key: "background",
      label: "Track Background",
      category: "background",
      isArray: false,
    });
  }

  return configs;
}

/**
 * 判断图表类型是否支持描边颜色
 */
function chartTypeHasStroke(chartType: ChartType): boolean {
  return ["area", "radar", "line"].includes(chartType);
}

/**
 * 获取图表配置描述（兼容旧接口）
 */
export function getChartConfigSchema(
  chartType: ChartType,
  seriesKeys?: Array<{ key: string; label: string }>,
  chartData?: unknown[],
  chartConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): ChartConfigSchema {
  // 如果没有数据，使用旧的静态配置
  if (!chartData || chartData.length === 0) {
    return CHART_CONFIG_SCHEMAS[chartType] || { colors: [], options: [] };
  }

  // 使用新的数据驱动配置生成
  return generateDataDrivenConfigSchema(chartType, chartData, chartConfig);
}

/**
 * 生成统一的图表配置 - 基于标准化数据的稳定版本
 */
export function generateUnifiedChartConfig(
  chartType: ChartType,
  chartData: unknown[],
  chartConfig?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor?: string
): UnifiedChartConfig {
  // 1. 标准化数据格式，获得稳定的数据结构
  const { data: standardizedData, config: standardConfig } = standardizeChartData(
    chartData,
    chartType,
    chartConfig
  );

  // 2. 基于标准化数据计算系列数量 - 更稳定和可预测
  const seriesCount = getSeriesCount(standardizedData, chartType);

  // 3. 从标准化配置提取系列键
  const baseSeriesKeys = Object.keys(standardConfig).map(key => ({
    key,
    label: standardConfig[key].label || key,
  }));

  const seriesKeys = resolveSeriesKeys(chartType, standardizedData, baseSeriesKeys, seriesCount);

  // 4. 生成简化的颜色配置 - 基于系列数量而不是动态key
  const colors = generateSimplifiedColorConfig(chartType, seriesCount, primaryColor);

  // 5. 生成选项配置
  const options = generateOptionConfig(chartType, seriesKeys, chartData, chartConfig);

  const result: UnifiedChartConfig = {
    chartType,
    colors,
    options,
    seriesKeys,
  };

  return result;
}

function resolveSeriesKeys(
  chartType: ChartType,
  data: unknown,
  baseKeys: Array<{ key: string; label: string }>,
  seriesCount: number
): Array<{ key: string; label: string }> {
  if (Array.isArray(data) && ["pie", "radial"].includes(chartType)) {
    const categoricalData = data as Array<Record<string, unknown>>;
    const usedKeys = new Set<string>();

    return categoricalData.map((item, index) => {
      const existing = baseKeys[index];
      const rawLabel = existing?.label || inferCategoricalLabel(item, index);
      const baseKey = sanitizeSeriesKey(existing?.key || rawLabel, index);
      const key = ensureUniqueKey(baseKey, usedKeys);
      usedKeys.add(key);

      return {
        key,
        label: rawLabel,
      };
    });
  }

  if (baseKeys.length >= seriesCount) {
    return baseKeys;
  }

  const filledKeys = [...baseKeys];
  const usedKeys = new Set(filledKeys.map(item => item.key));
  for (let index = filledKeys.length; index < seriesCount; index += 1) {
    const fallbackLabel = `Series ${index + 1}`;
    const baseKey = `series_${index + 1}`;
    const key = ensureUniqueKey(baseKey, usedKeys);
    usedKeys.add(key);

    filledKeys.push({
      key,
      label: fallbackLabel,
    });
  }

  return filledKeys;
}

function inferCategoricalLabel(item: Record<string, unknown>, index: number): string {
  const name = item.name || item.label || item.category || item.dimension;
  if (typeof name === "string" && name.trim().length > 0) {
    return name;
  }
  return `Slice ${index + 1}`;
}

function sanitizeSeriesKey(value: string | undefined, index: number): string {
  if (value && value.trim().length > 0) {
    const normalized = value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return `slice_${index + 1}`;
}

function ensureUniqueKey(baseKey: string, usedKeys: Set<string>): string {
  let key = baseKey;
  let attempt = 1;
  while (usedKeys.has(key)) {
    key = `${baseKey}_${attempt}`;
    attempt += 1;
  }
  return key;
}

/**
 * 生成简化的颜色配置 - 基于系列数量的稳定配置
 */
function generateSimplifiedColorConfig(
  chartType: ChartType,
  seriesCount: number,
  primaryColor: string = CHART_CONFIG_DEFAULTS.PRIMARY_COLOR
): UnifiedColorConfig {
  // 使用现有的generateSeriesConfigs生成结构化颜色
  const seriesConfigs = generateSeriesConfigs(primaryColor, seriesCount);
  const fillColors = (seriesConfigs ?? [])
    .map(config => (config.fill?.startsWith("rgba") ? config.stroke : config.fill))
    .filter((color): color is string => !!color);
  const strokeColors = chartTypeHasStroke(chartType)
    ? seriesConfigs.map(config => config.stroke).filter((color): color is string => !!color)
    : undefined;

  // 生成通用颜色
  const commonColors = generateCommonColors(primaryColor);

  const result: UnifiedColorConfig = {
    primary: primaryColor,
    series: fillColors,
    seriesStroke: strokeColors,
    grid: commonColors.grid,
    background: commonColors.background,
    text: commonColors.label,
    // 简化：不使用复杂的dynamic配置
  };

  return result;
}

/**
 * 生成颜色配置（旧版兼容函数）
 */
export function generateColorConfig(baseColor: string, seriesCount: number): ColorGenerationResult {
  try {
    const theme = createChartTheme(baseColor, seriesCount, `config-${Date.now()}`);
    const seriesColors = theme.palette.series;

    const colors: UnifiedColorConfig = {
      primary: baseColor,
      series: seriesColors,
      grid: theme.palette.grid,
      background: theme.palette.background,
      text: theme.palette.neutral || CHART_CONFIG_DEFAULTS.TEXT_COLOR,
    };

    return {
      colors,
      success: true,
    };
  } catch (error) {
    return {
      colors: getDefaultColorConfig(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 生成选项配置
 */
export function generateOptionConfig(
  chartType: ChartType,
  seriesKeys?: Array<{ key: string; label: string }>,
  chartData?: unknown[],
  chartConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): UnifiedOptionConfig {
  // 使用静态配置描述来生成选项，因为选项不依赖于数据
  const baseSchema = CHART_CONFIG_SCHEMAS[chartType];
  const options: UnifiedOptionConfig = {};

  if (baseSchema && baseSchema.options) {
    // 根据配置描述设置默认值
    baseSchema.options.forEach(item => {
      (options as Record<string, unknown>)[item.key] = item.defaultValue;
    });
  }

  return options;
}

/**
 * 获取默认颜色配置
 */
export function getDefaultColorConfig(): UnifiedColorConfig {
  return {
    primary: CHART_CONFIG_DEFAULTS.PRIMARY_COLOR,
    series: [...CHART_CONFIG_DEFAULTS.SERIES_COLORS],
    grid: CHART_CONFIG_DEFAULTS.GRID_COLOR,
    background: CHART_CONFIG_DEFAULTS.BACKGROUND_COLOR,
    text: CHART_CONFIG_DEFAULTS.TEXT_COLOR,
  };
}

/**
 * 从基础颜色生成完整颜色配置 - 简化版本
 */
export function generateColorsFromPrimary(
  primaryColor: string,
  seriesCount: number,
  chartType: ChartType
): UnifiedColorConfig {
  return generateSimplifiedColorConfig(chartType, seriesCount, primaryColor);
}

/**
 * 验证配置的有效性
 */
export function validateChartConfig(config: UnifiedChartConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证图表类型
  if (!config.chartType) {
    errors.push("Chart type is required");
  }

  // 验证颜色配置
  if (!config.colors.primary) {
    errors.push("Primary color is required");
  }

  if (!config.colors.series || config.colors.series.length === 0) {
    errors.push("At least one series color is required");
  }

  // 验证系列颜色数量
  if (config.colors.series.length < config.seriesKeys.length) {
    warnings.push("Not enough series colors for all data series");
  }

  // 验证选项配置
  const schema = getChartConfigSchema(config.chartType, config.seriesKeys);
  schema.options.forEach(item => {
    const value = (config.options as Record<string, unknown>)[item.key];

    if (value === undefined || value === null) {
      warnings.push(`Missing value for option: ${item.key}`);
      return;
    }

    // 验证数值范围
    if (item.type === "number" && item.range && typeof value === "number") {
      if (value < item.range.min || value > item.range.max) {
        errors.push(`Value for ${item.key} is out of range (${item.range.min}-${item.range.max})`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 合并配置更新
 */
export function mergeConfigUpdate(
  currentConfig: UnifiedChartConfig,
  updates: Partial<UnifiedChartConfig>
): UnifiedChartConfig {
  return {
    ...currentConfig,
    ...updates,
    colors: {
      ...currentConfig.colors,
      ...updates.colors,
    },
    options: {
      ...currentConfig.options,
      ...updates.options,
    },
  };
}

/**
 * 转换为图表主题配置
 * 用于与现有的ChartThemeProvider兼容
 */
export function convertToChartTheme(config: UnifiedChartConfig) {
  return createChartTheme(
    config.colors.primary,
    config.colors.series.length,
    `unified-${config.chartType}-${Date.now()}`
  );
}

/**
 * 从统一配置提取图表组件所需的props
 */
export function extractChartProps(config: UnifiedChartConfig) {
  // 根据图表类型提取相应的props
  const baseProps = {
    ...config.options,
  };

  // 特殊处理某些属性名称映射
  const propMappings: Record<string, string> = {
    // 这里可以添加属性名称映射，如果组件props与配置key不一致
  };

  const mappedProps: any = {};
  Object.entries(baseProps).forEach(([key, value]) => {
    const mappedKey = propMappings[key] || key;
    mappedProps[mappedKey] = value;
  });

  return mappedProps;
}
