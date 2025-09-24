// Line Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";
import { UnifiedColorConfig } from "@/types/chart-config";

/**
 * 折线图数据点接口
 * 每个数据点必须包含一个标识符（通常是时间或序列标识），其余为数值数据
 */
export interface LineChartDataPoint {
  [key: string]: string | number;
}

/**
 * 折线图数据数组类型
 * 必须至少包含两个数据点以形成折线
 */
export type LineChartData = LineChartDataPoint[];

/**
 * 趋势分析结果
 */
export interface TrendAnalysis {
  /** 数据系列标识 */
  key: string;

  /** 数值变化量 */
  change: number;

  /** 变化百分比 */
  changePercent: number;

  /** 趋势方向 */
  trend: "up" | "down" | "stable";

  /** 最小值 */
  min: number;

  /** 最大值 */
  max: number;

  /** 平均值 */
  avg: number;
}

/**
 * 折线图组件属性接口
 */
export type LineDotVariant = "default" | "solid" | "icon";

export interface LineChartProps {
  /** 图表数据 - 必须包含至少两个数据点 */
  data: LineChartData;

  /** 图表配置 - 定义数据系列的显示配置 */
  config: ChartConfig;

  /** 图表标题 */
  title?: string;

  /** 图表描述 */
  description?: string;

  /** 自定义样式类名 */
  className?: string;

  /** 是否显示参考线 */
  showReferenceLine?: boolean;

  /** 参考线数值 */
  referenceValue?: number;

  /** 参考线标签 */
  referenceLabel?: string;

  /** 曲线类型 */
  curveType?: "monotone" | "linear";

  /** 是否显示拐点 */
  showDots?: boolean;

  /** 拐点大小 */
  dotSize?: number;

  /** 拐点样式 */
  dotVariant?: LineDotVariant;

  /** 是否显示背景网格 */
  showGrid?: boolean;

  /** 颜色配置（新架构） - 必需 */
  colors: UnifiedColorConfig;

  /** 主色调（可选，用于生成颜色配置） */
  primaryColor?: string;
}

/**
 * 折线图数据验证接口
 */
export interface LineChartValidationResult {
  /** 数据是否有效 */
  isValid: boolean;

  /** 错误信息 */
  errors: string[];

  /** 数据统计信息 */
  stats: {
    dataPointCount: number;
    seriesCount: number;
    xAxisKey: string;
    valueKeys: string[];
  };
}

/**
 * 折线图样式配置
 */

export interface LineChartStyleConfig {
  /** 线条宽度 */
  strokeWidth?: number;

  /** 线条样式 */
  strokeDasharray?: string;

  /** 是否显示数据点 */
  showDots?: boolean;

  /** 数据点大小 */
  dotSize?: number;

  /** 是否显示数值标签 */
  showValueLabels?: boolean;

  /** 是否平滑曲线 */
  smooth?: boolean;
}

/**
 * 折线图配置完整选项
 */
export interface LineChartConfiguration {
  /** 基础配置 */
  config: ChartConfig;

  /** 样式配置 */
  style?: LineChartStyleConfig;

  /** 图表元数据 */
  metadata: {
    title?: string;
    description?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };

  /** 分析配置 */
  analysis?: {
    showTrend?: boolean;
    showReferenceLine?: boolean;
    referenceValue?: number;
    referenceLabel?: string;
  };
}
