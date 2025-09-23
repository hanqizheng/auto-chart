/**
 * 图表配置工具函数
 * 提供配置生成、验证、转换等功能
 */

import {
  UnifiedChartConfig,
  UnifiedColorConfig,
  UnifiedOptionConfig,
  ConfigGenerationOptions,
  ColorGenerationResult,
  ConfigValidationResult,
  ChartConfigSchema,
} from "@/types/chart-config";
import {
  CHART_CONFIG_SCHEMAS,
  CHART_CONFIG_DEFAULTS,
  CHART_CONFIG_MODES,
} from "@/constants/chart-config";
import { ChartType } from "@/types/chart";
import { createChartTheme, generateSeriesConfigs } from "@/lib/colors";

/**
 * 获取图表配置描述
 */
export function getChartConfigSchema(chartType: ChartType): ChartConfigSchema {
  const schema = CHART_CONFIG_SCHEMAS[chartType];
  if (!schema) {
    console.warn(`No config schema found for chart type: ${chartType}`);
    return { colors: [], options: [] };
  }
  return schema;
}

/**
 * 生成统一的图表配置
 */
export function generateUnifiedChartConfig(options: ConfigGenerationOptions): UnifiedChartConfig {
  const { baseColor, seriesCount, chartType, seriesKeys } = options;

  // 生成颜色配置
  const colorResult = generateColorConfig(baseColor, seriesCount);
  if (!colorResult.success) {
    throw new Error(colorResult.error || "Failed to generate color config");
  }

  // 生成选项配置
  const optionConfig = generateOptionConfig(chartType);

  return {
    chartType,
    colors: colorResult.colors,
    options: optionConfig,
    mode: CHART_CONFIG_MODES.SIMPLE,
    seriesKeys,
  };
}

/**
 * 生成颜色配置
 */
export function generateColorConfig(baseColor: string, seriesCount: number): ColorGenerationResult {
  try {
    // 使用现有的颜色生成逻辑
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
export function generateOptionConfig(chartType: ChartType): UnifiedOptionConfig {
  const schema = getChartConfigSchema(chartType);
  const options: UnifiedOptionConfig = {};

  // 根据配置描述设置默认值
  schema.options.forEach(item => {
    (options as any)[item.key] = item.defaultValue;
  });

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
 * 从简单模式的基础颜色生成完整颜色配置
 */
export function generateColorsFromPrimary(
  primaryColor: string,
  seriesCount: number
): UnifiedColorConfig {
  const result = generateColorConfig(primaryColor, seriesCount);
  return result.success ? result.colors : getDefaultColorConfig();
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
  const schema = getChartConfigSchema(config.chartType);
  schema.options.forEach(item => {
    const value = (config.options as any)[item.key];

    if (value === undefined || value === null) {
      warnings.push(`Missing value for option: ${item.key}`);
      return;
    }

    // 验证数值范围
    if (item.type === "number" && item.range) {
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
