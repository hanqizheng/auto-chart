"use client";

import { useRef, useEffect, useState, useCallback, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeautifulLineChart } from "@/components/charts/line-chart";
import { BeautifulBarChart } from "@/components/charts/bar-chart";
import { BeautifulAreaChart } from "@/components/charts/area-chart";
import { BeautifulPieChart } from "@/components/charts/pie-chart";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { createChartTheme } from "@/lib/colors";

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

  const updateStage = useCallback(
    (next: ScrollStage) => {
      if (stageRef.current === next) return;
      stageRef.current = next;
      setStage(next);
    },
    []
  );

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
      const tailSpacing = clamp(
        viewportWidth * 0.18,
        MIN_TAIL_SPACING,
        MAX_TAIL_SPACING
      );

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
        const data = [
          { month: "Jan", revenue: 125000, profit: 35000, expenses: 90000 },
          { month: "Feb", revenue: 158000, profit: 52000, expenses: 106000 },
          { month: "Mar", revenue: 142000, profit: 28000, expenses: 114000 },
          { month: "Apr", revenue: 196000, profit: 78000, expenses: 118000 },
          { month: "May", revenue: 188000, profit: 82000, expenses: 106000 },
          { month: "Jun", revenue: 215000, profit: 95000, expenses: 120000 },
        ];
        const config = {
          revenue: { label: "Revenue", color: "#22c55e" },
          profit: { label: "Profit", color: "#16a34a" },
          expenses: { label: "Expenses", color: "#4ade80" },
        };

        return (
          <ChartThemeProvider
            chartType="line"
            chartData={data}
            chartConfig={config}
            theme={createChartTheme("#22c55e", 3, "demo-line")}
          >
            <BeautifulLineChart data={data} config={config} className="h-[280px] w-full" />
          </ChartThemeProvider>
        );
      }

      case "bar": {
        const data = [
          { city: "Beijing", income: 25000 },
          { city: "Shanghai", income: 23000 },
          { city: "Shenzhen", income: 22000 },
          { city: "Guangzhou", income: 21000 },
          { city: "Chongqing", income: 20000 },
        ];
        const config = {
          income: { label: "Income", color: "#22c55e" },
        };

        return (
          <ChartThemeProvider
            chartType="bar"
            chartData={data}
            chartConfig={config}
            theme={createChartTheme("#22c55e", 1, "demo-bar")}
          >
            <BeautifulBarChart data={data} config={config} className="h-[280px] w-full" />
          </ChartThemeProvider>
        );
      }

      case "area": {
        const data = [
          { month: "Jan", users: 12500, sessions: 35000, pageviews: 125000 },
          { month: "Feb", users: 18300, sessions: 48000, pageviews: 156000 },
          { month: "Mar", users: 22100, sessions: 52000, pageviews: 175000 },
          { month: "Apr", users: 27800, sessions: 68000, pageviews: 202000 },
          { month: "May", users: 31200, sessions: 74000, pageviews: 235000 },
          { month: "Jun", users: 35600, sessions: 82000, pageviews: 268000 },
        ];
        const config = {
          users: { label: "Users", color: "#16a34a" },
          sessions: { label: "Sessions", color: "#22c55e" },
          pageviews: { label: "Page Views", color: "#42d392" },
        };

        return (
          <ChartThemeProvider
            chartType="area"
            chartData={data}
            chartConfig={config}
            theme={createChartTheme("#22c55e", 3, "demo-area")}
          >
            <BeautifulAreaChart data={data} config={config} className="h-[280px] w-full" />
          </ChartThemeProvider>
        );
      }

      case "pie": {
        const data = [
          { name: "Product A", value: 350000 },
          { name: "Product B", value: 250000 },
          { name: "Product C", value: 200000 },
          { name: "Product D", value: 120000 },
          { name: "Others", value: 80000 },
        ];
        const config = { value: { label: "Sales" } };

        return (
          <ChartThemeProvider
            chartType="pie"
            chartData={data}
            chartConfig={config}
            theme={createChartTheme("#22c55e", data.length, "demo-pie")}
          >
            <BeautifulPieChart
              data={data}
              config={config}
              className="h-[220px] w-full"
              showLegend={false}
            />
          </ChartThemeProvider>
        );
      }

      default:
        return null;
    }
  }, []);

  const renderDemoCard = useCallback(
    (demo: DemoItem, index: number, layout: "horizontal" | "stacked" = "horizontal") => {
      const widthClass =
        layout === "horizontal" ? "w-[min(600px,90vw)] flex-none" : "w-full";
      const heightClass = layout === "horizontal" ? "h-[32rem]" : "min-h-[28rem] h-full";
      const snapClass = layout === "horizontal" ? "snap-center" : "";

      return (
        <article
          key={demo.id}
          className={`flex ${heightClass} ${widthClass} ${snapClass} rounded-3xl border border-border/40 bg-card/80 p-6 shadow-xl backdrop-blur transition-colors duration-200 hover:border-border hover:bg-card`}
        >
          <div className="flex w-full flex-col">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.3em] text-primary/80">
              <span>{`[${String(index).padStart(2, "0")}]`}</span>
              <span>{demo.chartType.toUpperCase()}</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 p-4">
              {getMockDataAndChart(demo.chartType)}
            </div>

            <h3 className="mt-6 text-2xl font-semibold leading-tight">{demo.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{demo.description}</p>

            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                Best for
              </span>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {demo.features.map((feature, featureIndex) => (
                  <span
                    key={`${demo.id}-feature-${featureIndex}`}
                    className="rounded-full bg-muted/70 px-3 py-1"
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
      <section className="bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-6">
            <span className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/80">
              Demo Library
            </span>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">{heading}</h2>
            {subheading && (
              <p className="text-lg leading-relaxed text-muted-foreground">{subheading}</p>
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
      className="relative bg-gradient-to-b from-background via-background to-muted/20"
      style={{
        height: `${Math.max(layout.totalHeight, SECTION_MIN_HEIGHT * 2)}px`,
      }}
    >
      <div
        ref={pinnedWrapperRef}
        className="z-10 flex w-full items-center justify-start overflow-visible"
        style={pinnedStyle}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/60 to-transparent" />

        <div
          ref={trackRef}
          className="relative flex h-full flex-nowrap items-center gap-12 px-6 py-12 md:px-12 lg:px-24"
          style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
        >
          <div className="flex h-[32rem] w-[min(600px,90vw)] flex-none items-center">
            <div className="space-y-6">
              <span className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/80">
                Demo Library
              </span>
              <h2 className="text-4xl font-bold leading-tight md:text-6xl">{heading}</h2>
              {subheading && (
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {subheading}
                </p>
              )}
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                Scroll ↓ to explore all chart types
              </p>
            </div>
          </div>

          {demos.map((demo, index) => renderDemoCard(demo, index, "horizontal"))}
          <div ref={tailSpacerRef} className="flex-none" aria-hidden style={{ width: `${layout.tailSpacing}px` }} />
        </div>
      </div>
    </section>
  );
}
