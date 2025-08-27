# Area Chart 组件

美化的面积图组件，专为累积数据和容量分析设计，提供完整的面积分析和增长统计。

## 组件特性

- ✅ **完全类型安全** - 使用 TypeScript 严格类型定义
- 📊 **累积分析** - 自动计算总计、增长率和容量统计
- 🎯 **多模式支持** - 支持堆叠和非堆叠显示模式
- 📈 **增长追踪** - 显示期间增长率和趋势变化
- 🎨 **专业外观** - 优化的视觉设计，适合演示和报告
- 📱 **响应式设计** - 支持不同屏幕尺寸
- ⚡ **数据验证** - 内置数据格式验证和错误处理
- 🖼️ **导出友好** - 为静态图像导出优化，显示所有关键信息

## 数据格式要求

### 基础数据结构

```typescript
interface AreaChartDataPoint {
  [key: string]: string | number;
}

type AreaChartData = AreaChartDataPoint[];
```

### 数据格式示例

```typescript
// 月度销售累积数据
const monthlySalesData = [
  { month: "1月", product1: 12000, product2: 8000, product3: 5000 },
  { month: "2月", product1: 15000, product2: 9500, product3: 6200 },
  { month: "3月", product1: 18000, product2: 11000, product3: 7500 },
  { month: "4月", product1: 16000, product2: 12500, product3: 8200 },
  { month: "5月", product1: 20000, product2: 14000, product3: 9000 },
  { month: "6月", product1: 22000, product2: 15500, product3: 9800 }
];

// 网站流量累积数据
const trafficData = [
  { date: "Week 1", organic: 1200, social: 800, direct: 600, paid: 400 },
  { date: "Week 2", organic: 1350, social: 950, direct: 720, paid: 480 },
  { date: "Week 3", organic: 1100, social: 1100, direct: 800, paid: 520 },
  { date: "Week 4", organic: 1450, social: 1200, direct: 850, paid: 600 }
];

// 成本累积分析
const costAccumulationData = [
  { quarter: "Q1", personnel: 450000, materials: 280000, operations: 120000, marketing: 80000 },
  { quarter: "Q2", personnel: 520000, materials: 320000, operations: 140000, marketing: 95000 },
  { quarter: "Q3", personnel: 580000, materials: 360000, operations: 160000, marketing: 110000 },
  { quarter: "Q4", personnel: 620000, materials: 400000, operations: 180000, marketing: 130000 }
];

// 用户增长数据
const userGrowthData = [
  { month: "1月", newUsers: 1200, activeUsers: 8500, premiumUsers: 850 },
  { month: "2月", newUsers: 1450, activeUsers: 9200, premiumUsers: 920 },
  { month: "3月", newUsers: 1680, activeUsers: 10100, premiumUsers: 1050 },
  { month: "4月", newUsers: 1520, activeUsers: 10800, premiumUsers: 1180 },
  { month: "5月", newUsers: 1750, activeUsers: 11600, premiumUsers: 1320 }
];
```

## 配置选项

### ChartConfig 格式

```typescript
import { ChartConfig } from "@/components/ui/chart";

const config: ChartConfig = {
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
```

## 使用示例

### 基础非堆叠面积图

```tsx
import { BeautifulAreaChart } from "@/components/charts/area-chart";

function SalesAreaChart() {
  const data = [
    { month: "1月", productA: 12000, productB: 8000, productC: 5000 },
    { month: "2月", productA: 15000, productB: 9500, productC: 6200 },
    { month: "3月", productA: 18000, productB: 11000, productC: 7500 },
    { month: "4月", productA: 16000, productB: 12500, productC: 8200 },
    { month: "5月", productA: 20000, productB: 14000, productC: 9000 },
    { month: "6月", productA: 22000, productB: 15500, productC: 9800 }
  ];

  const config = {
    productA: {
      label: "产品A",
      color: "hsl(220, 70%, 50%)",
    },
    productB: {
      label: "产品B",
      color: "hsl(160, 60%, 45%)",
    },
    productC: {
      label: "产品C",
      color: "hsl(30, 80%, 55%)",
    }
  };

  return (
    <BeautifulAreaChart
      data={data}
      config={config}
      title="产品销售趋势"
      description="2024年上半年各产品销售额变化"
      stacked={false}  // 非堆叠显示
    />
  );
}
```

### 堆叠面积图示例

```tsx
import { BeautifulAreaChart } from "@/components/charts/area-chart";

function StackedRevenueChart() {
  const data = [
    { quarter: "Q1", software: 125000, services: 98000, subscription: 87000, training: 45000 },
    { quarter: "Q2", software: 140000, services: 110000, subscription: 95000, training: 52000 },
    { quarter: "Q3", software: 158000, services: 125000, subscription: 108000, training: 58000 },
    { quarter: "Q4", software: 175000, services: 140000, subscription: 120000, training: 65000 }
  ];

  const config = {
    software: {
      label: "软件销售",
      color: "hsl(220, 70%, 50%)",
    },
    services: {
      label: "服务收入",
      color: "hsl(160, 60%, 45%)",
    },
    subscription: {
      label: "订阅收入",
      color: "hsl(30, 80%, 55%)",
    },
    training: {
      label: "培训收入",
      color: "hsl(280, 65%, 60%)",
    }
  };

  return (
    <BeautifulAreaChart
      data={data}
      config={config}
      title="收入来源堆叠分析"
      description="2024年各业务线收入累积情况"
      stacked={true}           // 堆叠显示
      showTotalLine={true}     // 显示总计参考线
      showGrowthRate={true}    // 显示增长率
      fillOpacity={0.7}        // 面积透明度
    />
  );
}
```

### 完整功能示例

```tsx
import { BeautifulAreaChart } from "@/components/charts/area-chart";

function ComprehensiveAreaChart() {
  const data = [
    { week: "W1", organic: 12000, social: 8000, direct: 6000, paid: 4000, email: 2500 },
    { week: "W2", organic: 13500, social: 9500, direct: 7200, paid: 4800, email: 2800 },
    { week: "W3", organic: 11000, social: 11000, direct: 8000, paid: 5200, email: 3100 },
    { week: "W4", organic: 14500, social: 12000, direct: 8500, paid: 6000, email: 3400 },
    { week: "W5", organic: 16000, social: 13000, direct: 9200, paid: 6500, email: 3700 },
    { week: "W6", organic: 17500, social: 14000, direct: 9800, paid: 7000, email: 4000 },
    { week: "W7", organic: 15800, social: 15000, direct: 10500, paid: 7500, email: 4300 },
    { week: "W8", organic: 18200, social: 16000, direct: 11000, paid: 8000, email: 4600 }
  ];

  const config = {
    organic: {
      label: "自然流量",
      color: "hsl(160, 60%, 45%)",
    },
    social: {
      label: "社交媒体",
      color: "hsl(220, 70%, 50%)",
    },
    direct: {
      label: "直接访问",
      color: "hsl(30, 80%, 55%)",
    },
    paid: {
      label: "付费推广",
      color: "hsl(340, 75%, 55%)",
    },
    email: {
      label: "邮件营销",
      color: "hsl(280, 65%, 60%)",
    }
  };

  return (
    <BeautifulAreaChart
      data={data}
      config={config}
      title="网站流量来源分析"
      description="8周内各流量渠道的累积表现"
      stacked={false}
      showTotalLine={true}
      showGrowthRate={true}
      fillOpacity={0.6}
      className="w-full max-w-6xl"
    />
  );
}
```

### 堆叠成本分析示例

```tsx
import { BeautifulAreaChart } from "@/components/charts/area-chart";

function CostStructureChart() {
  const data = [
    { month: "1月", personnel: 45000, materials: 28000, operations: 15000, marketing: 8000, other: 4000 },
    { month: "2月", personnel: 47000, materials: 30000, operations: 16000, marketing: 9000, other: 4500 },
    { month: "3月", personnel: 49000, materials: 32000, operations: 17000, marketing: 10000, other: 5000 },
    { month: "4月", personnel: 48000, materials: 31000, operations: 16500, marketing: 9500, other: 4800 },
    { month: "5月", personnel: 51000, materials: 34000, operations: 18000, marketing: 11000, other: 5500 },
    { month: "6月", personnel: 53000, materials: 36000, operations: 19000, marketing: 12000, other: 6000 }
  ];

  const config = {
    personnel: {
      label: "人力成本",
      color: "hsl(220, 70%, 50%)",
    },
    materials: {
      label: "原材料",
      color: "hsl(0, 70%, 50%)",
    },
    operations: {
      label: "运营费用",
      color: "hsl(30, 80%, 55%)",
    },
    marketing: {
      label: "营销费用",
      color: "hsl(160, 60%, 45%)",
    },
    other: {
      label: "其他费用",
      color: "hsl(280, 65%, 60%)",
    }
  };

  return (
    <BeautifulAreaChart
      data={data}
      config={config}
      title="成本结构堆叠分析"
      description="2024年上半年各项成本的累积变化"
      stacked={true}
      fillOpacity={0.8}
    />
  );
}
```

## 属性说明

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `data` | `AreaChartData` | ✅ | - | 图表数据，至少包含两个数据点 |
| `config` | `ChartConfig` | ✅ | - | 数据系列配置（颜色、标签等） |
| `title` | `string` | ❌ | - | 图表标题 |
| `description` | `string` | ❌ | - | 图表描述 |
| `className` | `string` | ❌ | - | 自定义样式类名 |
| `stacked` | `boolean` | ❌ | `false` | 是否堆叠显示 |
| `showTotalLine` | `boolean` | ❌ | `true` | 是否显示总计参考线 |
| `showGrowthRate` | `boolean` | ❌ | `true` | 是否显示增长率指标 |
| `fillOpacity` | `number` | ❌ | `0.6` | 面积透明度 (0-1) |

## 分析功能

组件会自动提供以下分析功能：

### 累积分析
- **总计值** - 每个时间点的累积总和
- **增长率** - 期间增长百分比
- **峰值分析** - 最高累积值和对应时期
- **平均线** - 总计值的平均水平

### 系列分析
- **累积贡献** - 每个系列的总累积值
- **增长趋势** - 增长、下降、稳定或波动状态
- **波动性** - 变异系数衡量数据稳定性
- **峰谷分析** - 每个系列的最高和最低点

### 数据洞察
- **最佳增长期** - 增长率最高的时间段
- **时间范围** - 数据覆盖的完整时间跨度
- **数据质量** - 检测负值等数据问题
- **容量分析** - 各系列的容量贡献比例

## 堆叠 vs 非堆叠模式

### 非堆叠模式 (`stacked={false}`)
- **适用场景** - 比较不同系列的独立趋势
- **视觉效果** - 各面积重叠显示，可看到每个系列的完整形状
- **分析重点** - 各系列的相对表现和变化趋势

### 堆叠模式 (`stacked={true}`)
- **适用场景** - 展示各部分对整体的贡献
- **视觉效果** - 面积叠加显示，总高度代表总量
- **分析重点** - 整体容量变化和各部分占比

## 数据验证规则

组件会自动验证数据格式，包括：

1. **数据存在性** - 数据不能为空或未定义
2. **最小数据点** - 至少需要 2 个数据点形成面积效果
3. **数据结构** - 必须是数组格式
4. **最小字段数** - 每个数据点至少需要 2 个字段（1个X轴 + 1个Y轴）
5. **字段一致性** - 所有数据点必须包含相同的字段
6. **数据类型** - X轴字段可以是字符串或数字，Y轴字段必须为数字

### 错误处理示例

```tsx
// ❌ 错误：数据点不足
const invalidData1 = [
  { month: "1月", sales: 12000 }  // 只有1个数据点，无法形成面积
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

// ✅ 正确格式
const validData = [
  { month: "1月", sales: 12000, target: 10000, profit: 3000 },
  { month: "2月", sales: 15000, target: 12000, profit: 4000 }
];
```

## 最佳实践

### 1. 选择合适的显示模式
```tsx
// 推荐：比较不同产品的独立表现
<BeautifulAreaChart data={productData} config={config} stacked={false} />

// 推荐：展示成本构成和总成本变化
<BeautifulAreaChart data={costData} config={config} stacked={true} />
```

### 2. 合理设置透明度
```tsx
// 非堆叠模式：较低透明度避免重叠混淆
<BeautifulAreaChart fillOpacity={0.4} stacked={false} />

// 堆叠模式：较高透明度展示层次
<BeautifulAreaChart fillOpacity={0.7} stacked={true} />
```

### 3. 数据系列数量控制
```tsx
// 推荐：非堆叠模式不超过4个系列
const moderateData = [
  { month: "1月", series1: 100, series2: 80, series3: 60, series4: 40 }
];

// 推荐：堆叠模式可以支持更多系列
const stackedData = [
  { month: "1月", cost1: 100, cost2: 80, cost3: 60, cost4: 40, cost5: 30, cost6: 20 }
];
```

### 4. 时间序列数据格式
```tsx
// 推荐：清晰的时间标识
const timeSeriesData = [
  { date: "2024-01", value1: 100, value2: 80 },
  { date: "2024-02", value1: 120, value2: 90 }
];

// 推荐：有意义的时间描述
const periodData = [
  { quarter: "2024 Q1", revenue: 100000, cost: 60000 },
  { quarter: "2024 Q2", revenue: 120000, cost: 70000 }
];
```

## 注意事项

1. **数据量限制** - 建议单个系列数据点数量不超过 50 个，以保证性能
2. **系列数量** - 非堆叠模式建议不超过 4 个系列，堆叠模式可适当增加
3. **负值处理** - 组件支持负值，但在堆叠模式下可能导致视觉混淆
4. **颜色对比** - 确保相邻系列有足够的颜色对比度
5. **导出优化** - 组件专为静态导出设计，包含完整的分析表格

## 常见问题

### Q: 堆叠面积图中如何处理负值？
A: 组件支持负值，但在堆叠模式下负值会向下堆叠。建议对数据进行预处理或使用非堆叠模式。

### Q: 如何自定义面积渐变效果？
A: 当前版本使用预设渐变。如需自定义，可以通过 CSS 变量或 `fillOpacity` 属性调整效果。

### Q: 支持面积图的平滑曲线吗？
A: 支持，组件使用 `monotone` 曲线类型提供平滑效果，保持数据的单调性。

### Q: 如何处理数据中的空值？
A: 组件会自动将空值转换为 0。建议在传入数据前进行预处理：

```typescript
const cleanedData = rawData.map(item => ({
  ...item,
  sales: item.sales ?? 0,  // 处理 null/undefined
  cost: Number(item.cost) || 0  // 确保数字类型
}));
```

### Q: 面积图适合展示什么类型的数据？
A: 面积图特别适合：
- 累积数据（销售额、用户增长等）
- 容量分析（成本构成、流量来源等）
- 时间序列的量级变化
- 多个相关指标的综合展示