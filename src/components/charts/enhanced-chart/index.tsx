"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { useBetterScreenshot } from "@/hooks/use-better-screenshot";
import { BeautifulAreaChart } from "../area-chart";
import { BeautifulBarChart } from "../bar-chart";
import { BeautifulLineChart } from "../line-chart";
import { BeautifulPieChart } from "../pie-chart";
import {
  EnhancedChartProps,
  StandardChartData,
  ChartTypeValidationResult,
  ExportConfig,
  ShareConfig,
  ENHANCED_CHART_DEFAULTS,
} from "./types";
import { PieChartData } from "../pie-chart/types";

/**
 * 验证数据与图表类型的兼容性
 */
export function validateChartTypeCompatibility(
  data: EnhancedChartProps["data"],
  type: EnhancedChartProps["type"]
): ChartTypeValidationResult {
  const errors: string[] = [];
  let isValid = true;

  // 基础数据检查
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    isValid = false;
    return {
      isValid,
      errors,
      dataStats: {
        pointCount: 0,
        seriesCount: 0,
        hasTimeData: false,
        hasCategoryData: false,
        hasNumericalData: false,
      },
    };
  }

  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const pointCount = data.length;

  // 检查数据格式
  const isPieFormat = "name" in firstItem && "value" in firstItem;
  const isStandardFormat = keys.length >= 2 && !isPieFormat;

  let seriesCount = 0;
  let hasTimeData = false;
  let hasCategoryData = false;
  let hasNumericalData = false;

  if (isPieFormat) {
    seriesCount = 1;
    hasCategoryData = true;
    hasNumericalData = true;
  } else if (isStandardFormat) {
    seriesCount = keys.length - 1; // 除去第一个键（通常是分类/时间）

    // 检查第一个键是否是时间数据
    const firstKey = keys[0];
    const firstValue = firstItem[firstKey];
    if (typeof firstValue === "string") {
      hasTimeData = /\d{4}|\d{1,2}月|Q\d|week|day|年|季度/i.test(firstValue);
      hasCategoryData = !hasTimeData;
    }

    // 检查是否有数值数据
    hasNumericalData = keys
      .slice(1)
      .some(key => data.some(item => typeof (item as any)[key] === "number"));
  }

  // 图表类型兼容性验证
  switch (type) {
    case "pie":
      if (!isPieFormat && !isStandardFormat) {
        errors.push("饼图需要包含 name 和 value 字段，或标准的分类数据格式");
        isValid = false;
      }
      if (pointCount < 2) {
        errors.push("饼图至少需要2个数据点");
        isValid = false;
      }
      break;

    case "bar":
    case "line":
    case "area":
      if (isPieFormat) {
        errors.push(`${type}图不支持饼图数据格式，请使用标准数据格式`);
        isValid = false;
      }
      if (pointCount < 2) {
        errors.push(`${type}图至少需要2个数据点`);
        isValid = false;
      }
      if (seriesCount < 1) {
        errors.push(`${type}图至少需要1个数值系列`);
        isValid = false;
      }
      break;

    default:
      errors.push(`不支持的图表类型: ${type}`);
      isValid = false;
  }

  return {
    isValid,
    errors,
    dataStats: {
      pointCount,
      seriesCount,
      hasTimeData,
      hasCategoryData,
      hasNumericalData,
    },
  };
}

/**
 * 数据格式转换：标准数据转饼图数据
 */
export function transformToPieData(data: StandardChartData): PieChartData {
  if (data.length === 0) return [];

  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const nameKey = keys[0]; // 第一个键作为名称
  const valueKeys = keys.slice(1); // 其余键作为数值

  // 如果只有一个数值列，直接转换
  if (valueKeys.length === 1) {
    const valueKey = valueKeys[0];
    return data.map(item => ({
      name: String(item[nameKey]),
      value: Number(item[valueKey]) || 0,
    }));
  }

  // 如果有多个数值列，聚合所有数值
  return data.map(item => {
    const total = valueKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    return {
      name: String(item[nameKey]),
      value: total,
    };
  });
}

/**
 * 增强图表组件
 * 统一的图表包装器，支持所有图表类型和导出功能
 */
export const EnhancedChart = forwardRef<
  {
    exportChart: (config?: Partial<ExportConfig>) => Promise<void>;
    shareChart: (config?: Partial<ShareConfig>) => Promise<void>;
  },
  EnhancedChartProps
>(function EnhancedChart({
  type,
  data,
  config,
  title,
  description,
  className = ENHANCED_CHART_DEFAULTS.className,
  stacked = ENHANCED_CHART_DEFAULTS.stacked,
  fillOpacity = ENHANCED_CHART_DEFAULTS.fillOpacity,
  innerRadius = ENHANCED_CHART_DEFAULTS.innerRadius,
  outerRadius = ENHANCED_CHART_DEFAULTS.outerRadius,
  showPercentage = ENHANCED_CHART_DEFAULTS.showPercentage,
  showLegend = ENHANCED_CHART_DEFAULTS.showLegend,
}, ref) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { isCapturing, error, exportChart } = useBetterScreenshot();

  // 暴露导出和分享方法给父组件
  useImperativeHandle(ref, () => ({
    exportChart: handleExport,
    shareChart: handleShare,
  }), []);

  // 验证数据兼容性
  const validation = validateChartTypeCompatibility(data, type);

  if (!validation.isValid) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">数据格式错误</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {validation.errors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 导出配置
  const handleExport = async (config?: Partial<ExportConfig>) => {
    if (!chartRef.current) return;

    try {
      const exportConfig = {
        ...ENHANCED_CHART_DEFAULTS.export,
        ...config,
      };

      const filename =
        exportConfig.filename ||
        `${title?.replace(/[^a-z0-9]/gi, "_") || "chart"}.${exportConfig.format}`;

      await exportChart(chartRef.current, filename);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // 分享配置
  const handleShare = async (config?: Partial<ShareConfig>) => {
    if (!chartRef.current) return;

    try {
      const shareConfig = {
        ...ENHANCED_CHART_DEFAULTS.share,
        title: title || ENHANCED_CHART_DEFAULTS.share.title,
        text: description || ENHANCED_CHART_DEFAULTS.share.text,
        url: window.location.href,
        ...config,
      };

      // 现代浏览器的 Web Share API
      if (navigator.share && typeof navigator.canShare === "function") {
        await navigator.share({
          title: shareConfig.title,
          text: shareConfig.text,
          url: shareConfig.url,
        });
      } else {
        // 降级方案：复制到剪贴板
        await navigator.clipboard.writeText(shareConfig.url);
        // 这里可以显示一个 toast 通知，但现在先用 alert
        alert("链接已复制到剪贴板!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  // 渲染对应的图表组件
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BeautifulBarChart
            data={data as StandardChartData}
            config={config}
            title={title}
            description={description}
          />
        );

      case "line":
        return (
          <BeautifulLineChart
            data={data as StandardChartData}
            config={config}
            title={title}
            description={description}
          />
        );

      case "pie":
        // 数据格式转换处理
        let pieData: PieChartData;
        if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0];
          if ("name" in firstItem && "value" in firstItem) {
            // 已经是饼图格式
            pieData = data as PieChartData;
          } else {
            // 转换标准数据为饼图格式
            pieData = transformToPieData(data as StandardChartData);
          }
        } else {
          pieData = [];
        }

        return (
          <BeautifulPieChart
            data={pieData}
            config={config}
            title={title}
            description={description}
            showPercentage={showPercentage}
            showLegend={showLegend}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
          />
        );

      case "area":
        return (
          <BeautifulAreaChart
            data={data as StandardChartData}
            config={config}
            title={title}
            description={description}
            stacked={stacked}
            fillOpacity={fillOpacity}
          />
        );

      default:
        return (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">不支持的图表类型: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {/* 错误显示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20 mb-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">❌ 导出错误</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 图表容器 */}
      <div ref={chartRef} data-chart-container className="no-capture-controls">
        {renderChart()}
      </div>

      {/* 开发模式说明 */}
      {process.env.NODE_ENV === "development" && (
        <div className="no-capture mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>开发模式:</strong> 为了获得最佳的截图质量，你也可以使用系统的原生截图工具
            (Mac 上的 Cmd+Shift+4，Windows 上的 Win+Shift+S) 直接截取图表区域。
          </p>
        </div>
      )}
    </div>
  );
});

// 默认导出
export default EnhancedChart;
