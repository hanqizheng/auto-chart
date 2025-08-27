// Area Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";

/**
 * 面积图数据点接口
 * 每个数据点必须包含一个标识符（通常是时间或序列标识），其余为数值数据
 */
export interface AreaChartDataPoint {
  [key: string]: string | number;
}

/**
 * 面积图数据数组类型
 * 必须至少包含两个数据点以形成面积
 */
export type AreaChartData = AreaChartDataPoint[];

/**
 * 增强的面积图数据点（包含计算字段）
 */
export interface EnhancedAreaChartDataPoint extends AreaChartDataPoint {
  /** 总计值 */
  _total: number;
  
  /** 增长率 */
  _growth: number;
}

/**
 * 面积图系列分析
 */
export interface AreaSeriesAnalysis {
  /** 系列标识 */
  key: string;
  
  /** 总累积值 */
  totalAccumulated: number;
  
  /** 平均值 */
  average: number;
  
  /** 峰值 */
  peak: {
    value: number;
    period: string | number;
  };
  
  /** 谷值 */
  valley: {
    value: number;
    period: string | number;
  };
  
  /** 增长趋势 */
  growthTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  
  /** 变异系数（衡量波动性） */
  coefficientOfVariation: number;
}

/**
 * 面积图组件属性接口
 */
export interface AreaChartProps {
  /** 图表数据 - 必须包含至少两个数据点 */
  data: AreaChartData;
  
  /** 图表配置 - 定义数据系列的显示配置 */
  config: ChartConfig;
  
  /** 图表标题 */
  title?: string;
  
  /** 图表描述 */
  description?: string;
  
  /** 自定义样式类名 */
  className?: string;
  
  /** 是否堆叠显示 */
  stacked?: boolean;
  
  /** 是否显示总计线 */
  showTotalLine?: boolean;
  
  /** 是否显示增长率指标 */
  showGrowthRate?: boolean;
  
  /** 面积透明度 */
  fillOpacity?: number;
}

/**
 * 面积图数据验证接口
 */
export interface AreaChartValidationResult {
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
    hasNegativeValues: boolean;
    totalRange: {
      min: number;
      max: number;
    };
  };
}

/**
 * 面积图样式配置
 */
export interface AreaChartStyleConfig {
  /** 面积透明度 */
  fillOpacity?: number;
  
  /** 边界线宽度 */
  strokeWidth?: number;
  
  /** 是否显示边界线 */
  showStroke?: boolean;
  
  /** 是否显示数据点 */
  showDots?: boolean;
  
  /** 数据点大小 */
  dotSize?: number;
  
  /** 渐变填充 */
  useGradient?: boolean;
  
  /** 曲线平滑度 */
  curveType?: 'linear' | 'monotone' | 'step';
}

/**
 * 面积图配置完整选项
 */
export interface AreaChartConfiguration {
  /** 基础配置 */
  config: ChartConfig;
  
  /** 样式配置 */
  style?: AreaChartStyleConfig;
  
  /** 图表元数据 */
  metadata: {
    title?: string;
    description?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
  
  /** 显示选项 */
  display?: {
    stacked?: boolean;
    showTotalLine?: boolean;
    showGrowthRate?: boolean;
    fillOpacity?: number;
  };
  
  /** 分析配置 */
  analysis?: {
    calculateGrowth?: boolean;
    showPeakValley?: boolean;
    highlightTrends?: boolean;
  };
}

/**
 * 面积图默认配置
 */
export const AREA_CHART_DEFAULTS = {
  fillOpacity: 0.6,
  strokeWidth: 2,
  showStroke: true,
  showDots: false,
  dotSize: 4,
  useGradient: true,
  curveType: 'monotone' as const,
  stacked: false,
  showTotalLine: true,
  showGrowthRate: true,
} as const;