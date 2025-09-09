"use client";

import { PieChart } from "lucide-react";
import { ProcessingStep, ChartGenerationData } from "@/types";
import { BaseStepComponent } from "./base-step-component";

interface ChartGenerationStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 图表生成步骤组件
 */
export function ChartGenerationStepComponent(props: ChartGenerationStepProps) {
  const data = props.step.data as ChartGenerationData | undefined;

  const renderDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* 图表配置 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">图表信息</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">类型:</span>
                <span className="font-medium">{getChartTypeLabel(data.chartType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">组件:</span>
                <span className="font-mono text-xs">{data.componentName}</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">性能</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">生成耗时:</span>
                <span className="font-mono">{formatDuration(data.generationTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 数据映射 */}
        <div>
          <h5 className="text-foreground mb-2 text-sm font-medium">数据映射</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">X轴:</span>
              <span className="font-mono">{data.dataMapping.xAxis}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Y轴:</span>
              <span className="font-mono">{data.dataMapping.yAxis.join(", ")}</span>
            </div>
          </div>
        </div>

        {/* 配置信息 */}
        {Object.keys(data.config).length > 0 && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">配置选项</h5>
            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
              {JSON.stringify(data.config, null, 2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseStepComponent
      {...props}
      icon={PieChart}
      colorScheme="pink"
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
