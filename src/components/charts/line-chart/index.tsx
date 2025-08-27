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

        {/* 趋势分析摘要 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendAnalysis.map(({ key, trend, changePercent, min, max, avg }) => (
            <div key={key} className="bg-muted/30 space-y-2 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                  />
                  <span className="text-sm font-medium">{config[key]?.label || key}</span>
                </div>
                <div className="flex items-center gap-1">
                  {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {trend === "stable" && <Minus className="h-4 w-4 text-gray-500" />}
                  <span
                    className={`font-mono text-sm ${
                      trend === "up"
                        ? "text-green-600"
                        : trend === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {changePercent > 0 ? "+" : ""}
                    {changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
                <div>最小: {min.toFixed(1)}</div>
                <div>平均: {avg.toFixed(1)}</div>
                <div>最大: {max.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
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
            {valueKeys.map(key => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={3}
                dot={{
                  fill: `var(--color-${key})`,
                  strokeWidth: 2,
                  r: 6,
                }}
                name={String(config[key]?.label || key)}
              />
            ))}
            
            {/* 数值标签 - 仅在系列较少时显示，避免重叠 */}
            {valueKeys.length <= 2 &&
              valueKeys.map(key => (
                <LabelList
                  key={`label-${key}`}
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "9px",
                    fill: config[key]?.color || `var(--color-${key})`,
                    fontWeight: "700",
                    textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                  }}
                  formatter={(value: number) => (value > 0 ? value.toLocaleString() : "")}
                />
              ))}
          </LineChart>
        </ChartContainer>

        {/* 完整数据表格 - 为静态导出显示所有数值 */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold">完整数据表</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-semibold">{xAxisKey}</th>
                  {valueKeys.map(key => (
                    <th key={key} className="p-2 text-right font-semibold">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                        />
                        {config[key]?.label || key}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="p-2 font-mono">{item[xAxisKey]}</td>
                    {valueKeys.map(key => (
                      <td key={key} className="p-2 text-right font-mono">
                        {Number(item[key]).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 数据概览信息 */}
        <div className="bg-muted/30 mt-4 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-semibold">数据概览</h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">时间范围</p>
              <p className="font-mono text-xs">
                {data[0][xAxisKey]} → {data[data.length - 1][xAxisKey]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">数据点</p>
              <p className="font-mono">{data.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{referenceLabel || "参考线"}</p>
              <p className="font-mono">{overallAverage.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">最佳表现</p>
              <p className="font-mono text-xs">
                {
                  trendAnalysis.reduce((best, current) =>
                    current.changePercent > best.changePercent ? current : best
                  ).key
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 默认导出
export default BeautifulLineChart;