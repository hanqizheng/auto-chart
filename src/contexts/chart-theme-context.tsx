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
import { ChartPalette, ChartTheme, ChartType, SeriesColorConfig } from "@/types";
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

  // ===== 新增：结构化颜色配置获取方法 =====
  /** 获取结构化的系列颜色配置（包含边框色和填充色） */
  getSeriesConfig: (key: string, fallbackIndex?: number) => SeriesColorConfig;
  /** 获取通用颜色配置 */
  getCommonColors: () => import("@/types").ChartCommonColors;
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

  // ===== 新增：结构化颜色配置获取方法 =====

  const getSeriesConfig = useCallback(
    (key: string, fallbackIndex?: number): SeriesColorConfig => {
      // 优先使用结构化配置
      if (palette.structured?.seriesConfigs) {
        const keyIndex = derivedSeriesKeys.indexOf(key);
        const targetIndex = keyIndex >= 0 ? keyIndex : (fallbackIndex ?? 0);
        const config =
          palette.structured.seriesConfigs[targetIndex % palette.structured.seriesConfigs.length];

        if (config) {
          return config;
        }
      }

      // 回退到传统逻辑 - 基于现有颜色生成结构化配置
      const color = getSeriesColor(key, fallbackIndex);
      const { r, g, b } = (() => {
        const hex = color.replace("#", "");
        const num = parseInt(hex, 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255,
        };
      })();

      return {
        stroke: color,
        fill: `rgba(${r}, ${g}, ${b}, 0.2)`, // 默认20%透明度
      };
    },
    [palette.structured, derivedSeriesKeys, getSeriesColor]
  );

  const getCommonColors = useCallback(() => {
    // 优先使用结构化配置
    if (palette.structured?.common) {
      return palette.structured.common;
    }

    // 回退到传统字段映射
    return {
      background: palette.background,
      grid: palette.grid,
      label: palette.neutralStrong,
      tooltip: palette.background,
    };
  }, [palette]);

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

    // 新增的结构化颜色配置方法
    getSeriesConfig,
    getCommonColors,
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
