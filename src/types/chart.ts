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
