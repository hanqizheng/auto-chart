"use client";

import { useRef } from "react";
import { Download, Share } from "lucide-react";
import { ChartConfig } from "@/components/ui/chart";
import { ChartType } from "@/types/chart";
import { useBetterScreenshot } from "@/hooks/use-better-screenshot";
import { BeautifulAreaChart } from "./area-chart";
import { BeautifulBarChart } from "./bar-chart";
import { BeautifulLineChart } from "./line-chart";
import { BeautifulPieChart } from "./pie-chart";

interface ChartData {
  [key: string]: string | number;
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface EnhancedChartProps {
  type: ChartType;
  data: ChartData[] | PieChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
  stacked?: boolean;
}

export function EnhancedChart({
  type,
  data,
  config,
  title,
  description,
  className,
  stacked,
}: EnhancedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { isCapturing, error, exportChart } = useBetterScreenshot();

  const handleExport = async () => {
    if (!chartRef.current) return;

    try {
      const filename = `${title?.replace(/[^a-z0-9]/gi, "_") || "chart"}.png`;
      await exportChart(chartRef.current, filename);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleShare = async () => {
    if (!chartRef.current) return;

    try {
      // For modern browsers with Web Share API
      if (navigator.share && typeof navigator.canShare === "function") {
        await navigator.share({
          title: title || "Chart",
          text: description || "Generated chart from Auto Chart",
          url: window.location.href,
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BeautifulBarChart
            data={data as ChartData[]}
            config={config}
            title={title}
            description={description}
            className={className}
          />
        );
      case "line":
        return (
          <BeautifulLineChart
            data={data as ChartData[]}
            config={config}
            title={title}
            description={description}
            className={className}
          />
        );
      case "pie":
        // Transform data to pie chart format if needed
        const pieData: PieChartData[] = Array.isArray(data)
          ? data.map((item: any) => {
              if (item.name && typeof item.value === "number") {
                // Already in correct format
                return item as PieChartData;
              } else {
                // Transform from other format
                const keys = Object.keys(item);
                const nameKey = keys[0];
                const valueKey = keys[1];
                return {
                  name: String(item[nameKey] || "Unknown"),
                  value: Number(item[valueKey]) || 0,
                  color: item.color,
                };
              }
            })
          : [];

        return (
          <BeautifulPieChart
            data={pieData}
            config={config}
            title={title}
            description={description}
            className={className}
          />
        );
      case "area":
        return (
          <BeautifulAreaChart
            data={data as ChartData[]}
            config={config}
            title={title}
            description={description}
            className={className}
            stacked={stacked}
          />
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Export Controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          title="Share chart"
        >
          <Share className="h-4 w-4" />
          Share
        </button>

        <button
          onClick={handleExport}
          disabled={isCapturing}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-600/50"
          title="Export chart as PNG image"
        >
          {isCapturing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isCapturing ? "Exporting..." : "Export PNG"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">❌ Export Error</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Chart Container */}
      <div ref={chartRef} data-chart-container className="no-capture-controls">
        {renderChart()}
      </div>

      {/* Instructions for better capture */}
      {process.env.NODE_ENV === "development" && (
        <div className="no-capture mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Development Mode:</strong> For best quality screenshots, you can also use
            your system's native screenshot tool (Cmd+Shift+4 on Mac, Win+Shift+S on Windows) to
            capture the chart area directly.
          </p>
        </div>
      )}
    </div>
  );
}
