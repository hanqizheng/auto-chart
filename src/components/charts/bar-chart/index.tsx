"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useChartTheme } from "@/contexts/chart-theme-context";
import { BarChartProps, BarChartValidationResult, BarChartData } from "./types";

/**
 * 验证柱状图数据格式和完整性
 */
export function validateBarChartData(data: BarChartData): BarChartValidationResult {
  const errors: string[] = [];

  // 检查数据是否存在且非空
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return {
      isValid: false,
      errors,
      stats: {
        dataPointCount: 0,
        seriesCount: 0,
        categoryKey: "",
        valueKeys: [],
      },
    };
  }

  // 检查数据点结构一致性
  const firstItem = data[0];
  const keys = Object.keys(firstItem);

  if (keys.length < 2) {
    errors.push("每个数据点至少需要包含 2 个字段（1个分类字段 + 至少1个数值字段）");
  }

  const categoryKey = keys[0];
  const valueKeys = keys.slice(1);

  // 验证数据类型一致性
  data.forEach((item, index) => {
    const itemKeys = Object.keys(item);

    // 检查字段数量一致性
    if (itemKeys.length !== keys.length) {
      errors.push(`数据点 ${index} 的字段数量与第一个数据点不一致`);
    }

    // 检查分类字段类型
    if (typeof item[categoryKey] !== "string") {
      errors.push(`数据点 ${index} 的分类字段 "${categoryKey}" 必须为字符串类型`);
    }

    // 检查数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`数据点 ${index} 的数值字段 "${key}" 必须为有效数字`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      dataPointCount: data.length,
      seriesCount: valueKeys.length,
      categoryKey,
      valueKeys,
    },
  };
}

/**
 * 美化柱状图组件
 * 专为静态图像导出设计，显示完整的数据信息和统计分析
 */
export function BeautifulBarChart({
  data,
  config,
  title,
  description,
  className,
  barRadius = 4,
  showValueLabels = true,
  showGrid = true,
}: BarChartProps) {
  const { getSeriesColor, getCommonColors, palette } = useChartTheme();
  const commonColors = getCommonColors();
  // 数据验证
  const validation = validateBarChartData(data);

  if (!validation.isValid) {
    return (
      <div className={className}>
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

  const { stats } = validation;
  const { categoryKey, valueKeys } = stats;

  // 计算统计数据
  const dataRange =
    data.length > 0 ? `${data[0][categoryKey]} - ${data[data.length - 1][categoryKey]}` : "";

  // 计算每个系列的最大值
  const maxValues = valueKeys.map(key => {
    const max = Math.max(...data.map(item => Number(item[key]) || 0));
    return { key, max };
  });

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}

      <div className="py-4">
        <ChartContainer config={config}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={commonColors.grid} opacity={0.35} />
            )}
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: commonColors.label }}
              angle={0}
              textAnchor="middle"
              height={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: commonColors.label }}
              tickFormatter={value => value.toLocaleString()}
            />
            {valueKeys.map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={getSeriesColor(key)}
                radius={[barRadius, barRadius, 0, 0]}
                name={String(config[key]?.label || key)}
              >
                {showValueLabels && (
                  <LabelList
                    dataKey={key}
                    position="top"
                    style={{
                      fontSize: "11px",
                      fill: commonColors.label,
                      fontWeight: "600",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// 默认导出
export default BeautifulBarChart;
