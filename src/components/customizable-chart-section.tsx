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
import { useChartConfig } from "@/components/charts/simple-chart-wrapper";
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
  // 使用新的图表配置hook获取颜色
  const { colors } = useChartConfig("bar", baseData, baseConfig, baseColor);

  return (
    <div className="border-border/60 bg-background relative overflow-hidden rounded-3xl border p-6 shadow-lg">
      <ResponsiveContainer width="100%" height={320}>
        <RechartsBarChart data={baseData} barGap={8}>
          <CartesianGrid stroke={colors.grid} opacity={0.18} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: colors.text }}
            padding={{ left: 6, right: 6 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: colors.text }}
            tickFormatter={value => `${Math.round(Number(value) / 1000)}k`}
            width={44}
          />
          <Bar
            dataKey="revenue"
            fill={colors.series[0] || colors.primary}
            radius={[barRadius, barRadius, Math.max(barRadius - 6, 2), Math.max(barRadius - 6, 2)]}
            maxBarSize={56}
          >
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(value: number) => `$${(value / 1000).toFixed(1)}k`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                fill: colors.text,
              }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      <div className="border-border/60 bg-background/80 mt-6 rounded-2xl border p-4">
        <div className="text-primary/70 text-xs font-semibold tracking-[0.3em] uppercase">
          Auto Styling Script
        </div>
        <pre className="text-muted-foreground mt-2 font-mono text-sm whitespace-pre-wrap">
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
      const randomRadius = Math.round(Math.random() * (maxRadius - minRadius) + minRadius);

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
    <section className="from-muted/40 via-background to-background bg-gradient-to-b py-24">
      <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="text-primary/80 text-sm font-semibold tracking-[0.4em] uppercase">
              Live Styling
            </span>
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">
              Design-ready charts, tailored instantly
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
              Auto Chart rewrites every visual property of your chart—color palettes, rounded
              corners, spacing, gradients—through code. Adjust the controls or watch the automation
              script iterate designs once you pause.
            </p>
          </div>

          <div className="border-border/60 bg-muted/10 grid gap-8 rounded-3xl border p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="chart-color"
                  className="text-muted-foreground/80 text-xs font-semibold tracking-[0.3em] uppercase"
                >
                  Chart Color
                </Label>
                <Input
                  id="chart-color"
                  type="color"
                  value={baseColor}
                  onChange={event => handleColorChange(event.target.value)}
                  className="border-border/60 h-10 w-16 cursor-pointer bg-transparent p-1"
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
                <Label className="text-muted-foreground/80 text-xs font-semibold tracking-[0.3em] uppercase">
                  Bar radius
                </Label>
                <span className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
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

            <p className="text-muted-foreground/80 text-xs">
              Pause for a second to let Auto Chart continue experimenting with colors and corner
              radii automatically—perfect for generating multiple design options programmatically.
            </p>
          </div>
        </div>

        <AnimatedBarChart baseColor={baseColor} barRadius={radius} />
      </div>
    </section>
  );
}

export default CustomizableChartSection;
