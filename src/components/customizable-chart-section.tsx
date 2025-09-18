"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LabelList,
} from "recharts";
import { ChartThemeProvider, useChartTheme } from "@/contexts/chart-theme-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const baseData = [
  { month: "Jan", revenue: 128000 },
  { month: "Feb", revenue: 142000 },
  { month: "Mar", revenue: 158500 },
  { month: "Apr", revenue: 171200 },
  { month: "May", revenue: 185400 },
  { month: "Jun", revenue: 198750 },
];

const baseConfig = {
  revenue: { label: "Monthly revenue" },
};

const swatchColors = [
  "#22c55e",
  "#f97316",
  "#22d3ee",
  "#ec4899",
  "#10b981",
  "#a855f7",
  "#facc15",
] as const;

const AUTO_IDLE_DELAY = 1000;
const AUTO_RADIUS_RANGE: [number, number] = [4, 24];

interface AnimatedBarChartProps {
  baseColor: string;
  barRadius: number;
}

function AnimatedBarChart({ baseColor, barRadius }: AnimatedBarChartProps) {
  const { palette, getSeriesColor, setBaseColor } = useChartTheme();

  useEffect(() => {
    setBaseColor(baseColor);
  }, [baseColor, setBaseColor]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background p-6 shadow-lg">
      <ResponsiveContainer width="100%" height={320}>
        <RechartsBarChart data={baseData} barGap={8}>
          <CartesianGrid stroke={palette.grid} opacity={0.18} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: palette.neutralStrong }}
            padding={{ left: 6, right: 6 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: palette.neutralStrong }}
            tickFormatter={value => `${Math.round(Number(value) / 1000)}k`}
            width={44}
          />
          <Bar dataKey="revenue" fill={getSeriesColor("revenue")}
            radius={[barRadius, barRadius, Math.max(barRadius - 6, 2), Math.max(barRadius - 6, 2)]}
            maxBarSize={56}>
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(value: number) => `$${(value / 1000).toFixed(1)}k`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                fill: palette.neutralStrong,
              }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background/80 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
          Auto Styling Script
        </div>
        <pre className="mt-2 whitespace-pre-wrap text-sm font-mono text-muted-foreground">
          {`chart.setStyle({ baseColor: "${baseColor}", barRadius: ${barRadius} });`}
        </pre>
      </div>
    </div>
  );
}

export function CustomizableChartSection() {
  const [baseColor, setBaseColor] = useState<string>(swatchColors[0]);
  const [radius, setRadius] = useState<number>(14);
  const idleSinceRef = useRef<number>(Date.now());
  const isManualRef = useRef<boolean>(false);

  const handleColorChange = useCallback((nextColor: string, markInteraction = true) => {
    const normalized = nextColor.startsWith("#") ? nextColor : `#${nextColor}`;
    setBaseColor(normalized);
    if (markInteraction) {
      idleSinceRef.current = Date.now();
      isManualRef.current = true;
    }
  }, []);

  const handleRadiusChange = useCallback((values: number[]) => {
    const value = Math.round(values[0]);
    setRadius(value);
    idleSinceRef.current = Date.now();
    isManualRef.current = true;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - idleSinceRef.current < AUTO_IDLE_DELAY) {
        return;
      }

      const randomColor = swatchColors[Math.floor(Math.random() * swatchColors.length)];
      const [minRadius, maxRadius] = AUTO_RADIUS_RANGE;
      const randomRadius = Math.round(
        Math.random() * (maxRadius - minRadius) + minRadius
      );

      isManualRef.current = false;
      setBaseColor(randomColor);
      setRadius(randomRadius);
    }, AUTO_IDLE_DELAY);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isManualRef.current) {
      idleSinceRef.current = Date.now();
    }
  }, [baseColor, radius]);

  const radiusDisplay = useMemo(() => `${radius}px`, [radius]);

  return (
    <section className="bg-gradient-to-b from-muted/40 via-background to-background py-24">
      <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/80">
              Live Styling
            </span>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Design-ready charts, tailored instantly
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
              Auto Chart rewrites every visual property of your chart—color palettes, rounded
              corners, spacing, gradients—through code. Adjust the controls or watch the automation
              script iterate designs once you pause.
            </p>
          </div>

          <div className="grid gap-8 rounded-3xl border border-border/60 bg-muted/10 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="chart-color" className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Chart Color
                </Label>
                <Input
                  id="chart-color"
                  type="color"
                  value={baseColor}
                  onChange={event => handleColorChange(event.target.value)}
                  className="h-10 w-16 cursor-pointer border-border/60 bg-transparent p-1"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {swatchColors.map(color => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline"
                    className={`h-10 w-10 rounded-full border-2 p-0 transition-transform ${
                      baseColor.toLowerCase() === color.toLowerCase()
                        ? "border-primary scale-105"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    aria-label={`Use color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Bar radius
                </Label>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {radiusDisplay}
                </span>
              </div>
              <Slider
                value={[radius]}
                min={AUTO_RADIUS_RANGE[0]}
                max={AUTO_RADIUS_RANGE[1]}
                step={1}
                onValueChange={handleRadiusChange}
              />
            </div>

            <p className="text-xs text-muted-foreground/80">
              Pause for a second to let Auto Chart continue experimenting with colors and corner
              radii automatically—perfect for generating multiple design options programmatically.
            </p>
          </div>
        </div>

        <ChartThemeProvider chartType="bar" chartData={baseData} chartConfig={baseConfig}>
          <AnimatedBarChart baseColor={baseColor} barRadius={radius} />
        </ChartThemeProvider>
      </div>
    </section>
  );
}

export default CustomizableChartSection;
