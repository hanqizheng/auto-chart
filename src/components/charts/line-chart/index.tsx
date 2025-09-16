"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
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
    if (typeof xValue !== 'string' && typeof xValue !== 'number') {
      errors.push(`数据点 ${index} 的X轴字段 "${xAxisKey}" 必须为字符串或数字类型`);
    }
    
    // 检查Y轴数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== 'number' || isNaN(value)) {
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
}: LineChartProps) {
  // 数据验证
  const validation = validateLineChartData(data);
  
  if (!validation.isValid) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">数据格式错误</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm">• {error}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats } = validation;
  const { xAxisKey, valueKeys } = stats;

  // 计算趋势分析
  const trendAnalysis = calculateTrendAnalysis(data, valueKeys);

  // 计算整体平均值作为参考线
  const overallAverage = referenceValue ?? (
    valueKeys.length > 0
      ? data.reduce((sum, item) => {
          const total = valueKeys.reduce((keySum, key) => keySum + (Number(item[key]) || 0), 0);
          return sum + total / valueKeys.length;
        }, 0) / data.length
      : 0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">折线图</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

      </CardHeader>

      <CardContent>
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
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground))"
              opacity={0.3}
            />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={value => value.toLocaleString()}
            />

            {/* 参考线 */}
            {showReferenceLine && (
              <ReferenceLine
                y={overallAverage}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}

            {/* 折线渲染 */}
            {valueKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config[key]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                strokeWidth={3}
                strokeOpacity={1}
                dot={{
                  fill: config[key]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                  strokeWidth: 2,
                  r: 6,
                  stroke: "hsl(var(--background))",
                }}
                activeDot={{
                  r: 8,
                  stroke: config[key]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                  strokeWidth: 2,
                  fill: "hsl(var(--background))",
                }}
                name={String(config[key]?.label || key)}
                animationBegin={index * 200}
                animationDuration={1500}
                connectNulls={false}
              />
            ))}
            
            {/* 数值标签 - 仅在系列较少时显示，避免重叠 */}
            {valueKeys.length <= 2 &&
              valueKeys.map((key, index) => (
                <LabelList
                  key={`label-${key}`}
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "9px",
                    fill: config[key]?.color || `hsl(${(index * 137.5) % 360}, 70%, 45%)`,
                    fontWeight: "700",
                    textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                  }}
                  formatter={(value: number) => (value > 0 ? value.toLocaleString() : "")}
                />
              ))}
          </LineChart>
        </ChartContainer>


      </CardContent>
    </Card>
  );
}

// 默认导出
export default BeautifulLineChart;