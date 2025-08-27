// 图表相关常量定义

// 支持的图表类型常量
export const CHART_TYPES = {
  BAR: "bar",
  LINE: "line",
  PIE: "pie",
  AREA: "area",
} as const;

// 简单图表支持的类型
export const SIMPLE_CHART_TYPES = {
  BAR: "bar",
  LINE: "line",
} as const;

// 图表类别常量
export const CHART_CATEGORIES = {
  COMPARISON: "comparison",
  TREND: "trend",
  DISTRIBUTION: "distribution",
  RELATIONSHIP: "relationship",
} as const;

// 数据列类型常量
export const COLUMN_TYPES = {
  STRING: "string",
  NUMBER: "number",
  DATE: "date",
  BOOLEAN: "boolean",
  MIXED: "mixed",
} as const;

// 轴类型常量
export const AXIS_TYPES = {
  CATEGORY: "category",
  VALUE: "value",
  TIME: "time",
} as const;

// 图表配置选项
export const CHART_OPTIONS = {
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false,
  ANIMATION_DURATION: 750,
  BORDER_WIDTH: {
    DEFAULT: 2,
    THIN: 1,
    THICK: 3,
  },
  BORDER_RADIUS: {
    NONE: 0,
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 8,
  },
} as const;

// 颜色主题常量
export const COLOR_THEMES = {
  DEFAULT: "default",
  BLUE: "blue",
  GREEN: "green",
  RED: "red",
  PURPLE: "purple",
  ORANGE: "orange",
} as const;

// 图例位置常量
export const LEGEND_POSITIONS = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

// 图表尺寸预设
export const CHART_SIZES = {
  SMALL: { width: 400, height: 300 },
  MEDIUM: { width: 600, height: 400 },
  LARGE: { width: 800, height: 500 },
  XLARGE: { width: 1200, height: 600 },
} as const;

// 图表标题样式
export const TITLE_STYLES = {
  FONT_SIZE: {
    SMALL: "14px",
    MEDIUM: "16px",
    LARGE: "18px",
    XLARGE: "20px",
  },
  FONT_WEIGHT: {
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
} as const;

// 数据验证常量
export const DATA_VALIDATION = {
  MAX_ROWS: 10000,
  MAX_COLUMNS: 50,
  MIN_ROWS: 1,
  MIN_COLUMNS: 2,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: [".xlsx", ".xls"],
} as const;

// 图表生成状态
export const CHART_GENERATION_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
} as const;

// 图表指示器类型
export const CHART_INDICATOR_TYPES = {
  LINE: "line",
  DOT: "dot",
  DASHED: "dashed",
} as const;

// 默认图表配置
export const DEFAULT_CHART_CONFIG = {
  responsive: CHART_OPTIONS.RESPONSIVE,
  maintainAspectRatio: CHART_OPTIONS.MAINTAIN_ASPECT_RATIO,
  plugins: {
    title: {
      display: true,
      fontSize: TITLE_STYLES.FONT_SIZE.MEDIUM,
      fontWeight: TITLE_STYLES.FONT_WEIGHT.SEMIBOLD,
    },
    legend: {
      display: true,
      position: LEGEND_POSITIONS.TOP,
    },
  },
} as const;
