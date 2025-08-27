"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface LineChartData {
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
}

export function BeautifulLineChart({
  data,
  config,
  title,
  description,
  className,
}: LineChartProps) {
  if (!data?.length) return null;

  const xAxisKey = Object.keys(data[0])[0];
  const dataKeys = Object.keys(config);

  // Calculate trend analysis
  const trendAnalysis = dataKeys.map(key => {
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

  // Calculate overall average for reference line
  const overallAverage =
    dataKeys.length > 0
      ? data.reduce((sum, item) => {
          const total = dataKeys.reduce((keySum, key) => keySum + (Number(item[key]) || 0), 0);
          return sum + total / dataKeys.length;
        }, 0) / data.length
      : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">Line Chart</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Trend Analysis Summary */}
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
                <div>Min: {min.toFixed(1)}</div>
                <div>Avg: {avg.toFixed(1)}</div>
                <div>Max: {max.toFixed(1)}</div>
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

            {/* Reference line for average */}
            <ReferenceLine
              y={overallAverage}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              opacity={0.5}
            />

            {/* Removed tooltip since we're showing values directly on points */}
            {dataKeys.map(key => (
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
            {/* Add labels for line chart values - show only key data points to avoid clutter */}
            {dataKeys.length <= 2 &&
              dataKeys.map(key => (
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

        {/* Complete Data Table - All values visible for static export */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold">Complete Data Values</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-semibold">{xAxisKey}</th>
                  {dataKeys.map(key => (
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
                    {dataKeys.map(key => (
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

        {/* Data Range Information */}
        <div className="bg-muted/30 mt-4 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-semibold">Data Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Time Period</p>
              <p className="font-mono">
                {data[0][xAxisKey]} → {data[data.length - 1][xAxisKey]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Points</p>
              <p className="font-mono">{data.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Line</p>
              <p className="font-mono">{overallAverage.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Best Performer</p>
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
