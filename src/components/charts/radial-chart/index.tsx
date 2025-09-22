"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart as RechartsRadialBarChart,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useChartTheme } from "@/contexts/chart-theme-context";
import {
  RadialChartProps,
  RadialChartData,
  RadialChartValidationResult,
  RADIAL_CHART_DEFAULTS,
} from "./types";
import { cn } from "@/lib/utils";

/**
 * 验证径向图数据
 */
export function validateRadialChartData(data: RadialChartData): RadialChartValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return {
      isValid: false,
      errors,
      stats: {
        dataPointCount: 0,
        totalValue: 0,
        hasZeroOrNegative: false,
      },
    };
  }

  const stats = {
    dataPointCount: data.length,
    totalValue: 0,
    hasZeroOrNegative: false,
  };

  data.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`数据点 ${index + 1} 必须为有效对象`);
      return;
    }

    if (typeof item.name !== "string" || item.name.trim() === "") {
      errors.push(`数据点 ${index + 1} 必须包含非空的 name 字段`);
    }

    if (typeof item.value !== "number" || Number.isNaN(item.value)) {
      errors.push(`数据点 ${index + 1} 的 value 字段必须为有效数字`);
    } else {
      stats.totalValue += item.value;
      if (item.value <= 0) {
        stats.hasZeroOrNegative = true;
      }
    }
  });

  if (stats.totalValue <= 0) {
    errors.push("所有数值的总和必须大于0");
  }

  return {
    isValid: errors.length === 0,
    errors,
    stats,
  };
}

/**
 * 美化径向图组件
 */
export function BeautifulRadialChart({
  data,
  config,
  title,
  description,
  className,
  innerRadius = RADIAL_CHART_DEFAULTS.innerRadius,
  outerRadius = RADIAL_CHART_DEFAULTS.outerRadius,
  barSize = RADIAL_CHART_DEFAULTS.barSize,
  cornerRadius = RADIAL_CHART_DEFAULTS.cornerRadius,
  startAngle = RADIAL_CHART_DEFAULTS.startAngle,
  endAngle = RADIAL_CHART_DEFAULTS.endAngle,
  showLegend = RADIAL_CHART_DEFAULTS.showLegend,
  showBackground = RADIAL_CHART_DEFAULTS.showBackground,
  showLabels = RADIAL_CHART_DEFAULTS.showLabels,
}: RadialChartProps) {
  const { palette } = useChartTheme();
  const validation = validateRadialChartData(data);
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

  const coloredData = data.map((item, index) => ({
    ...item,
    fill: palette.series[index % palette.series.length] || palette.primary,
  }));

  const maxValue = Math.max(...coloredData.map(item => Number(item.value) || 0), 0);
  const angleDomain: [number, number | "auto"] = [0, maxValue > 0 ? maxValue : "auto"];

  const summaries = coloredData.map(item => ({
    name: item.name,
    value: item.value,
    color: item.fill,
  }));

  return (
    <div className={containerClass}>
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <ChartContainer config={config} className="flex-1">
        <RechartsRadialBarChart
          data={coloredData}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          barSize={barSize}
          startAngle={startAngle}
          endAngle={endAngle}
        >
          <PolarAngleAxis
            type="number"
            domain={angleDomain}
            tick={false}
            axisLine={false}
          />
          <PolarRadiusAxis
            dataKey="name"
            type="category"
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            background={showBackground ? { fill: palette.background } : undefined}
            cornerRadius={cornerRadius}
            label={
              showLabels
                ? {
                    position: "insideStart",
                    fill: "#fff",
                    formatter: (value: number) => value.toLocaleString(),
                    style: { fontSize: 11, fontWeight: 500 },
                  }
                : undefined
            }
          />
          {showLegend && (
            <Legend
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
        </RechartsRadialBarChart>
      </ChartContainer>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
        {summaries.map(item => (
          <div key={item.name} className="flex items-center gap-3">
            <span
              className="inline-flex h-2 w-6 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-foreground">{item.name}</span>
            <span>{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BeautifulRadialChart;
