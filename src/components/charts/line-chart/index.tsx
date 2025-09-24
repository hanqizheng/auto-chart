"use client";

import { GitCommitVertical, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChartProps, LineChartValidationResult, LineChartData, TrendAnalysis } from "./types";

/**
 * 计算趋势分析
 */
export function calculateTrendAnalysis(data: LineChartData, valueKeys: string[]): TrendAnalysis[] {
  return valueKeys.map(key => {
    const values = data.map(item => Number(item[key]) || 0);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    return {
      key,
      change,
      changePercent,
      trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    };
  });
}

/**
 * 验证折线图数据格式和完整性
 */
export function validateLineChartData(data: LineChartData): LineChartValidationResult {
  const errors: string[] = [];

  // 检查数据是否存在且非空
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return {
      isValid: false,
      errors,
      stats: {
        dataPointCount: 0,
        seriesCount: 0,
        xAxisKey: "",
        valueKeys: [],
      },
    };
  }

  // 折线图至少需要2个数据点
  if (data.length < 2) {
    errors.push("折线图至少需要2个数据点才能形成趋势线");
  }

  // 检查数据点结构一致性
  const firstItem = data[0];
  const keys = Object.keys(firstItem);

  if (keys.length < 2) {
    errors.push("每个数据点至少需要包含 2 个字段（1个X轴字段 + 至少1个Y轴数值字段）");
  }

  const xAxisKey = keys[0];
  const valueKeys = keys.slice(1);

  // 验证数据类型一致性
  data.forEach((item, index) => {
    const itemKeys = Object.keys(item);

    // 检查字段数量一致性
    if (itemKeys.length !== keys.length) {
      errors.push(`数据点 ${index} 的字段数量与第一个数据点不一致`);
    }

    // 检查X轴字段（可以是字符串或数字）
    const xValue = item[xAxisKey];
    if (typeof xValue !== "string" && typeof xValue !== "number") {
      errors.push(`数据点 ${index} 的X轴字段 "${xAxisKey}" 必须为字符串或数字类型`);
    }

    // 检查Y轴数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`数据点 ${index} 的数值字段 "${key}" 必须为有效数字`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      dataPointCount: data.length,
      seriesCount: valueKeys.length,
      xAxisKey,
      valueKeys,
    },
  };
}

/**
 * 美化折线图组件
 * 专为趋势分析和时间序列数据设计，显示完整的趋势分析和统计信息
 */
export function BeautifulLineChart({
  data,
  config,
  title,
  description,
  className,
  showReferenceLine = true,
  referenceValue,
  referenceLabel,
  curveType = "monotone",
  showDots = true,
  dotSize = 6,
  dotVariant = "default",
  showGrid = true,
  colors: providedColors,
  primaryColor = "#22c55e",
}: LineChartProps) {
  // 直接使用传入的颜色配置
  const finalColors = providedColors;

  // 简单的系列颜色分配逻辑
  const getSeriesColor = (key: string, fallbackIndex?: number): string => {
    const configKeys = Object.keys(config);
    const keyIndex = configKeys.indexOf(key);
    const colorIndex = keyIndex >= 0 ? keyIndex : (fallbackIndex ?? 0);
    return (
      finalColors.series[colorIndex % finalColors.series.length] ||
      finalColors.series[0] ||
      finalColors.primary
    );
  };
  // 数据验证
  const validation = validateLineChartData(data);

  if (!validation.isValid) {
    return (
      <div className={className}>
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

  const { stats } = validation;
  const { xAxisKey, valueKeys } = stats;

  const createIconDot =
    (color: string, seriesKey: string, sizeMultiplier = 1) =>
    (props: any) => {
      const { cx, cy, payload } = props;
      if (typeof cx !== "number" || typeof cy !== "number") {
        return null;
      }
      const baseSize = Math.max(dotSize * 2.2 * sizeMultiplier, 12);
      const key = payload?.[xAxisKey] ?? `${seriesKey}-${cx}-${cy}`;
      return (
        <GitCommitVertical
          key={`${seriesKey}-${key}-${sizeMultiplier}`}
          x={cx - baseSize / 2}
          y={cy - baseSize / 2}
          width={baseSize}
          height={baseSize}
          strokeWidth={2}
          stroke={color}
          fill={finalColors.background}
        />
      );
    };

  const getDotConfiguration = (seriesKey: string, seriesIndex: number, color: string) => {
    if (!showDots) {
      return { dot: false, activeDot: undefined } as const;
    }

    switch (dotVariant) {
      case "solid":
        return {
          dot: {
            r: dotSize,
            fill: color,
            stroke: finalColors.background,
            strokeWidth: 1.5,
          },
          activeDot: {
            r: dotSize + 2,
            fill: color,
            stroke: finalColors.background,
            strokeWidth: 2,
          },
        } as const;
      case "icon":
        return {
          dot: createIconDot(color, seriesKey, 1) as any, // 类型断言以解决类型冲突
          activeDot: createIconDot(color, seriesKey, 1.2) as any,
        } as const;
      default:
        return {
          dot: {
            fill: finalColors.background,
            strokeWidth: 2,
            r: dotSize,
            stroke: color,
          },
          activeDot: {
            r: dotSize + 2,
            stroke: color,
            strokeWidth: 2,
            fill: finalColors.background,
          },
        } as const;
    }
  };

  // 计算趋势分析
  const trendAnalysis = calculateTrendAnalysis(data, valueKeys);

  // 计算整体平均值作为参考线
  const overallAverage =
    referenceValue ??
    (valueKeys.length > 0
      ? data.reduce((sum, item) => {
          const total = valueKeys.reduce((keySum, key) => keySum + (Number(item[key]) || 0), 0);
          return sum + total / valueKeys.length;
        }, 0) / data.length
      : 0);

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}

      <div className="py-4">
        <ChartContainer config={config}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={finalColors.grid} opacity={0.4} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: finalColors.text }}
              angle={0}
              textAnchor="middle"
              height={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: finalColors.text }}
              tickFormatter={value => value.toLocaleString()}
            />

            {/* 参考线 */}
            {showReferenceLine && (
              <ReferenceLine
                y={overallAverage}
                stroke={finalColors.grid}
                strokeDasharray="5 5"
                opacity={0.6}
              />
            )}

            {/* 折线渲染 */}
            {valueKeys.map((key, index) => {
              const color = getSeriesColor(key, index);
              const { dot, activeDot } = getDotConfiguration(key, index, color);

              return (
                <Line
                  key={key}
                  type={curveType}
                  dataKey={key}
                  stroke={color}
                  strokeWidth={3}
                  strokeOpacity={1}
                  dot={dot}
                  activeDot={activeDot}
                  name={String(config[key]?.label || key)}
                  animationBegin={index * 200}
                  animationDuration={1500}
                  connectNulls={false}
                />
              );
            })}

            {/* 数值标签 - 仅在系列较少时显示，避免重叠 */}
            {valueKeys.length <= 2 &&
              valueKeys.map((key, index) => (
                <LabelList
                  key={`label-${key}`}
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "9px",
                    fill: getSeriesColor(key, index),
                    fontWeight: "700",
                    textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                  }}
                  formatter={(value: number) => (value > 0 ? value.toLocaleString() : "")}
                />
              ))}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// 默认导出
export default BeautifulLineChart;
