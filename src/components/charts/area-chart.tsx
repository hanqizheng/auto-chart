"use client";

import { Activity, BarChart2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface AreaChartData {
  [key: string]: string | number;
}

interface EnhancedAreaChartData extends AreaChartData {
  _total: number;
  _growth: number;
}

interface AreaChartProps {
  data: AreaChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
  stacked?: boolean;
}

export function BeautifulAreaChart({
  data,
  config,
  title,
  description,
  className,
  stacked = false,
}: AreaChartProps) {
  if (!data?.length) return null;

  const xAxisKey = Object.keys(data[0])[0];
  const dataKeys = Object.keys(config);

  // Calculate cumulative totals and growth rates
  const cumulativeData: EnhancedAreaChartData[] = data.map((item, index) => {
    const total = dataKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    const prevTotal =
      index > 0
        ? dataKeys.reduce((sum, key) => sum + (Number(data[index - 1][key]) || 0), 0)
        : total;
    const growth = prevTotal !== 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return {
      ...item,
      _total: total,
      _growth: growth,
    };
  });

  // Calculate area statistics
  const areaStats = dataKeys.map(key => {
    const values = data.map(item => Number(item[key]) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);

    return {
      key,
      total,
      avg,
      peak,
      peakPeriod: data[peakIndex]?.[xAxisKey] || "Unknown",
      contribution: (total / cumulativeData.reduce((sum, item) => sum + item._total, 0)) * 100,
    };
  });

  // Find overall peak period
  const overallPeak = Math.max(...cumulativeData.map(item => item._total));
  const peakItem = cumulativeData.find(item => item._total === overallPeak);
  const peakPeriod = peakItem ? String(peakItem[xAxisKey]) : "Unknown";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground flex items-center gap-1 text-sm font-normal">
            <Activity className="h-4 w-4" />
            Area Chart {stacked ? "(Stacked)" : ""}
          </div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Performance Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">Peak Performance</span>
            </div>
            <p className="font-mono text-lg">{overallPeak.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Period: {peakPeriod}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Average Total</span>
            </div>
            <p className="font-mono text-lg">
              {(cumulativeData.reduce((sum, item) => sum + item._total, 0) / data.length).toFixed(
                0
              )}
            </p>
            <p className="text-muted-foreground text-xs">Per Period</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold">Growth Trend</span>
            </div>
            <p className="font-mono text-lg">
              {(
                ((cumulativeData[cumulativeData.length - 1]._total - cumulativeData[0]._total) /
                  cumulativeData[0]._total) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-muted-foreground text-xs">Overall Change</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config}>
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            <defs>
              {dataKeys.map(key => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={config[key]?.color || `var(--color-${key})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={config[key]?.color || `var(--color-${key})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
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
              y={cumulativeData.reduce((sum, item) => sum + item._total, 0) / data.length}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              opacity={0.5}
            />

            {/* Removed tooltip since we're showing values directly on chart */}
            {dataKeys.map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "1" : key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                fill={`url(#gradient-${key})`}
                name={String(config[key]?.label || key)}
              />
            ))}
          </AreaChart>
        </ChartContainer>

        {/* Series Contribution Analysis */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold">Series Analysis</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {areaStats.map(({ key, total, peak, peakPeriod, contribution }) => (
              <div key={key} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                  />
                  <span className="font-medium">{config[key]?.label || key}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Area</p>
                    <p className="font-mono">{total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contribution</p>
                    <p className="font-mono">{contribution.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Value</p>
                    <p className="font-mono">{peak.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Period</p>
                    <p className="font-mono text-xs">{peakPeriod}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Values Table - All values visible for static export */}
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
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                        />
                        {config[key]?.label || key}
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const total = dataKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="p-2 font-mono">{item[xAxisKey]}</td>
                      {dataKeys.map(key => (
                        <td key={key} className="p-2 text-right font-mono">
                          {Number(item[key]).toLocaleString()}
                        </td>
                      ))}
                      <td className="p-2 text-right font-mono font-semibold">
                        {total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="bg-muted/30 mt-4 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-semibold">Timeline Insights</h4>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Time Span</p>
              <p className="font-mono">
                {data[0][xAxisKey]} → {data[data.length - 1][xAxisKey]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Points</p>
              <p className="font-mono">{data.length} periods</p>
            </div>
            <div>
              <p className="text-muted-foreground">Best Quarter</p>
              <p className="font-mono text-xs">{peakPeriod}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
