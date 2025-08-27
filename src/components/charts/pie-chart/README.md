# Pie Chart 组件

美化的饼图组件，专为分布分析设计，提供完整的分类信息和统计分析。

## 组件特性

- ✅ **完全类型安全** - 使用 TypeScript 严格类型定义
- 📊 **分布分析** - 自动计算占比、集中度和关键洞察
- 🎯 **多样化显示** - 支持标准饼图和环形图模式
- 🎨 **专业外观** - 优化的视觉设计，适合演示和报告
- 📱 **响应式设计** - 支持不同屏幕尺寸
- ⚡ **数据验证** - 内置数据格式验证和错误处理
- 🖼️ **导出友好** - 为静态图像导出优化，显示所有关键信息
- 📈 **深度分析** - 提供累积占比、集中度分析等高级功能

## 数据格式要求

### 基础数据结构

```typescript
interface PieChartDataPoint {
  /** 数据分类名称 */
  name: string;
  
  /** 数值大小 */
  value: number;
  
  /** 自定义颜色（可选） */
  color?: string;
}

type PieChartData = PieChartDataPoint[];
```

### 数据格式示例

```typescript
// 市场份额数据
const marketShareData = [
  { name: "苹果", value: 45, color: "hsl(220, 70%, 50%)" },
  { name: "三星", value: 35, color: "hsl(160, 60%, 45%)" },
  { name: "华为", value: 15, color: "hsl(30, 80%, 55%)" },
  { name: "小米", value: 3, color: "hsl(280, 65%, 60%)" },
  { name: "其他", value: 2, color: "hsl(340, 75%, 55%)" }
];

// 销售渠道分布
const channelData = [
  { name: "线上直销", value: 12500000 },
  { name: "零售店", value: 8300000 },
  { name: "经销商", value: 6200000 },
  { name: "企业客户", value: 4100000 },
  { name: "海外市场", value: 2900000 }
];

// 用户年龄分布
const ageDistributionData = [
  { name: "18-25岁", value: 28 },
  { name: "26-35岁", value: 42 },
  { name: "36-45岁", value: 18 },
  { name: "46-55岁", value: 8 },
  { name: "55岁以上", value: 4 }
];

// 成本结构分析
const costStructureData = [
  { name: "人力成本", value: 45.5 },
  { name: "原材料", value: 25.3 },
  { name: "运营费用", value: 15.8 },
  { name: "营销费用", value: 8.7 },
  { name: "其他", value: 4.7 }
];
```

## 配置选项

### ChartConfig 格式

```typescript
import { ChartConfig } from "@/components/ui/chart";

// 基础配置（饼图通常不需要复杂配置）
const config: ChartConfig = {};

// 如有特殊需求，可以添加配置
const advancedConfig: ChartConfig = {
  // 通常饼图依据数据自动分配颜色
  // 特殊情况下可以在数据中指定 color 属性
};
```

## 使用示例

### 基础用法

```tsx
import { BeautifulPieChart } from "@/components/charts/pie-chart";

function MarketShareChart() {
  const data = [
    { name: "产品A", value: 45 },
    { name: "产品B", value: 30 },
    { name: "产品C", value: 15 },
    { name: "产品D", value: 7 },
    { name: "其他", value: 3 }
  ];

  return (
    <BeautifulPieChart
      data={data}
      config={{}}
      title="市场份额分布"
      description="2024年Q1各产品市场占有率"
    />
  );
}
```

### 环形图示例

```tsx
import { BeautifulPieChart } from "@/components/charts/pie-chart";

function RevenueDistributionChart() {
  const data = [
    { name: "软件销售", value: 125000000 },
    { name: "服务收入", value: 98000000 },
    { name: "订阅收入", value: 87000000 },
    { name: "培训收入", value: 45000000 },
    { name: "其他", value: 23000000 }
  ];

  return (
    <BeautifulPieChart
      data={data}
      config={{}}
      title="收入来源分布"
      description="2024年各业务线收入构成"
      innerRadius={60}  // 设置内圆半径创建环形图
      outerRadius={140}
      showPercentage={true}
      showLegend={true}
    />
  );
}
```

### 自定义颜色示例

```tsx
import { BeautifulPieChart } from "@/components/charts/pie-chart";

function CustomColorChart() {
  const data = [
    { 
      name: "优秀", 
      value: 65,
      color: "hsl(160, 60%, 45%)"  // 绿色 
    },
    { 
      name: "良好", 
      value: 25,
      color: "hsl(220, 70%, 50%)"  // 蓝色
    },
    { 
      name: "一般", 
      value: 8,
      color: "hsl(45, 90%, 60%)"   // 黄色
    },
    { 
      name: "需改进", 
      value: 2,
      color: "hsl(0, 70%, 50%)"    // 红色
    }
  ];

  return (
    <BeautifulPieChart
      data={data}
      config={{}}
      title="员工绩效评价分布"
      description="2024年度员工绩效考核结果"
      className="w-full max-w-4xl"
    />
  );
}
```

### 完整功能示例

```tsx
import { BeautifulPieChart } from "@/components/charts/pie-chart";

function ComprehensiveAnalysisChart() {
  const data = [
    { name: "移动端", value: 18500000 },
    { name: "PC端", value: 12300000 },
    { name: "平板", value: 6800000 },
    { name: "智能电视", value: 2900000 },
    { name: "其他设备", value: 1100000 }
  ];

  return (
    <div className="space-y-4">
      <BeautifulPieChart
        data={data}
        config={{}}
        title="用户设备分布"
        description="各设备类型的用户访问量统计"
        showPercentage={true}
        showLegend={true}
        innerRadius={0}        // 标准饼图
        outerRadius={120}
        className="w-full"
      />
      
      <div className="text-sm text-muted-foreground mt-4">
        <p>💡 移动端占据主导地位，占总访问量的45.2%</p>
        <p>📊 前三位设备类型占总量的88.7%，显示高度集中</p>
      </div>
    </div>
  );
}
```

## 属性说明

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `data` | `PieChartData` | ✅ | - | 图表数据，至少包含两个数据点 |
| `config` | `ChartConfig` | ✅ | - | 图表配置（饼图通常使用空配置） |
| `title` | `string` | ❌ | - | 图表标题 |
| `description` | `string` | ❌ | - | 图表描述 |
| `className` | `string` | ❌ | - | 自定义样式类名 |
| `showPercentage` | `boolean` | ❌ | `true` | 是否显示百分比标签 |
| `showLegend` | `boolean` | ❌ | `true` | 是否显示图例 |
| `innerRadius` | `number` | ❌ | `0` | 内圆半径（0为饼图，>0为环形图） |
| `outerRadius` | `number` | ❌ | `120` | 外圆半径 |

## 分析功能

组件会自动提供以下分析功能：

### 分布分析
- **总计值** - 所有数据的总和
- **最大/最小分类** - 占比最高和最低的分类
- **集中度分析** - 前3名的总占比
- **分布状态** - 判断数据是否高度集中（>80%）

### 数据洞察
- **主导分类** - 占比最高的分类
- **平均占比** - 理论平均分配的占比
- **分布状态** - 高度集中或相对分散
- **数据质量** - 检测零值等数据问题

### 详细表格
- **排序展示** - 按数值大小排序
- **占比计算** - 显示每个分类的精确占比
- **累积占比** - 显示累积分布情况
- **视觉标识** - 颜色对应关系清晰

## 数据验证规则

组件会自动验证数据格式，包括：

1. **数据存在性** - 数据不能为空或未定义
2. **最小数据点** - 至少需要 2 个数据点形成有意义分布
3. **字段完整性** - 每个数据点必须包含 `name` 和 `value` 字段
4. **数据类型** - `name` 必须为字符串，`value` 必须为数字
5. **数值有效性** - 不允许负数，总和不能为零
6. **名称唯一性** - 分类名称不能重复

### 错误处理示例

```tsx
// ❌ 错误：数据点不足
const invalidData1 = [
  { name: "单一分类", value: 100 }  // 只有1个数据点，无法形成分布
];

// ❌ 错误：缺少必需字段
const invalidData2 = [
  { name: "分类A" },  // 缺少 value 字段
  { value: 30 }       // 缺少 name 字段
];

// ❌ 错误：数据类型不匹配
const invalidData3 = [
  { name: "分类A", value: "50" },  // value 应为数字类型
  { name: "分类B", value: 30 }
];

// ❌ 错误：包含负数
const invalidData4 = [
  { name: "收入", value: 1000 },
  { name: "支出", value: -800 }  // 饼图不支持负数
];

// ❌ 错误：名称重复
const invalidData5 = [
  { name: "分类A", value: 50 },
  { name: "分类A", value: 30 }  // 名称重复
];

// ✅ 正确格式
const validData = [
  { name: "分类A", value: 50 },
  { name: "分类B", value: 30 },
  { name: "分类C", value: 20 }
];
```

## 最佳实践

### 1. 分类命名
```tsx
// 推荐：使用清晰简洁的分类名
const goodNaming = [
  { name: "移动端", value: 45 },
  { name: "PC端", value: 35 },
  { name: "平板", value: 20 }
];

// 避免：过长或模糊的分类名
const poorNaming = [
  { name: "移动端设备访问用户", value: 45 },
  { name: "类型1", value: 35 }
];
```

### 2. 数据简化
```tsx
// 推荐：合并小分类，保持图表清晰
const simplifiedData = [
  { name: "主要产品", value: 65 },
  { name: "次要产品", value: 25 },
  { name: "其他", value: 10 }  // 将多个小分类合并
];

// 避免：过多细分类别
const overComplicated = [
  { name: "产品A", value: 25 },
  { name: "产品B", value: 20 },
  // ... 10多个小分类
];
```

### 3. 颜色策略
```tsx
// 推荐：使用语义化颜色
const semanticColors = [
  { name: "完成", value: 70, color: "hsl(160, 60%, 45%)" },  // 绿色
  { name: "进行中", value: 20, color: "hsl(45, 90%, 60%)" }, // 黄色
  { name: "未开始", value: 10, color: "hsl(220, 70%, 50%)" } // 蓝色
];
```

### 4. 环形图使用
```tsx
// 适合环形图的场景：
// - 想在中心显示总计或关键信息
// - 数据类别较多，需要更清晰的分割
// - 现代化的设计需求

<BeautifulPieChart
  data={data}
  config={{}}
  innerRadius={60}  // 环形图
  title="收入构成"
/>
```

## 注意事项

1. **数据量限制** - 建议分类数量不超过 8 个，以保证可读性
2. **小分类处理** - 占比小于 3% 的分类建议合并为"其他"
3. **颜色对比** - 确保相邻扇区有足够的颜色对比度
4. **标签重叠** - 过多分类可能导致标签重叠，考虑关闭标签或使用环形图
5. **导出优化** - 组件专为静态导出设计，包含完整的数据表格和分析
6. **零值处理** - 零值或负值会被自动过滤，不会显示在图表中

## 常见问题

### Q: 如何处理数据中的零值？
A: 组件会自动过滤零值，不在图表中显示，但会在数据质量分析中提醒。

### Q: 支持多级饼图吗？
A: 当前版本不支持多级饼图。如需展示层级关系，建议使用多个饼图或其他图表类型。

### Q: 如何自定义标签格式？
A: 当前版本显示百分比标签。如需自定义，可以通过 `showPercentage={false}` 关闭默认标签。

### Q: 环形图中心可以显示内容吗？
A: 当前版本的环形图中心为空。如需在中心显示总计等信息，建议通过 CSS 绝对定位添加。

### Q: 如何处理特别小的分类？
A: 建议将占比小于 3-5% 的分类合并为"其他"类别，这样可以保持图表的可读性。