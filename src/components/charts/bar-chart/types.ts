// Bar Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";

/**
 * 柱状图数据点接口
 * 每个数据点必须包含一个字符串类型的分类标识符，其余为数值数据
 */
export interface BarChartDataPoint {
  [key: string]: string | number;
}

/**
 * 柱状图数据数组类型
 * 必须至少包含一个数据点
 */
export type BarChartData = BarChartDataPoint[];

/**
 * 柱状图组件属性接口
 */
export interface BarChartProps {
  /** 图表数据 - 必须包含至少一个数据点 */
  data: BarChartData;
  
  /** 图表配置 - 定义数据系列的显示配置 */
  config: ChartConfig;
  
  /** 图表标题 */
  title?: string;
  
  /** 图表描述 */
  description?: string;
  
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 柱状图数据验证接口
 */
export interface BarChartValidationResult {
  /** 数据是否有效 */
  isValid: boolean;
  
  /** 错误信息 */
  errors: string[];
  
  /** 数据统计信息 */
  stats: {
    dataPointCount: number;
    seriesCount: number;
    categoryKey: string;
    valueKeys: string[];
  };
}

/**
 * 柱状图样式配置
 */
export interface BarChartStyleConfig {
  /** 柱子圆角半径 */
  barRadius?: [number, number, number, number];
  
  /** 柱子间距 */
  barCategoryGap?: string;
  
  /** 同类别柱子间距 */
  barGap?: string;
  
  /** 是否显示数值标签 */
  showValueLabels?: boolean;
  
  /** 数值标签位置 */
  labelPosition?: 'top' | 'inside' | 'bottom';
}

/**
 * 柱状图配置完整选项
 */
export interface BarChartConfiguration {
  /** 基础配置 */
  config: ChartConfig;
  
  /** 样式配置 */
  style?: BarChartStyleConfig;
  
  /** 图表元数据 */
  metadata: {
    title?: string;
    description?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
}