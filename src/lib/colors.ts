import {
  ChartPalette,
  ChartTheme,
  SeriesColorConfig,
  ChartCommonColors,
  StructuredChartColors,
} from "@/types";

const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const DEFAULT_CHART_BASE_COLOR = "#22c55e";

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

type ColorAdjustment = { hue?: number; saturation?: number; lightness?: number };

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const expandToSixDigitHex = (hex: string): string => {
  if (hex.length === 3) {
    return hex
      .split("")
      .map(char => `${char}${char}`)
      .join("");
  }
  return hex;
};

export const normalizeHexColor = (
  input: string | undefined | null,
  fallback = DEFAULT_CHART_BASE_COLOR
): string => {
  if (!input) {
    return fallback;
  }

  const trimmed = input.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return fallback;
  }

  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  return `#${expandToSixDigitHex(hex.toLowerCase())}`;
};

const hexToRgb = (hex: string): RGB => {
  const normalized = normalizeHexColor(hex);
  const value = normalized.replace("#", "");
  const bigint = parseInt(value, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (num: number) => num.toString(16).padStart(2, "0");
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
};

const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s, l };
};

const hslToRgb = ({ h, s, l }: HSL): RGB => {
  const hue = ((h % 360) + 360) % 360;

  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToRgb = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const r = hueToRgb(hue / 360 + 1 / 3) * 255;
  const g = hueToRgb(hue / 360) * 255;
  const b = hueToRgb(hue / 360 - 1 / 3) * 255;

  return { r, g, b };
};

const hslToHex = (hsl: HSL): string => rgbToHex(hslToRgb(hsl));

const applyAdjustment = (hsl: HSL, adjustment: ColorAdjustment): HSL => ({
  h: (((hsl.h + (adjustment.hue || 0)) % 360) + 360) % 360,
  s: clamp(hsl.s + (adjustment.saturation || 0)),
  l: clamp(hsl.l + (adjustment.lightness || 0)),
});

const generateSeriesColors = (baseColor: string, count: number): string[] => {
  const baseHsl = rgbToHsl(hexToRgb(baseColor));
  const adjustments: ColorAdjustment[] = [
    { hue: 0, saturation: 0, lightness: 0 },
    { hue: 16, saturation: -0.04, lightness: -0.05 },
    { hue: -18, saturation: -0.05, lightness: 0.08 },
    { hue: 32, saturation: 0.02, lightness: -0.12 },
    { hue: -32, saturation: 0.04, lightness: 0.12 },
    { hue: 48, saturation: 0, lightness: -0.18 },
  ];

  return Array.from({ length: Math.max(count, 1) }).map((_, index) => {
    const adjustment = adjustments[index % adjustments.length];
    const adjustedHsl = applyAdjustment(baseHsl, adjustment);
    return hslToHex(adjustedHsl);
  });
};

/**
 * 生成结构化颜色配置 - 新增功能
 * @param baseColor 基础颜色
 * @param count 需要生成的系列数量
 * @param fillOpacity 填充色透明度 (0-1)
 * @returns 结构化的系列颜色配置
 */
export const generateSeriesConfigs = (
  baseColor: string,
  count: number,
  fillOpacity: number = 0.2
): SeriesColorConfig[] => {
  const mainColors = generateSeriesColors(baseColor, count);

  return mainColors.map(color => {
    const { r, g, b } = hexToRgb(color);
    return {
      stroke: color,
      fill: `rgba(${r}, ${g}, ${b}, ${fillOpacity})`,
    };
  });
};

/**
 * 生成通用颜色配置 - 新增功能
 * @param baseColor 基础颜色
 * @returns 通用颜色配置
 */
export const generateCommonColors = (baseColor: string): ChartCommonColors => {
  const baseHsl = rgbToHsl(hexToRgb(baseColor));

  return {
    background: "transparent", // 保持透明，让容器控制背景
    grid: hslToHex(applyAdjustment(baseHsl, { saturation: -0.35, lightness: 0.15 })),
    label: hslToHex(applyAdjustment(baseHsl, { saturation: -0.4, lightness: -0.25 })),
    tooltip: hslToHex(applyAdjustment(baseHsl, { saturation: -0.5, lightness: 0.42 })),
  };
};

/**
 * 生成完整的结构化颜色配置 - 新增功能
 * @param baseColor 基础颜色
 * @param seriesCount 系列数量
 * @param fillOpacity 填充色透明度
 * @returns 完整的结构化颜色配置
 */
export const generateStructuredColors = (
  baseColor: string,
  seriesCount: number,
  fillOpacity: number = 0.2
): StructuredChartColors => {
  return {
    common: generateCommonColors(baseColor),
    seriesConfigs: generateSeriesConfigs(baseColor, seriesCount, fillOpacity),
  };
};

export const createChartPalette = (baseColor: string, seriesCount = 4): ChartPalette => {
  const normalizedBase = normalizeHexColor(baseColor);
  const baseHsl = rgbToHsl(hexToRgb(normalizedBase));

  const primarySoft = hslToHex(applyAdjustment(baseHsl, { lightness: 0.18 }));
  const primaryStrong = hslToHex(applyAdjustment(baseHsl, { lightness: -0.18 }));
  const accent = hslToHex(applyAdjustment(baseHsl, { hue: 36, lightness: 0.02 }));
  const accentSoft = hslToHex(applyAdjustment(baseHsl, { hue: -24, lightness: 0.18 }));

  const neutralBase = applyAdjustment(baseHsl, { saturation: -0.4 });
  const neutral = hslToHex(applyAdjustment(neutralBase, { lightness: 0.35 }));
  const neutralStrong = hslToHex(applyAdjustment(neutralBase, { lightness: -0.25 }));
  const background = hslToHex(applyAdjustment(baseHsl, { saturation: -0.5, lightness: 0.42 }));
  const grid = hslToHex(applyAdjustment(baseHsl, { saturation: -0.35, lightness: 0.15 }));

  const series = generateSeriesColors(normalizedBase, seriesCount);

  // 生成结构化颜色配置
  const structured = generateStructuredColors(normalizedBase, seriesCount);

  return {
    // 保持向后兼容的原有字段
    primary: normalizedBase,
    primarySoft,
    primaryStrong,
    accent,
    accentSoft,
    neutral,
    neutralStrong,
    background,
    grid,
    series,

    // 新增的结构化配置
    structured,
  };
};

export const createChartTheme = (
  baseColor: string,
  seriesCount = 4,
  name?: string
): ChartTheme => ({
  baseColor: normalizeHexColor(baseColor),
  palette: createChartPalette(baseColor, seriesCount),
  generatedAt: new Date().toISOString(),
  name,
});

export const ensureChartTheme = (
  theme: ChartTheme | undefined,
  seriesCount = 4,
  fallbackColor = DEFAULT_CHART_BASE_COLOR
): ChartTheme => {
  const normalizedFallback = normalizeHexColor(fallbackColor);

  if (!theme) {
    return createChartTheme(normalizedFallback, seriesCount);
  }

  const normalizedBase = normalizeHexColor(theme.baseColor, normalizedFallback);
  const needsRebuild =
    normalizedBase !== normalizeHexColor(theme.baseColor, normalizedBase) ||
    theme.palette.series.length !== seriesCount;

  if (needsRebuild) {
    return createChartTheme(normalizedBase, seriesCount, theme.name);
  }

  return {
    ...theme,
    baseColor: normalizedBase,
    palette:
      theme.palette.series.length === seriesCount
        ? theme.palette
        : createChartPalette(normalizedBase, seriesCount),
  };
};

export type SeriesColorMap = Record<string, string>;

export const mapSeriesKeysToColors = (keys: string[], palette: ChartPalette): SeriesColorMap => {
  const colors = palette.series.length
    ? palette.series
    : generateSeriesColors(palette.primary, keys.length || 1);

  return keys.reduce<SeriesColorMap>((acc, key, index) => {
    acc[key] = colors[index % colors.length];
    return acc;
  }, {});
};

export const applyPaletteToConfig = (
  config: Record<string, any>,
  palette: ChartPalette,
  keys: string[]
): Record<string, any> => {
  if (!config) {
    return {};
  }

  const colorMap = mapSeriesKeysToColors(keys, palette);

  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (key in colorMap) {
        return [key, { ...value, color: colorMap[key] }];
      }
      return [key, value];
    })
  );
};
