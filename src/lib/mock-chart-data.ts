/**
 * Mock 图表数据 - 用于测试导出功能
 */

import { ChartConfig } from "@/components/ui/chart";

// 标准图表数据格式（用于 bar, line, area）
export interface StandardMockData {
  name: string;
  [key: string]: string | number;
}

// 饼图数据格式
export interface PieMockData {
  name: string;
  value: number;
}

// 柱状图测试数据
export const mockBarData: StandardMockData[] = [
  { name: "1月", 销售额: 4000, 利润: 2400, 成本: 1600 },
  { name: "2月", 销售额: 3000, 利润: 1398, 成本: 1602 },
  { name: "3月", 销售额: 2000, 利润: 9800, 成本: 800 },
  { name: "4月", 销售额: 2780, 利润: 3908, 成本: 872 },
  { name: "5月", 销售额: 1890, 利润: 4800, 成本: 1090 },
  { name: "6月", 销售额: 2390, 利润: 3800, 成本: 590 },
];

export const mockBarConfig: ChartConfig = {
  销售额: {
    label: "销售额",
    color: "hsl(220, 70%, 50%)", // blue
  },
  利润: {
    label: "利润", 
    color: "hsl(160, 60%, 45%)", // green
  },
  成本: {
    label: "成本",
    color: "hsl(30, 80%, 55%)", // orange
  },
};

// 折线图测试数据
export const mockLineData: StandardMockData[] = [
  { name: "周一", 访问量: 1200, 转化率: 85, 点击量: 1020 },
  { name: "周二", 访问量: 1900, 转化率: 92, 点击量: 1748 },
  { name: "周三", 访问量: 3000, 转化率: 78, 点击量: 2340 },
  { name: "周四", 访问量: 5000, 转化率: 95, 点击量: 4750 },
  { name: "周五", 访问量: 4200, 转化率: 88, 点击量: 3696 },
  { name: "周六", 访问量: 3200, 转化率: 82, 点击量: 2624 },
  { name: "周日", 访问量: 2800, 转化率: 90, 点击量: 2520 },
];

export const mockLineConfig: ChartConfig = {
  访问量: {
    label: "访问量",
    color: "hsl(280, 65%, 60%)", // purple
  },
  转化率: {
    label: "转化率(%)",
    color: "hsl(340, 75%, 55%)", // pink
  },
  点击量: {
    label: "点击量",
    color: "hsl(200, 80%, 50%)", // cyan
  },
};

// 面积图测试数据
export const mockAreaData: StandardMockData[] = [
  { name: "Q1", 收入: 15000, 支出: 12000, 净利润: 3000 },
  { name: "Q2", 收入: 18000, 支出: 14000, 净利润: 4000 },
  { name: "Q3", 收入: 22000, 支出: 16000, 净利润: 6000 },
  { name: "Q4", 收入: 25000, 支出: 18000, 净利润: 7000 },
];

export const mockAreaConfig: ChartConfig = {
  收入: {
    label: "收入",
    color: "hsl(120, 70%, 50%)", // bright green
  },
  支出: {
    label: "支出",
    color: "hsl(0, 70%, 50%)", // red
  },
  净利润: {
    label: "净利润",
    color: "hsl(240, 70%, 50%)", // blue
  },
};

// 饼图测试数据
export const mockPieData: PieMockData[] = [
  { name: "移动端", value: 65 },
  { name: "桌面端", value: 25 },
  { name: "平板端", value: 8 },
  { name: "其他", value: 2 },
];

export const mockPieConfig: ChartConfig = {
  移动端: {
    label: "移动端",
    color: "hsl(220, 70%, 50%)",
  },
  桌面端: {
    label: "桌面端", 
    color: "hsl(160, 60%, 45%)",
  },
  平板端: {
    label: "平板端",
    color: "hsl(30, 80%, 55%)",
  },
  其他: {
    label: "其他",
    color: "hsl(280, 65%, 60%)",
  },
};

// SimpleChart 测试数据（仅支持 bar 和 line）
export const mockSimpleBarData = [
  { category: "产品A", sales: 1200, profit: 800 },
  { category: "产品B", sales: 1900, profit: 1200 },
  { category: "产品C", sales: 3000, profit: 1800 },
  { category: "产品D", sales: 5000, profit: 3000 },
  { category: "产品E", sales: 4200, profit: 2500 },
];

export const mockSimpleBarConfig: ChartConfig = {
  sales: {
    label: "销售额",
    color: "#22c55e",
  },
  profit: {
    label: "利润",
    color: "#10b981",
  },
};

export const mockSimpleLineData = [
  { month: "1月", temperature: 18, humidity: 65 },
  { month: "2月", temperature: 22, humidity: 58 },
  { month: "3月", temperature: 25, humidity: 72 },
  { month: "4月", temperature: 28, humidity: 68 },
  { month: "5月", temperature: 32, humidity: 75 },
  { month: "6月", temperature: 35, humidity: 80 },
];

export const mockSimpleLineConfig: ChartConfig = {
  temperature: {
    label: "温度(°C)",
    color: "#ef4444",
  },
  humidity: {
    label: "湿度(%)",
    color: "#8b5cf6",
  },
};

// 所有测试数据的集合
export const mockTestData = {
  // EnhancedChart 数据
  enhanced: {
    bar: { data: mockBarData, config: mockBarConfig },
    line: { data: mockLineData, config: mockLineConfig },
    area: { data: mockAreaData, config: mockAreaConfig },
    pie: { data: mockPieData, config: mockPieConfig },
  },
  
  // SimpleChart 数据
  simple: {
    bar: { data: mockSimpleBarData, config: mockSimpleBarConfig },
    line: { data: mockSimpleLineData, config: mockSimpleLineConfig },
  },
} as const;
