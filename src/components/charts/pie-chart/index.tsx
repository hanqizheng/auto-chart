"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChartProps,
  PieChartValidationResult,
  PieChartData,
  PieChartAnalysis,
  PIE_CHART_DEFAULTS,
} from "./types";
import { useChartTheme } from "@/contexts/chart-theme-context";

/**
 * 分析饼图数据分布
 */
export function analyzePieChartData(data: PieChartData): PieChartAnalysis {
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
  // 数据验证
  const validation = validatePieChartData(data);

  if (!validation.isValid) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">数据格式错误</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-red-600">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm">
                • {error}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 过滤有效数据
  const validData = data.filter(
    item => item && typeof item.value === "number" && !isNaN(item.value) && item.value > 0
  );

  // 分析数据
  const analysis = analyzePieChartData(validData);

  // 准备图表数据并分配颜色
  const chartData = validData.map((item, index) => ({
    ...item,
    color: pieSliceColors[index % pieSliceColors.length] || palette.series[index % palette.series.length] || palette.primary,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">饼图</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <ChartContainer config={config}>
            <PieChart width={600} height={400}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={PIE_CHART_DEFAULTS.paddingAngle}
              dataKey="value"
              startAngle={PIE_CHART_DEFAULTS.startAngle}
              endAngle={PIE_CHART_DEFAULTS.endAngle}
              label={
                showPercentage ? entry => formatPercentageLabel(entry, analysis.total) : undefined
              }
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
                    {entry?.payload
                      ? ((entry.payload.value / analysis.total) * 100).toFixed(1)
                      : "0"}
                    %)
                  </span>
                )}
              />
            )}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 默认导出
export default BeautifulPieChart;
