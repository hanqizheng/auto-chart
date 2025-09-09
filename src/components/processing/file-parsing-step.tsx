"use client";

import { FileText, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ProcessingStep, FileParsingData } from "@/types";

interface FileParsingStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 文件解析步骤组件
 * 显示文件解析的进度和结果
 */
export function FileParsingStepComponent({
  step,
  isActive = false,
  showDetails = true,
}: FileParsingStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = step.data as FileParsingData | undefined;

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isActive
          ? "border-green-200 bg-green-50 shadow-sm dark:border-green-800 dark:bg-green-900/20"
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
                  ? "animate-pulse bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          } `}
        >
          <FileText className="h-4 w-4" />
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
                      className="h-full bg-green-500 transition-all duration-500"
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

          {/* 文件基本信息 */}
          {data && (
            <div className="text-muted-foreground mt-2 flex items-center space-x-4 text-xs">
              <span>文件: {data.fileName}</span>
              <span>大小: {formatFileSize(data.fileSize)}</span>
              <span>类型: {data.fileType}</span>
            </div>
          )}

          {/* 时间和状态信息 */}
          <div className="text-muted-foreground mt-1 flex items-center space-x-4 text-xs">
            {step.duration && <span>耗时: {formatDuration(step.duration)}</span>}
            {data?.parseTime && <span>解析耗时: {formatDuration(data.parseTime)}</span>}
            {step.error && <span className="text-red-500">错误: {step.error}</span>}
          </div>

          {/* 详细内容 */}
          {data && showDetails && isExpanded && (
            <div className="border-border/50 mt-4 border-t pt-4">
              <div className="space-y-4">
                {/* 解析结果统计 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-foreground text-sm font-medium">数据规模</h5>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>行数:</span>
                        <span className="font-mono">{data.rowCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>列数:</span>
                        <span className="font-mono">{data.columnCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-foreground text-sm font-medium">文件信息</h5>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>格式:</span>
                        <span className="font-mono">{data.fileType.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>大小:</span>
                        <span className="font-mono">{formatFileSize(data.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 错误信息 */}
                {data.errors && data.errors.length > 0 && (
                  <div>
                    <h5 className="text-foreground mb-2 flex items-center space-x-1 text-sm font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>解析警告</span>
                    </h5>
                    <div className="space-y-1">
                      {data.errors.map((error, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 成功状态总结 */}
                {step.status === "completed" && (!data.errors || data.errors.length === 0) && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <span className="text-xs">✓</span>
                    </div>
                    <span>文件解析成功，数据已准备就绪</span>
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
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
