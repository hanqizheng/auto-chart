"use client";

import { Activity, BarChart2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  AreaChartProps,
  AreaChartValidationResult,
  AreaChartData,
  EnhancedAreaChartDataPoint,
  AreaSeriesAnalysis,
  AREA_CHART_DEFAULTS
} from "./types";

/**
 * 计算面积图系列分析
 */
export function analyzeAreaSeries(data: AreaChartData, valueKeys: string[]): AreaSeriesAnalysis[] {
  const xAxisKey = Object.keys(data[0])[0];
  
  return valueKeys.map(key => {
    const values = data.map(item => Number(item[key]) || 0);
    const totalAccumulated = values.reduce((sum, val) => sum + val, 0);
    const average = totalAccumulated / values.length;
    
    // 找到峰值和谷值
    const peakIndex = values.indexOf(Math.max(...values));
    const valleyIndex = values.indexOf(Math.min(...values));
    
    const peak = {
      value: values[peakIndex],
      period: data[peakIndex][xAxisKey]
    };
    
    const valley = {
      value: values[valleyIndex],
      period: data[valleyIndex][xAxisKey]
    };
    
    // 计算增长趋势
    const firstQuarter = values.slice(0, Math.ceil(values.length / 4));
    const lastQuarter = values.slice(Math.floor(values.length * 0.75));
    const firstAvg = firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length;
    
    let growthTrend: AreaSeriesAnalysis['growthTrend'] = 'stable';
    const growthRate = (lastAvg - firstAvg) / firstAvg;
    
    if (Math.abs(growthRate) < 0.05) {
      growthTrend = 'stable';
    } else if (growthRate > 0.2) {
      growthTrend = 'increasing';
    } else if (growthRate < -0.2) {
      growthTrend = 'decreasing';
    } else {
      growthTrend = 'volatile';
    }
    
    // 计算变异系数
    const standardDeviation = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
    );
    const coefficientOfVariation = average !== 0 ? (standardDeviation / average) * 100 : 0;
    
    return {
      key,
      totalAccumulated,
      average,
      peak,
      valley,
      growthTrend,
      coefficientOfVariation
    };
  });
}

/**
 * 验证面积图数据格式和完整性
 */
export function validateAreaChartData(data: AreaChartData): AreaChartValidationResult {
  const errors: string[] = [];
  const stats = {
    dataPointCount: 0,
    seriesCount: 0,
    xAxisKey: "",
    valueKeys: [] as string[],
    hasNegativeValues: false,
    totalRange: { min: 0, max: 0 }
  };
  
  // 检查数据是否存在且非空
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push("数据不能为空");
    return { isValid: false, errors, stats };
  }
  
  // 面积图至少需要2个数据点
  if (data.length < 2) {
    errors.push("面积图至少需要2个数据点才能形成面积效果");
  }
  
  stats.dataPointCount = data.length;
  
  // 检查数据点结构一致性
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  if (keys.length < 2) {
    errors.push("每个数据点至少需要包含 2 个字段（1个X轴字段 + 至少1个Y轴数值字段）");
  }
  
  const xAxisKey = keys[0];
  const valueKeys = keys.slice(1);
  
  stats.xAxisKey = xAxisKey;
  stats.valueKeys = valueKeys;
  stats.seriesCount = valueKeys.length;
  
  let allValues: number[] = [];
  
  // 验证数据类型一致性
  data.forEach((item, index) => {
    const itemKeys = Object.keys(item);
    
    // 检查字段数量一致性
    if (itemKeys.length !== keys.length) {
      errors.push(`数据点 ${index} 的字段数量与第一个数据点不一致`);
    }
    
    // 检查X轴字段
    const xValue = item[xAxisKey];
    if (typeof xValue !== 'string' && typeof xValue !== 'number') {
      errors.push(`数据点 ${index} 的X轴字段 "${xAxisKey}" 必须为字符串或数字类型`);
    }
    
    // 检查Y轴数值字段类型
    valueKeys.forEach(key => {
      const value = item[key];
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`数据点 ${index} 的数值字段 "${key}" 必须为有效数字`);
      } else {
        allValues.push(value);
        if (value < 0) {
          stats.hasNegativeValues = true;
        }
      }
    });
  });
  
  // 计算数值范围
  if (allValues.length > 0) {
    stats.totalRange = {
      min: Math.min(...allValues),
      max: Math.max(...allValues)
    };
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    stats
  };
}

/**
 * 美化面积图组件
 * 专为累积数据和容量分析设计，显示完整的面积分析和增长统计
 */
export function BeautifulAreaChart({
  data,
  config,
  title,
  description,
  className,
  stacked = AREA_CHART_DEFAULTS.stacked,
  showTotalLine = AREA_CHART_DEFAULTS.showTotalLine,
  showGrowthRate = AREA_CHART_DEFAULTS.showGrowthRate,
  fillOpacity = AREA_CHART_DEFAULTS.fillOpacity,
}: AreaChartProps) {
  // 数据验证
  const validation = validateAreaChartData(data);
  
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
  const { xAxisKey, valueKeys } = stats;
  
  // 计算累积总计和增长率
  const enhancedData: EnhancedAreaChartDataPoint[] = data.map((item, index) => {
    const total = valueKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    const prevTotal = index > 0
      ? valueKeys.reduce((sum, key) => sum + (Number(data[index - 1][key]) || 0), 0)
      : total;
    const growth = prevTotal !== 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
    
    return {
      ...item,
      _total: total,
      _growth: growth,
    } as EnhancedAreaChartDataPoint;
  });
  
  // 计算面积统计分析
  const seriesAnalysis = analyzeAreaSeries(data, valueKeys);
  
  // 计算整体统计
  const totalMaxValue = Math.max(...enhancedData.map(item => item._total));
  const totalAverage = enhancedData.reduce((sum, item) => sum + item._total, 0) / enhancedData.length;
  const bestGrowthPeriod = enhancedData.reduce((best, current) => 
    current._growth > best._growth ? current : best
  );
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="text-muted-foreground text-sm font-normal">面积图</div>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        
        {/* 面积概览指标 */}
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
            <p className="text-muted-foreground">峰值总量</p>
            <p className="font-semibold">{totalMaxValue.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">平均总量</p>
            <p className="font-semibold">{totalAverage.toFixed(0).toLocaleString()}</p>
          </div>
        </div>
        
        {/* 系列分析摘要 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {seriesAnalysis.map(({ key, totalAccumulated, growthTrend, coefficientOfVariation }) => (
            <div key={key} className="bg-muted/30 space-y-2 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: config[key]?.color || `var(--color-${key})` }}
                  />
                  <span className="text-sm font-medium">{config[key]?.label || key}</span>
                </div>
                <div className="flex items-center gap-1">
                  {growthTrend === "increasing" && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {growthTrend === "decreasing" && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                  {growthTrend === "volatile" && <Activity className="h-4 w-4 text-amber-500" />}
                  {growthTrend === "stable" && <BarChart2 className="h-4 w-4 text-gray-500" />}
                </div>
              </div>
              <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                <div>累积: {totalAccumulated.toLocaleString()}</div>
                <div>波动: {coefficientOfVariation.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart
            data={enhancedData}
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
              dataKey={xAxisKey}
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
            
            {/* 总计参考线 */}
            {showTotalLine && (
              <ReferenceLine
                y={totalAverage}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}
            
            {/* 面积渲染 */}
            {valueKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "1" : undefined}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={fillOpacity}
                strokeWidth={AREA_CHART_DEFAULTS.strokeWidth}
                name={String(config[key]?.label || key)}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        
        {/* 完整数据表格 */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold">完整数据表</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-semibold">{xAxisKey}</th>
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
                  <th className="p-2 text-right font-semibold">总计</th>
                  {showGrowthRate && <th className="p-2 text-right font-semibold">增长率</th>}
                </tr>
              </thead>
              <tbody>
                {enhancedData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="p-2 font-mono">{item[xAxisKey]}</td>
                    {valueKeys.map(key => (
                      <td key={key} className="p-2 text-right font-mono">
                        {Number(item[key]).toLocaleString()}
                      </td>
                    ))}
                    <td className="p-2 text-right font-mono font-semibold">
                      {item._total.toLocaleString()}
                    </td>
                    {showGrowthRate && (
                      <td className={`p-2 text-right font-mono ${
                        item._growth > 0 ? 'text-green-600' : 
                        item._growth < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item._growth > 0 ? '+' : ''}{item._growth.toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 面积分析摘要 */}
        <div className="bg-muted/30 mt-4 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-semibold">面积分析摘要</h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">时间范围</p>
              <p className="font-mono text-xs">
                {data[0][xAxisKey]} → {data[data.length - 1][xAxisKey]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">最佳增长期</p>
              <p className="font-mono text-xs">{bestGrowthPeriod[xAxisKey]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">平均线</p>
              <p className="font-mono">{totalAverage.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">数据质量</p>
              <p className="font-mono text-xs">
                {stats.hasNegativeValues ? "包含负值" : "数据完整"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 默认导出
export default BeautifulAreaChart;