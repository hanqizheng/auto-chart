"use client";

import { BarChart3 } from "lucide-react";
import { ProcessingStep, DataAnalysisData } from "@/types";
import { BaseStepComponent } from "./base-step-component";

interface DataAnalysisStepProps {
  step: ProcessingStep;
  isActive?: boolean;
  showDetails?: boolean;
}

/**
 * 数据分析步骤组件
 */
export function DataAnalysisStepComponent(props: DataAnalysisStepProps) {
  const data = props.step.data as DataAnalysisData | undefined;

  const renderDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* 数据源信息 */}
        <div>
          <h5 className="text-foreground mb-2 text-sm font-medium">数据源</h5>
          <p className="text-muted-foreground text-sm">
            {data.dataSource === "file"
              ? "文件数据"
              : data.dataSource === "prompt"
                ? "用户描述"
                : "混合数据"}
          </p>
        </div>

        {/* 数据规模 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground text-sm">数据行数:</span>
            <span className="ml-2 font-mono text-sm">{data.rowCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">数据列数:</span>
            <span className="ml-2 font-mono text-sm">{data.columnCount}</span>
          </div>
        </div>

        {/* 数据类型 */}
        {Object.keys(data.dataTypes).length > 0 && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">字段类型</h5>
            <div className="space-y-1">
              {Object.entries(data.dataTypes).map(([field, type]) => (
                <div key={field} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{field}:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据洞察 */}
        {data.insights && data.insights.length > 0 && (
          <div>
            <h5 className="text-foreground mb-2 text-sm font-medium">数据洞察</h5>
            <ul className="space-y-1">
              {data.insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-muted-foreground flex items-start space-x-2 text-sm"
                >
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-purple-500" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseStepComponent
      {...props}
      icon={BarChart3}
      colorScheme="purple"
      renderDetails={renderDetails}
    />
  );
}
