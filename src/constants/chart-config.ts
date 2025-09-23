/**
 * 图表配置常量定义
 * 定义所有图表配置相关的常量，供类型派生和UI生成使用
 */

/**
 * 配置项类型常量
 */
export const CHART_CONFIG_TYPES = {
  COLOR: "color",
  BOOLEAN: "boolean",
  NUMBER: "number",
  SELECT: "select",
} as const;

/**
 * 颜色配置类别常量
 */
export const COLOR_CONFIG_CATEGORIES = {
  PRIMARY: "primary",
  SERIES: "series",
  GRID: "grid",
  BACKGROUND: "background",
  TEXT: "text",
  BORDER: "border",
} as const;

/**
 * 配置模式常量
 */
export const CHART_CONFIG_MODES = {
  SIMPLE: "simple",
  COMPLEX: "complex",
} as const;

/**
 * 数值配置的范围常量
 */
export const CHART_CONFIG_RANGES = {
  BAR_RADIUS: { min: 0, max: 24, step: 1 },
  OPACITY: { min: 0.1, max: 1, step: 0.05 },
  INNER_RADIUS: { min: 0, max: 90, step: 5 },
  OUTER_RADIUS: { min: 50, max: 200, step: 10 },
  DOT_SIZE: { min: 2, max: 12, step: 1 },
  STROKE_WIDTH: { min: 1, max: 5, step: 0.5 },
  BAR_SIZE: { min: 5, max: 40, step: 1 },
  CORNER_RADIUS: { min: 0, max: 20, step: 1 },
} as const;

/**
 * 折线图点样式选项
 */
export const LINE_DOT_VARIANTS = [
  { value: "default", label: "Default" },
  { value: "solid", label: "Solid" },
  { value: "icon", label: "Icon" },
] as const;

/**
 * 折线图曲线类型选项
 */
export const LINE_CURVE_TYPES = [
  { value: "monotone", label: "Smooth" },
  { value: "linear", label: "Linear" },
] as const;

/**
 * 各图表类型的配置描述
 */
export const CHART_CONFIG_SCHEMAS = {
  bar: {
    colors: [
      {
        key: "grid",
        label: "Grid Color",
        category: COLOR_CONFIG_CATEGORIES.GRID,
      },
      {
        key: "series",
        label: "Bar Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
      },
    ],
    options: [
      {
        key: "barRadius",
        label: "Corner Radius",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 4,
        range: CHART_CONFIG_RANGES.BAR_RADIUS,
        unit: "px",
      },
      {
        key: "barShowGrid",
        label: "Show Grid",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "barShowValues",
        label: "Show Value Labels",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  line: {
    colors: [
      {
        key: "grid",
        label: "Grid Color",
        category: COLOR_CONFIG_CATEGORIES.GRID,
      },
      {
        key: "series",
        label: "Line Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
      },
    ],
    options: [
      {
        key: "lineCurveType",
        label: "Curve Type",
        type: CHART_CONFIG_TYPES.SELECT,
        defaultValue: "monotone",
        options: LINE_CURVE_TYPES,
      },
      {
        key: "lineShowGrid",
        label: "Show Grid",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "lineShowDots",
        label: "Show Points",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "lineDotSize",
        label: "Point Size",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 6,
        range: CHART_CONFIG_RANGES.DOT_SIZE,
        unit: "px",
        dependsOn: "lineShowDots",
      },
      {
        key: "lineDotVariant",
        label: "Point Style",
        type: CHART_CONFIG_TYPES.SELECT,
        defaultValue: "default",
        options: LINE_DOT_VARIANTS,
        dependsOn: "lineShowDots",
      },
    ],
  },
  pie: {
    colors: [
      {
        key: "series",
        label: "Slice Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
      },
    ],
    options: [
      {
        key: "showLegend",
        label: "Show Legend",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "showPercentage",
        label: "Show Labels",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "innerRadius",
        label: "Inner Radius",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 0,
        range: CHART_CONFIG_RANGES.INNER_RADIUS,
        unit: "px",
      },
    ],
  },
  area: {
    colors: [
      {
        key: "grid",
        label: "Grid Color",
        category: COLOR_CONFIG_CATEGORIES.GRID,
      },
      {
        key: "series",
        label: "Area Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
        hasStroke: true, // 区域图有边框颜色
      },
    ],
    options: [
      {
        key: "areaShowGrid",
        label: "Show Grid",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "areaUseGradient",
        label: "Gradient Fill",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "areaFillOpacity",
        label: "Fill Opacity",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 0.6,
        range: CHART_CONFIG_RANGES.OPACITY,
        unit: "%",
        formatter: (value: number) => Math.round(value * 100),
      },
    ],
  },
  radar: {
    colors: [
      {
        key: "series",
        label: "Radar Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
        hasStroke: true, // 雷达图有边框颜色
      },
    ],
    options: [
      {
        key: "radarShowLegend",
        label: "Show Legend",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "radarShowArea",
        label: "Fill Area",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "radarShowDots",
        label: "Show Points",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "radarFillOpacity",
        label: "Fill Opacity",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 0.3,
        range: CHART_CONFIG_RANGES.OPACITY,
        unit: "%",
        formatter: (value: number) => Math.round(value * 100),
        dependsOn: "radarShowArea",
      },
      {
        key: "radarStrokeWidth",
        label: "Line Width",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 2,
        range: CHART_CONFIG_RANGES.STROKE_WIDTH,
        unit: "px",
      },
    ],
  },
  radial: {
    colors: [
      {
        key: "series",
        label: "Ring Colors",
        category: COLOR_CONFIG_CATEGORIES.SERIES,
        isArray: true,
      },
      {
        key: "background",
        label: "Track Background",
        category: COLOR_CONFIG_CATEGORIES.BACKGROUND,
      },
    ],
    options: [
      {
        key: "radialShowLabels",
        label: "Show Value Labels",
        type: CHART_CONFIG_TYPES.BOOLEAN,
        defaultValue: true,
      },
      {
        key: "radialInnerRadius",
        label: "Inner Radius",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 45,
        range: { min: 20, max: 100, step: 5 },
        unit: "px",
      },
      {
        key: "radialBarSize",
        label: "Ring Width",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 20,
        range: CHART_CONFIG_RANGES.BAR_SIZE,
        unit: "px",
      },
      {
        key: "radialCornerRadius",
        label: "Corner Radius",
        type: CHART_CONFIG_TYPES.NUMBER,
        defaultValue: 10,
        range: CHART_CONFIG_RANGES.CORNER_RADIUS,
        unit: "px",
      },
    ],
  },
} as const;

/**
 * 默认配置值常量
 */
export const CHART_CONFIG_DEFAULTS = {
  MODE: CHART_CONFIG_MODES.SIMPLE,
  PRIMARY_COLOR: "#3b82f6",
  SERIES_COLORS: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  GRID_COLOR: "#e5e7eb",
  BACKGROUND_COLOR: "#ffffff",
  TEXT_COLOR: "#374151",
} as const;

/**
 * 配置组件映射常量
 */
export const CONFIG_COMPONENT_MAP = {
  [CHART_CONFIG_TYPES.COLOR]: "ColorInput",
  [CHART_CONFIG_TYPES.BOOLEAN]: "Switch",
  [CHART_CONFIG_TYPES.NUMBER]: "Slider",
  [CHART_CONFIG_TYPES.SELECT]: "Select",
} as const;
