"use client";

import { Target } from "lucide-react";
import { ProcessingStep, ChartTypeDetectionData } from "@/types";
import { BaseStepComponent } from "./base-step-component";

interface ChartTypeDetectionStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 图表类型检测步骤组件
 */
export function ChartTypeDetectionStepComponent(props: ChartTypeDetectionStepProps) {
  const data = props.step.data as ChartTypeDetectionData | undefined;

  const renderDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* 检测结果 */}
        <div>
          <h5 className="text-foreground mb-2 text-sm font-medium">检测结果</h5>
          <div className="flex items-center space-x-3">
            <span className="text-lg font-medium text-orange-600 dark:text-orange-400">
              {getChartTypeLabel(data.detectedType)}
            </span>
            <span className="rounded bg-orange-100 px-2 py-1 text-sm text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              置信度: {Math.round(data.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* 推理过程 */}
        {data.reasoning && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">推理依据</h5>
            <p className="text-muted-foreground text-sm leading-relaxed">{data.reasoning}</p>
          </div>
        )}

        {/* 备选方案 */}
        {data.alternatives && data.alternatives.length > 0 && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">其他选项</h5>
            <div className="space-y-2">
              {data.alternatives.map((alt, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{getChartTypeLabel(alt.type)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-xs">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                    <span className="text-muted-foreground text-xs">{alt.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseStepComponent
      {...props}
      icon={Target}
      colorScheme="orange"
      renderDetails={renderDetails}
    />
  );
}

function getChartTypeLabel(chartType: string): string {
  const labels: Record<string, string> = {
    bar: "柱状图",
    line: "折线图",
    area: "面积图",
    pie: "饼图",
    scatter: "散点图",
    radar: "雷达图",
  };

  return labels[chartType] || chartType;
}
