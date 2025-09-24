// Enhanced Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";
import { ChartType } from "@/types/chart";

// 导入各图表组件的数据类型
import { BarChartData } from "../bar-chart/types";
import { LineChartData, LineDotVariant } from "../line-chart/types";
import { PieChartData } from "../pie-chart/types";
import { AreaChartData } from "../area-chart/types";
import { RadarChartData, RADAR_CHART_DEFAULTS } from "../radar-chart/types";
import { RadialChartData, RADIAL_CHART_DEFAULTS } from "../radial-chart/types";

/**
 * 通用图表数据点接口
 * 用于非饼图的图表类型
 */
export interface StandardChartDataPoint {
  [key: string]: string | number;
}

/**
 * 通用图表数据数组类型
 */
export type StandardChartData = StandardChartDataPoint[];

/**
 * 增强图表组件支持的所有数据类型
 */
export type EnhancedChartData = StandardChartData | PieChartData | RadialChartData;

/**
 * 增强图表组件属性接口
 */
export interface EnhancedChartProps {
  /** 图表类型 */
  type: ChartType;

  /** 图表数据 - 根据类型自动适配 */
  data: EnhancedChartData;

  /** 图表配置 - 定义数据系列的显示配置 */
  config: ChartConfig;

  /** 图表标题 */
  title?: string;

  /** 图表描述 */
  description?: string;

  /** 自定义样式类名 */
  className?: string;

  /** 是否堆叠显示（仅适用于支持堆叠的图表类型） */
  stacked?: boolean;

  /** 面积图透明度（仅适用于面积图） */
  fillOpacity?: number;

  /** 面积图是否使用渐变填充 */
  areaUseGradient?: boolean;

  /** 面积图是否显示背景网格 */
  areaShowGrid?: boolean;

  /** 饼图内圆半径（仅适用于饼图） */
  innerRadius?: number;

  /** 饼图外圆半径（仅适用于饼图） */
  outerRadius?: number;

  /** 是否显示百分比标签（仅适用于饼图） */
  showPercentage?: boolean;

  /** 是否显示图例（饼图/径向图） */
  showLegend?: boolean;

  /** 柱状图圆角半径 */
  barRadius?: number;

  /** 柱状图是否显示数值标签 */
  barShowValues?: boolean;

  /** 柱状图是否显示背景网格 */
  barShowGrid?: boolean;

  /** 折线图曲线类型 */
  lineCurveType?: "monotone" | "linear";

  /** 折线图是否显示节点 */
  lineShowDots?: boolean;

  /** 折线图节点大小 */
  lineDotSize?: number;

  /** 折线图节点样式 */
  lineDotVariant?: LineDotVariant;

  /** 折线图是否显示背景网格 */
  lineShowGrid?: boolean;

  /** 雷达图是否显示网格 */
  radarShowGrid?: boolean;

  /** 雷达图是否显示图例 */
  radarShowLegend?: boolean;

  /** 雷达图是否显示数据点 */
  radarShowDots?: boolean;

  /** 雷达图是否填充区域 */
  radarShowArea?: boolean;

  /** 雷达图区域透明度 */
  radarFillOpacity?: number;

  /** 雷达图线条宽度 */
  radarStrokeWidth?: number;

  /** 雷达图最大刻度值 */
  radarMaxValue?: number;

  /** 径向图条形宽度 */
  radialBarSize?: number;

  /** 径向图条形圆角 */
  radialCornerRadius?: number;

  /** 径向图起始角度 */
  radialStartAngle?: number;

  /** 径向图结束角度 */
  radialEndAngle?: number;

  /** 径向图是否显示背景轨道 */
  radialShowBackground?: boolean;

  /** 径向图是否显示标签 */
  radialShowLabels?: boolean;

  /** 径向图内半径 */
  radialInnerRadius?: number;

  /** 径向图外半径 */
  radialOuterRadius?: number;

  /** 导出模式 - 隐藏UI元素，仅显示图表 */
  exportMode?: boolean;

  /** 主色调（用于颜色生成） */
  primaryColor?: string;
}

/**
 * 导出错误信息接口
 */
export interface ExportError {
  /** 错误代码 */
  code: "CAPTURE_FAILED" | "NO_ELEMENT" | "BROWSER_NOT_SUPPORTED" | "UNKNOWN";

  /** 错误信息 */
  message: string;

  /** 详细错误信息 */
  details?: string;
}

/**
 * 导出配置接口
 */
export interface ExportConfig {
  /** 导出文件名 */
  filename?: string;

  /** 图像质量 (0-1) */
  quality?: number;

  /** 图像格式 */
  format?: "png" | "jpeg" | "webp";

  /** 缩放倍数 */
  scale?: number;

  /** 背景颜色 */
  backgroundColor?: string;
}

/**
 * 分享配置接口
 */
export interface ShareConfig {
  /** 分享标题 */
  title?: string;

  /** 分享描述 */
  text?: string;

  /** 分享URL */
  url?: string;

  /** 是否包含图片 */
  includeImage?: boolean;
}

/**
 * 图表类型验证结果
 */
export interface ChartTypeValidationResult {
  /** 是否有效 */
  isValid: boolean;

  /** 错误信息 */
  errors: string[];

  /** 建议的图表类型 */
  suggestedType?: ChartType;

  /** 验证的数据统计 */
  dataStats: {
    pointCount: number;
    seriesCount: number;
    hasTimeData: boolean;
    hasCategoryData: boolean;
    hasNumericalData: boolean;
  };
}

/**
 * 数据转换配置
 */
export interface DataTransformConfig {
  /** 源数据格式 */
  sourceFormat: "standard" | "pie" | "mixed";

  /** 目标图表类型 */
  targetType: ChartType;

  /** 是否强制转换 */
  forceTransform?: boolean;

  /** 转换选项 */
  transformOptions?: {
    /** 饼图转换时的值字段 */
    valueField?: string;

    /** 饼图转换时的名称字段 */
    nameField?: string;

    /** 标准数据转换为饼图时是否聚合 */
    aggregateValues?: boolean;
  };
}

/**
 * 图表渲染状态
 */
export type ChartRenderState = "idle" | "loading" | "rendering" | "ready" | "error";

/**
 * 增强图表状态接口
 */
export interface EnhancedChartState {
  /** 渲染状态 */
  renderState: ChartRenderState;

  /** 是否正在导出 */
  isExporting: boolean;

  /** 导出错误 */
  exportError: ExportError | null;

  /** 数据验证结果 */
  validationResult: ChartTypeValidationResult | null;
}

/**
 * 默认配置常量
 */
export const ENHANCED_CHART_DEFAULTS = {
  // 通用默认值
  className: "w-full",

  // 面积图默认值
  fillOpacity: 0.6,
  stacked: false,

  // 柱状图默认值
  bar: {
    radius: 4,
    showValues: true,
    showGrid: true,
  },

  // 折线图默认值
  line: {
    curveType: "monotone" as const,
    showDots: true,
    dotSize: 6,
    dotVariant: "default" as LineDotVariant,
    showGrid: true,
  },

  // 饼图默认值
  innerRadius: 0,
  outerRadius: 120,
  showPercentage: true,
  showLegend: true,

  // 面积图选项默认值
  area: {
    showGrid: true,
    useGradient: true,
  },

  // 雷达图默认值
  radar: RADAR_CHART_DEFAULTS,

  // 径向图默认值
  radial: RADIAL_CHART_DEFAULTS,

  // 导出默认值
  export: {
    quality: 0.95,
    format: "png" as const,
    scale: 2,
    backgroundColor: "#ffffff",
  },

  // 分享默认值
  share: {
    title: "图表分享",
    text: "通过 Auto Chart 生成的图表",
  },
} as const;

/**
 * 图表类型映射
 */
export const CHART_TYPE_MAP = {
  bar: "BeautifulBarChart",
  line: "BeautifulLineChart",
  pie: "BeautifulPieChart",
  area: "BeautifulAreaChart",
  radar: "BeautifulRadarChart",
  radial: "BeautifulRadialChart",
} as const;

/**
 * 支持的导出格式
 */
export const SUPPORTED_EXPORT_FORMATS = ["png", "jpeg", "webp"] as const;

/**
 * 图表类型兼容性映射
 */
export const CHART_DATA_COMPATIBILITY = {
  bar: ["standard"],
  line: ["standard"],
  area: ["standard"],
  pie: ["pie", "standard"], // 饼图支持两种数据格式
  radial: ["pie", "standard"],
  radar: ["standard"],
} as const;
