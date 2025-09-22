// AI Chart System - 统一导出
// Professional AI-driven chart generation system

import { CHART_TYPES } from "@/constants/chart";

// 核心系统
export { AIChartDirector, aiChartDirector, generateChart, getSystemStatus } from './ai-chart-director';

// 系统组件
export { InputRouter, inputRouter } from './input-router';
export { DataExtractor, dataExtractor } from './data-extractor';
export { IntentAnalyzer, intentAnalyzer } from './intent-analyzer';  
export { ChartGenerator, chartGenerator } from './chart-generator';

// 类型定义
export type {
  // 核心类型
  ScenarioType,
  AIChartResult,
  ChartGenerationResult,
  ChartGenerationError,
  AIChartSystemInput,
  
  // 数据相关类型
  UnifiedDataStructure,
  DataSchema,
  DataMetadata,
  ExtractedData,
  
  // 意图分析类型
  ChartIntent,
  CompatibilityResult,
  
  // 配置类型
  ChartConfig,
  AIChartSystemConfig,
  
  // 验证类型
  ValidationResult,
  
  // 接口类型
  IInputRouter,
  IDataExtractor,  
  IIntentAnalyzer,
  IChartGenerator,
  IAIChartDirector,
} from './types';

// 错误类型
export { AIChartError } from './types';

// 系统常量
export const AI_CHART_SYSTEM_VERSION = '1.0.0';
export const SUPPORTED_FILE_FORMATS = ['.xlsx', '.xls', '.csv'];
export const SUPPORTED_CHART_TYPES = Object.values(CHART_TYPES);

/**
 * 快速开始指南:
 * 
 * ```typescript
 * import { generateChart } from '@/lib/ai-chart-system';
 * 
 * // 场景1: 仅文本描述
 * const result1 = await generateChart({
 *   prompt: "北京[22, 23, 24], 上海[25, 26, 27], 深圳[28, 29, 30]的温度对比"
 * });
 * 
 * // 场景2: 文本 + 文件
 * const result2 = await generateChart({
 *   prompt: "展示各地区销售额的对比分析",
 *   files: [excelFile]
 * });
 * 
 * // 场景3: 仅文件
 * const result3 = await generateChart({
 *   prompt: "",
 *   files: [csvFile]
 * });
 * ```
 */
