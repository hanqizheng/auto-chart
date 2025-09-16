"use client";

import { useState } from "react";
import { ProcessingMessage as ProcessingMessageType, ProcessingFlow } from "@/types";
import { STEP_TYPE_CONFIG, STEP_STATUS_CONFIG } from "@/constants/processing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProcessingStep } from "./processing-step";

interface ProcessingMessageProps {
  message: ProcessingMessageType;
  className?: string;
  showTimestamp?: boolean;
  onToggleExpanded?: () => void;
}

export function ProcessingMessage({
  message,
  className,
  showTimestamp = true,
  onToggleExpanded,
}: ProcessingMessageProps) {
  const { content, timestamp } = message;
  const { title, isExpanded, flow } = content;
  const { steps, isCompleted, totalSteps, currentStepIndex: currentStep } = flow;

  const completedSteps = steps.filter(step => step.status === "completed").length;
  const hasErrors = steps.some(step => step.status === "error");
  const progress = totalSteps ? (completedSteps / totalSteps) * 100 : 0;

  const getStatusIcon = () => {
    if (hasErrors) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  };

  const getStatusText = () => {
    if (hasErrors) return "处理出错";
    if (isCompleted) return "处理完成";
    return "处理中";
  };

  const getStatusColor = () => {
    if (hasErrors) return "text-red-600 dark:text-red-400";
    if (isCompleted) return "text-green-600 dark:text-green-400";
    return "text-blue-600 dark:text-blue-400";
  };

  return (
    <div className={cn("mb-6 w-full", className)}>
      {/* 时间戳 */}
      {showTimestamp && (
        <div className="text-muted-foreground mb-2 px-2 text-xs">
          {format(timestamp, "HH:mm:ss", { locale: zhCN })}
        </div>
      )}

      {/* 处理消息容器 - 撑满宽度 */}
      <div className="bg-muted/30 border-border w-full overflow-hidden rounded-lg border">
        {/* 头部 - 可点击展开收起 */}
        <div
          className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
          onClick={onToggleExpanded}
        >
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            {/* 状态图标 */}
            {getStatusIcon()}

            {/* 标题和状态 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-foreground truncate font-medium">{title}</h3>
              </div>

              {/* 完成时的统计信息 */}
              {isCompleted && (
                <div className="text-muted-foreground mt-1 text-xs">
                  已完成 {completedSteps} 个步骤
                  {steps.length > 0 && (
                    <span className="ml-2">耗时 {calculateTotalDuration(steps)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 展开/收起按钮 */}
          <div className="flex items-center space-x-2">
            {/* 步骤数量 */}
            {steps.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {steps.length}
              </Badge>
            )}

            {/* 展开/收起图标 */}
            {isExpanded ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </div>

        {/* 步骤列表 - 可展开收起 */}
        {isExpanded && steps.length > 0 && (
          <div className="border-border bg-background/50 border-t">
            <div className="space-y-3 p-4">
              {steps.map((step, index) => (
                <ProcessingStep
                  key={step.id}
                  step={step}
                  index={index}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {isExpanded && steps.length === 0 && (
          <div className="border-border bg-background/50 border-t p-4">
            <div className="text-muted-foreground text-center text-sm">
              <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
              正在初始化处理步骤...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 计算总耗时
 */
function calculateTotalDuration(steps: ProcessingFlow["steps"]): string {
  const totalMs = steps.reduce((total, step) => {
    if (step.startTime && step.endTime) {
      return total + (step.endTime.getTime() - step.startTime.getTime());
    }
    return total;
  }, 0);

  if (totalMs < 1000) {
    return `${totalMs}ms`;
  } else {
    return `${(totalMs / 1000).toFixed(1)}s`;
  }
}
