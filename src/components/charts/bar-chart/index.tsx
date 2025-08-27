"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
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
    if (typeof item[categoryKey] !== 'string') {
      errors.push(`数据点 ${index} 的分类字段 "${categoryKey}" 必须为字符串类型`);
    }
    
    // 检查数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== 'number' || isNaN(value)) {
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
export function BeautifulBarChart({ data, config, title, description, className }: BarChartProps) {
  // 数据验证
  const validation = validateBarChartData(data);
  
  if (!validation.isValid) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">数据格式错误</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm">• {error}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats } = validation;
  const { categoryKey, valueKeys } = stats;

  // 计算统计数据
  const dataRange = data.length > 0 
    ? `${data[0][categoryKey]} - ${data[data.length - 1][categoryKey]}` 
    : "";

  // 计算每个系列的最大值
  const maxValues = valueKeys.map(key => {
    const max = Math.max(...data.map(item => Number(item[key]) || 0));
    return { key, max };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">柱状图</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* 数据概览 */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground">数据点</p>
            <p className="font-semibold">{stats.dataPointCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">数据系列</p>
            <p className="font-semibold">{stats.seriesCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">数据范围</p>
            <p className="text-xs font-semibold">{dataRange}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">峰值数据</p>
            <div className="space-y-0.5">
              {maxValues.slice(0, 2).map(({ key, max }) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config[key]?.color || "var(--color-" + key + ")" }}
                  />
                  <span className="font-mono text-xs">{max.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
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
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground))"
              opacity={0.3}
            />
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={value => value.toLocaleString()}
            />
            {valueKeys.map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                name={String(config[key]?.label || key)}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{
                    fontSize: "11px",
                    fill: "#333",
                    fontWeight: "600",
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>

        {/* 完整数据表格 - 为静态导出显示所有数值 */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold">完整数据表</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-semibold">{categoryKey}</th>
                  {valueKeys.map(key => (
                    <th key={key} className="p-2 text-right font-semibold">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                        />
                        {config[key]?.label || key}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="p-2 font-mono">{item[categoryKey]}</td>
                    {valueKeys.map(key => (
                      <td key={key} className="p-2 text-right font-mono">
                        {Number(item[key]).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 统计摘要 */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {valueKeys.map(key => {
            const total = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
            const avg = total / data.length;
            return (
              <div key={key} className="flex items-center space-x-2 text-sm">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                />
                <div className="space-y-0.5">
                  <div className="font-medium">{config[key]?.label || key}</div>
                  <div className="text-muted-foreground text-xs">
                    平均: {avg.toFixed(1)} | 总计: {total.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 默认导出
export default BeautifulBarChart;