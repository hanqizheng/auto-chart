"use client";

import { ProcessingStep, ProcessingStepType } from "@/types";
import { PROCESSING_STEPS } from "@/constants/processing";
import { ThinkingStepComponent } from "./thinking-step";
import { FileParsingStepComponent } from "./file-parsing-step";
import { DataAnalysisStepComponent } from "./data-analysis-step";
import { ChartTypeDetectionStepComponent } from "./chart-type-detection-step";
import { ChartGenerationStepComponent } from "./chart-generation-step";
import { ImageExportStepComponent } from "./image-export-step";

/**
 * 处理步骤组件映射表
 * 通过步骤类型动态渲染对应的组件
 */
const STEP_COMPONENTS = {
  [PROCESSING_STEPS.THINKING]: ThinkingStepComponent,
  [PROCESSING_STEPS.FILE_PARSING]: FileParsingStepComponent,
  [PROCESSING_STEPS.DATA_ANALYSIS]: DataAnalysisStepComponent,
  [PROCESSING_STEPS.CHART_TYPE_DETECTION]: ChartTypeDetectionStepComponent,
  [PROCESSING_STEPS.CHART_GENERATION]: ChartGenerationStepComponent,
  [PROCESSING_STEPS.IMAGE_EXPORT]: ImageExportStepComponent,
  [PROCESSING_STEPS.COMPLETED]: () => null, // 完成状态不需要特殊组件
} as const;

interface StepRendererProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 处理步骤渲染器
 * 根据步骤类型动态渲染对应的组件
 */
export function StepRenderer({ step, isActive = false, showDetails = true }: StepRendererProps) {
  const Component = STEP_COMPONENTS[step.type as keyof typeof STEP_COMPONENTS];

  if (!Component) {
    return <DefaultStepComponent step={step} isActive={isActive} />;
  }

  return <Component step={step} isActive={isActive} showDetails={showDetails} />;
}

/**
 * 默认步骤组件
 * 用于未知或未实现的步骤类型
 */
function DefaultStepComponent({ step, isActive }: { step: ProcessingStep; isActive: boolean }) {
  return (
    <div
      className={`flex items-center space-x-3 rounded-lg border p-3 ${
        isActive
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "bg-muted/50 border-border"
      } `}
    >
      {/* 状态图标 */}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          step.status === "completed"
            ? "bg-green-500 text-white"
            : step.status === "error"
              ? "bg-red-500 text-white"
              : step.status === "running"
                ? "animate-pulse bg-blue-500 text-white"
                : "bg-gray-300 text-gray-600"
        } `}
      >
        {step.status === "completed" && "✓"}
        {step.status === "error" && "✗"}
        {step.status === "running" && "●"}
        {step.status === "pending" && "○"}
      </div>

      {/* 步骤信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="text-foreground truncate font-medium">{step.title}</h4>
          {step.status === "running" && step.progress !== undefined && (
            <div className="flex items-center space-x-1">
              <div className="bg-muted h-1 w-16 overflow-hidden rounded-full">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${step.progress}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">{Math.round(step.progress)}%</span>
            </div>
          )}
        </div>

        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}

        {/* 时间信息 */}
        {step.duration && (
          <p className="text-muted-foreground mt-1 text-xs">
            耗时: {formatDuration(step.duration)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 格式化持续时间
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
