"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
}

const COLORS = [
  "hsl(220, 70%, 50%)", // Blue
  "hsl(160, 60%, 45%)", // Green
  "hsl(30, 80%, 55%)", // Orange
  "hsl(280, 65%, 60%)", // Purple
  "hsl(340, 75%, 55%)", // Pink
  "hsl(200, 80%, 60%)", // Light Blue
  "hsl(140, 70%, 50%)", // Lime
  "hsl(45, 90%, 60%)", // Yellow
];

export function BeautifulPieChart({ data, config, title, description, className }: PieChartProps) {
  if (!data?.length) return null;

  // Validate data format
  const validData = data.filter(
    item =>
      item &&
      typeof item === "object" &&
      "name" in item &&
      "value" in item &&
      typeof item.value === "number" &&
      !isNaN(item.value)
  );

  if (validData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Valid Data</CardTitle>
          <CardDescription>
            Unable to render pie chart - no valid data points found.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Process data with colors and percentages
  const totalValue = validData.reduce((sum, item) => sum + (item.value || 0), 0);
  const processedData = validData.map((item, index) => ({
    ...item,
    value: item.value || 0,
    color: item.color || config[item.name]?.color || COLORS[index % COLORS.length],
    percentage: totalValue > 0 ? ((item.value || 0) / totalValue) * 100 : 0,
  }));

  // Sort data by value for better visualization
  const sortedData = [...processedData].sort((a, b) => b.value - a.value);

  // Custom label function for pie slices - show both percentage and value
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
  }: any) => {
    if (percent < 0.03) return null; // Don't show labels for slices < 3%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text
          x={x}
          y={y - 6}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight="bold"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <text
          x={x}
          y={y + 8}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight="600"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
        >
          {value.toLocaleString()}
        </text>
      </g>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">Pie Chart</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground">Total Value</p>
            <p className="text-lg font-bold">{totalValue.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Categories</p>
            <p className="font-semibold">{validData.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Largest Segment</p>
            <p className="font-semibold">{sortedData[0]?.name}</p>
            <p className="text-muted-foreground text-xs">{sortedData[0]?.percentage.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Distribution</p>
            <p className="text-muted-foreground text-xs">
              Top 3:{" "}
              {sortedData
                .slice(0, 3)
                .reduce((sum, item) => sum + item.percentage, 0)
                .toFixed(1)}
              %
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pie Chart */}
          <div className="lg:col-span-2">
            <ChartContainer config={config} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Tooltip removed - all data visible directly on chart */}
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Legend with detailed information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Breakdown</h4>
            <div className="max-h-[350px] space-y-3 overflow-y-auto">
              {sortedData.map((item, index) => (
                <div
                  key={item.name}
                  className="bg-muted/30 flex items-center justify-between rounded-lg p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-mono text-xs">#{index + 1}</span>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.value?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.percentage?.toFixed(1) || "0"}%</p>
                    <div className="bg-muted mt-1 h-1.5 w-12 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                          maxWidth: "100%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional insights */}
        <div className="bg-muted/30 mt-6 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-semibold">Key Insights</h4>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Dominance</p>
              <p>
                {sortedData[0]?.percentage > 50
                  ? `${sortedData[0]?.name} dominates with ${sortedData[0]?.percentage.toFixed(1)}%`
                  : `Relatively balanced distribution`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Diversity</p>
              <p>
                {validData.filter(item => (item.value / totalValue) * 100 > 10).length} major
                segments ({">"}10%)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
