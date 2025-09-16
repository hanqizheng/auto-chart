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
}

export interface ChartTheme {
  baseColor: string;
  palette: ChartPalette;
  /** 记录主题生成时间，方便追踪 */
  generatedAt: string;
  /** 可选的主题名称，用于未来的主题管理 */
  name?: string;
}
