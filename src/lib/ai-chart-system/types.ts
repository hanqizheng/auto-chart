// Professional AI Chart System Types
// 专业AI图表系统类型定义

import { ChartType } from "@/types/chart";
import { AIServiceError } from "@/lib/ai/types";

/**
 * 场景类型 - 三种核心处理场景
 */
export type ScenarioType = 'PROMPT_ONLY' | 'PROMPT_WITH_FILE' | 'FILE_ONLY';

/**
 * 数据字段类型
 */
export type FieldType = 'string' | 'number' | 'date' | 'boolean';

/**
 * 数据字段定义
 */
export interface DataField {
  name: string;
  type: FieldType;
  nullable: boolean;
  unique?: boolean;
}

/**
 * 数据架构定义
 */
export interface DataSchema {
  /** 字段定义 */
  fields: DataField[];
  
  /** 主键字段 */
  primaryKey?: string;
  
  /** 数据行数 */
  rowCount: number;
  
  /** 数据质量分数 (0-1) */
  qualityScore: number;
}

/**
 * 数据值类型
 */
export type DataValue = string | number | Date | boolean | null;

/**
 * 数据行类型
 */
export interface DataRow {
  [fieldName: string]: DataValue;
}

/**
 * 文件信息
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

/**
 * 数据统计信息
 */
export interface DataStatistics {
  numericFields: string[];
  categoricalFields: string[];
  dateFields: string[];
  missingValues: number;
}

/**
 * 数据元信息
 */
export interface DataMetadata {
  /** 数据来源 */
  source: 'prompt' | 'file' | 'hybrid';
  
  /** 提取时间 */
  extractedAt: Date;
  
  /** 原始文件信息 */
  fileInfo?: FileInfo;
  
  /** 数据预览 */
  preview: DataRow[];
  
  /** 统计信息 */
  statistics: DataStatistics;
}

/**
 * 统一数据结构 - 系统内唯一数据源格式
 */
export interface UnifiedDataStructure {
  /** 标准化数据 */
  data: DataRow[];
  
  /** 数据架构 */
  schema: DataSchema;
  
  /** 数据元信息 */
  metadata: DataMetadata;
  
  /** 验证状态 */
  isValid: boolean;
  
  /** 验证错误 */
  validationErrors: string[];
}

/**
 * 输入验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 图表意图分析结果
 */
export interface ChartIntent {
  /** 推荐的图表类型 */
  chartType: ChartType;
  
  /** 置信度 (0-1) */
  confidence: number;
  
  /** 推理过程说明 */
  reasoning: string;
  
  /** 必需的数据字段 */
  requiredFields: string[];
  
  /** 可选的数据字段 */
  optionalFields: string[];
  
  /** 推荐的视觉映射 */
  visualMapping: VisualMapping;
  
  /** AI生成的标题和描述 */
  suggestions: {
    title: string;
    description: string;
    insights: string[];
  };
}

/**
 * 数据兼容性检查结果
 */
export interface CompatibilityResult {
  isCompatible: boolean;
  reason: string;
  missingFields: string[];
  incompatibleTypes: string[];
  suggestions: string[];
}

/**
 * 自动分析结果
 */
export interface AutoAnalysisResult {
  recommendedChart: ChartType;
  confidence: number;
  reasoning: string;
  requiredFields: string[];
  optionalFields: string[];
  visualMapping: ChartIntent['visualMapping'];
}

/**
 * 视觉映射定义
 */
export interface VisualMapping {
  xAxis: string;
  yAxis: string[];
  colorBy?: string;
  sizeBy?: string;
}

/**
 * 数据提取方法
 */
export type ExtractionMethod = 'ai_parsing' | 'regex_pattern' | 'file_parsing';

/**
 * 提取的数据结果
 */
export interface ExtractedData {
  data: DataRow[];
  confidence: number;
  extractionMethod: ExtractionMethod;
  warnings: string[];
}

/**
 * 图表生成配置
 */
export interface ChartConfig {
  colors: string[];
  dimensions: {
    width: number;
    height: number;
  };
  axes: {
    xAxis: {
      label: string;
      type: 'category' | 'time' | 'value';
    };
    yAxis: {
      label: string;
      type: 'value';
      min?: number;
      max?: number;
    };
  };
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  responsive: boolean;
}

/**
 * 图表元数据
 */
export interface ChartMetadata {
  generatedAt: Date;
  dataSource: string;
  processingTime: number;
  confidence: number;
}

/**
 * 最终图表生成结果
 */
export interface ChartGenerationResult {
  success: true;
  chartType: ChartType;
  data: DataRow[];
  config: ChartConfig;
  title: string;
  description: string;
  insights: string[];
  metadata: ChartMetadata;
}

/**
 * 错误结果
 */
export interface ChartGenerationError {
  success: false;
  error: AIServiceError;
  failedStage: 'input_validation' | 'data_extraction' | 'intent_analysis' | 'chart_generation';
  suggestions: string[];
}

/**
 * 统一的处理结果类型
 */
export type AIChartResult = ChartGenerationResult | ChartGenerationError;

/**
 * AI图表系统输入
 */
export interface AIChartSystemInput {
  prompt: string;
  files?: File[];
}

/**
 * 组件接口导出
 */
export interface IInputRouter {
  classifyScenario(prompt: string, files: File[]): ScenarioType;
  validateInput(scenario: ScenarioType, prompt: string, files: File[]): ValidationResult;
}

export interface IDataExtractor {
  extractFromPrompt(prompt: string): Promise<ExtractedData | null>;
  extractFromFiles(files: File[]): Promise<ExtractedData[]>;
  normalizeData(rawData: DataRow[], source: 'prompt' | 'file', metadata?: Partial<DataMetadata>): UnifiedDataStructure;
}

export interface IIntentAnalyzer {
  analyzeChartIntent(prompt: string, dataStructure: UnifiedDataStructure): Promise<ChartIntent>;
  validateDataCompatibility(intent: ChartIntent, data: UnifiedDataStructure): CompatibilityResult;
  suggestBestVisualization(data: UnifiedDataStructure): Promise<ChartIntent>;
}

export interface IChartGenerator {
  generateChart(intent: ChartIntent, data: UnifiedDataStructure): Promise<ChartGenerationResult>;
  buildConfiguration(chartType: ChartType, data: UnifiedDataStructure, intent: ChartIntent): ChartConfig;
}

export interface IAIChartDirector {
  generateChart(input: AIChartSystemInput): Promise<AIChartResult>;
  getSystemStatus(): Promise<{
    aiServiceConnected: boolean;
    componentsInitialized: boolean;
    lastError?: string;
  }>;
}

/**
 * AI图表系统错误类型
 */
export class AIChartError extends AIServiceError {
  constructor(
    public stage: 'input_validation' | 'data_extraction' | 'intent_analysis' | 'chart_generation',
    type: AIServiceError['type'],
    message: string,
    details?: any
  ) {
    super(type, message, details, false);
    this.name = 'AIChartError';
  }
}

/**
 * 系统配置
 */
export interface AIChartSystemConfig {
  /** AI服务配置 */
  aiService: {
    provider: string;
    apiKey: string;
    timeout: number;
  };
  
  /** 数据处理配置 */
  dataProcessing: {
    maxFileSize: number;
    supportedFormats: string[];
    maxDataPoints: number;
  };
  
  /** 图表生成配置 */
  chartGeneration: {
    defaultColors: string[];
    maxSeriesCount: number;
    enableAnimations: boolean;
  };
  
  /** 调试配置 */
  debug: {
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}