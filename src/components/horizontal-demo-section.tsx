"use client";

import { useRef, useEffect, useState, useCallback, type CSSProperties } from "react";
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

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const SECTION_MIN_HEIGHT = 480;
const ENTRY_DELAY_RATIO = 0.12;
const EXIT_DELAY_RATIO = 0.18;
const MIN_ENTRY_DELAY = 80;
const MIN_EXIT_DELAY = 120;
const MIN_TAIL_SPACING = 160;
const MAX_TAIL_SPACING = 320;
const ENTRY_ALIGNMENT_BUFFER = 64;
const HORIZONTAL_SCROLL_SPEED = 1.25;

type ScrollStage = "before" | "active" | "after";

export function HorizontalDemoSection({
  heading,
  subheading,
  demos,
  onTryDemo,
}: HorizontalDemoSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinnedWrapperRef = useRef<HTMLDivElement>(null);
  const tailSpacerRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef(0);
  const maxTranslateRef = useRef(0);
  const scrollBoundsRef = useRef({
    sectionTop: 0,
    startPin: 0,
    scrollEnd: 0,
    releasePoint: 0,
  });
  const rafRef = useRef<number | null>(null);

  const [disableHorizontal, setDisableHorizontal] = useState(false);
  const stageRef = useRef<ScrollStage>("before");
  const [stage, setStage] = useState<ScrollStage>("before");
  const [layout, setLayout] = useState({
    entrySpacer: MIN_ENTRY_DELAY,
    exitSpacer: MIN_EXIT_DELAY,
    pinnedTop: 0,
    pinnedHeight: SECTION_MIN_HEIGHT,
    totalHeight: SECTION_MIN_HEIGHT * 2,
    scrollDistance: SECTION_MIN_HEIGHT,
    tailSpacing: MIN_TAIL_SPACING,
  });

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, []);

  const updateStage = useCallback((next: ScrollStage) => {
    if (stageRef.current === next) return;
    stageRef.current = next;
    setStage(next);
  }, []);

  const applyOffset = useCallback((nextOffset: number) => {
    const maxTranslate = maxTranslateRef.current;
    const clampedOffset = clamp(nextOffset, 0, maxTranslate);
    const previous = offsetRef.current;
    offsetRef.current = clampedOffset;

    const track = trackRef.current;
    if (!track) return;

    const delta = Math.abs(clampedOffset - previous);
    if (delta < 0.5 && clampedOffset !== 0 && clampedOffset !== maxTranslate) {
      return;
    }

    track.style.transform = `translate3d(-${clampedOffset}px, 0, 0)`;
  }, []);

  const syncScrollPosition = useCallback(() => {
    const maxTranslate = maxTranslateRef.current;
    const scrollY = window.scrollY || window.pageYOffset;
    const { startPin, scrollEnd, releasePoint } = scrollBoundsRef.current;

    if (maxTranslate <= 0) {
      updateStage("before");
      if (offsetRef.current !== 0) {
        applyOffset(0);
      }
      return;
    }

    if (scrollY + 1 < startPin) {
      updateStage("before");
      if (offsetRef.current !== 0) {
        applyOffset(0);
      }
      return;
    }

    if (scrollY >= releasePoint) {
      updateStage("after");
      if (offsetRef.current !== maxTranslate) {
        applyOffset(maxTranslate);
      }
      return;
    }

    updateStage("active");

    if (scrollY <= scrollEnd) {
      const distance = scrollY - startPin;
      applyOffset(distance * HORIZONTAL_SCROLL_SPEED);
      return;
    }

    if (offsetRef.current !== maxTranslate) {
      applyOffset(maxTranslate);
    }
  }, [applyOffset, updateStage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      const prefersReducedMotion = mediaQuery.matches;
      const isSmallScreen = window.innerWidth < 768;
      setDisableHorizontal(prefersReducedMotion || isSmallScreen);
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
    } else {
      mediaQuery.addListener(updatePreference);
    }

    window.addEventListener("resize", updatePreference);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updatePreference);
      } else {
        mediaQuery.removeListener(updatePreference);
      }
      window.removeEventListener("resize", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (disableHorizontal) {
      offsetRef.current = 0;
      maxTranslateRef.current = 0;
      if (trackRef.current) {
        trackRef.current.style.transform = "translate3d(0, 0, 0)";
      }
      scrollBoundsRef.current = {
        sectionTop: 0,
        startPin: 0,
        scrollEnd: 0,
        releasePoint: 0,
      };
      updateStage("before");
      return;
    }

    const updateMetrics = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      const pinned = pinnedWrapperRef.current;
      if (!container || !track || !pinned) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tailSpacing = clamp(viewportWidth * 0.18, MIN_TAIL_SPACING, MAX_TAIL_SPACING);

      if (tailSpacerRef.current) {
        tailSpacerRef.current.style.width = `${tailSpacing}px`;
      }

      const trackWidth = track.scrollWidth;
      const maxTranslate = Math.max(0, trackWidth - viewportWidth);

      maxTranslateRef.current = maxTranslate;
      applyOffset(offsetRef.current);

      const pinnedHeight = Math.max(pinned.offsetHeight, SECTION_MIN_HEIGHT);
      const pinnedTop = Math.max(0, (viewportHeight - pinnedHeight) / 2);
      const entryBase = Math.max(viewportHeight * ENTRY_DELAY_RATIO, MIN_ENTRY_DELAY);
      const entrySpacer = Math.max(entryBase, pinnedTop + ENTRY_ALIGNMENT_BUFFER);
      const exitSpacer = Math.max(viewportHeight * EXIT_DELAY_RATIO, MIN_EXIT_DELAY);

      const scrollDistance = maxTranslate > 0 ? maxTranslate / HORIZONTAL_SCROLL_SPEED : 0;
      const totalHeight = entrySpacer + exitSpacer + pinnedHeight + scrollDistance;

      const scrollTop = window.scrollY || window.pageYOffset;
      const { top } = container.getBoundingClientRect();
      const sectionStart = scrollTop + top;
      const startPin = sectionStart + Math.max(entrySpacer - pinnedTop, 0);
      const scrollEnd = startPin + scrollDistance;
      const releasePoint = scrollEnd;

      scrollBoundsRef.current = {
        sectionTop: sectionStart,
        startPin,
        scrollEnd,
        releasePoint,
      };

      setLayout({
        entrySpacer,
        exitSpacer,
        pinnedTop,
        pinnedHeight,
        totalHeight: Math.max(totalHeight, SECTION_MIN_HEIGHT * 2),
        scrollDistance,
        tailSpacing,
      });

      syncScrollPosition();
    };

    updateMetrics();

    window.addEventListener("resize", updateMetrics);

    let trackObserver: ResizeObserver | undefined;
    let pinnedObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      if (trackRef.current) {
        trackObserver = new ResizeObserver(updateMetrics);
        trackObserver.observe(trackRef.current);
      }

      if (pinnedWrapperRef.current) {
        pinnedObserver = new ResizeObserver(updateMetrics);
        pinnedObserver.observe(pinnedWrapperRef.current);
      }
    }

    return () => {
      window.removeEventListener("resize", updateMetrics);
      trackObserver?.disconnect();
      pinnedObserver?.disconnect();
    };
  }, [disableHorizontal, applyOffset, syncScrollPosition]);

  useEffect(() => {
    if (disableHorizontal) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        syncScrollPosition();
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [disableHorizontal, syncScrollPosition]);

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
    (demo: DemoItem, index: number, layout: "horizontal" | "stacked" = "horizontal") => {
      const widthClass = layout === "horizontal" ? "w-[min(620px,90vw)] flex-none" : "w-full";
      const heightClass = layout === "horizontal" ? "min-h-[36rem]" : "min-h-[30rem]";
      const snapClass = layout === "horizontal" ? "snap-center" : "";

      return (
        <article
          key={demo.id}
          className={`flex h-auto ${heightClass} ${widthClass} ${snapClass} border-border/40 bg-card/80 hover:border-border hover:bg-card overflow-visible rounded-3xl border p-6 shadow-xl backdrop-blur transition-colors duration-200`}
        >
          <div className="flex w-full flex-1 flex-col gap-4">
            <div className="text-primary/80 flex items-center justify-between font-mono text-xs tracking-[0.3em] uppercase">
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

  if (disableHorizontal) {
    return (
      <section className="from-background to-muted/20 bg-gradient-to-b py-20">
        <div className="container mx-auto space-y-12 px-6">
          <div className="max-w-2xl space-y-6">
            <span className="text-primary/80 text-sm font-semibold tracking-[0.4em] uppercase">
              Demo Library
            </span>
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">{heading}</h2>
            {subheading && (
              <p className="text-muted-foreground text-lg leading-relaxed">{subheading}</p>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {demos.map((demo, index) => renderDemoCard(demo, index, "stacked"))}
          </div>
        </div>
      </section>
    );
  }

  const afterTop = layout.entrySpacer + layout.scrollDistance;
  const pinnedStyle: CSSProperties =
    stage === "active"
      ? {
          position: "fixed",
          top: `${layout.pinnedTop}px`,
          left: 0,
          right: 0,
          width: "100%",
        }
      : {
          position: "absolute",
          top: `${stage === "before" ? layout.entrySpacer : afterTop}px`,
          left: 0,
          right: 0,
          width: "100%",
        };

  return (
    <section
      ref={containerRef}
      className="from-background via-background to-muted/20 relative bg-gradient-to-b"
      style={{
        height: `${Math.max(layout.totalHeight, SECTION_MIN_HEIGHT * 2)}px`,
      }}
    >
      <div
        ref={pinnedWrapperRef}
        className="z-10 flex w-full items-center justify-start overflow-visible"
        style={pinnedStyle}
      >
        <div className="from-background via-background/60 pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent" />
        <div className="from-background via-background/60 pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l to-transparent" />

        <div
          ref={trackRef}
          className="relative flex h-full flex-nowrap items-center gap-12 px-6 py-12 md:px-12 lg:px-24"
          style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
        >
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
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                Scroll ↓ to explore all chart types
              </p>
            </div>
          </div>

          {demos.map((demo, index) => renderDemoCard(demo, index, "horizontal"))}
          <div
            ref={tailSpacerRef}
            className="flex-none"
            aria-hidden
            style={{ width: `${layout.tailSpacing}px` }}
          />
        </div>
      </div>
    </section>
  );
}
