"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ChartPalette, ChartTheme, ChartType } from "@/types";
import {
  applyPaletteToConfig,
  createChartTheme,
  DEFAULT_CHART_BASE_COLOR,
  mapSeriesKeysToColors,
  normalizeHexColor,
} from "@/lib/colors";

interface ChartThemeProviderProps {
  chartType: ChartType;
  chartData?: any[];
  chartConfig?: Record<string, any>;
  theme?: ChartTheme;
  children: ReactNode;
}

interface ChartThemeContextValue {
  chartType: ChartType;
  theme: ChartTheme;
  palette: ChartPalette;
  baseColor: string;
  seriesKeys: string[];
  seriesColorMap: Record<string, string>;
  pieSliceColors: string[];
  themedConfig: Record<string, any>;
  setBaseColor: (color: string) => void;
  getSeriesColor: (key: string, fallbackIndex?: number) => string;
}

const ChartThemeContext = createContext<ChartThemeContextValue | null>(null);
const toLower = (value?: string) => (value ? value.toLowerCase() : "");

const collectSeriesKeys = (
  chartType: ChartType,
  data: any[] = [],
  config: Record<string, any> = {}
): string[] => {
  const configKeys = Object.keys(config || {});
  if (configKeys.length > 0 && chartType !== "pie") {
    return configKeys;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (chartType === "pie" || chartType === "radial") {
    return data.map((item: any, index: number) => String(item?.name ?? `slice-${index + 1}`));
  }

  const firstItem = data[0] || {};
  const keys = Object.keys(firstItem).filter(key => key !== "name");
  const numericKeys = keys.filter(key => typeof firstItem[key] === "number");

  if (numericKeys.length > 0) {
    return numericKeys;
  }

  return keys;
};

export function ChartThemeProvider({
  chartType,
  chartData = [],
  chartConfig = {},
  theme: incomingTheme,
  children,
}: ChartThemeProviderProps) {
  const derivedSeriesKeys = useMemo(
    () => collectSeriesKeys(chartType, chartData, chartConfig),
    [chartType, chartData, chartConfig]
  );

  const seriesCount =
    chartType === "pie" || chartType === "radial"
      ? Math.max(chartData.length || derivedSeriesKeys.length, 1)
      : Math.max(derivedSeriesKeys.length || 1, 1);

  const initialBaseColor = useMemo(() => {
    if (incomingTheme?.baseColor) {
      return normalizeHexColor(incomingTheme.baseColor);
    }

    for (const key of Object.keys(chartConfig)) {
      const color = chartConfig[key]?.color;
      if (color) {
        return normalizeHexColor(color);
      }
    }

    return DEFAULT_CHART_BASE_COLOR;
  }, [incomingTheme?.baseColor, chartConfig]);

  const [baseColor, setBaseColor] = useState(initialBaseColor);

  useEffect(() => {
    setBaseColor(initialBaseColor);
  }, [initialBaseColor]);

  const theme = useMemo(() => {
    const normalizedBase = normalizeHexColor(baseColor);

    if (incomingTheme && toLower(incomingTheme.baseColor) === toLower(normalizedBase)) {
      const seriesMatches = incomingTheme.palette.series.length === seriesCount;
      if (seriesMatches) {
        return incomingTheme;
      }
    }

    return createChartTheme(normalizedBase, seriesCount, incomingTheme?.name);
  }, [incomingTheme, baseColor, seriesCount]);

  const palette = theme.palette;

  const themedConfig = useMemo(() => {
    if (chartType === "pie" || chartType === "radial") {
      return chartConfig;
    }

    const keys = Object.keys(chartConfig).length > 0 ? Object.keys(chartConfig) : derivedSeriesKeys;

    const paletteMap = mapSeriesKeysToColors(keys, palette);
    const next = { ...(chartConfig || {}) } as Record<string, any>;
    keys.forEach(key => {
      const existing = next[key] || {};
      // Preserve existing explicit color if present, otherwise fill from palette
      next[key] = existing.color ? existing : { ...existing, color: paletteMap[key] };
    });
    return next;
  }, [chartType, chartConfig, derivedSeriesKeys, palette]);

  const pieSliceColors = useMemo(() => {
    if (chartType !== "pie" && chartType !== "radial") {
      return [];
    }

    const explicitColors: string[] | undefined = Array.isArray((chartConfig as any)?.colors)
      ? ((chartConfig as any).colors as string[])
      : undefined;

    const source = explicitColors && explicitColors.length > 0 ? explicitColors : palette.series;

    return Array.from({ length: chartData.length }).map((_, index) => {
      return source[index % source.length] || palette.primary;
    });
  }, [chartType, chartData.length, chartConfig, palette.series, palette.primary]);

  const seriesColorMap = useMemo(() => {
    if (chartType === "pie" || chartType === "radial") {
      const labels = Array.isArray(chartData)
        ? chartData.map((item: any, index: number) => String(item?.name ?? `slice-${index + 1}`))
        : [];

      const explicitColors: string[] | undefined = Array.isArray((chartConfig as any)?.colors)
        ? ((chartConfig as any).colors as string[])
        : undefined;

      const source = explicitColors && explicitColors.length > 0 ? explicitColors : palette.series;

      return labels.reduce<Record<string, string>>((acc, label, index) => {
        acc[label] = source[index % source.length] || palette.primary;
        return acc;
      }, {});
    }

    const keys = Object.keys(chartConfig).length > 0 ? Object.keys(chartConfig) : derivedSeriesKeys;
    return mapSeriesKeysToColors(keys, theme.palette);
  }, [chartType, chartData, chartConfig, derivedSeriesKeys, theme.palette]);

  const handleSetBaseColor = useCallback(
    (color: string) => {
      setBaseColor(normalizeHexColor(color, palette.primary));
    },
    [palette.primary]
  );

  const getSeriesColor = useCallback(
    (key: string, fallbackIndex?: number) => {
      if (seriesColorMap[key]) {
        return seriesColorMap[key];
      }
      if (typeof fallbackIndex === "number") {
        const colors = palette.series;
        if (colors.length === 0) {
          return palette.primary;
        }
        return colors[fallbackIndex % colors.length];
      }
      return palette.primary;
    },
    [seriesColorMap, palette]
  );

  const value: ChartThemeContextValue = {
    chartType,
    theme,
    palette,
    baseColor,
    seriesKeys: derivedSeriesKeys,
    seriesColorMap,
    pieSliceColors,
    themedConfig,
    setBaseColor: handleSetBaseColor,
    getSeriesColor,
  };

  return <ChartThemeContext.Provider value={value}>{children}</ChartThemeContext.Provider>;
}

export function useChartTheme() {
  const context = useContext(ChartThemeContext);

  if (!context) {
    throw new Error("useChartTheme must be used within a ChartThemeProvider");
  }

  return context;
}
