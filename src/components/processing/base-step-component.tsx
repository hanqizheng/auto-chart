"use client";

import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { useState, ReactNode } from "react";
import { ProcessingStep } from "@/types";

interface BaseStepComponentProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
  icon: LucideIcon;
  colorScheme: "blue" | "green" | "purple" | "orange" | "pink" | "indigo";
  renderDetails?: () => ReactNode;
}

/**
 * 基础步骤组件
 * 提供统一的步骤展示模板
 */
export function BaseStepComponent({
  step,
  isActive = false,
  showDetails = true,
  icon: Icon,
  colorScheme,
  renderDetails,
}: BaseStepComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 颜色配置
  const colorConfigs = {
    blue: {
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      progress: "bg-blue-500",
    },
    green: {
      bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      icon: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      progress: "bg-green-500",
    },
    purple: {
      bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
      icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      progress: "bg-purple-500",
    },
    orange: {
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
      icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      progress: "bg-orange-500",
    },
    pink: {
      bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800",
      icon: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
      progress: "bg-pink-500",
    },
    indigo: {
      bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800",
      icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      progress: "bg-indigo-500",
    },
  };

  const colors = colorConfigs[colorScheme];

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isActive ? `${colors.bg} shadow-sm` : "bg-background border-border hover:border-border/80"
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
                ? "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
                : step.status === "running"
                  ? `${colors.icon} animate-pulse`
                  : "bg-muted text-muted-foreground"
          } `}
        >
          <Icon className="h-4 w-4" />
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
                      className={`h-full ${colors.progress} transition-all duration-500`}
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
            {renderDetails && showDetails && (
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
          {renderDetails && showDetails && isExpanded && (
            <div className="border-border/50 mt-4 border-t pt-4">{renderDetails()}</div>
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
