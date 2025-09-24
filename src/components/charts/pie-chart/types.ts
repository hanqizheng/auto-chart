// Pie Chart 专用类型定义
import { ChartConfig } from "@/components/ui/chart";
import { UnifiedColorConfig } from "@/types/chart-config";

/**
 * 饼图数据点接口
 * 专用于饼图的数据格式，包含名称和数值
 */
export interface PieChartDataPoint {
  /** 数据分类名称 */
  name: string;

  /** 数值大小 */
  value: number;

  /** 自定义颜色（可选） */
  color?: string;
}

/**
 * 饼图数据数组类型
 * 必须至少包含两个数据点以形成有意义的分布
 */
export type PieChartData = PieChartDataPoint[];

/**
 * 饼图分析结果
 */
export interface PieChartAnalysis {
  /** 总计值 */
  total: number;

  /** 最大分类 */
  largest: {
    name: string;
    value: number;
    percentage: number;
  };

  /** 最小分类 */
  smallest: {
    name: string;
    value: number;
    percentage: number;
  };

  /** 分类数量 */
  categoryCount: number;

  /** 集中度（前3名占比） */
  concentration: number;

  /** 是否高度集中（前3名超过80%） */
  isHighlyConcentrated: boolean;
}

/**
 * 饼图组件属性接口
 */
export interface PieChartProps {
  /** 图表数据 - 必须包含至少两个数据点 */
  data: PieChartData;

  /** 图表配置 - 定义显示配置 */
  config: ChartConfig;

  /** 图表标题 */
  title?: string;

  /** 图表描述 */
  description?: string;

  /** 自定义样式类名 */
  className?: string;

  /** 是否显示百分比标签 */
  showPercentage?: boolean;

  /** 是否显示图例 */
  showLegend?: boolean;

  /** 内圆半径（环形图） */
  innerRadius?: number;

  /** 外圆半径 */
  outerRadius?: number;

  /** 颜色配置（新架构） - 必需 */
  colors: UnifiedColorConfig;

  /** 主色调（可选，用于生成颜色配置） */
  primaryColor?: string;
}

/**
 * 饼图数据验证接口
 */
export interface PieChartValidationResult {
  /** 数据是否有效 */
  isValid: boolean;

  /** 错误信息 */
  errors: string[];

  /** 数据统计信息 */
  stats: {
    dataPointCount: number;
    totalValue: number;
    hasValidNames: boolean;
    hasValidValues: boolean;
    hasZeroValues: boolean;
    hasNegativeValues: boolean;
  };
}

/**
 * 饼图样式配置
 */
export interface PieChartStyleConfig {
  /** 扇区间距 */
  paddingAngle?: number;

  /** 标签显示位置 */
  labelPosition?: "inside" | "outside" | "none";

  /** 是否显示连接线 */
  showConnectorLine?: boolean;

  /** 是否启用动画 */
  animate?: boolean;

  /** 起始角度 */
  startAngle?: number;

  /** 结束角度 */
  endAngle?: number;
}

/**
 * 饼图配置完整选项
 */
export interface PieChartConfiguration {
  /** 基础配置 */
  config: ChartConfig;

  /** 样式配置 */
  style?: PieChartStyleConfig;

  /** 图表元数据 */
  metadata: {
    title?: string;
    description?: string;
    unit?: string;
    totalLabel?: string;
  };

  /** 显示选项 */
  display?: {
    showPercentage?: boolean;
    showLegend?: boolean;
    innerRadius?: number;
    outerRadius?: number;
  };
}

/**
 * 饼图颜色主题
 */
export const PIE_CHART_COLORS = [
  "hsl(220, 70%, 50%)", // 蓝色
  "hsl(160, 60%, 45%)", // 绿色
  "hsl(30, 80%, 55%)", // 橙色
  "hsl(280, 65%, 60%)", // 紫色
  "hsl(340, 75%, 55%)", // 粉色
  "hsl(200, 80%, 60%)", // 浅蓝色
  "hsl(140, 70%, 50%)", // 青绿色
  "hsl(45, 90%, 60%)", // 黄色
  "hsl(10, 75%, 55%)", // 红色
  "hsl(260, 60%, 55%)", // 深紫色
] as const;

/**
 * 饼图默认配置
 */
export const PIE_CHART_DEFAULTS = {
  innerRadius: 0,
  outerRadius: 120,
  paddingAngle: 2,
  showPercentage: true,
  showLegend: true,
  animate: true,
  startAngle: 90,
  endAngle: 450,
  labelPosition: "outside" as const,
  showConnectorLine: true,
} as const;
