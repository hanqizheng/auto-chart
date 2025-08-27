// 数据处理相关常量

// 文件上传状态
export const UPLOAD_STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
} as const;

// 数据质量问题类型
export const QUALITY_ISSUE_TYPES = {
  MISSING_DATA: "missing_data",
  INCONSISTENT_TYPES: "inconsistent_types",
  DUPLICATE_ROWS: "duplicate_rows",
  OUTLIERS: "outliers",
  INVALID_FORMAT: "invalid_format",
} as const;

// 问题严重程度
export const SEVERITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

// 数据模式类型
export const DATA_PATTERN_TYPES = {
  TREND: "trend",
  SEASONAL: "seasonal",
  CATEGORICAL: "categorical",
  NUMERIC_RANGE: "numeric_range",
  TIME_SERIES: "time_series",
  CORRELATION: "correlation",
} as const;

// 文件类型支持
export const SUPPORTED_FILE_TYPES = {
  EXCEL_XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  EXCEL_XLS: "application/vnd.ms-excel",
  CSV: "text/csv",
} as const;

export const SUPPORTED_FILE_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

// 数据处理限制
export const DATA_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 50000,
  MAX_COLUMNS: 100,
  MIN_ROWS: 1,
  MIN_COLUMNS: 2,
  PREVIEW_ROWS: 10, // 预览显示的行数
  SAMPLE_SIZE: 1000, // 数据分析采样大小
} as const;

// 数据清洗操作类型
export const CLEANING_ACTIONS = {
  REMOVE_EMPTY_ROWS: "remove_empty_rows",
  REMOVE_EMPTY_COLUMNS: "remove_empty_columns",
  FILL_MISSING_VALUES: "fill_missing_values",
  NORMALIZE_TYPES: "normalize_types",
  REMOVE_DUPLICATES: "remove_duplicates",
  TRIM_WHITESPACE: "trim_whitespace",
} as const;

// 错误类型
export const DATA_ERROR_TYPES = {
  FILE_TOO_LARGE: "file_too_large",
  INVALID_FORMAT: "invalid_format",
  CORRUPT_FILE: "corrupt_file",
  NO_DATA: "no_data",
  INSUFFICIENT_COLUMNS: "insufficient_columns",
  PROCESSING_FAILED: "processing_failed",
} as const;

// 默认错误消息
export const ERROR_MESSAGES = {
  [DATA_ERROR_TYPES.FILE_TOO_LARGE]: "File size exceeds 10MB limit",
  [DATA_ERROR_TYPES.INVALID_FORMAT]: "Unsupported file format. Please use .xlsx or .xls files",
  [DATA_ERROR_TYPES.CORRUPT_FILE]: "File appears to be corrupted or unreadable",
  [DATA_ERROR_TYPES.NO_DATA]: "No data found in the uploaded file",
  [DATA_ERROR_TYPES.INSUFFICIENT_COLUMNS]:
    "File must contain at least 2 columns for chart generation",
  [DATA_ERROR_TYPES.PROCESSING_FAILED]: "Failed to process the uploaded file",
} as const;

// 数据类型检测阈值
export const TYPE_DETECTION = {
  NUMERIC_THRESHOLD: 0.8, // 80% 数值才认为是数字列
  DATE_THRESHOLD: 0.7, // 70% 日期才认为是日期列
  CATEGORICAL_THRESHOLD: 0.9, // 90% 重复值才认为是分类列
  MIN_SAMPLES_FOR_DETECTION: 10, // 最少样本数量
} as const;
