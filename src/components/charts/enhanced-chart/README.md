# Enhanced Chart 组件

统一的图表包装器组件，支持所有图表类型（柱状图、折线图、饼图、面积图）和高级功能（导出、分享、数据验证）。

## 组件特性

- ✅ **统一接口** - 一个组件支持所有图表类型
- 🔄 **智能转换** - 自动适配不同数据格式
- 📊 **完整验证** - 内置数据格式验证和兼容性检查
- 🖼️ **高级导出** - 支持多种格式的高质量图像导出
- 📤 **便捷分享** - 集成分享功能，支持现代浏览器 Web Share API
- ⚡ **类型安全** - 完全的 TypeScript 支持
- 🎨 **专业外观** - 统一的控制界面和错误处理
- 📱 **响应式设计** - 适配不同屏幕尺寸

## 支持的图表类型

| 图表类型 | 类型值 | 适用场景 | 数据格式要求 |
|----------|--------|----------|-------------|
| 柱状图 | `'bar'` | 分类数据比较 | 标准数据格式 |
| 折线图 | `'line'` | 趋势分析 | 标准数据格式 |
| 饼图 | `'pie'` | 分布分析 | 饼图格式或标准格式 |
| 面积图 | `'area'` | 累积分析 | 标准数据格式 |

## 数据格式

### 标准数据格式
```typescript
interface StandardChartDataPoint {
  [key: string]: string | number;
}

// 示例
const standardData = [
  { month: "1月", sales: 12000, target: 10000, profit: 3000 },
  { month: "2月", sales: 15000, target: 12000, profit: 4000 },
  { month: "3月", sales: 18000, target: 15000, profit: 5000 }
];
```

### 饼图数据格式
```typescript
interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

// 示例
const pieData = [
  { name: "产品A", value: 45 },
  { name: "产品B", value: 30 },
  { name: "产品C", value: 25 }
];
```

## 基础使用

### 柱状图示例

```tsx
import { EnhancedChart } from "@/components/charts/enhanced-chart";

function SalesChart() {
  const data = [
    { month: "1月", sales: 12000, target: 10000 },
    { month: "2月", sales: 15000, target: 12000 },
    { month: "3月", sales: 18000, target: 15000 }
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
    <EnhancedChart
      type="bar"
      data={data}
      config={config}
      title="月度销售对比"
      description="2024年Q1销售情况"
    />
  );
}
```

### 折线图示例

```tsx
import { EnhancedChart } from "@/components/charts/enhanced-chart";

function TrendChart() {
  const data = [
    { date: "1月1日", visitors: 1200, pageviews: 3600 },
    { date: "1月2日", visitors: 1350, pageviews: 4050 },
    { date: "1月3日", visitors: 1100, pageviews: 3300 },
    { date: "1月4日", visitors: 1450, pageviews: 4350 }
  ];

  const config = {
    visitors: {
      label: "访客数",
      color: "hsl(220, 70%, 50%)",
    },
    pageviews: {
      label: "页面浏览量",
      color: "hsl(160, 60%, 45%)",
    }
  };

  return (
    <EnhancedChart
      type="line"
      data={data}
      config={config}
      title="网站流量趋势"
      description="一周内访问量变化"
    />
  );
}
```

### 饼图示例

```tsx
import { EnhancedChart } from "@/components/charts/enhanced-chart";

// 方式一：使用专用饼图数据格式
function MarketShareChart() {
  const pieData = [
    { name: "产品A", value: 45 },
    { name: "产品B", value: 30 },
    { name: "产品C", value: 15 },
    { name: "其他", value: 10 }
  ];

  return (
    <EnhancedChart
      type="pie"
      data={pieData}
      config={{}}
      title="市场份额分布"
      description="2024年Q1产品市场占有率"
      showPercentage={true}
      showLegend={true}
    />
  );
}

// 方式二：使用标准数据格式（自动转换）
function SalesDistributionChart() {
  const standardData = [
    { product: "产品A", sales: 45000 },
    { product: "产品B", sales: 30000 },
    { product: "产品C", sales: 15000 },
    { product: "其他", sales: 10000 }
  ];

  return (
    <EnhancedChart
      type="pie"
      data={standardData}  // 会自动转换为饼图格式
      config={{}}
      title="销售额分布"
      innerRadius={60}  // 环形图
    />
  );
}
```

### 面积图示例

```tsx
import { EnhancedChart } from "@/components/charts/enhanced-chart";

function AreaChart() {
  const data = [
    { month: "1月", product1: 12000, product2: 8000, product3: 5000 },
    { month: "2月", product1: 15000, product2: 9500, product3: 6200 },
    { month: "3月", product1: 18000, product2: 11000, product3: 7500 }
  ];

  const config = {
    product1: {
      label: "产品A",
      color: "hsl(220, 70%, 50%)",
    },
    product2: {
      label: "产品B",
      color: "hsl(160, 60%, 45%)",
    },
    product3: {
      label: "产品C",
      color: "hsl(30, 80%, 55%)",
    }
  };

  return (
    <EnhancedChart
      type="area"
      data={data}
      config={config}
      title="产品销售趋势"
      stacked={true}      // 堆叠显示
      fillOpacity={0.7}   // 面积透明度
    />
  );
}
```

## 高级功能

### 导出功能

组件内置高质量图像导出功能：

```tsx
// 基础导出（使用默认配置）
<EnhancedChart
  type="bar"
  data={data}
  config={config}
  title="可导出的图表"
/>

// 导出功能特性：
// - 自动生成文件名（基于标题）
// - 2倍分辨率，确保清晰度
// - PNG 格式，支持透明背景
// - 开发环境提供手动截图提示
// - 完整错误处理和用户反馈
```

### 分享功能

支持现代浏览器的原生分享：

```tsx
<EnhancedChart
  type="line"
  data={data}
  config={config}
  title="可分享的趋势图"
  description="这个描述会作为分享内容"
/>

// 分享功能特性：
// - 支持 Web Share API（移动端原生分享）
// - 降级到剪贴板复制
// - 自动包含页面标题和描述
// - 分享当前页面URL
```

### 数据验证

内置智能数据验证：

```tsx
// 会自动验证数据格式兼容性
<EnhancedChart
  type="pie"
  data={invalidData}  // 如果数据格式不兼容会显示错误信息
  config={config}
/>

// 验证内容包括：
// - 数据格式兼容性
// - 最小数据点要求
// - 字段完整性检查
// - 数据类型验证
// - 智能错误提示
```

## 完整属性说明

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `type` | `ChartType` | ✅ | - | 图表类型：'bar' \| 'line' \| 'pie' \| 'area' |
| `data` | `EnhancedChartData` | ✅ | - | 图表数据 |
| `config` | `ChartConfig` | ✅ | - | 图表配置 |
| `title` | `string` | ❌ | - | 图表标题 |
| `description` | `string` | ❌ | - | 图表描述 |
| `className` | `string` | ❌ | `'w-full'` | 自定义样式类名 |

### 面积图专用属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `stacked` | `boolean` | `false` | 是否堆叠显示 |
| `fillOpacity` | `number` | `0.6` | 面积透明度 (0-1) |

### 饼图专用属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `innerRadius` | `number` | `0` | 内圆半径（>0 为环形图） |
| `outerRadius` | `number` | `120` | 外圆半径 |
| `showPercentage` | `boolean` | `true` | 是否显示百分比标签 |
| `showLegend` | `boolean` | `true` | 是否显示图例 |

## 数据转换规则

### 标准数据 → 饼图数据

当使用饼图类型但提供标准数据格式时，组件会自动转换：

```typescript
// 输入：标准数据
const input = [
  { category: "A类", value: 100 },
  { category: "B类", value: 200 },
  { category: "C类", value: 150 }
];

// 自动转换为：饼图数据
const output = [
  { name: "A类", value: 100 },
  { name: "B类", value: 200 },
  { name: "C类", value: 150 }
];

// 多数值列会聚合
const multiValueInput = [
  { category: "A类", q1: 25, q2: 30, q3: 20, q4: 25 },
  { category: "B类", q1: 50, q2: 60, q3: 40, q4: 50 }
];

// 转换为
const aggregatedOutput = [
  { name: "A类", value: 100 },  // 25+30+20+25
  { name: "B类", value: 200 }   // 50+60+40+50
];
```

## 错误处理

### 数据验证错误

```tsx
// 会显示具体的错误信息
<EnhancedChart
  type="line"
  data={[]}  // 空数据
  config={{}}
/>
// 显示：数据不能为空

<EnhancedChart
  type="pie"
  data={standardData}
  config={{}}
/>
// 如果标准数据格式不适合饼图，会显示建议
```

### 导出错误

```tsx
// 导出失败时会显示错误信息
// - 浏览器不支持
// - 截图失败
// - 文件保存问题
```

## 最佳实践

### 1. 选择合适的图表类型

```tsx
// ✅ 推荐：分类数据比较用柱状图
<EnhancedChart type="bar" data={categoryData} config={config} />

// ✅ 推荐：时间序列趋势用折线图
<EnhancedChart type="line" data={timeSeriesData} config={config} />

// ✅ 推荐：分布比例用饼图
<EnhancedChart type="pie" data={proportionData} config={config} />

// ✅ 推荐：累积数据用面积图
<EnhancedChart type="area" data={cumulativeData} config={config} stacked={true} />
```

### 2. 数据准备

```tsx
// ✅ 推荐：使用语义化的字段名
const goodData = [
  { month: "1月", revenue: 50000, expenses: 30000 }
];

// ❌ 避免：无意义的字段名
const poorData = [
  { x: "1月", y1: 50000, y2: 30000 }
];
```

### 3. 配置优化

```tsx
// ✅ 推荐：提供清晰的标签和颜色
const config = {
  revenue: {
    label: "收入",
    color: "hsl(160, 60%, 45%)",  // 语义化绿色
  },
  expenses: {
    label: "支出", 
    color: "hsl(0, 70%, 50%)",    // 语义化红色
  }
};
```

### 4. 响应式使用

```tsx
// ✅ 推荐：合理使用 className
<EnhancedChart
  type="bar"
  data={data}
  config={config}
  className="w-full max-w-4xl mx-auto"  // 限制最大宽度，居中显示
/>
```

## 常见问题

### Q: 如何切换图表类型？
A: 简单更改 `type` 属性即可，组件会自动处理数据兼容性：

```tsx
const [chartType, setChartType] = useState('bar');

<EnhancedChart
  type={chartType}
  data={data}
  config={config}
/>
```

### Q: 饼图支持标准数据格式吗？
A: 是的，组件会自动转换标准数据为饼图格式。如果有多个数值列，会聚合所有数值。

### Q: 导出的图片质量如何？
A: 导出使用 2 倍分辨率，确保高清晰度。支持 PNG 格式保证最佳质量。

### Q: 如何处理大数据集？
A: 建议对数据进行预处理：
- 柱状图/折线图：不超过 50 个数据点
- 饼图：不超过 10 个分类
- 面积图：不超过 100 个数据点

### Q: 支持自定义导出配置吗？
A: 当前版本使用预设配置。未来版本将支持自定义导出格式、质量和尺寸。

### Q: 如何处理数据验证失败？
A: 组件会显示具体的错误信息和建议。根据提示调整数据格式或图表类型即可。