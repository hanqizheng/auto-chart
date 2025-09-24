/**
 * 图表配置类型定义
 * 基于 @/constants/chart-config 中的常量派生所有类型
 */

import {
  CHART_CONFIG_TYPES,
  COLOR_CONFIG_CATEGORIES,
  CHART_CONFIG_MODES,
  CHART_CONFIG_SCHEMAS,
  CHART_CONFIG_RANGES,
  LINE_DOT_VARIANTS,
  LINE_CURVE_TYPES,
  CONFIG_COMPONENT_MAP,
} from "@/constants/chart-config";
import { ChartType } from "@/types/chart";

/**
 * 配置项类型
 */
export type ChartConfigType = (typeof CHART_CONFIG_TYPES)[keyof typeof CHART_CONFIG_TYPES];

/**
 * 颜色配置类别
 */
export type ColorConfigCategory =
  (typeof COLOR_CONFIG_CATEGORIES)[keyof typeof COLOR_CONFIG_CATEGORIES];

/**
 * 配置模式
 */
export type ChartConfigMode = (typeof CHART_CONFIG_MODES)[keyof typeof CHART_CONFIG_MODES];

/**
 * 折线图点样式
 */
export type LineDotVariant = (typeof LINE_DOT_VARIANTS)[number]["value"];

/**
 * 折线图曲线类型
 */
export type LineCurveType = (typeof LINE_CURVE_TYPES)[number]["value"];

/**
 * 配置组件类型
 */
export type ConfigComponentType = (typeof CONFIG_COMPONENT_MAP)[keyof typeof CONFIG_COMPONENT_MAP];

/**
 * 数值范围配置
 */
export interface NumberRange {
  min: number;
  max: number;
  step: number;
}

/**
 * 选择项配置
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * 颜色配置项
 */
export interface ColorConfigItem {
  /** 配置键 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 颜色类别 */
  category: ColorConfigCategory;
  /** 是否为数组类型（系列颜色） */
  isArray?: boolean;
  /** 是否有描边颜色（仅用于某些图表类型） */
  hasStroke?: boolean;
  /** 系列索引（用于动态系列配置） */
  seriesIndex?: number;
  /** 颜色类型（填充或描边） */
  colorType?: "fill" | "stroke";
  /** 系列键（用于关联数据） */
  seriesKey?: string;
  /** 数据索引（用于分类图表） */
  dataIndex?: number;
}

/**
 * 选项配置项
 */
export interface OptionConfigItem {
  /** 配置键 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 配置类型 */
  type: ChartConfigType;
  /** 默认值 */
  defaultValue: any;
  /** 数值范围（仅用于 number 类型） */
  range?: NumberRange;
  /** 单位（仅用于 number 类型） */
  unit?: string;
  /** 选择项（仅用于 select 类型） */
  options?: readonly SelectOption[];
  /** 格式化函数（仅用于 number 类型） */
  formatter?: (value: number) => number;
  /** 依赖条件（当某个配置为 true 时才显示） */
  dependsOn?: string;
}

/**
 * 图表配置描述
 */
export interface ChartConfigSchema {
  /** 颜色配置 */
  colors: readonly ColorConfigItem[];
  /** 选项配置 */
  options: readonly OptionConfigItem[];
}

/**
 * 图表配置描述映射
 */
export type ChartConfigSchemas = typeof CHART_CONFIG_SCHEMAS;

/**
 * 统一的颜色配置结构 - 支持填充和描边的细粒度控制
 */
export interface UnifiedColorConfig {
  /** 主色调（用于生成系列颜色） */
  primary: string;
  /** 系列填充颜色 */
  series: string[];
  /** 系列描边颜色（某些图表类型使用） */
  seriesStroke?: string[];
  /** 网格颜色 */
  grid: string;
  /** 背景颜色 */
  background: string;
  /** 文本颜色 */
  text: string;
  /** 动态颜色配置（键值对形式，支持复杂配置项） */
  dynamic?: Record<string, string>;
}

/**
 * 统一的选项配置结构
 */
export interface UnifiedOptionConfig {
  // 柱状图选项
  barRadius?: number;
  barShowValues?: boolean;
  barShowGrid?: boolean;

  // 折线图选项
  lineCurveType?: LineCurveType;
  lineShowDots?: boolean;
  lineDotSize?: number;
  lineDotVariant?: LineDotVariant;
  lineShowGrid?: boolean;

  // 面积图选项
  areaFillOpacity?: number;
  areaStacked?: boolean;
  areaUseGradient?: boolean;
  areaShowGrid?: boolean;

  // 饼图选项
  innerRadius?: number;
  outerRadius?: number;
  showPercentage?: boolean;
  showLegend?: boolean;

  // 径向图选项
  radialInnerRadius?: number;
  radialOuterRadius?: number;
  radialBarSize?: number;
  radialCornerRadius?: number;
  radialShowBackground?: boolean;
  radialShowLabels?: boolean;

  // 雷达图选项
  radarShowArea?: boolean;
  radarShowDots?: boolean;
  radarShowGrid?: boolean;
  radarShowLegend?: boolean;
  radarFillOpacity?: number;
  radarStrokeWidth?: number;
  radarMaxValue?: number;
}

/**
 * 统一的图表配置接口 - 使用自定义配置模式
 */
export interface UnifiedChartConfig {
  /** 图表类型 */
  chartType: ChartType;

  /** 颜色配置 */
  colors: UnifiedColorConfig;

  /** 选项配置 */
  options: UnifiedOptionConfig;

  /** 可配置的系列键（从图表数据中提取） */
  seriesKeys: Array<{ key: string; label: string }>;
}

/**
 * 配置变更事件 - 只支持自定义配置
 */
export interface ConfigChangeEvent {
  /** 变更类型 */
  type: "color" | "option";
  /** 变更的键 */
  key: string;
  /** 新值 */
  value: any;
  /** 数组索引（仅用于系列颜色） */
  index?: number;
  /** 颜色类型（填充或描边） */
  colorType?: "fill" | "stroke";
  /** 系列键（用于关联数据） */
  seriesKey?: string;
}

/**
 * 配置生成选项
 */
export interface ConfigGenerationOptions {
  /** 基础颜色（用于颜色生成） */
  baseColor: string;
  /** 系列数量 */
  seriesCount: number;
  /** 图表类型 */
  chartType: ChartType;
  /** 系列键信息 */
  seriesKeys: Array<{ key: string; label: string }>;
}

/**
 * 颜色生成结果
 */
export interface ColorGenerationResult {
  /** 生成的颜色配置 */
  colors: UnifiedColorConfig;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 配置UI渲染参数
 */
export interface ConfigUIRenderProps {
  /** 配置描述 */
  schema: ChartConfigSchema;
  /** 当前配置值 */
  config: UnifiedChartConfig;
  /** 配置变更回调 */
  onChange: (event: ConfigChangeEvent) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 动态组件属性
 */
export interface DynamicComponentProps {
  /** 配置项 */
  item: ColorConfigItem | OptionConfigItem;
  /** 当前值 */
  value: any;
  /** 变更回调 */
  onChange: (value: any) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外属性 */
  [key: string]: any;
}
