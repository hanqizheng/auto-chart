/**
 * 处理步骤相关常量
 * 用于AI执行过程的详细步骤展示
 */

/**
 * 处理步骤类型
 */
export const PROCESSING_STEPS = {
  THINKING: "thinking",
  FILE_PARSING: "file_parsing",
  DATA_ANALYSIS: "data_analysis",
  CHART_TYPE_DETECTION: "chart_type_detection",
  CHART_GENERATION: "chart_generation",
  IMAGE_EXPORT: "image_export",
  OPTIMIZATION: "optimization", // 添加优化步骤
  COMPLETED: "completed",
} as const;

/**
 * 处理步骤状态
 */
export const STEP_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

/**
 * 步骤类型配置 - UI 显示信息
 */
export const STEP_TYPE_CONFIG = {
  [PROCESSING_STEPS.THINKING]: {
    icon: "🤔",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    defaultTitle: "AI reasoning",
    description: "Analyzing the request and data characteristics",
  },
  [PROCESSING_STEPS.FILE_PARSING]: {
    icon: "📄",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    defaultTitle: "File parsing",
    description: "Parsing uploaded data files",
  },
  [PROCESSING_STEPS.DATA_ANALYSIS]: {
    icon: "📊",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    defaultTitle: "Data analysis",
    description: "Evaluating data structure and patterns",
  },
  [PROCESSING_STEPS.CHART_TYPE_DETECTION]: {
    icon: "🎯",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    defaultTitle: "Chart type selection",
    description: "Determining the most suitable chart type",
  },
  [PROCESSING_STEPS.CHART_GENERATION]: {
    icon: "📈",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    defaultTitle: "Chart generation",
    description: "Generating chart components",
  },
  [PROCESSING_STEPS.IMAGE_EXPORT]: {
    icon: "💾",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    defaultTitle: "Image export",
    description: "Exporting the chart as an image",
  },
  [PROCESSING_STEPS.OPTIMIZATION]: {
    icon: "🔧",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    defaultTitle: "Chart optimization",
    description: "Refining chart layout and styling",
  },
  [PROCESSING_STEPS.COMPLETED]: {
    icon: "✅",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    defaultTitle: "Processing complete",
    description: "All processing steps are finished",
  },
} as const;

/**
 * 步骤状态配置 - UI 显示信息
 */
export const STEP_STATUS_CONFIG = {
  [STEP_STATUS.PENDING]: {
    icon: "⏳",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    description: "Waiting to start",
  },
  [STEP_STATUS.RUNNING]: {
    icon: "⚡",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    description: "In progress",
  },
  [STEP_STATUS.COMPLETED]: {
    icon: "✓",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    description: "Finished",
  },
  [STEP_STATUS.ERROR]: {
    icon: "❌",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    description: "Failed",
  },
} as const;

/**
 * 处理阶段 - 用于组织多个步骤
 */
export const PROCESSING_STAGES = {
  PREPARATION: "preparation", // 准备阶段：思考、文件解析
  ANALYSIS: "analysis", // 分析阶段：数据分析、图表类型检测
  GENERATION: "generation", // 生成阶段：图表生成、图片导出
  COMPLETION: "completion", // 完成阶段
} as const;

/**
 * 阶段与步骤的映射关系
 */
export const STAGE_STEP_MAPPING = {
  [PROCESSING_STAGES.PREPARATION]: [PROCESSING_STEPS.THINKING, PROCESSING_STEPS.FILE_PARSING],
  [PROCESSING_STAGES.ANALYSIS]: [
    PROCESSING_STEPS.DATA_ANALYSIS,
    PROCESSING_STEPS.CHART_TYPE_DETECTION,
  ],
  [PROCESSING_STAGES.GENERATION]: [
    PROCESSING_STEPS.CHART_GENERATION,
    PROCESSING_STEPS.IMAGE_EXPORT,
  ],
  [PROCESSING_STAGES.COMPLETION]: [PROCESSING_STEPS.COMPLETED],
} as const;
