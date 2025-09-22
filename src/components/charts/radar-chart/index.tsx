"use client";

import {
  LabelList,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useChartTheme } from "@/contexts/chart-theme-context";
import {
  RadarChartProps,
  RadarChartData,
  RadarChartValidationResult,
  RADAR_CHART_DEFAULTS,
} from "./types";
import { cn } from "@/lib/utils";

/**
 * 验证雷达图数据结构
 */
export function validateRadarChartData(data: RadarChartData): RadarChartValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return {
      isValid: false,
      errors,
      stats: {
        dataPointCount: 0,
        dimensionKey: "",
        valueKeys: [],
      },
    };
  }

  if (data.length < 3) {
    errors.push("雷达图至少需要3个数据点");
  }

  const firstItem = data[0];
  const keys = Object.keys(firstItem);

  if (keys.length < 2) {
    errors.push("每个数据点至少需要1个分类字段和1个数值字段");
    return {
      isValid: false,
      errors,
      stats: {
        dataPointCount: data.length,
        dimensionKey: "",
        valueKeys: [],
      },
    };
  }

  const potentialDimensionKey = keys.find(key => typeof firstItem[key] === "string") || keys[0];
  const valueKeys = keys.filter(key => key !== potentialDimensionKey);

  if (valueKeys.length === 0) {
    errors.push("雷达图需要至少一个数值字段");
  }

  data.forEach((item, index) => {
    if (typeof item[potentialDimensionKey] !== "string") {
      errors.push(`数据点 ${index + 1} 的分类字段必须为字符串`);
    }

    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push(`数据点 ${index + 1} 的数值字段 ${key} 必须为有效数字`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      dataPointCount: data.length,
      dimensionKey: potentialDimensionKey,
      valueKeys,
    },
  };
}

/**
 * 美化雷达图组件
 */
export function BeautifulRadarChart({
  data,
  config,
  title,
  description,
  className,
  showGrid = RADAR_CHART_DEFAULTS.showGrid,
  showLegend = RADAR_CHART_DEFAULTS.showLegend,
  showDots = RADAR_CHART_DEFAULTS.showDots,
  showArea = RADAR_CHART_DEFAULTS.showArea,
  fillOpacity = RADAR_CHART_DEFAULTS.fillOpacity,
  strokeWidth = RADAR_CHART_DEFAULTS.strokeWidth,
  maxValue,
}: RadarChartProps) {
  const { getSeriesColor, palette } = useChartTheme();
  const validation = validateRadarChartData(data);
  const containerClass = cn("flex h-full w-full flex-col", className);

  if (!validation.isValid) {
    return (
      <div className={containerClass}>
        <h3 className="mb-2 text-lg font-semibold text-red-600">数据格式错误</h3>
        <div className="space-y-1 text-red-600">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm">
              • {error}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const { dimensionKey, valueKeys } = validation.stats;

  const computedMax =
    typeof maxValue === "number"
      ? maxValue
      : Math.max(
          ...valueKeys.map(key => Math.max(...data.map(item => Number(item[key]) || 0))),
          0
        );

  const summaries = valueKeys.map(key => {
    const seriesValues = data.map(item => Number(item[key]) || 0);
    const max = Math.max(...seriesValues);
    const min = Math.min(...seriesValues);
    const avg =
      seriesValues.reduce((acc, value) => acc + value, 0) / (seriesValues.length || 1);

    return {
      key,
      label: String(config[key]?.label || key),
      color: getSeriesColor(key),
      max,
      min,
      avg,
    };
  });

  return (
    <div className={containerClass}>
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <ChartContainer config={config} className="flex-1">
        <RechartsRadarChart data={data} outerRadius="80%">
          {showGrid && <PolarGrid stroke={palette.grid} />}
          <PolarAngleAxis
            dataKey={dimensionKey}
            tick={{ fill: palette.neutralStrong, fontSize: 12 }}
          />
          <PolarRadiusAxis
            tick={{ fill: palette.neutral, fontSize: 11 }}
            angle={30}
            domain={[0, computedMax || "auto"]}
          />
          {valueKeys.map((key, index) => {
            const color = getSeriesColor(key, index);
            return (
              <Radar
                key={key}
                name={String(config[key]?.label || key)}
                dataKey={key}
                stroke={color}
                fill={showArea ? color : undefined}
                fillOpacity={showArea ? fillOpacity : 0}
                strokeWidth={strokeWidth}
                dot={showDots}
                activeDot={showDots ? { r: 4 } : undefined}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  formatter={(value: number) => value.toFixed(0)}
                  className="text-[10px] font-medium"
                />
              </Radar>
            );
          })}
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </RechartsRadarChart>
      </ChartContainer>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
        {summaries.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <span
              className="inline-flex h-2 w-6 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-foreground">{item.label}</span>
            <span>max {item.max.toFixed(0)}</span>
            <span>min {item.min.toFixed(0)}</span>
            <span>avg {item.avg.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BeautifulRadarChart;
