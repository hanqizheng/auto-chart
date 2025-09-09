"use client";

import { ProcessingStep as ProcessingStepType } from "@/types";
import { STEP_TYPE_CONFIG, STEP_STATUS_CONFIG } from "@/constants/processing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Clock, CheckCircle, XCircle, Loader2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProcessingStepProps {
  step: ProcessingStepType;
  index?: number;
  isLast?: boolean;
  className?: string;
  showDetails?: boolean;
}

export function ProcessingStep({
  step,
  index,
  isLast = false,
  className,
  showDetails = true,
}: ProcessingStepProps) {
  const { type, title, content, status, startTime, endTime, metadata } = step;

  const typeConfig = STEP_TYPE_CONFIG[type];
  const statusConfig = STEP_STATUS_CONFIG[status];

  // 计算耗时
  const duration = startTime && endTime ? endTime.getTime() - startTime.getTime() : undefined;

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "error":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className={cn("flex items-start space-x-3", className)}>
      {/* 步骤连接线 */}
      <div className="flex flex-col items-center">
        {/* 步骤图标 */}
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          <span className="text-xs">{typeConfig.icon}</span>
        </div>

        {/* 连接线 */}
        {!isLast && (
          <div
            className={cn(
              "mt-1 h-4 w-0.5 transition-colors",
              status === "completed"
                ? "bg-green-200 dark:bg-green-800"
                : status === "running"
                  ? "bg-blue-200 dark:bg-blue-800"
                  : status === "error"
                    ? "bg-red-200 dark:bg-red-800"
                    : "bg-gray-200 dark:bg-gray-700"
            )}
          />
        )}
      </div>

      {/* 步骤内容 */}
      <div className="min-w-0 flex-1">
        {/* 步骤头部 */}
        <div className="mb-1 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* 标题和状态 */}
            <div className="mb-1 flex items-center space-x-2">
              {/* 序号 */}
              {typeof index === "number" && (
                <span className="text-muted-foreground font-mono text-xs">
                  {(index + 1).toString().padStart(2, "0")}.
                </span>
              )}

              <h4 className="text-foreground truncate text-sm font-medium">{title}</h4>

              {/* 状态图标 */}
              <div className={statusConfig.color}>{getStatusIcon()}</div>
            </div>

            {/* 步骤内容 */}
            {content && showDetails && (
              <div className="text-muted-foreground mb-2 text-xs leading-relaxed">{content}</div>
            )}
          </div>
        </div>

        {/* 元数据信息 */}
        {showDetails && (metadata || duration !== undefined) && (
          <div className="text-muted-foreground flex items-center space-x-3 text-xs">
            {/* 耗时 */}
            {duration !== undefined && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}

            {/* 进度 */}
            {metadata?.progress !== undefined && (
              <div className="flex items-center space-x-1">
                <ChevronRight className="h-3 w-3" />
                <span>{metadata.progress}%</span>
              </div>
            )}

            {/* 数据量 */}
            {metadata?.dataCount !== undefined && (
              <div className="flex items-center space-x-1">
                <span>数据: {metadata.dataCount}条</span>
              </div>
            )}

            {/* 开始时间 */}
            {startTime && (
              <div className="flex items-center space-x-1">
                <span>{format(startTime, "HH:mm:ss", { locale: zhCN })}</span>
              </div>
            )}
          </div>
        )}

        {/* 特殊步骤类型的内容渲染 */}
        {showDetails && renderStepTypeContent(step)}
      </div>
    </div>
  );
}

/**
 * 格式化耗时
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

/**
 * 渲染不同步骤类型的特殊内容
 */
function renderStepTypeContent(step: ProcessingStepType) {
  const { type, metadata } = step;

  switch (type) {
    case "thinking":
      if (metadata?.considerations) {
        return (
          <div className="mt-2 border-l-2 border-blue-200 pl-2 dark:border-blue-800">
            <div className="text-muted-foreground space-y-1 text-xs">
              {metadata.considerations.map((consideration: string, i: number) => (
                <div key={i} className="flex items-start space-x-1">
                  <span className="mt-0.5 text-blue-400">•</span>
                  <span>{consideration}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      break;

    case "data_analysis":
      if (metadata?.dataStructure) {
        return (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-purple-50 p-2 dark:bg-purple-900/20">
              <div className="font-medium text-purple-600 dark:text-purple-400">
                数据行: {metadata.rowCount || 0}
              </div>
            </div>
            <div className="rounded bg-purple-50 p-2 dark:bg-purple-900/20">
              <div className="font-medium text-purple-600 dark:text-purple-400">
                字段: {metadata.columnCount || 0}
              </div>
            </div>
          </div>
        );
      }
      break;

    default:
      break;
  }

  return null;
}
