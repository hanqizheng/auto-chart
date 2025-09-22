"use client";

import { useCallback, useMemo, useState } from "react";
import { RefreshCcw, FlaskConical } from "lucide-react";
import { ChartDisplayArea } from "@/components/layout/chart-display-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createChartTheme } from "@/lib/colors";
import { mockTestData } from "@/lib/mock-chart-data";
import { CHART_TYPE_LABELS } from "@/constants/chart";
import type { ChartResultContent, ChartType, LocalImageInfo } from "@/types";

const chartTypes: ChartType[] = ["bar", "line", "area", "pie", "radial", "radar"];

const radarData = [
  { dimension: "Execution", "Team Alpha": 82, "Team Bravo": 75, "Team Charlie": 88 },
  { dimension: "Innovation", "Team Alpha": 90, "Team Bravo": 78, "Team Charlie": 84 },
  { dimension: "Quality", "Team Alpha": 88, "Team Bravo": 83, "Team Charlie": 91 },
  { dimension: "Speed", "Team Alpha": 76, "Team Bravo": 89, "Team Charlie": 80 },
  { dimension: "Collaboration", "Team Alpha": 92, "Team Bravo": 86, "Team Charlie": 88 },
];

const radarConfig = {
  "Team Alpha": { label: "Team Alpha", color: "#2563eb" },
  "Team Bravo": { label: "Team Bravo", color: "#f97316" },
  "Team Charlie": { label: "Team Charlie", color: "#16a34a" },
};

const radialData = [
  { name: "Email", value: 24 },
  { name: "Paid Ads", value: 32 },
  { name: "Organic Search", value: 18 },
  { name: "Events", value: 14 },
  { name: "Referrals", value: 12 },
];

const radialConfig = {
  Email: { label: "Email", color: "#0ea5e9" },
  "Paid Ads": { label: "Paid Ads", color: "#f97316" },
  "Organic Search": { label: "Organic Search", color: "#22c55e" },
  Events: { label: "Events", color: "#a855f7" },
  Referrals: { label: "Referrals", color: "#f43f5e" },
};

const cloneChartConfig = (config: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, typeof value === "object" && value !== null ? { ...value } : value])
  );

const createPlaceholderImageInfo = (filename: string): LocalImageInfo => ({
  filename,
  localBlobUrl: `mock://chart-preview/${filename}`,
  size: 0,
  format: "png",
  dimensions: { width: 1280, height: 720 },
  createdAt: new Date(),
  storageType: "demo_static",
});

const sampleChartFactory: Record<ChartType, () => ChartResultContent> = {
  bar: () => {
    const data = mockTestData.enhanced.bar.data.map(item => ({ ...item }));
    const config = cloneChartConfig(mockTestData.enhanced.bar.config);
    return {
      chartType: "bar",
      title: "Monthly Sales Performance",
      description: "Sales, profit, and cost comparison for the last six months.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#2563eb", Object.keys(config).length, "bar-demo"),
      imageInfo: createPlaceholderImageInfo("bar-demo.png"),
    };
  },
  line: () => {
    const data = mockTestData.enhanced.line.data.map(item => ({ ...item }));
    const config = cloneChartConfig(mockTestData.enhanced.line.config);
    return {
      chartType: "line",
      title: "Weekly Traffic Trend",
      description: "Visits, conversion rate, and clicks across the last seven days.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#8b5cf6", Object.keys(config).length, "line-demo"),
      imageInfo: createPlaceholderImageInfo("line-demo.png"),
    };
  },
  area: () => {
    const data = mockTestData.enhanced.area.data.map(item => ({ ...item }));
    const config = cloneChartConfig(mockTestData.enhanced.area.config);
    return {
      chartType: "area",
      title: "Quarterly Financial Overview",
      description: "Income, expense, and net profit breakdown by quarter.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#22c55e", Object.keys(config).length, "area-demo"),
      imageInfo: createPlaceholderImageInfo("area-demo.png"),
    };
  },
  pie: () => {
    const data = mockTestData.enhanced.pie.data.map(item => ({ ...item }));
    const config = cloneChartConfig(mockTestData.enhanced.pie.config);
    return {
      chartType: "pie",
      title: "Device Traffic Share",
      description: "Traffic source distribution across device types.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#0ea5e9", Object.keys(config).length, "pie-demo"),
      imageInfo: createPlaceholderImageInfo("pie-demo.png"),
    };
  },
  radial: () => {
    const data = radialData.map(item => ({ ...item }));
    const config = cloneChartConfig(radialConfig);
    return {
      chartType: "radial",
      title: "Marketing Channel Contribution",
      description: "Share of total pipeline attributed to each marketing channel.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#f59e0b", Object.keys(config).length, "radial-demo"),
      imageInfo: createPlaceholderImageInfo("radial-demo.png"),
    };
  },
  radar: () => {
    const data = radarData.map(item => ({ ...item }));
    const config = cloneChartConfig(radarConfig);
    return {
      chartType: "radar",
      title: "Product Team Capability Comparison",
      description: "Multi-dimensional capability scores across three product teams.",
      chartData: data,
      chartConfig: config,
      theme: createChartTheme("#6366f1", Object.keys(config).length, "radar-demo"),
      imageInfo: createPlaceholderImageInfo("radar-demo.png"),
    };
  },
};

const chartTypeLabel = (type: ChartType) =>
  CHART_TYPE_LABELS[type as keyof typeof CHART_TYPE_LABELS]?.en ?? type;

export default function ChartDisplayAreaTestClient() {
  const [selectedType, setSelectedType] = useState<ChartType>("bar");
  const [chart, setChart] = useState<ChartResultContent | null>(() => sampleChartFactory.bar());

  const handleSelectType = useCallback((type: ChartType) => {
    setSelectedType(type);
    setChart(sampleChartFactory[type]());
  }, []);

  const handleUpdateChart = useCallback((updatedChart: ChartResultContent) => {
    setChart({ ...updatedChart, chartData: [...updatedChart.chartData], chartConfig: { ...updatedChart.chartConfig } });
  }, []);

  const handleReset = useCallback(() => {
    setChart(sampleChartFactory[selectedType]());
  }, [selectedType]);

  const statusBadge = useMemo(
    () => (
      <Badge variant="outline" className="gap-1 border-dashed">
        <FlaskConical className="h-3.5 w-3.5" />
        Local test only
      </Badge>
    ),
    []
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card className="border-dashed">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>ChartDisplayArea playground</CardTitle>
            <CardDescription>
              Quickly load mock chart results to verify styling, options, and export states without calling AI APIs.
            </CardDescription>
          </div>
          {statusBadge}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {chartTypes.map(type => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => handleSelectType(type)}
                className="capitalize"
              >
                {chartTypeLabel(type)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleReset} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reset sample
            </Button>
            {chart === null && (
              <Button onClick={() => setChart(sampleChartFactory[selectedType]())}>Reload chart</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {chart ? `${chart.title} · ${chartTypeLabel(chart.chartType)}` : "No chart selected"}
          </CardTitle>
          {chart?.description && <CardDescription>{chart.description}</CardDescription>}
        </CardHeader>
        <Separator />
        <CardContent className="min-h-[600px]">
          <ChartDisplayArea chart={chart} onClose={() => setChart(null)} onUpdateChart={handleUpdateChart} />
        </CardContent>
      </Card>
    </div>
  );
}
