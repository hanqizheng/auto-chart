"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { SimpleChartType } from "@/types/chart";
import { useSimpleExport } from "@/hooks/use-simple-export";

interface ChartData {
  [key: string]: string | number;
}

interface SimpleChartProps {
  type: SimpleChartType;
  data: ChartData[];
  title?: string;
  config: ChartConfig;
  showExportButton?: boolean; // 可选的导出按钮
}

export function SimpleChart({
  type,
  data,
  title,
  config,
  showExportButton = true,
}: SimpleChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { isExporting, error, exportChart } = useSimpleExport();

  const handleChartExport = async () => {
    if (!chartRef.current) return;

    try {
      const filename = `${title?.replace(/[^a-z0-9]/gi, "_") || "chart"}.png`;
      await exportChart(chartRef.current, filename);
    } catch (error) {
      console.error("Chart export failed:", error);
    }
  };

  const renderChart = () => {
    const xAxisKey = Object.keys(data[0] || {})[0]; // First key as x-axis
    const dataKeys = Object.keys(config);

    if (type === "line") {
      return (
        <ChartContainer config={config}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={{ stroke: "#666" }}
              axisLine={{ stroke: "#666" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={{ stroke: "#666" }}
              axisLine={{ stroke: "#666" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }}
            />
            {dataKeys.map(key => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={config[key].color}
                strokeWidth={3}
                dot={{ fill: config[key].color, strokeWidth: 2, r: 4 }}
                name={String(config[key].label || key)}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "12px",
                    fill: "#333",
                    fontWeight: "600",
                  }}
                />
              </Line>
            ))}
          </LineChart>
        </ChartContainer>
      );
    }

    if (type === "bar") {
      return (
        <ChartContainer config={config}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={{ stroke: "#666" }}
              axisLine={{ stroke: "#666" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#666" }}
              tickLine={{ stroke: "#666" }}
              axisLine={{ stroke: "#666" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="rect"
              wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }}
            />
            {dataKeys.map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={config[key].color}
                radius={[4, 4, 0, 0]}
                name={String(config[key].label || key)}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "12px",
                    fill: "#333",
                    fontWeight: "600",
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      );
    }

    return <div>Unsupported chart type</div>;
  };

  return (
    <div className="w-full">
      {/* Export button - 可选显示 */}
      {showExportButton && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <button
            onClick={handleChartExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-600/50"
            title="Export chart as PNG image"
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export PNG"}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">❌ Export Error</p>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Please try again or refresh the page if the problem persists.
          </p>
        </div>
      )}

      {/* Chart */}
      <div ref={chartRef} data-chart-container>
        <Card>
          <CardHeader>
            {title && <CardTitle className="mb-2 text-center text-xl font-bold">{title}</CardTitle>}
            {/* Data Summary */}
            <div className="mb-4 text-center text-sm text-gray-600">
              <div className="flex flex-col justify-center gap-1">
                <div>Data Points: {data.length}</div>
                <div>Series: {Object.keys(config).length}</div>
                {data.length > 0 && (
                  <div>
                    Range: {data[0][Object.keys(data[0])[0]]} -{" "}
                    {data[data.length - 1][Object.keys(data[data.length - 1])[0]]}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">{renderChart()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
