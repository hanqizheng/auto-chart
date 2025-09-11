/**
 * Demo会话数据配置
 * 预设的完整会话数据，用于展示应用功能
 */

import { 
  SerializableChatSession, 
  DemoReplayConfig 
} from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";

/**
 * 销售数据分析Demo
 */
export const SALES_ANALYSIS_DEMO: SerializableChatSession = {
  id: "demo_sales_analysis_2024",
  title: "销售数据趋势分析演示",
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  lastActivity: new Date("2024-01-15T10:05:30.000Z"),
  
  messages: [
    {
      id: "demo_sales_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "帮我分析这个销售数据，生成一个折线图显示月度趋势",
        subtype: USER_MESSAGE_SUBTYPES.MIXED,
        attachments: [
          {
            id: "demo_sales_file",
            name: "2024_sales_data.csv",
            type: "csv",
            size: 2048,
            uploadedAt: new Date("2024-01-15T10:00:00.000Z"),
            storageType: "demo_static",
            staticPath: "/demo-assets/sales_data.csv",
            dataUrl: "data:text/csv;base64,月份,销售额,目标\n2024-01,125000,120000\n2024-02,138000,130000\n2024-03,142000,135000\n2024-04,156000,140000\n2024-05,168000,145000\n2024-06,175000,150000",
            metadata: {
              rows: 7,
              columns: 3,
              encoding: "utf-8"
            }
          }
        ]
      },
      timestamp: new Date("2024-01-15T10:00:00.000Z"),
      status: MESSAGE_STATUS.SENT
    },
    {
      id: "demo_sales_processing_msg",
      type: MESSAGE_TYPES.PROCESSING,
      content: {
        title: "正在分析销售数据",
        isExpanded: false,
        flow: {
          id: "demo_sales_flow",
          steps: [
            {
              id: "demo_sales_step_1",
              type: "thinking",
              title: "分析用户需求",
              description: "理解用户想要分析销售数据的趋势",
              status: "completed",
              duration: 1200,
              data: {
                reasoning: "用户提供了销售数据并要求生成折线图显示月度趋势，这是典型的时间序列数据分析需求",
                conclusion: "选择折线图最适合展示销售额随时间的变化趋势"
              }
            },
            {
              id: "demo_sales_step_2",
              type: "file_parsing",
              title: "解析CSV文件",
              description: "提取销售数据结构",
              status: "completed",
              duration: 800,
              data: {
                fileName: "2024_sales_data.csv",
                fileSize: 2048,
                fileType: "text/csv",
                rowCount: 6,
                columnCount: 3,
                parseTime: 800
              }
            },
            {
              id: "demo_sales_step_3",
              type: "chart_type_detection",
              title: "确定图表类型",
              description: "选择最适合的图表类型",
              status: "completed",
              duration: 500,
              data: {
                detectedType: "line",
                confidence: 0.92,
                reasoning: "时间序列数据最适合用折线图展示趋势变化"
              }
            },
            {
              id: "demo_sales_step_4",
              type: "chart_generation",
              title: "生成折线图",
              description: "创建交互式销售趋势图表",
              status: "completed",
              duration: 1500,
              data: {
                chartType: "line",
                componentName: "BeautifulLineChart",
                generationTime: 1500,
                dataMapping: {
                  xAxis: "month",
                  yAxis: ["销售额", "目标"]
                },
                config: {
                  colors: ["#8b5cf6", "#06d6a0"],
                  showTrend: true,
                  animation: true
                }
              }
            }
          ],
          currentStepIndex: 4,
          totalSteps: 4,
          startTime: new Date("2024-01-15T10:00:05.000Z"),
          endTime: new Date("2024-01-15T10:00:09.000Z"),
          isCompleted: true,
          hasError: false
        }
      },
      timestamp: new Date("2024-01-15T10:00:05.000Z"),
      status: MESSAGE_STATUS.COMPLETED
    },
    {
      id: "demo_sales_chart_msg",
      type: MESSAGE_TYPES.CHART_RESULT,
      content: {
        chartType: "line",
        title: "2024年销售趋势分析",
        description: "基于您提供的数据生成的销售趋势图表，显示了销售额稳步增长的良好态势，且大部分月份都超过了预设目标。",
        chartData: [
          { month: "2024-01", 销售额: 125000, 目标: 120000 },
          { month: "2024-02", 销售额: 138000, 目标: 130000 },
          { month: "2024-03", 销售额: 142000, 目标: 135000 },
          { month: "2024-04", 销售额: 156000, 目标: 140000 },
          { month: "2024-05", 销售额: 168000, 目标: 145000 },
          { month: "2024-06", 销售额: 175000, 目标: 150000 }
        ],
        chartConfig: {
          销售额: { 
            label: "实际销售额", 
            color: "hsl(220, 70%, 50%)" 
          },
          目标: { 
            label: "销售目标", 
            color: "hsl(160, 60%, 45%)" 
          }
        },
        imageInfo: {
          filename: "sales_trend_demo.png",
          localBlobUrl: "", // 运行时生成
          storageType: "demo_static",
          staticPath: "/demo-assets/sales_trend_chart.png",
          size: 245760,
          format: "png",
          dimensions: { width: 800, height: 600 },
          createdAt: new Date("2024-01-15T10:05:30.000Z")
        }
      },
      timestamp: new Date("2024-01-15T10:05:30.000Z"),
      status: MESSAGE_STATUS.COMPLETED
    }
  ],
  
  currentChart: {
    chartType: "line",
    title: "2024年销售趋势分析",
    description: "基于您提供的数据生成的销售趋势图表，显示了销售额稳步增长的良好态势。",
    chartData: [
      { month: "2024-01", 销售额: 125000, 目标: 120000 },
      { month: "2024-02", 销售额: 138000, 目标: 130000 },
      { month: "2024-03", 销售额: 142000, 目标: 135000 },
      { month: "2024-04", 销售额: 156000, 目标: 140000 },
      { month: "2024-05", 销售额: 168000, 目标: 145000 },
      { month: "2024-06", 销售额: 175000, 目标: 150000 }
    ],
    chartConfig: {
      销售额: { label: "实际销售额", color: "hsl(220, 70%, 50%)" },
      目标: { label: "销售目标", color: "hsl(160, 60%, 45%)" }
    },
    imageInfo: {
      filename: "sales_trend_demo.png",
      localBlobUrl: "",
      storageType: "demo_static",
      staticPath: "/demo-assets/sales_trend_chart.png",
      size: 245760,
      format: "png",
      dimensions: { width: 800, height: 600 },
      createdAt: new Date("2024-01-15T10:05:30.000Z")
    }
  },
  
  _demoReplay: {
    enabled: true,
    mode: "step_by_step",
    stepDelay: 1500,
    predefinedSteps: [
      {
        type: "add_processing_message",
        delay: 0,
        data: {
          title: "正在分析销售数据"
        }
      },
      {
        type: "update_processing_step",
        delay: 1000,
        data: {
          stepType: "thinking",
          title: "分析用户需求",
          content: "理解用户想要分析销售数据的趋势..."
        }
      },
      {
        type: "update_processing_step",
        delay: 1500,
        data: {
          stepType: "file_parsing",
          title: "解析CSV文件",
          content: "正在解析销售数据文件，提取数据结构..."
        }
      },
      {
        type: "update_processing_step",
        delay: 2000,
        data: {
          stepType: "chart_type_detection",
          title: "确定图表类型",
          content: "分析数据特征，选择最适合的图表类型..."
        }
      },
      {
        type: "update_processing_step",
        delay: 2500,
        data: {
          stepType: "chart_generation",
          title: "生成折线图",
          content: "正在创建交互式销售趋势图表..."
        }
      },
      {
        type: "add_chart_result",
        delay: 3500,
        data: {
          chartType: "line",
          title: "2024年销售趋势分析",
          description: "基于您提供的数据生成的销售趋势图表，显示了销售额稳步增长的良好态势。",
          chartData: [
            { month: "2024-01", 销售额: 125000, 目标: 120000 },
            { month: "2024-02", 销售额: 138000, 目标: 130000 },
            { month: "2024-03", 销售额: 142000, 目标: 135000 },
            { month: "2024-04", 销售额: 156000, 目标: 140000 },
            { month: "2024-05", 销售额: 168000, 目标: 145000 },
            { month: "2024-06", 销售额: 175000, 目标: 150000 }
          ],
          chartConfig: {
            销售额: { label: "实际销售额", color: "hsl(220, 70%, 50%)" },
            目标: { label: "销售目标", color: "hsl(160, 60%, 45%)" }
          },
          imageInfo: {
            filename: "sales_trend_demo.png",
            localBlobUrl: "",
            storageType: "demo_static",
            staticPath: "/demo-assets/sales_trend_chart.png",
            size: 245760,
            format: "png",
            dimensions: { width: 800, height: 600 },
            createdAt: new Date("2024-01-15T10:05:30.000Z")
          }
        }
      }
    ]
  },
  
  _storage: {
    totalFiles: 1,
    totalCharts: 1,
    storageTypes: ["demo_static"],
    indexeddbKeys: []
  }
};

/**
 * 产品占比分析Demo
 */
export const PRODUCT_SHARE_DEMO: SerializableChatSession = {
  id: "demo_product_share_2024",
  title: "产品销售占比分析演示",
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-10T14:30:00.000Z"),
  lastActivity: new Date("2024-01-10T14:33:45.000Z"),
  
  messages: [
    {
      id: "demo_product_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "生成一个饼图显示各产品的销售占比",
        subtype: USER_MESSAGE_SUBTYPES.TEXT
      },
      timestamp: new Date("2024-01-10T14:30:00.000Z"),
      status: MESSAGE_STATUS.SENT
    },
    {
      id: "demo_product_chart_msg",
      type: MESSAGE_TYPES.CHART_RESULT,
      content: {
        chartType: "pie",
        title: "产品销售占比分析",
        description: "根据AI生成的模拟数据制作的产品销售占比图，清晰展示各产品的市场份额分布。",
        chartData: [
          { name: "产品A", value: 35, sales: 350000 },
          { name: "产品B", value: 25, sales: 250000 },
          { name: "产品C", value: 20, sales: 200000 },
          { name: "产品D", value: 12, sales: 120000 },
          { name: "其他", value: 8, sales: 80000 }
        ],
        chartConfig: {
          产品A: { label: "产品A", color: "hsl(220, 70%, 50%)" },
          产品B: { label: "产品B", color: "hsl(160, 60%, 45%)" },
          产品C: { label: "产品C", color: "hsl(30, 80%, 55%)" },
          产品D: { label: "产品D", color: "hsl(280, 65%, 60%)" },
          其他: { label: "其他产品", color: "hsl(340, 75%, 55%)" }
        },
        imageInfo: {
          filename: "product_share_demo.png",
          localBlobUrl: "",
          storageType: "demo_static",
          staticPath: "/demo-assets/product_share_chart.png",
          size: 156800,
          format: "png",
          dimensions: { width: 600, height: 400 },
          createdAt: new Date("2024-01-10T14:33:45.000Z")
        }
      },
      timestamp: new Date("2024-01-10T14:33:45.000Z"),
      status: MESSAGE_STATUS.COMPLETED
    }
  ],
  
  currentChart: {
    chartType: "pie",
    title: "产品销售占比分析",
    description: "根据AI生成的模拟数据制作的产品销售占比图。",
    chartData: [
      { name: "产品A", value: 35, sales: 350000 },
      { name: "产品B", value: 25, sales: 250000 },
      { name: "产品C", value: 20, sales: 200000 },
      { name: "产品D", value: 12, sales: 120000 },
      { name: "其他", value: 8, sales: 80000 }
    ],
    chartConfig: {
      产品A: { label: "产品A", color: "hsl(220, 70%, 50%)" },
      产品B: { label: "产品B", color: "hsl(160, 60%, 45%)" },
      产品C: { label: "产品C", color: "hsl(30, 80%, 55%)" },
      产品D: { label: "产品D", color: "hsl(280, 65%, 60%)" },
      其他: { label: "其他产品", color: "hsl(340, 75%, 55%)" }
    },
    imageInfo: {
      filename: "product_share_demo.png",
      localBlobUrl: "",
      storageType: "demo_static",
      staticPath: "/demo-assets/product_share_chart.png",
      size: 156800,
      format: "png",
      dimensions: { width: 600, height: 400 },
      createdAt: new Date("2024-01-10T14:33:45.000Z")
    }
  },
  
  _demoReplay: {
    enabled: true,
    mode: "instant",
    stepDelay: 0,
    predefinedSteps: [
      {
        type: "add_chart_result",
        delay: 1000,
        data: {
          chartType: "pie",
          title: "产品销售占比分析",
          description: "根据AI生成的模拟数据制作的产品销售占比图。",
          chartData: [
            { name: "产品A", value: 35, sales: 350000 },
            { name: "产品B", value: 25, sales: 250000 },
            { name: "产品C", value: 20, sales: 200000 },
            { name: "产品D", value: 12, sales: 120000 },
            { name: "其他", value: 8, sales: 80000 }
          ],
          chartConfig: {
            产品A: { label: "产品A", color: "hsl(220, 70%, 50%)" },
            产品B: { label: "产品B", color: "hsl(160, 60%, 45%)" },
            产品C: { label: "产品C", color: "hsl(30, 80%, 55%)" },
            产品D: { label: "产品D", color: "hsl(280, 65%, 60%)" },
            其他: { label: "其他产品", color: "hsl(340, 75%, 55%)" }
          },
          imageInfo: {
            filename: "product_share_demo.png",
            localBlobUrl: "",
            storageType: "demo_static",
            staticPath: "/demo-assets/product_share_chart.png",
            size: 156800,
            format: "png",
            dimensions: { width: 600, height: 400 },
            createdAt: new Date("2024-01-10T14:33:45.000Z")
          }
        }
      }
    ]
  },
  
  _storage: {
    totalFiles: 0,
    totalCharts: 1,
    storageTypes: ["demo_static"],
    indexeddbKeys: []
  }
};

/**
 * 地区收入对比Demo
 */
export const REGIONAL_REVENUE_DEMO: SerializableChatSession = {
  id: "demo_regional_revenue_2024",
  title: "地区收入对比分析演示",
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-20T16:15:00.000Z"),
  lastActivity: new Date("2024-01-20T16:18:20.000Z"),
  
  messages: [
    {
      id: "demo_regional_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "创建一个柱状图比较北京、上海、深圳三个城市的收入情况",
        subtype: USER_MESSAGE_SUBTYPES.TEXT
      },
      timestamp: new Date("2024-01-20T16:15:00.000Z"),
      status: MESSAGE_STATUS.SENT
    },
    {
      id: "demo_regional_chart_msg",
      type: MESSAGE_TYPES.CHART_RESULT,
      content: {
        chartType: "bar",
        title: "主要城市收入对比分析",
        description: "展示北京、上海、深圳三个主要城市的收入对比情况，包括平均收入和中位数收入的双重视角。",
        chartData: [
          { city: "北京", 平均收入: 25000, 中位数收入: 20000 },
          { city: "上海", 平均收入: 23000, 中位数收入: 19000 },
          { city: "深圳", 平均收入: 22000, 中位数收入: 18500 }
        ],
        chartConfig: {
          平均收入: { label: "平均收入", color: "hsl(220, 70%, 50%)" },
          中位数收入: { label: "中位数收入", color: "hsl(160, 60%, 45%)" }
        },
        imageInfo: {
          filename: "regional_revenue_demo.png",
          localBlobUrl: "",
          storageType: "demo_static",
          staticPath: "/demo-assets/regional_revenue_chart.png",
          size: 198400,
          format: "png",
          dimensions: { width: 800, height: 500 },
          createdAt: new Date("2024-01-20T16:18:20.000Z")
        }
      },
      timestamp: new Date("2024-01-20T16:18:20.000Z"),
      status: MESSAGE_STATUS.COMPLETED
    }
  ],
  
  currentChart: {
    chartType: "bar",
    title: "主要城市收入对比分析",
    description: "展示北京、上海、深圳三个主要城市的收入对比情况。",
    chartData: [
      { city: "北京", 平均收入: 25000, 中位数收入: 20000 },
      { city: "上海", 平均收入: 23000, 中位数收入: 19000 },
      { city: "深圳", 平均收入: 22000, 中位数收入: 18500 }
    ],
    chartConfig: {
      平均收入: { label: "平均收入", color: "hsl(220, 70%, 50%)" },
      中位数收入: { label: "中位数收入", color: "hsl(160, 60%, 45%)" }
    },
    imageInfo: {
      filename: "regional_revenue_demo.png",
      localBlobUrl: "",
      storageType: "demo_static",
      staticPath: "/demo-assets/regional_revenue_chart.png",
      size: 198400,
      format: "png",
      dimensions: { width: 800, height: 500 },
      createdAt: new Date("2024-01-20T16:18:20.000Z")
    }
  },
  
  _storage: {
    totalFiles: 0,
    totalCharts: 1,
    storageTypes: ["demo_static"],
    indexeddbKeys: []
  }
};

/**
 * Demo会话映射表
 */
export const DEMO_SESSIONS = {
  sales_analysis: SALES_ANALYSIS_DEMO,
  product_share: PRODUCT_SHARE_DEMO,
  regional_revenue: REGIONAL_REVENUE_DEMO,
} as const;

/**
 * Demo会话列表（用于首页展示）
 */
export const DEMO_SESSION_LIST = [
  {
    id: "sales_analysis",
    title: "销售数据趋势分析",
    description: "上传Excel文件，生成销售趋势折线图",
    category: "数据分析",
    chartType: "line",
    features: ["文件上传", "趋势分析", "对比展示"],
    estimatedTime: "30秒"
  },
  {
    id: "product_share",
    title: "产品销售占比分析",
    description: "快速生成产品占比饼图",
    category: "市场分析",
    chartType: "pie",
    features: ["AI生成数据", "占比分析", "交互图表"],
    estimatedTime: "15秒"
  },
  {
    id: "regional_revenue",
    title: "地区收入对比分析",
    description: "多城市收入数据柱状图对比",
    category: "地域分析",
    chartType: "bar",
    features: ["多维对比", "数据洞察", "专业图表"],
    estimatedTime: "20秒"
  }
] as const;

/**
 * 获取Demo会话数据
 */
export function getDemoSession(demoId: string): SerializableChatSession | null {
  return DEMO_SESSIONS[demoId as keyof typeof DEMO_SESSIONS] || null;
}

/**
 * 获取所有Demo会话ID列表
 */
export function getDemoSessionIds(): string[] {
  return Object.keys(DEMO_SESSIONS);
}

/**
 * 验证Demo ID是否有效
 */
export function isValidDemoId(demoId: string): boolean {
  return demoId in DEMO_SESSIONS;
}