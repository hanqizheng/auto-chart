"use client";

import { Cell, Legend, Pie, PieChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChartProps,
  PieChartValidationResult,
  PieChartData,
  PieChartAnalysis,
  PIE_CHART_DEFAULTS,
} from "./types";
import { useChartTheme } from "@/contexts/chart-theme-context";
import { cn } from "@/lib/utils";

/**
 * 分析饼图数据分布
 */
export function analyzePieChartData(data: PieChartData): PieChartAnalysis {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      total: 0,
      largest: { name: "", value: 0, percentage: 0 },
      smallest: { name: "", value: 0, percentage: 0 },
      categoryCount: 0,
      concentration: 0,
      isHighlyConcentrated: false,
    };
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return {
      total: 0,
      largest: { name: data[0].name, value: data[0].value, percentage: 0 },
      smallest: {
        name: data[data.length - 1].name,
        value: data[data.length - 1].value,
        percentage: 0,
      },
      categoryCount: data.length,
      concentration: 0,
      isHighlyConcentrated: false,
    };
  }

  // 按数值排序
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  const largest = {
    name: sortedData[0].name,
    value: sortedData[0].value,
    percentage: (sortedData[0].value / total) * 100,
  };

  const smallest = {
    name: sortedData[sortedData.length - 1].name,
    value: sortedData[sortedData.length - 1].value,
    percentage: (sortedData[sortedData.length - 1].value / total) * 100,
  };

  // 计算集中度（前3名占比）
  const top3Total = sortedData.slice(0, 3).reduce((sum, item) => sum + item.value, 0);
  const concentration = (top3Total / total) * 100;

  return {
    total,
    largest,
    smallest,
    categoryCount: data.length,
    concentration,
    isHighlyConcentrated: concentration > 80,
  };
}

/**
 * 验证饼图数据格式和完整性
 */
export function validatePieChartData(data: PieChartData): PieChartValidationResult {
  const errors: string[] = [];
  const stats = {
    dataPointCount: 0,
    totalValue: 0,
    hasValidNames: true,
    hasValidValues: true,
    hasZeroValues: false,
    hasNegativeValues: false,
  };

  // 检查数据是否存在且非空
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return { isValid: false, errors, stats };
  }

  // 饼图至少需要2个数据点
  if (data.length < 2) {
    errors.push("饼图至少需要2个数据点才能形成有意义的分布");
  }

  stats.dataPointCount = data.length;

  // 验证每个数据点的格式
  data.forEach((item, index) => {
    // 检查数据点是否为有效对象
    if (!item || typeof item !== "object") {
      errors.push(`数据点 ${index} 必须为有效对象`);
      return;
    }

    // 检查名称字段
    if (!("name" in item) || typeof item.name !== "string" || item.name.trim() === "") {
      errors.push(`数据点 ${index} 必须包含非空的 name 字段`);
      stats.hasValidNames = false;
    }

    // 检查数值字段
    if (!("value" in item) || typeof item.value !== "number" || isNaN(item.value)) {
      errors.push(`数据点 ${index} 的 value 字段必须为有效数字`);
      stats.hasValidValues = false;
    } else {
      stats.totalValue += item.value;

      if (item.value === 0) {
        stats.hasZeroValues = true;
      }

      if (item.value < 0) {
        errors.push(`数据点 ${index} 的数值不能为负数`);
        stats.hasNegativeValues = true;
      }
    }
  });

  // 检查总值是否有效
  if (stats.totalValue === 0) {
    errors.push("所有数据点的总和不能为零");
  }

  // 检查名称重复
  const names = data.map(item => item.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`发现重复的分类名称: ${duplicates.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    stats,
  };
}

/**
 * 格式化百分比标签
 */
const formatPercentageLabel = (entry: any, total: number): string => {
  if (!total || total <= 0) {
    return "0%";
  }
  const percentage = ((entry.value / total) * 100).toFixed(1);
  return `${percentage}%`;
};

/**
 * 美化饼图组件
 * 专为分布分析设计，显示完整的分类信息和统计分析
 */
export function BeautifulPieChart({
  data,
  config,
  title,
  description,
  className,
  showPercentage = PIE_CHART_DEFAULTS.showPercentage,
  showLegend = PIE_CHART_DEFAULTS.showLegend,
  innerRadius = PIE_CHART_DEFAULTS.innerRadius,
  outerRadius = PIE_CHART_DEFAULTS.outerRadius,
}: PieChartProps) {
  const { pieSliceColors, palette } = useChartTheme();
  const outerClasses = cn("flex h-full w-full flex-col", className);

  // 数据验证
  const validation = validatePieChartData(data);

  if (!validation.isValid) {
    return (
      <div className={outerClasses}>
        <h3 className="mb-2 text-lg font-semibold text-red-600">数据格式错误</h3>
        <div className="space-y-1 text-red-600">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm">
              • {error}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // 过滤有效数据
  const validData = data.filter(
    item => item && typeof item.value === "number" && !isNaN(item.value) && item.value > 0
  );

  if (validData.length < 2) {
    return (
      <div className={outerClasses}>
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Not enough non-zero categories to render a pie chart.
        </div>
      </div>
    );
  }

  // 分析数据
  const analysis = analyzePieChartData(validData);
  const total =
    analysis.total > 0 ? analysis.total : validData.reduce((sum, item) => sum + item.value, 0);

  // 选择颜色调色板，避免对零长度数组取模
  const colorPalette = (() => {
    if (pieSliceColors.length > 0) {
      return pieSliceColors;
    }
    if (palette.series.length > 0) {
      return palette.series;
    }
    return [palette.primary];
  })();

  // 准备图表数据并分配颜色
  const chartData = validData.map((item, index) => ({
    ...item,
    color: colorPalette[index % colorPalette.length],
  }));

  const effectiveOuterRadius =
    typeof outerRadius === "number" ? Math.min(outerRadius, 96) : outerRadius;

  return (
    <div className={outerClasses}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}

      <div className="flex-1 py-2">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square min-h-[260px] w-full max-w-[360px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={effectiveOuterRadius}
              paddingAngle={PIE_CHART_DEFAULTS.paddingAngle}
              dataKey="value"
              startAngle={PIE_CHART_DEFAULTS.startAngle}
              endAngle={PIE_CHART_DEFAULTS.endAngle}
              label={showPercentage ? entry => formatPercentageLabel(entry, total) : undefined}
              labelLine={PIE_CHART_DEFAULTS.showConnectorLine}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span className="text-sm" style={{ color: palette.neutralStrong }}>
                    {value} (
                    {entry?.payload && total > 0
                      ? ((entry.payload.value / total) * 100).toFixed(1)
                      : "0"}
                    %)
                  </span>
                )}
              />
            )}
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// 默认导出
export default BeautifulPieChart;
