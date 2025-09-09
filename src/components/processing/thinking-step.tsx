"use client";

import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ProcessingStep, ThinkingData } from "@/types";
import { STEP_TYPE_CONFIG } from "@/constants/processing";

interface ThinkingStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 思考步骤组件
 * 显示 AI 的思考过程和推理
 */
export function ThinkingStepComponent({
  step,
  isActive = false,
  showDetails = true,
}: ThinkingStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STEP_TYPE_CONFIG.thinking;
  const data = step.data as ThinkingData | undefined;

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isActive
          ? "border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-900/20"
          : "bg-background border-border hover:border-border/80"
      } `}
    >
      {/* 主要内容 */}
      <div className="flex items-start space-x-3 p-4">
        {/* 状态图标 */}
        <div
          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            step.status === "completed"
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : step.status === "error"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : step.status === "running"
                  ? "animate-pulse bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          } `}
        >
          <Brain className="h-4 w-4" />
        </div>

        {/* 步骤内容 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="text-foreground font-medium">{step.title}</h4>
              {step.status === "running" && step.progress !== undefined && (
                <div className="flex items-center space-x-2">
                  <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {Math.round(step.progress)}%
                  </span>
                </div>
              )}
            </div>

            {/* 展开/收起按钮 */}
            {data && showDetails && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-muted/50 rounded p-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* 基本描述 */}
          {step.description && (
            <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
          )}

          {/* 时间和状态信息 */}
          <div className="text-muted-foreground mt-2 flex items-center space-x-4 text-xs">
            {step.duration && <span>耗时: {formatDuration(step.duration)}</span>}
            {step.startTime && <span>开始: {step.startTime.toLocaleTimeString()}</span>}
            {step.error && <span className="text-red-500">错误: {step.error}</span>}
          </div>

          {/* 详细内容 */}
          {data && showDetails && isExpanded && (
            <div className="border-border/50 mt-4 border-t pt-4">
              <div className="space-y-3">
                {/* 推理过程 */}
                {data.reasoning && (
                  <div>
                    <h5 className="text-foreground mb-2 text-sm font-medium">推理过程</h5>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {data.reasoning}
                    </p>
                  </div>
                )}

                {/* 考虑因素 */}
                {data.considerations && data.considerations.length > 0 && (
                  <div>
                    <h5 className="text-foreground mb-2 text-sm font-medium">考虑因素</h5>
                    <ul className="space-y-1">
                      {data.considerations.map((consideration, index) => (
                        <li
                          key={index}
                          className="text-muted-foreground flex items-start space-x-2 text-sm"
                        >
                          <span className="bg-muted-foreground mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 结论 */}
                {data.conclusion && (
                  <div>
                    <h5 className="text-foreground mb-2 text-sm font-medium">结论</h5>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {data.conclusion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
