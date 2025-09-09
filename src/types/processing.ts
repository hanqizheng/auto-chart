/**
 * 处理步骤相关类型定义
 * 基于新的常量系统，用于AI执行过程的详细步骤展示
 */

import {
  PROCESSING_STEPS,
  STEP_STATUS,
  PROCESSING_STAGES,
  STAGE_STEP_MAPPING,
} from "@/constants/processing";
import { ChartType } from "./chart";

/**
 * 从常量派生的类型
 */
export type ProcessingStepType = (typeof PROCESSING_STEPS)[keyof typeof PROCESSING_STEPS];
export type StepStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS];
export type ProcessingStage = (typeof PROCESSING_STAGES)[keyof typeof PROCESSING_STAGES];

/**
 * 处理步骤数据内容接口
 */

// 思考步骤数据
export interface ThinkingData {
  reasoning: string;
  considerations?: string[];
  conclusion?: string;
}

// 文件解析步骤数据
export interface FileParsingData {
  fileName: string;
  fileSize: number;
  fileType: string;
  rowCount: number;
  columnCount: number;
  parseTime: number;
  errors?: string[];
}

// 数据分析步骤数据
export interface DataAnalysisData {
  dataSource: "prompt" | "file" | "hybrid";
  rowCount: number;
  columnCount: number;
  dataTypes: Record<string, string>;
  sampleData?: any[];
  insights?: string[];
  statistics?: {
    numerical: number;
    categorical: number;
    missing: number;
  };
}

// 图表类型检测步骤数据
export interface ChartTypeDetectionData {
  detectedType: ChartType;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    type: ChartType;
    confidence: number;
    reason: string;
  }>;
}

// 图表生成步骤数据
export interface ChartGenerationData {
  chartType: ChartType;
  dataMapping: {
    xAxis: string;
    yAxis: string[];
  };
  config: Record<string, any>;
  generationTime: number;
  componentName: string;
}

// 图片导出步骤数据
export interface ImageExportData {
  fileName: string;
  format: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  exportTime: number;
  localPath?: string;
}

/**
 * 步骤数据联合类型
 */
export type ProcessingStepData =
  | ThinkingData
  | FileParsingData
  | DataAnalysisData
  | ChartTypeDetectionData
  | ChartGenerationData
  | ImageExportData;

/**
 * 处理步骤接口
 */
export interface ProcessingStep {
  id: string;
  type: ProcessingStepType;
  title: string;
  description: string;
  content?: string; // 添加content属性用于显示内容
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress?: number;
  data?: ProcessingStepData;
  error?: string;
  metadata?: Record<string, any>; // 添加metadata属性用于额外数据
}

/**
 * 处理流程接口
 */
export interface ProcessingFlow {
  id: string;
  steps: ProcessingStep[];
  currentStepIndex: number;
  totalSteps: number;
  startTime: Date;
  endTime?: Date;
  isCompleted: boolean;
  hasError: boolean;
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: {
  currentStep: number;
  totalSteps: number;
  stepType: ProcessingStepType;
  stepTitle: string;
  progress: number;
  details?: any;
}) => void;

/**
 * 步骤构建器接口
 */
export interface StepBuilder {
  createThinkingStep: (title: string, data: ThinkingData) => Omit<ProcessingStep, "id">;
  createFileParsingStep: (title: string, data: FileParsingData) => Omit<ProcessingStep, "id">;
  createDataAnalysisStep: (title: string, data: DataAnalysisData) => Omit<ProcessingStep, "id">;
  createChartTypeDetectionStep: (
    title: string,
    data: ChartTypeDetectionData
  ) => Omit<ProcessingStep, "id">;
  createChartGenerationStep: (
    title: string,
    data: ChartGenerationData
  ) => Omit<ProcessingStep, "id">;
  createImageExportStep: (title: string, data: ImageExportData) => Omit<ProcessingStep, "id">;
}

/**
 * 步骤更新参数
 */
export interface StepUpdateParams {
  stepId: string;
  updates: Partial<ProcessingStep>;
}

/**
 * 处理流程操作接口
 */
export interface ProcessingFlowActions {
  addStep: (step: Omit<ProcessingStep, "id">) => string;
  updateStep: (params: StepUpdateParams) => void;
  completeStep: (stepId: string) => void;
  failStep: (stepId: string, error: string) => void;
  nextStep: () => void;
  complete: () => void;
}
