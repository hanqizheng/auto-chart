# Bar Chart 组件

美化的柱状图组件，专为静态图像导出设计，显示完整的数据信息和统计分析。

## 组件特性

- ✅ **完全类型安全** - 使用 TypeScript 严格类型定义
- 📊 **数据完整展示** - 包含图表、数据表格和统计摘要
- 🎨 **专业外观** - 优化的视觉设计，适合演示和报告
- 📱 **响应式设计** - 支持不同屏幕尺寸
- ⚡ **数据验证** - 内置数据格式验证和错误处理
- 🖼️ **导出友好** - 为静态图像导出优化，无需交互即可显示所有信息

## 数据格式要求

### 基础数据结构

```typescript
interface BarChartDataPoint {
  [key: string]: string | number;
}

type BarChartData = BarChartDataPoint[];
```

### 数据格式示例

```typescript
// 基础销售数据
const salesData = [
  { product: "产品A", sales: 1200, target: 1000 },
  { product: "产品B", sales: 800, target: 900 },
  { product: "产品C", sales: 1500, target: 1200 },
  { product: "产品D", sales: 600, target: 700 }
];

// 月度收入数据
const revenueData = [
  { month: "1月", revenue: 50000, expenses: 30000, profit: 20000 },
  { month: "2月", revenue: 55000, expenses: 32000, profit: 23000 },
  { month: "3月", revenue: 60000, expenses: 35000, profit: 25000 }
];

// 地区销售数据
const regionData = [
  { region: "北京", q1: 100, q2: 120, q3: 110, q4: 150 },
  { region: "上海", q1: 90, q2: 110, q3: 130, q4: 140 },
  { region: "广州", q1: 80, q2: 95, q3: 105, q4: 120 }
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
  }
};
```

## 使用示例

### 基础用法

```tsx
import { BeautifulBarChart } from "@/components/charts/bar-chart";

function SalesChart() {
  const data = [
    { product: "产品A", sales: 1200, target: 1000 },
    { product: "产品B", sales: 800, target: 900 },
    { product: "产品C", sales: 1500, target: 1200 }
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
    <BeautifulBarChart
      data={data}
      config={config}
      title="产品销售对比"
      description="2024年Q1产品销售情况与目标对比"
    />
  );
}
```

### 完整配置示例

```tsx
import { BeautifulBarChart } from "@/components/charts/bar-chart";

function RevenueChart() {
  const data = [
    { month: "1月", revenue: 50000, expenses: 30000, profit: 20000 },
    { month: "2月", revenue: 55000, expenses: 32000, profit: 23000 },
    { month: "3月", revenue: 60000, expenses: 35000, profit: 25000 },
    { month: "4月", revenue: 58000, expenses: 33000, profit: 25000 },
    { month: "5月", revenue: 62000, expenses: 36000, profit: 26000 },
    { month: "6月", revenue: 65000, expenses: 38000, profit: 27000 }
  ];

  const config = {
    revenue: {
      label: "收入",
      color: "hsl(220, 70%, 50%)",
    },
    expenses: {
      label: "支出",
      color: "hsl(0, 70%, 50%)",
    },
    profit: {
      label: "利润",
      color: "hsl(160, 60%, 45%)",
    }
  };

  return (
    <BeautifulBarChart
      data={data}
      config={config}
      title="月度财务概览"
      description="2024年上半年收入、支出和利润趋势"
      className="w-full max-w-4xl"
    />
  );
}
```

## 属性说明

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `data` | `BarChartData` | ✅ | - | 图表数据，至少包含一个数据点 |
| `config` | `ChartConfig` | ✅ | - | 数据系列配置（颜色、标签等） |
| `title` | `string` | ❌ | - | 图表标题 |
| `description` | `string` | ❌ | - | 图表描述 |
| `className` | `string` | ❌ | - | 自定义样式类名 |

## 数据验证规则

组件会自动验证数据格式，包括：

1. **数据存在性** - 数据不能为空或未定义
2. **数据结构** - 必须是数组格式
3. **最小字段数** - 每个数据点至少需要 2 个字段（1个分类 + 1个数值）
4. **字段一致性** - 所有数据点必须包含相同的字段
5. **数据类型** - 分类字段必须为字符串，数值字段必须为数字

### 错误处理示例

```tsx
// ❌ 错误：数据为空
const invalidData1 = [];

// ❌ 错误：缺少数值字段
const invalidData2 = [
  { product: "产品A" }  // 只有分类字段，缺少数值字段
];

// ❌ 错误：数据类型不匹配
const invalidData3 = [
  { product: "产品A", sales: "1200" },  // sales 应为数字类型
  { product: "产品B", sales: 800 }
];

// ❌ 错误：字段不一致
const invalidData4 = [
  { product: "产品A", sales: 1200 },
  { product: "产品B", revenue: 800 }  // 字段名不一致
];

// ✅ 正确格式
const validData = [
  { product: "产品A", sales: 1200, target: 1000 },
  { product: "产品B", sales: 800, target: 900 }
];
```

## 注意事项

1. **字段顺序** - 第一个字段自动识别为 X 轴（分类字段），其余字段为 Y 轴数值
2. **颜色配置** - 确保 `config` 中包含所有数值字段的配置
3. **数据量限制** - 建议单个系列数据点数量不超过 50 个，以保证可读性
4. **导出优化** - 组件专为静态导出设计，包含完整的数据表格和统计信息
5. **响应式支持** - 在小屏幕上会自动调整布局和字体大小

## 常见问题

### Q: 如何更改柱子的颜色？
A: 在 `config` 对象中设置每个数据系列的 `color` 属性：

```typescript
const config = {
  sales: {
    label: "销售额",
    color: "hsl(220, 70%, 50%)",  // 蓝色
  }
};
```

### Q: 如何处理长标签名？
A: 组件会自动旋转 X 轴标签 45 度，并预留足够的空间。如需更多控制，可以通过 CSS 自定义样式。

### Q: 支持堆叠柱状图吗？
A: 当前版本为分组柱状图。如需堆叠效果，请使用 `area-chart` 组件或后续会添加堆叠选项。

### Q: 如何自定义统计信息的显示？
A: 组件会自动计算平均值和总计。如需更多统计信息，可以继承组件并重写统计计算逻辑。