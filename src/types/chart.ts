// 图表相关类型定义

import {
  CHART_TYPES,
  SIMPLE_CHART_TYPES,
  CHART_CATEGORIES,
  COLUMN_TYPES,
  AXIS_TYPES,
  COLOR_THEMES,
  LEGEND_POSITIONS,
  CHART_GENERATION_STATUS,
  CHART_INDICATOR_TYPES,
} from "@/constants/chart";

export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];

export type SimpleChartType = (typeof SIMPLE_CHART_TYPES)[keyof typeof SIMPLE_CHART_TYPES];

export type ChartCategory = (typeof CHART_CATEGORIES)[keyof typeof CHART_CATEGORIES];

export type ColumnType = (typeof COLUMN_TYPES)[keyof typeof COLUMN_TYPES];

export type AxisType = (typeof AXIS_TYPES)[keyof typeof AXIS_TYPES];

export type ColorTheme = (typeof COLOR_THEMES)[keyof typeof COLOR_THEMES];

export type LegendPosition = (typeof LEGEND_POSITIONS)[keyof typeof LEGEND_POSITIONS];

export type ChartGenerationStatus =
  (typeof CHART_GENERATION_STATUS)[keyof typeof CHART_GENERATION_STATUS];

export type ChartIndicatorType = (typeof CHART_INDICATOR_TYPES)[keyof typeof CHART_INDICATOR_TYPES];

/**
 * 标准化的图表数据结构
 * 所有图表组件都应该接受这种统一的数据格式
 */

// 基础数据点接口
export interface BaseDataPoint {
  /** 主标签字段（用于分类轴，如日期、城市名等） */
  label: string;
  /** 数值字段映射 */
  [key: string]: string | number;
}

// 多系列图表数据点（line, bar, area, radar）
export interface MultiSeriesDataPoint extends BaseDataPoint {
  /** 分类标签（必须字段） */
  label: string;
  /** 动态数值字段，键名对应系列名 */
  [seriesKey: string]: string | number;
}

// 分类图表数据点（pie, radial）
export interface CategoricalDataPoint {
  /** 分类名称 */
  name: string;
  /** 数值 */
  value: number;
  /** 可选的额外属性 */
  [key: string]: any;
}

// 统一的图表数据类型
export type ChartData = MultiSeriesDataPoint[] | CategoricalDataPoint[];

// 系列配置接口（用于描述数据字段）
export interface SeriesConfig {
  /** 系列键（数据字段名） */
  key: string;
  /** 显示标签 */
  label: string;
  /** 颜色（可选，会被配置系统覆盖） */
  color?: string;
  /** 是否显示（可选） */
  show?: boolean;
}

// 图表配置接口
export interface StandardChartConfig {
  /** 系列配置映射 */
  [seriesKey: string]: SeriesConfig | { label: string; color?: string; show?: boolean };
}

/**
 * 标准化的图表组件Props接口
 * 所有图表组件都应该遵循这个接口
 */
export interface StandardChartProps {
  /** 图表数据 */
  data: ChartData;
  /** 系列配置 */
  config: StandardChartConfig;
  /** CSS类名 */
  className?: string;
  /** 图表特定的配置选项 */
  options?: Record<string, any>;
  /** 颜色配置（由配置系统提供） */
  colors?: {
    series: string[];
    seriesStroke?: string[];
    grid?: string;
    background?: string;
    text?: string;
  };
}

/**
 * 数据转换工具类型
 */
export interface DataTransformOptions {
  /** 源图表类型 */
  sourceType: ChartType;
  /** 目标图表类型 */
  targetType: ChartType;
  /** 标签字段映射 */
  labelField?: string;
  /** 数值字段映射 */
  valueFields?: string[];
}
