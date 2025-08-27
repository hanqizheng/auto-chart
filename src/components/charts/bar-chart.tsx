"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface BarChartData {
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
}

export function BeautifulBarChart({ data, config, title, description, className }: BarChartProps) {
  if (!data?.length) return null;

  const xAxisKey = Object.keys(data[0])[0];
  const dataKeys = Object.keys(config);

  // Calculate totals and stats for display
  const totalDataPoints = data.length;
  const dataRange =
    data.length > 0 ? `${data[0][xAxisKey]} - ${data[data.length - 1][xAxisKey]}` : "";

  // Calculate max values for each series
  const maxValues = dataKeys.map(key => {
    const max = Math.max(...data.map(item => Number(item[key]) || 0));
    return { key, max };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">Bar Chart</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Data Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground">Data Points</p>
            <p className="font-semibold">{totalDataPoints}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Series</p>
            <p className="font-semibold">{dataKeys.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Range</p>
            <p className="text-xs font-semibold">{dataRange}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Peak Values</p>
            <div className="space-y-0.5">
              {maxValues.slice(0, 2).map(({ key, max }) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config[key]?.color || "var(--color-" + key + ")" }}
                  />
                  <span className="font-mono text-xs">{max.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config}>
          <BarChart
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
            {/* Removed tooltip since we're showing values directly on bars */}
            {dataKeys.map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                name={String(config[key]?.label || key)}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "11px",
                    fill: "#333",
                    fontWeight: "600",
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            ))}
          </BarChart>
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
                          className="h-3 w-3 rounded-sm"
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

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {dataKeys.map(key => {
            const total = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
            const avg = total / data.length;
            return (
              <div key={key} className="flex items-center space-x-2 text-sm">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                />
                <div className="space-y-0.5">
                  <div className="font-medium">{config[key]?.label || key}</div>
                  <div className="text-muted-foreground text-xs">
                    Avg: {avg.toFixed(1)} | Total: {total.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
