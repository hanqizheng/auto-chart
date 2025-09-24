// Radial Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";
import { UnifiedColorConfig } from "@/types/chart-config";

/**
 * 径向图数据点
 */
export interface RadialChartDatum {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * 径向图数据集合
 */
export type RadialChartData = RadialChartDatum[];

/**
 * 径向图组件属性
 */
export interface RadialChartProps {
  /** 图表数据 */
  data: RadialChartData;

  /** 图表配置 */
  config: ChartConfig;

  /** 图表标题 */
  title?: string;

  /** 图表描述 */
  description?: string;

  /** 自定义样式类名 */
  className?: string;

  /** 内半径 */
  innerRadius?: number;

  /** 外半径 */
  outerRadius?: number;

  /** 每个扇区厚度 */
  barSize?: number;

  /** 扇区圆角 */
  cornerRadius?: number;

  /** 起始角度 */
  startAngle?: number;

  /** 结束角度 */
  endAngle?: number;

  /** 是否显示图例 */
  showLegend?: boolean;

  /** 是否展示背景轨道 */
  showBackground?: boolean;

  /** 是否显示标签 */
  showLabels?: boolean;

  /** 颜色配置（新架构） - 必需 */
  colors: UnifiedColorConfig;

  /** 主色调（可选，用于生成颜色配置） */
  primaryColor?: string;
}

/**
 * 径向图验证结果
 */
export interface RadialChartValidationResult {
  /** 数据是否有效 */
  isValid: boolean;

  /** 错误信息 */
  errors: string[];

  /** 数据统计 */
  stats: {
    dataPointCount: number;
    totalValue: number;
    hasZeroOrNegative: boolean;
  };
}

/**
 * 径向图默认配置
 */
export const RADIAL_CHART_DEFAULTS = {
  innerRadius: 40,
  outerRadius: 110,
  barSize: 14,
  cornerRadius: 6,
  startAngle: 90,
  endAngle: -270,
  showLegend: true,
  showBackground: true,
  showLabels: true,
} as const;
