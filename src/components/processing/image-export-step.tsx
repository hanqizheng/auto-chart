"use client";

import { Download } from "lucide-react";
import { ProcessingStep, ImageExportData } from "@/types";
import { BaseStepComponent } from "./base-step-component";

interface ImageExportStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 图片导出步骤组件
 */
export function ImageExportStepComponent(props: ImageExportStepProps) {
  const data = props.step.data as ImageExportData | undefined;

  const renderDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* 文件信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">文件信息</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">文件名:</span>
                <span className="font-mono text-xs">{data.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">格式:</span>
                <span className="font-mono">{data.format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">大小:</span>
                <span className="font-mono">{formatFileSize(data.size)}</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">图片规格</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">宽度:</span>
                <span className="font-mono">{data.dimensions.width}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">高度:</span>
                <span className="font-mono">{data.dimensions.height}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">导出耗时:</span>
                <span className="font-mono">{formatDuration(data.exportTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 本地路径 */}
        {data.localPath && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">存储位置</h5>
            <div className="bg-muted/50 rounded p-2 font-mono text-xs break-all">
              {data.localPath}
            </div>
          </div>
        )}

        {/* 成功状态 */}
        {props.step.status === "completed" && (
          <div className="flex items-center space-x-2 rounded bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <Download className="h-4 w-4" />
            <span>图片已成功导出并保存到本地</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseStepComponent
      {...props}
      icon={Download}
      colorScheme="indigo"
      renderDetails={renderDetails}
    />
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
