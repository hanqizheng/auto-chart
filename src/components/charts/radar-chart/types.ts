// Radar Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";
import { UnifiedColorConfig } from "@/types/chart-config";

/**
 * 雷达图数据点结构
 */
export interface RadarChartDataPoint {
  [key: string]: string | number;
}

/**
 * 雷达图数据集合
 */
export type RadarChartData = RadarChartDataPoint[];

/**
 * 雷达图组件属性
 */
export interface RadarChartProps {
  /** 图表数据 */
  data: RadarChartData;

  /** 图表配置 */
  config: ChartConfig;

  /** 图表标题 */
  title?: string;

  /** 图表描述 */
  description?: string;

  /** 自定义样式类名 */
  className?: string;

  /** 是否显示网格 */
  showGrid?: boolean;

  /** 是否显示图例 */
  showLegend?: boolean;

  /** 是否展示顶点圆点 */
  showDots?: boolean;

  /** 区域填充透明度 */
  fillOpacity?: number;

  /** 轮廓线宽 */
  strokeWidth?: number;

  /** 是否以填充区域展示 */
  showArea?: boolean;

  /** 最大半径刻度值 */
  maxValue?: number;

  /** 颜色配置（新架构） - 必需 */
  colors: UnifiedColorConfig;

  /** 主色调（可选，用于生成颜色配置） */
  primaryColor?: string;
}

/**
 * 雷达图数据校验结果
 */
export interface RadarChartValidationResult {
  /** 数据是否有效 */
  isValid: boolean;

  /** 错误信息 */
  errors: string[];

  /** 统计信息 */
  stats: {
    dataPointCount: number;
    dimensionKey: string;
    valueKeys: string[];
  };
}

/**
 * 雷达图默认配置
 */
export const RADAR_CHART_DEFAULTS = {
  showGrid: true,
  showLegend: true,
  showDots: true,
  showArea: true,
  fillOpacity: 0.25,
  strokeWidth: 2,
} as const;
