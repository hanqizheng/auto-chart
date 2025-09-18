/**
 * Demo session data configuration
 * Preset complete session data for showcasing app functionality
 */

import { SerializableChatSession } from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";

/**
 * Sales data analysis demo - triggers real AI process
 */
export const SALES_ANALYSIS_DEMO: SerializableChatSession = {
  id: "demo_sales_analysis_2024",
  title: undefined, // Let the system generate automatically
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  lastActivity: new Date("2024-01-15T10:00:00.000Z"),

  messages: [
    {
      id: "demo_sales_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "Help me analyze this sales data and generate a line chart showing monthly trends",
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

  // Configure auto-trigger to let demo follow real AI processing flow
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
 * Product share analysis demo - triggers real AI process
 */
export const PRODUCT_SHARE_DEMO: SerializableChatSession = {
  id: "demo_product_share_2024",
  title: undefined, // Let the system generate automatically
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-10T14:30:00.000Z"),
  lastActivity: new Date("2024-01-10T14:30:00.000Z"),

  messages: [
    {
      id: "demo_product_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "Generate a pie chart showing the sales share of each product",
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

  // Configure auto-trigger to let demo follow real AI processing flow
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
 * Performance analysis demo - triggers real AI process
 */
export const PERFORMANCE_ANALYSIS_DEMO: SerializableChatSession = {
  id: "demo_performance_analysis_2024",
  title: undefined, // Let the system generate automatically
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-25T09:45:00.000Z"),
  lastActivity: new Date("2024-01-25T09:45:00.000Z"),

  messages: [
    {
      id: "demo_performance_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "Create an area chart showing performance metrics over time",
        subtype: USER_MESSAGE_SUBTYPES.MIXED,
        attachments: [
          {
            id: "demo_performance_file",
            name: "performance_data.csv",
            type: "csv",
            size: 1536,
            uploadedAt: new Date("2024-01-25T09:45:00.000Z"),
            storageType: "base64",
            dataUrl:
              "data:text/csv;base64," +
              btoa(
                unescape(
                  encodeURIComponent(
                    "month,performance,target\n2024-01,85,80\n2024-02,88,82\n2024-03,92,85\n2024-04,89,87\n2024-05,94,90\n2024-06,97,92"
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
      timestamp: new Date("2024-01-25T09:45:00.000Z"),
      status: MESSAGE_STATUS.SENT,
    },
  ],

  // Configure auto-trigger to let demo follow real AI processing flow
  _autoTrigger: {
    enabled: true,
    type: "ai_processing",
    triggerMessage: "demo_performance_user_msg",
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
 * Regional revenue comparison demo - triggers real AI process
 */
export const REGIONAL_REVENUE_DEMO: SerializableChatSession = {
  id: "demo_regional_revenue_2024",
  title: undefined, // Let the system generate automatically
  version: "1.0",
  source: "demo",
  createdAt: new Date("2024-01-20T16:15:00.000Z"),
  lastActivity: new Date("2024-01-20T16:15:00.000Z"),

  messages: [
    {
      id: "demo_regional_user_msg",
      type: MESSAGE_TYPES.USER,
      content: {
        text: "Create a bar chart comparing the revenue of Beijing, Shanghai, and Shenzhen",
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

  // Configure auto-trigger to let demo follow real AI processing flow
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
 * Demo session mapping table
 */
export const DEMO_SESSIONS = {
  sales_analysis: SALES_ANALYSIS_DEMO,
  product_share: PRODUCT_SHARE_DEMO,
  regional_revenue: REGIONAL_REVENUE_DEMO,
  performance_analysis: PERFORMANCE_ANALYSIS_DEMO,
} as const;

/**
 * Demo session list (for homepage display)
 */
export const DEMO_SESSION_LIST = [
  {
    id: "sales_analysis",
    title: "Sales Data Trend Analysis",
    description: "Upload Excel file to generate sales trend line chart",
    category: "Data Analysis",
    chartType: "line",
    features: ["File Upload", "Trend Analysis", "Comparison Display"],
  },
  {
    id: "product_share",
    title: "Product Sales Share Analysis",
    description: "Quickly generate product share pie chart",
    category: "Market Analysis",
    chartType: "pie",
    features: ["AI Generated Data", "Share Analysis", "Interactive Charts"],
  },
  {
    id: "regional_revenue",
    title: "Regional Revenue Comparison Analysis",
    description: "Multi-city revenue data bar chart comparison",
    category: "Regional Analysis",
    chartType: "bar",
    features: ["Multi-dimensional Comparison", "Data Insights", "Professional Charts"],
  },
  {
    id: "performance_analysis",
    title: "Performance Trend Analysis",
    description: "Visualize cumulative performance data over time",
    category: "Performance Analysis",
    chartType: "area",
    features: ["Time Series", "Cumulative Display", "Trend Indicators"],
  },
] as const;

/**
 * Get demo session data
 */
export function getDemoSession(demoId: string): SerializableChatSession | null {
  return DEMO_SESSIONS[demoId as keyof typeof DEMO_SESSIONS] || null;
}

/**
 * Get all demo session ID list
 */
export function getDemoSessionIds(): string[] {
  return Object.keys(DEMO_SESSIONS);
}

/**
 * Validate if demo ID is valid
 */
export function isValidDemoId(demoId: string): boolean {
  return demoId in DEMO_SESSIONS;
}
