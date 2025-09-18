"use client";

import { Activity, BarChart2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  AreaChartProps,
  AreaChartValidationResult,
  AreaChartData,
  EnhancedAreaChartDataPoint,
  AreaSeriesAnalysis,
  AREA_CHART_DEFAULTS,
} from "./types";
import { useChartTheme } from "@/contexts/chart-theme-context";

/**
 * 计算面积图系列分析
 */
export function analyzeAreaSeries(data: AreaChartData, valueKeys: string[]): AreaSeriesAnalysis[] {
  const xAxisKey = Object.keys(data[0])[0];

  return valueKeys.map(key => {
    const values = data.map(item => Number(item[key]) || 0);
    const totalAccumulated = values.reduce((sum, val) => sum + val, 0);
    const average = totalAccumulated / values.length;

    // 找到峰值和谷值
    const peakIndex = values.indexOf(Math.max(...values));
    const valleyIndex = values.indexOf(Math.min(...values));

    const peak = {
      value: values[peakIndex],
      period: data[peakIndex][xAxisKey],
    };

    const valley = {
      value: values[valleyIndex],
      period: data[valleyIndex][xAxisKey],
    };

    // 计算增长趋势
    const firstQuarter = values.slice(0, Math.ceil(values.length / 4));
    const lastQuarter = values.slice(Math.floor(values.length * 0.75));
    const firstAvg = firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length;

    let growthTrend: AreaSeriesAnalysis["growthTrend"] = "stable";
    const growthRate = (lastAvg - firstAvg) / firstAvg;

    if (Math.abs(growthRate) < 0.05) {
      growthTrend = "stable";
    } else if (growthRate > 0.2) {
      growthTrend = "increasing";
    } else if (growthRate < -0.2) {
      growthTrend = "decreasing";
    } else {
      growthTrend = "volatile";
    }

    // 计算变异系数
    const standardDeviation = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
    );
    const coefficientOfVariation = average !== 0 ? (standardDeviation / average) * 100 : 0;

    return {
      key,
      totalAccumulated,
      average,
      peak,
      valley,
      growthTrend,
      coefficientOfVariation,
    };
  });
}

/**
 * 验证面积图数据格式和完整性
 */
export function validateAreaChartData(data: AreaChartData): AreaChartValidationResult {
  const errors: string[] = [];
  const stats = {
    dataPointCount: 0,
    seriesCount: 0,
    xAxisKey: "",
    valueKeys: [] as string[],
    hasNegativeValues: false,
    totalRange: { min: 0, max: 0 },
  };

  // 检查数据是否存在且非空
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return { isValid: false, errors, stats };
  }

  // 面积图至少需要2个数据点
  if (data.length < 2) {
    errors.push("面积图至少需要2个数据点才能形成面积效果");
  }

  stats.dataPointCount = data.length;

  // 检查数据点结构一致性
  const firstItem = data[0];
  const keys = Object.keys(firstItem);

  if (keys.length < 2) {
    errors.push("每个数据点至少需要包含 2 个字段（1个X轴字段 + 至少1个Y轴数值字段）");
  }

  const xAxisKey = keys[0];
  const valueKeys = keys.slice(1);

  stats.xAxisKey = xAxisKey;
  stats.valueKeys = valueKeys;
  stats.seriesCount = valueKeys.length;

  let allValues: number[] = [];

  // 验证数据类型一致性
  data.forEach((item, index) => {
    const itemKeys = Object.keys(item);

    // 检查字段数量一致性
    if (itemKeys.length !== keys.length) {
      errors.push(`数据点 ${index} 的字段数量与第一个数据点不一致`);
    }

    // 检查X轴字段
    const xValue = item[xAxisKey];
    if (typeof xValue !== "string" && typeof xValue !== "number") {
      errors.push(`数据点 ${index} 的X轴字段 "${xAxisKey}" 必须为字符串或数字类型`);
    }

    // 检查Y轴数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`数据点 ${index} 的数值字段 "${key}" 必须为有效数字`);
      } else {
        allValues.push(value);
        if (value < 0) {
          stats.hasNegativeValues = true;
        }
      }
    });
  });

  // 计算数值范围
  if (allValues.length > 0) {
    stats.totalRange = {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    stats,
  };
}

/**
 * 美化面积图组件
 * 专为累积数据和容量分析设计，显示完整的面积分析和增长统计
 */
export function BeautifulAreaChart({
  data,
  config,
  title,
  description,
  className,
  stacked = AREA_CHART_DEFAULTS.stacked,
  showTotalLine = AREA_CHART_DEFAULTS.showTotalLine,
  showGrowthRate = AREA_CHART_DEFAULTS.showGrowthRate,
  fillOpacity = AREA_CHART_DEFAULTS.fillOpacity,
}: AreaChartProps) {
  const { getSeriesColor, palette } = useChartTheme();
  // 数据验证
  const validation = validateAreaChartData(data);

  if (!validation.isValid) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold mb-2 text-red-600">数据格式错误</h3>
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

  // 计算累积总计和增长率
  const enhancedData: EnhancedAreaChartDataPoint[] = data.map((item, index) => {
    const total = valueKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    const prevTotal =
      index > 0
        ? valueKeys.reduce((sum, key) => sum + (Number(data[index - 1][key]) || 0), 0)
        : total;
    const growth = prevTotal !== 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return {
      ...item,
      _total: total,
      _growth: growth,
    } as EnhancedAreaChartDataPoint;
  });

  // 计算面积统计分析
  const seriesAnalysis = analyzeAreaSeries(data, valueKeys);

  // 计算整体统计
  const totalMaxValue = Math.max(...enhancedData.map(item => item._total));
  const totalAverage =
    enhancedData.reduce((sum, item) => sum + item._total, 0) / enhancedData.length;
  const bestGrowthPeriod = enhancedData.reduce((best, current) =>
    current._growth > best._growth ? current : best
  );

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="py-4">
        <ChartContainer config={config}>
          <AreaChart
            data={enhancedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} opacity={0.35} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: palette.neutralStrong }}
              angle={0}
              textAnchor="middle"
              height={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: palette.neutralStrong }}
              tickFormatter={value => value.toLocaleString()}
            />

            {/* 总计参考线 */}
            {showTotalLine && (
              <ReferenceLine
                y={totalAverage}
                stroke={palette.neutral}
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}

            {/* 面积渲染 */}
            {valueKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "1" : undefined}
                stroke={getSeriesColor(key, index)}
                fill={getSeriesColor(key, index)}
                fillOpacity={fillOpacity}
                strokeWidth={AREA_CHART_DEFAULTS.strokeWidth}
                name={String(config[key]?.label || key)}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// 默认导出
export default BeautifulAreaChart;
