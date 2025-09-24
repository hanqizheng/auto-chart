/**
 * 数据标准化工具 - 将各种图表数据格式转换为统一的标准格式
 * 这样可以让颜色配置生成逻辑更稳定和可预测
 */

import {
  ChartType,
  MultiSeriesDataPoint,
  CategoricalDataPoint,
  ChartData,
  StandardChartConfig,
  DataTransformOptions
} from "@/types/chart";

/**
 * 检测数据是否为多系列格式
 */
export function isMultiSeriesData(data: unknown[]): data is MultiSeriesDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) return false;

  const firstItem = data[0] as Record<string, unknown>;

  // 检查是否有标签字段和至少一个数值字段
  const hasLabelField = typeof firstItem.label === 'string' ||
                       typeof firstItem.date === 'string' ||
                       typeof firstItem.month === 'string' ||
                       typeof firstItem.city === 'string' ||
                       typeof firstItem.dimension === 'string';

  const numericFields = Object.keys(firstItem).filter(key =>
    typeof firstItem[key] === 'number' && key !== 'value'
  );

  return hasLabelField && numericFields.length >= 1;
}

/**
 * 检测数据是否为分类格式
 */
export function isCategoricalData(data: unknown[]): data is CategoricalDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) return false;

  const firstItem = data[0] as Record<string, unknown>;

  // 检查是否有name和value字段
  return (typeof firstItem.name === 'string' || typeof firstItem.label === 'string') &&
         typeof firstItem.value === 'number';
}

/**
 * 将任意格式的数据标准化为多系列格式
 */
export function standardizeToMultiSeries(
  data: unknown[],
  chartType: ChartType,
  existingConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): { data: MultiSeriesDataPoint[], config: StandardChartConfig } {
  console.log(`🔄 [standardizeToMultiSeries] Standardizing ${data.length} items for ${chartType}`);

  if (isMultiSeriesData(data)) {
    console.log("✅ Data is already in multi-series format");
    return {
      data: data as MultiSeriesDataPoint[],
      config: generateConfigFromData(data, existingConfig || {})
    };
  }

  // 转换单一格式数据为多系列格式
  const labelField = detectLabelField(data);
  const numericFields = detectNumericFields(data);

  console.log(`🔍 Detected label field: ${labelField}, numeric fields:`, numericFields);

  const standardizedData: MultiSeriesDataPoint[] = data.map((item, index) => {
    const dataItem = item as Record<string, unknown>;
    const standardItem: MultiSeriesDataPoint = {
      label: String(dataItem[labelField] || `Item ${index + 1}`)
    };

    // 复制所有数值字段
    numericFields.forEach(field => {
      const value = dataItem[field];
      if (typeof value === 'number') {
        standardItem[field] = value;
      }
    });

    return standardItem;
  });

  const config = generateConfigFromFields(numericFields, existingConfig || {});

  console.log(`✅ Standardized to ${standardizedData.length} multi-series data points`);
  return { data: standardizedData, config };
}

/**
 * 将任意格式的数据标准化为分类格式
 */
export function standardizeToCategorical(
  data: unknown[],
  chartType: ChartType,
  existingConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): { data: CategoricalDataPoint[], config: StandardChartConfig } {
  console.log(`🔄 [standardizeToCategorical] Standardizing ${data.length} items for ${chartType}`);

  if (isCategoricalData(data)) {
    console.log("✅ Data is already in categorical format");
    const categoricalData = data as CategoricalDataPoint[];

    // 为每个数据点创建配置键，以支持独立的颜色配置
    const config: StandardChartConfig = {};
    categoricalData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: existingConfig?.[item.name]?.color,
        show: existingConfig?.[item.name]?.show !== false
      };
    });

    return {
      data: categoricalData,
      config
    };
  }

  // 转换其他格式为分类格式
  const standardizedData: CategoricalDataPoint[] = data.map((item, index) => {
    const dataItem = item as Record<string, unknown>;
    // 尝试找到名称字段
    const name = dataItem.name || dataItem.label || dataItem.city || `Category ${index + 1}`;

    // 尝试找到数值字段
    let value = dataItem.value;
    if (value === undefined) {
      // 如果没有value字段，寻找第一个数值字段
      const numericField = Object.keys(dataItem).find(key => typeof dataItem[key] === 'number');
      value = numericField ? dataItem[numericField] : 0;
    }

    return {
      name: String(name),
      value: Number(value) || 0
    };
  });

  // 为每个标准化的数据点创建配置键
  const config: StandardChartConfig = {};
  standardizedData.forEach(item => {
    config[item.name] = {
      label: item.name,
      color: existingConfig?.[item.name]?.color,
      show: existingConfig?.[item.name]?.show !== false
    };
  });

  console.log(`✅ Standardized to ${standardizedData.length} categorical data points`);
  return {
    data: standardizedData,
    config
  };
}

/**
 * 根据图表类型自动选择合适的标准化方法
 */
export function standardizeChartData(
  data: unknown[],
  chartType: ChartType,
  existingConfig?: Record<string, { label?: string; color?: string; show?: boolean }>
): { data: ChartData, config: StandardChartConfig } {
  console.log(`🚀 [standardizeChartData] Auto-standardizing for ${chartType} chart`);

  if (['pie', 'radial'].includes(chartType)) {
    return standardizeToCategorical(data, chartType, existingConfig);
  } else {
    return standardizeToMultiSeries(data, chartType, existingConfig);
  }
}

/**
 * 检测标签字段
 */
function detectLabelField(data: unknown[]): string {
  if (data.length === 0) return 'label';

  const firstItem = data[0] as Record<string, unknown>;
  const commonLabelFields = ['label', 'date', 'month', 'year', 'city', 'region', 'category', 'dimension'];

  // 寻找第一个匹配的标签字段
  for (const field of commonLabelFields) {
    if (field in firstItem && typeof firstItem[field] === 'string') {
      return field;
    }
  }

  // 如果没找到，返回第一个字符串字段
  const stringField = Object.keys(firstItem).find(key => typeof firstItem[key] === 'string');
  return stringField || 'label';
}

/**
 * 检测数值字段
 */
function detectNumericFields(data: unknown[]): string[] {
  if (data.length === 0) return [];

  const firstItem = data[0] as Record<string, unknown>;
  return Object.keys(firstItem).filter(key => {
    const value = firstItem[key];
    return typeof value === 'number' && !isNaN(value);
  });
}

/**
 * 从数据生成配置
 */
function generateConfigFromData(
  data: unknown[],
  existingConfig: Record<string, { label?: string; color?: string; show?: boolean }>
): StandardChartConfig {
  const config: StandardChartConfig = {};

  if (data.length === 0) return config;

  const firstItem = data[0] as Record<string, unknown>;
  const numericFields = Object.keys(firstItem).filter(key =>
    typeof firstItem[key] === 'number' && key !== 'value'
  );

  numericFields.forEach(field => {
    config[field] = {
      label: existingConfig[field]?.label || formatFieldLabel(field),
      color: existingConfig[field]?.color,
      show: existingConfig[field]?.show !== false
    };
  });

  return config;
}

/**
 * 从字段列表生成配置
 */
function generateConfigFromFields(
  fields: string[],
  existingConfig: Record<string, { label?: string; color?: string; show?: boolean }>
): StandardChartConfig {
  const config: StandardChartConfig = {};

  fields.forEach(field => {
    config[field] = {
      label: existingConfig[field]?.label || formatFieldLabel(field),
      color: existingConfig[field]?.color,
      show: existingConfig[field]?.show !== false
    };
  });

  return config;
}

/**
 * 格式化字段标签
 */
function formatFieldLabel(field: string): string {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, str => str.toUpperCase());
}

/**
 * 计算标准化数据的系列数量 - 重构版本，基于稳定的数据结构
 */
export function getSeriesCount(data: ChartData, chartType: ChartType): number {
  console.log(`📊 [getSeriesCount] Calculating series count for ${chartType} chart`);

  if (['pie', 'radial'].includes(chartType)) {
    // 分类图：数据项数量 = 颜色数量
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`✅ [getSeriesCount] Categorical chart: ${count} series`);
    return count;
  } else {
    // 多系列图表：数值字段数量 = 颜色数量
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`⚠️ [getSeriesCount] No data, defaulting to 1 series`);
      return 1;
    }

    const firstItem = data[0] as MultiSeriesDataPoint;
    const numericFields = Object.keys(firstItem).filter(key =>
      typeof firstItem[key] === 'number' && key !== 'value' && key !== 'label'
    );

    const count = Math.max(numericFields.length, 1);
    console.log(`✅ [getSeriesCount] Multi-series chart: ${count} series from fields:`, numericFields);
    return count;
  }
}

/**
 * 核心图表配置生成函数 - 新的简化版本
 * 基于标准化数据结构，提供稳定的配置生成
 */
export function generateChartConfig(
  chartType: ChartType,
  rawData: unknown[],
  userConfig?: Record<string, { label?: string; color?: string; show?: boolean }>,
  primaryColor: string = "#22c55e"
) {
  console.log(`🚀 [generateChartConfig] Generating config for ${chartType} chart with ${rawData.length} items`);

  // 1. 先标准化数据 - 确保后续逻辑基于稳定的数据结构
  const { data, config } = standardizeChartData(rawData, chartType, userConfig);

  // 2. 基于标准化数据计算系列数量 - 稳定和可预测
  const seriesCount = getSeriesCount(data, chartType);

  // 3. 提取系列键信息（用于标签显示）
  const seriesKeys = Object.keys(config).map(key => ({
    key,
    label: config[key].label || key,
  }));

  console.log(`✅ [generateChartConfig] Generated:`, {
    dataLength: Array.isArray(data) ? data.length : 0,
    seriesCount,
    seriesKeys: seriesKeys.map(s => s.key),
  });

  return {
    data,
    config,
    seriesCount,
    seriesKeys,
    chartType,
    primaryColor
  };
}