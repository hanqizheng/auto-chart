/**
 * 数据分析工具函数
 * 用于从图表数据中智能提取系列键和标签
 */

import { ChartType } from "@/types/chart";

export interface SeriesKey {
  key: string;
  label: string;
  dataIndex?: number; // 用于饼图/径向图
}

/**
 * 格式化标签：将snake_case或camelCase转换为可读的标签
 */
export function formatLabel(key: string): string {
  return key
    // 处理snake_case: "average_income" -> "Average Income"
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    // 处理camelCase: "averageIncome" -> "Average Income"
    .replace(/([A-Z])/g, ' $1')
    .trim()
    // 确保首字母大写
    .replace(/^./, str => str.toUpperCase());
}

/**
 * 获取图表类型对应的分类键（非数值字段）
 */
export function getCategoricalKeys(chartType: ChartType): string[] {
  switch (chartType) {
    case 'line':
      return ['date', 'time', 'period', 'timestamp', 'year', 'month', 'day'];
    case 'bar':
      return ['city', 'region', 'category', 'name', 'group', 'type', 'label'];
    case 'area':
      return ['month', 'date', 'time', 'period', 'timestamp', 'year', 'day'];
    case 'radar':
      return ['dimension', 'axis', 'category', 'aspect', 'metric'];
    case 'pie':
    case 'radial':
      return ['name', 'label', 'category']; // 这些字段用作标签，不是数值
    default:
      return ['name', 'category', 'label', 'type'];
  }
}

/**
 * 从多系列图表数据中提取系列键
 */
export function extractMultiSeriesKeys(
  chartType: ChartType,
  data: any[],
  config: Record<string, any> = {}
): SeriesKey[] {
  console.log(`🔍 [extractMultiSeriesKeys] Analyzing ${chartType} chart with:`, {
    dataLength: data.length,
    configKeys: Object.keys(config),
    sampleData: data[0]
  });

  // 优先使用现有config中的配置
  if (config && Object.keys(config).length > 0) {
    const seriesFromConfig = Object.keys(config).map(key => ({
      key: key,
      label: config[key]?.label || formatLabel(key)
    }));

    console.log(`✅ [extractMultiSeriesKeys] Using config-based series:`, seriesFromConfig);
    return seriesFromConfig;
  }

  // 从数据中推断系列键
  if (!data || data.length === 0) {
    console.warn(`⚠️ [extractMultiSeriesKeys] No data provided for ${chartType}`);
    return [];
  }

  const firstItem = data[0];
  const allKeys = Object.keys(firstItem);
  const categoricalKeys = getCategoricalKeys(chartType);

  console.log(`🔍 [extractMultiSeriesKeys] Data analysis:`, {
    allKeys,
    categoricalKeys,
    firstItemSample: firstItem
  });

  // 过滤出数值键作为系列
  const numericKeys = allKeys.filter(key => {
    // 排除分类键
    if (categoricalKeys.includes(key.toLowerCase())) {
      return false;
    }

    // 检查是否为数值类型
    const value = firstItem[key];
    const isNumeric = typeof value === 'number' && !isNaN(value);

    console.log(`🔍 [extractMultiSeriesKeys] Key "${key}": value=${value}, type=${typeof value}, isNumeric=${isNumeric}`);

    return isNumeric;
  });

  const seriesKeys = numericKeys.map(key => ({
    key: key,
    label: formatLabel(key)
  }));

  console.log(`✅ [extractMultiSeriesKeys] Extracted ${seriesKeys.length} series from data:`, seriesKeys);

  return seriesKeys;
}

/**
 * 从分类图表数据中提取系列键（饼图、径向图）
 */
export function extractCategoricalKeys(
  chartType: ChartType,
  data: any[],
  config: Record<string, any> = {}
): SeriesKey[] {
  console.log(`🔍 [extractCategoricalKeys] Analyzing ${chartType} chart with ${data.length} items`);

  if (!data || data.length === 0) {
    console.warn(`⚠️ [extractCategoricalKeys] No data provided for ${chartType}`);
    return [];
  }

  const seriesKeys = data.map((item, index) => {
    // 尝试多种可能的标签字段
    const label = item.name || item.label || item.category || `${chartType === 'pie' ? 'Slice' : 'Segment'} ${index + 1}`;

    return {
      key: `slice-${index}`,
      label: label,
      dataIndex: index
    };
  });

  console.log(`✅ [extractCategoricalKeys] Extracted ${seriesKeys.length} categories:`, seriesKeys);

  return seriesKeys;
}

/**
 * 智能提取系列键的主函数
 */
export function extractSeriesKeys(
  chartType: ChartType,
  data: any[],
  config: Record<string, any> = {}
): SeriesKey[] {
  console.log(`🚀 [extractSeriesKeys] Starting analysis for ${chartType} chart`);

  if (['line', 'bar', 'area', 'radar'].includes(chartType)) {
    // 多系列图表：提取数值字段作为系列
    return extractMultiSeriesKeys(chartType, data, config);
  } else if (['pie', 'radial'].includes(chartType)) {
    // 分类图表：每个数据项作为一个系列
    return extractCategoricalKeys(chartType, data, config);
  } else {
    console.warn(`⚠️ [extractSeriesKeys] Unknown chart type: ${chartType}`);
    return [];
  }
}

/**
 * 验证提取的系列键是否合理
 */
export function validateSeriesKeys(
  chartType: ChartType,
  seriesKeys: SeriesKey[],
  data: any[]
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // 检查系列数量是否合理
  if (seriesKeys.length === 0) {
    warnings.push(`No series keys extracted for ${chartType} chart`);
    return { isValid: false, warnings };
  }

  // 多系列图表的特殊验证
  if (['line', 'bar', 'area', 'radar'].includes(chartType)) {
    if (seriesKeys.length > 10) {
      warnings.push(`Too many series (${seriesKeys.length}) for ${chartType} chart, consider limiting to 10 or fewer`);
    }

    // 验证数据中确实存在这些键
    if (data.length > 0) {
      const firstItem = data[0];
      const missingKeys = seriesKeys.filter(series => !(series.key in firstItem));
      if (missingKeys.length > 0) {
        warnings.push(`Series keys not found in data: ${missingKeys.map(k => k.key).join(', ')}`);
      }
    }
  }

  // 分类图表的特殊验证
  if (['pie', 'radial'].includes(chartType)) {
    if (seriesKeys.length > 20) {
      warnings.push(`Too many categories (${seriesKeys.length}) for ${chartType} chart`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}