"use client";

import { useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeautifulLineChart } from "@/components/charts/line-chart";
import { BeautifulBarChart } from "@/components/charts/bar-chart";
import { BeautifulAreaChart } from "@/components/charts/area-chart";
import { BeautifulPieChart } from "@/components/charts/pie-chart";
import { BeautifulRadarChart } from "@/components/charts/radar-chart";
import { BeautifulRadialChart } from "@/components/charts/radial-chart";
import { generateChartConfig } from "@/lib/data-standardization";
import { generateChartColors } from "@/lib/simplified-color-config";

// 完全重构的演示组件 - 使用新的简化配置系统
const LineChartDemo = () => {
  const rawData = [
    { date: "2024-01", sales: 125000, target: 120000 },
    { date: "2024-02", sales: 138000, target: 130000 },
    { date: "2024-03", sales: 142000, target: 135000 },
    { date: "2024-04", sales: 156000, target: 140000 },
    { date: "2024-05", sales: 168000, target: 145000 },
    { date: "2024-06", sales: 175000, target: 150000 },
  ];
  const userConfig = {
    sales: { label: "Sales" },
    target: { label: "Target" },
  };

  // 使用新的配置生成流程
  const chartConfig = generateChartConfig("line", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("line", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulLineChart
      data={chartConfig.data}
      config={chartConfig.config}
      colors={colors}
      className="h-[280px] w-full"
    />
  );
};

const BarChartDemo = () => {
  const rawData = [
    { city: "Beijing", average_income: 25000, median_income: 20000 },
    { city: "Shanghai", average_income: 23000, median_income: 19000 },
    { city: "Shenzhen", average_income: 22000, median_income: 18500 },
  ];
  const userConfig = {
    average_income: { label: "Average Income" },
    median_income: { label: "Median Income" },
  };

  const chartConfig = generateChartConfig("bar", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("bar", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulBarChart
      data={chartConfig.data}
      config={chartConfig.config}
      colors={colors}
      className="h-[280px] w-full"
    />
  );
};

const AreaChartDemo = () => {
  const rawData = [
    { month: "2024-01", performance: 85, target: 80 },
    { month: "2024-02", performance: 88, target: 82 },
    { month: "2024-03", performance: 92, target: 85 },
    { month: "2024-04", performance: 89, target: 87 },
    { month: "2024-05", performance: 94, target: 90 },
    { month: "2024-06", performance: 97, target: 92 },
  ];
  const userConfig = {
    performance: { label: "Performance" },
    target: { label: "Target" },
  };

  const chartConfig = generateChartConfig("area", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("area", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulAreaChart
      data={chartConfig.data}
      config={chartConfig.config}
      colors={colors}
      className="h-[280px] w-full"
    />
  );
};

const PieChartDemo = () => {
  const rawData = [
    { name: "Product A", value: 350000 },
    { name: "Product B", value: 250000 },
    { name: "Product C", value: 200000 },
    { name: "Product D", value: 120000 },
    { name: "Others", value: 80000 },
  ];
  const userConfig = { value: { label: "Sales" } };

  const chartConfig = generateChartConfig("pie", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("pie", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulPieChart
      data={chartConfig.data as any}
      config={chartConfig.config}
      colors={colors}
      className="h-[240px] w-full"
      showLegend={false}
    />
  );
};

const RadarChartDemo = () => {
  const rawData = [
    { dimension: "Execution", "Team Alpha": 82, "Team Bravo": 75, "Team Charlie": 88 },
    { dimension: "Innovation", "Team Alpha": 90, "Team Bravo": 78, "Team Charlie": 84 },
    { dimension: "Quality", "Team Alpha": 88, "Team Bravo": 83, "Team Charlie": 91 },
    { dimension: "Speed", "Team Alpha": 76, "Team Bravo": 89, "Team Charlie": 80 },
    { dimension: "Collaboration", "Team Alpha": 92, "Team Bravo": 86, "Team Charlie": 88 },
  ];
  const userConfig = {
    "Team Alpha": { label: "Team Alpha" },
    "Team Bravo": { label: "Team Bravo" },
    "Team Charlie": { label: "Team Charlie" },
  };

  const chartConfig = generateChartConfig("radar", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("radar", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulRadarChart
      data={chartConfig.data}
      config={chartConfig.config}
      colors={colors}
      className="h-[280px] w-full"
      showLegend
      showDots
      showArea
    />
  );
};

const RadialChartDemo = () => {
  const rawData = [
    { name: "Email", value: 24 },
    { name: "Paid Ads", value: 32 },
    { name: "Organic Search", value: 18 },
    { name: "Events", value: 14 },
    { name: "Referrals", value: 12 },
  ];
  const userConfig = { value: { label: "Contribution" } };

  const chartConfig = generateChartConfig("radial", rawData, userConfig, "#22c55e");
  const colors = generateChartColors("radial", chartConfig.seriesCount, "#22c55e");

  return (
    <BeautifulRadialChart
      data={chartConfig.data as any}
      config={chartConfig.config}
      colors={colors}
      className="h-[260px] w-full"
      showLegend
      showLabels
      innerRadius={45}
      outerRadius={140}
      barSize={20}
      cornerRadius={10}
    />
  );
};

interface DemoItem {
  id: string;
  title: string;
  description: string;
  chartType: string;
  features: readonly string[];
}

interface HorizontalDemoSectionProps {
  heading: string;
  subheading?: string;
  demos: readonly DemoItem[];
  onTryDemo: (demoId: string) => void;
}

export function HorizontalDemoSection({
  heading,
  subheading,
  demos,
  onTryDemo,
}: HorizontalDemoSectionProps) {

  const getMockDataAndChart = useCallback((chartType: string) => {
    switch (chartType) {
      case "line": {
        return <LineChartDemo />;
      }

      case "bar": {
        return <BarChartDemo />;
      }

      case "area": {
        return <AreaChartDemo />;
      }

      case "pie": {
        return <PieChartDemo />;
      }

      case "radar": {
        return <RadarChartDemo />;
      }

      case "radial": {
        return <RadialChartDemo />;
      }

      default:
        return null;
    }
  }, []);

  const renderDemoCard = useCallback(
    (demo: DemoItem, index: number, isHorizontal: boolean = true) => {
      const widthClass = isHorizontal ? "w-[min(620px,90vw)] flex-none" : "w-full";
      const heightClass = isHorizontal ? "min-h-[36rem]" : "min-h-[30rem]";
      const snapClass = isHorizontal ? "snap-center" : "";

      return (
        <article
          key={demo.id}
          className={`flex h-auto ${heightClass} ${widthClass} ${snapClass} border-border/40 bg-card/80 hover:border-border hover:bg-card overflow-visible rounded-3xl border p-6 shadow-xl backdrop-blur transition-colors duration-200`}
        >
          <div className="flex w-full flex-1 flex-col gap-4">
            <div className="text-primary/80 flex items-center justify-between text-xs tracking-[0.3em] uppercase font-serif font-bold">
              <span>{`[${String(index).padStart(2, "0")}]`}</span>
              <span>{demo.chartType.toUpperCase()}</span>
            </div>

            <div className="flex-1">
              <div className="border-border/40 bg-muted/30 relative flex h-full min-h-[300px] flex-col items-center justify-start overflow-hidden rounded-2xl border p-4">
                {getMockDataAndChart(demo.chartType)}
              </div>
            </div>

            <h3 className="text-2xl leading-tight font-semibold">{demo.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{demo.description}</p>

            <div className="space-y-2">
              <span className="text-muted-foreground/80 text-xs font-semibold tracking-wide uppercase">
                Best for
              </span>
              <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                {demo.features.map((feature, featureIndex) => (
                  <span
                    key={`${demo.id}-feature-${featureIndex}`}
                    className="bg-muted/70 rounded-full px-3 py-1"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <Button
              variant="link"
              size="sm"
              className="mt-auto inline-flex items-center gap-1.5 px-1 text-base font-bold"
              onClick={() => onTryDemo(demo.id)}
            >
              Try it
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </article>
      );
    },
    [getMockDataAndChart, onTryDemo]
  );

  return (
    <section className="from-background via-background to-muted/20 relative bg-gradient-to-b">
      <div className="overflow-x-auto">
        <div className="flex items-center py-32 px-24 w-max gap-12">
          {/* 标题区域 - 作为第一个item */}
          <div className="flex h-[32rem] w-[min(600px,90vw)] flex-none items-center">
            <div className="space-y-6">
              <span className="text-primary/80 text-sm font-semibold tracking-[0.4em] uppercase">
                Demo Library
              </span>
              <h2 className="text-4xl leading-tight font-bold md:text-6xl">{heading}</h2>
              {subheading && (
                <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
                  {subheading}
                </p>
              )}
            </div>
          </div>

          {/* Demo卡片 */}
          {demos.map((demo, index) => renderDemoCard(demo, index, true))}
        </div>
      </div>
    </section>
  );
}
