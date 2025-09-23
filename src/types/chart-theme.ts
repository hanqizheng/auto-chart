// ===== 新增：结构化颜色配置类型 =====

/**
 * 通用颜色配置 - 所有图表共用的颜色
 */
export interface ChartCommonColors {
  /** 背景色 */
  background: string;
  /** 网格线颜色 */
  grid: string;
  /** 文字/坐标轴标签颜色 */
  label: string;
  /** tooltip 背景色 */
  tooltip: string;
}

/**
 * 系列颜色配置 - 支持边框和填充颜色分离
 */
export interface SeriesColorConfig {
  /** 主颜色（边框/线条颜色） */
  stroke: string;
  /** 填充颜色（可选，用于区域图、雷达图等） */
  fill?: string;
}

/**
 * 结构化图表颜色配置
 */
export interface StructuredChartColors {
  /** 通用颜色 */
  common: ChartCommonColors;
  /** 系列颜色配置列表 */
  seriesConfigs: SeriesColorConfig[];
}

// ===== 保持向后兼容的原有类型定义 =====

export interface ChartPalette {
  /** 主色，用于主要图元 */
  primary: string;
  /** 更亮的主色，适用于背景或区域填充 */
  primarySoft: string;
  /** 更深的主色，适用于强调 */
  primaryStrong: string;
  /** 辅助强调色 */
  accent: string;
  /** 更柔和的强调色 */
  accentSoft: string;
  /** 中性颜色，适用于文字/分隔线 */
  neutral: string;
  /** 深色中性，适用于坐标轴等 */
  neutralStrong: string;
  /** 背景色 */
  background: string;
  /** 网格线颜色 */
  grid: string;
  /** 系列颜色列表，按顺序匹配数据字段 */
  series: string[];

  // ===== 新增：结构化颜色配置 =====
  /** 结构化颜色配置（新增） */
  structured: StructuredChartColors;
}

export interface ChartTheme {
  baseColor: string;
  palette: ChartPalette;
  /** 记录主题生成时间，方便追踪 */
  generatedAt: string;
  /** 可选的主题名称，用于未来的主题管理 */
  name?: string;
}
