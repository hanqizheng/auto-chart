# Line Chart 组件

美化的折线图组件，专为趋势分析和时间序列数据设计，提供完整的趋势分析和统计信息。

## 组件特性

- ✅ **完全类型安全** - 使用 TypeScript 严格类型定义
- 📈 **趋势分析** - 自动计算变化率、最值和平均值
- 🎯 **参考线支持** - 可自定义参考线和标签
- 📊 **数据完整展示** - 包含图表、数据表格和趋势摘要
- 🎨 **专业外观** - 优化的视觉设计，适合演示和报告
- 📱 **响应式设计** - 支持不同屏幕尺寸
- ⚡ **数据验证** - 内置数据格式验证和错误处理
- 🖼️ **导出友好** - 为静态图像导出优化，显示所有关键信息

## 数据格式要求

### 基础数据结构

```typescript
interface LineChartDataPoint {
  [key: string]: string | number;
}

type LineChartData = LineChartDataPoint[];
```

### 数据格式示例

```typescript
// 时间序列销售数据
const salesTrendData = [
  { month: "1月", sales: 12000, target: 10000, profit: 3000 },
  { month: "2月", sales: 15000, target: 12000, profit: 4200 },
  { month: "3月", sales: 18000, target: 15000, profit: 5400 },
  { month: "4月", sales: 16000, target: 16000, profit: 4800 },
  { month: "5月", sales: 20000, target: 18000, profit: 6000 },
  { month: "6月", sales: 22000, target: 20000, profit: 6600 }
];

// 网站访问量数据
const trafficData = [
  { date: "2024-01-01", visitors: 1200, pageviews: 3600, sessions: 900 },
  { date: "2024-01-02", visitors: 1350, pageviews: 4050, sessions: 1000 },
  { date: "2024-01-03", visitors: 1100, pageviews: 3300, sessions: 800 },
  { date: "2024-01-04", visitors: 1450, pageviews: 4350, sessions: 1100 },
  { date: "2024-01-05", visitors: 1600, pageviews: 4800, sessions: 1200 }
];

// 股价数据
const stockData = [
  { date: "2024-01", open: 100, close: 105, high: 108, low: 98 },
  { date: "2024-02", open: 105, close: 110, high: 115, low: 102 },
  { date: "2024-03", open: 110, close: 108, high: 118, low: 106 },
  { date: "2024-04", open: 108, close: 120, high: 125, low: 105 }
];
```

## 配置选项

### ChartConfig 格式

```typescript
import { ChartConfig } from "@/components/ui/chart";

const config: ChartConfig = {
  sales: {
    label: "实际销售",
    color: "hsl(220, 70%, 50%)",
  },
  target: {
    label: "销售目标",
    color: "hsl(160, 60%, 45%)",
  },
  profit: {
    label: "利润",
    color: "hsl(30, 80%, 55%)",
  }
};
```

## 使用示例

### 基础用法

```tsx
import { BeautifulLineChart } from "@/components/charts/line-chart";

function SalesTrendChart() {
  const data = [
    { month: "1月", sales: 12000, target: 10000 },
    { month: "2月", sales: 15000, target: 12000 },
    { month: "3月", sales: 18000, target: 15000 },
    { month: "4月", sales: 16000, target: 16000 },
    { month: "5月", sales: 20000, target: 18000 },
    { month: "6月", sales: 22000, target: 20000 }
  ];

  const config = {
    sales: {
      label: "实际销售",
      color: "hsl(220, 70%, 50%)",
    },
    target: {
      label: "销售目标",
      color: "hsl(160, 60%, 45%)",
    }
  };

  return (
    <BeautifulLineChart
      data={data}
      config={config}
      title="销售趋势分析"
      description="2024年上半年销售目标完成情况"
    />
  );
}
```

### 带自定义参考线的示例

```tsx
import { BeautifulLineChart } from "@/components/charts/line-chart";

function PerformanceChart() {
  const data = [
    { week: "W1", performance: 85, benchmark: 80 },
    { week: "W2", performance: 88, benchmark: 82 },
    { week: "W3", performance: 92, benchmark: 85 },
    { week: "W4", performance: 89, benchmark: 87 },
    { week: "W5", performance: 95, benchmark: 90 }
  ];

  const config = {
    performance: {
      label: "实际表现",
      color: "hsl(220, 70%, 50%)",
    },
    benchmark: {
      label: "基准线",
      color: "hsl(160, 60%, 45%)",
    }
  };

  return (
    <BeautifulLineChart
      data={data}
      config={config}
      title="团队绩效趋势"
      description="团队周度表现与基准对比"
      showReferenceLine={true}
      referenceValue={90}
      referenceLabel="目标线"
    />
  );
}
```

### 复杂多系列数据示例

```tsx
import { BeautifulLineChart } from "@/components/charts/line-chart";

function WebAnalyticsChart() {
  const data = [
    { date: "1月1日", visitors: 1200, pageviews: 3600, sessions: 900, bounceRate: 45 },
    { date: "1月2日", visitors: 1350, pageviews: 4050, sessions: 1000, bounceRate: 42 },
    { date: "1月3日", visitors: 1100, pageviews: 3300, sessions: 800, bounceRate: 48 },
    { date: "1月4日", visitors: 1450, pageviews: 4350, sessions: 1100, bounceRate: 40 },
    { date: "1月5日", visitors: 1600, pageviews: 4800, sessions: 1200, bounceRate: 38 },
    { date: "1月6日", visitors: 1800, pageviews: 5400, sessions: 1350, bounceRate: 35 },
    { date: "1月7日", visitors: 1700, pageviews: 5100, sessions: 1250, bounceRate: 37 }
  ];

  const config = {
    visitors: {
      label: "访客数",
      color: "hsl(220, 70%, 50%)",
    },
    pageviews: {
      label: "页面浏览量",
      color: "hsl(160, 60%, 45%)",
    },
    sessions: {
      label: "会话数",
      color: "hsl(30, 80%, 55%)",
    },
    bounceRate: {
      label: "跳出率 (%)",
      color: "hsl(0, 70%, 50%)",
    }
  };

  return (
    <BeautifulLineChart
      data={data}
      config={config}
      title="网站分析趋势"
      description="一周内网站关键指标变化趋势"
      className="w-full max-w-6xl"
    />
  );
}
```

## 属性说明

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `data` | `LineChartData` | ✅ | - | 图表数据，至少包含两个数据点 |
| `config` | `ChartConfig` | ✅ | - | 数据系列配置（颜色、标签等） |
| `title` | `string` | ❌ | - | 图表标题 |
| `description` | `string` | ❌ | - | 图表描述 |
| `className` | `string` | ❌ | - | 自定义样式类名 |
| `showReferenceLine` | `boolean` | ❌ | `true` | 是否显示参考线 |
| `referenceValue` | `number` | ❌ | 自动计算 | 自定义参考线数值 |
| `referenceLabel` | `string` | ❌ | "参考线" | 参考线标签 |

## 趋势分析功能

组件会自动为每个数据系列计算：

- **变化率** - 首末数值的百分比变化
- **趋势方向** - 上升、下降或稳定
- **统计信息** - 最小值、最大值、平均值
- **最佳表现** - 变化率最高的系列

### 趋势分析示例

```typescript
// 自动分析结果示例：
const analysisResult = {
  key: "sales",
  change: 10000,           // 数值变化
  changePercent: 83.3,     // 变化百分比
  trend: "up",             // 趋势方向
  min: 12000,              // 最小值
  max: 22000,              // 最大值
  avg: 17166.7             // 平均值
};
```

## 数据验证规则

组件会自动验证数据格式，包括：

1. **数据存在性** - 数据不能为空或未定义
2. **最小数据点** - 至少需要 2 个数据点形成趋势线
3. **数据结构** - 必须是数组格式
4. **最小字段数** - 每个数据点至少需要 2 个字段（1个X轴 + 1个Y轴）
5. **字段一致性** - 所有数据点必须包含相同的字段
6. **数据类型** - X轴字段可以是字符串或数字，Y轴字段必须为数字

### 错误处理示例

```tsx
// ❌ 错误：数据点不足
const invalidData1 = [
  { month: "1月", sales: 12000 }  // 只有1个数据点，无法形成趋势
];

// ❌ 错误：缺少数值字段
const invalidData2 = [
  { month: "1月" },  // 只有X轴字段，缺少Y轴数值字段
  { month: "2月" }
];

// ❌ 错误：数据类型不匹配
const invalidData3 = [
  { month: "1月", sales: "12000" },  // sales 应为数字类型
  { month: "2月", sales: 15000 }
];

// ❌ 错误：字段不一致
const invalidData4 = [
  { month: "1月", sales: 12000 },
  { month: "2月", revenue: 15000 }  // 字段名不一致
];

// ✅ 正确格式
const validData = [
  { month: "1月", sales: 12000, target: 10000 },
  { month: "2月", sales: 15000, target: 12000 }
];
```

## 最佳实践

### 1. 时间序列数据
```tsx
// 推荐：使用清晰的时间标识
const timeSeriesData = [
  { date: "2024-01", value: 100 },
  { date: "2024-02", value: 120 },
  { date: "2024-03", value: 110 }
];
```

### 2. 数据系列命名
```tsx
// 推荐：使用有意义的字段名
const meaningfulData = [
  { month: "1月", revenue: 50000, expenses: 30000, profit: 20000 }
];

// 避免：使用无意义的字段名
const poorData = [
  { x: "1月", y1: 50000, y2: 30000, y3: 20000 }
];
```

### 3. 颜色配置
```tsx
// 推荐：使用语义化颜色
const semanticConfig = {
  revenue: { label: "收入", color: "hsl(220, 70%, 50%)" },    // 蓝色
  expenses: { label: "支出", color: "hsl(0, 70%, 50%)" },     // 红色  
  profit: { label: "利润", color: "hsl(160, 60%, 45%)" }      // 绿色
};
```

## 注意事项

1. **数据量限制** - 建议单个系列数据点数量不超过 100 个，以保证可读性
2. **系列数量** - 建议同时显示的数据系列不超过 5 个，避免视觉混乱
3. **数值标签** - 当数据系列超过 2 个时，不显示数值标签，避免重叠
4. **参考线** - 可以关闭参考线或设置自定义数值，适应不同分析需求
5. **导出优化** - 组件专为静态导出设计，包含完整的趋势分析和数据表格

## 常见问题

### Q: 如何处理空数据或缺失值？
A: 组件会自动将无效数值转换为 0。建议在传入数据前进行预处理：

```typescript
const cleanedData = rawData.map(item => ({
  ...item,
  sales: item.sales || 0,  // 处理 null/undefined
  target: Number(item.target) || 0  // 确保数字类型
}));
```

### Q: 如何自定义折线样式？
A: 当前版本使用预设样式。如需自定义，可以通过 CSS 变量或继承组件：

```css
/* 自定义折线宽度和样式 */
.custom-line-chart .recharts-line {
  stroke-width: 2;
  stroke-dasharray: 5,5;
}
```

### Q: 支持对数刻度吗？
A: 当前版本使用线性刻度。如需对数刻度，建议对数据进行预处理或使用专门的对数刻度图表。

### Q: 如何处理大数值的显示？
A: 组件会自动使用 `toLocaleString()` 格式化数值，支持千位分隔符。对于特别大的数值，建议在传入前进行单位转换（如转换为万、亿）。