/**
 * Demo会话数据配置
 * 预设的完整会话数据，用于展示应用功能
 */

import { SerializableChatSession } from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";

/**
 * 销售数据分析Demo - 触发真实AI流程
 */
export const SALES_ANALYSIS_DEMO: SerializableChatSession = {
  id: "demo_sales_analysis_2024",
  title: undefined, // 让系统自动生成
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  lastActivity: new Date("2024-01-15T10:00:00.000Z"),

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
            storageType: "base64",
            dataUrl:
              "data:text/csv;base64," +
              btoa(
                unescape(
                  encodeURIComponent(
                    "date,sales,target\n2024-01,125000,120000\n2024-02,138000,130000\n2024-03,142000,135000\n2024-04,156000,140000\n2024-05,168000,145000\n2024-06,175000,150000"
                  )
                )
              ),
            metadata: {
              rows: 7,
              columns: 3,
              encoding: "utf-8",
            },
          },
        ],
      },
      timestamp: new Date("2024-01-15T10:00:00.000Z"),
      status: MESSAGE_STATUS.SENT,
    },
  ],

  // 配置自动触发，让Demo走真实的AI处理流程
  _autoTrigger: {
    enabled: true,
    type: "ai_processing",
    triggerMessage: "demo_sales_user_msg",
    expectedFlow: [
      "thinking",
      "data_analysis",
      "chart_type_detection",
      "chart_generation",
      "image_export",
    ],
  },

  _storage: {
    totalFiles: 1,
    totalCharts: 0,
    storageTypes: ["base64"],
    indexeddbKeys: [],
  },
};

/**
 * 产品占比分析Demo - 触发真实AI流程
 */
export const PRODUCT_SHARE_DEMO: SerializableChatSession = {
  id: "demo_product_share_2024",
  title: undefined, // 让系统自动生成
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-10T14:30:00.000Z"),
  lastActivity: new Date("2024-01-10T14:30:00.000Z"),

  messages: [
    {
      id: "demo_product_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "生成一个饼图显示各产品的销售占比",
        subtype: USER_MESSAGE_SUBTYPES.MIXED,
        attachments: [
          {
            id: "demo_product_file",
            name: "product_sales.csv",
            type: "csv",
            size: 1280,
            uploadedAt: new Date("2024-01-10T14:30:00.000Z"),
            storageType: "base64",
            dataUrl:
              "data:text/csv;base64," +
              btoa(
                unescape(
                  encodeURIComponent(
                    "product,sales,percentage\nProduct A,350000,35\nProduct B,250000,25\nProduct C,200000,20\nProduct D,120000,12\nOthers,80000,8"
                  )
                )
              ),
            metadata: {
              rows: 6,
              columns: 3,
              encoding: "utf-8",
            },
          },
        ],
      },
      timestamp: new Date("2024-01-10T14:30:00.000Z"),
      status: MESSAGE_STATUS.SENT,
    },
  ],

  // 配置自动触发，让Demo走真实的AI处理流程
  _autoTrigger: {
    enabled: true,
    type: "ai_processing",
    triggerMessage: "demo_product_user_msg",
    expectedFlow: [
      "thinking",
      "data_analysis",
      "chart_type_detection",
      "chart_generation",
      "image_export",
    ],
  },

  _storage: {
    totalFiles: 1,
    totalCharts: 0,
    storageTypes: ["base64"],
    indexeddbKeys: [],
  },
};

/**
 * 地区收入对比Demo - 触发真实AI流程
 */
export const REGIONAL_REVENUE_DEMO: SerializableChatSession = {
  id: "demo_regional_revenue_2024",
  title: undefined, // 让系统自动生成
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-20T16:15:00.000Z"),
  lastActivity: new Date("2024-01-20T16:15:00.000Z"),

  messages: [
    {
      id: "demo_regional_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "创建一个柱状图比较北京、上海、深圳三个城市的收入情况",
        subtype: USER_MESSAGE_SUBTYPES.MIXED,
        attachments: [
          {
            id: "demo_regional_file",
            name: "city_income.csv",
            type: "csv",
            size: 960,
            uploadedAt: new Date("2024-01-20T16:15:00.000Z"),
            storageType: "base64",
            dataUrl:
              "data:text/csv;base64," +
              btoa(
                unescape(
                  encodeURIComponent(
                    "city,average_income,median_income\nBeijing,25000,20000\nShanghai,23000,19000\nShenzhen,22000,18500"
                  )
                )
              ),
            metadata: {
              rows: 4,
              columns: 3,
              encoding: "utf-8",
            },
          },
        ],
      },
      timestamp: new Date("2024-01-20T16:15:00.000Z"),
      status: MESSAGE_STATUS.SENT,
    },
  ],

  // 配置自动触发，让Demo走真实的AI处理流程
  _autoTrigger: {
    enabled: true,
    type: "ai_processing",
    triggerMessage: "demo_regional_user_msg",
    expectedFlow: [
      "thinking",
      "data_analysis",
      "chart_type_detection",
      "chart_generation",
      "image_export",
    ],
  },

  _storage: {
    totalFiles: 1,
    totalCharts: 0,
    storageTypes: ["base64"],
    indexeddbKeys: [],
  },
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
    estimatedTime: "30秒",
  },
  {
    id: "product_share",
    title: "产品销售占比分析",
    description: "快速生成产品占比饼图",
    category: "市场分析",
    chartType: "pie",
    features: ["AI生成数据", "占比分析", "交互图表"],
    estimatedTime: "15秒",
  },
  {
    id: "regional_revenue",
    title: "地区收入对比分析",
    description: "多城市收入数据柱状图对比",
    category: "地域分析",
    chartType: "bar",
    features: ["多维对比", "数据洞察", "专业图表"],
    estimatedTime: "20秒",
  },
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
