// AI Agent System for Chart Generation
// This system processes natural language prompts and generates chart data

import { ChartType } from "@/types/chart";
import { CHART_TYPES } from "@/constants/chart";

export interface ChartGenerationRequest {
  prompt: string;
  uploadedFile?: File;
  context?: string[];
}

export interface ChartGenerationResult {
  success: boolean;
  chartType: ChartType;
  data: any[];
  config: Record<string, any>;
  title: string;
  description: string;
  reasoning: string;
  error?: string;
}

export interface AIAgent {
  name: string;
  description: string;
  execute: (request: ChartGenerationRequest) => Promise<ChartGenerationResult>;
}

// Data Analysis Agent - Processes and understands data
export const dataAnalysisAgent: AIAgent = {
  name: "Data Analyzer",
  description: "Analyzes data patterns and recommends appropriate chart types",

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    try {
      // For now, this is a mock implementation
      // In a real implementation, this would connect to an AI service

      const prompt = request.prompt.toLowerCase();

      // Simple heuristics for chart type selection
      let chartType: ChartType = CHART_TYPES.BAR;
      let mockData: any[] = [];
      let title = "Generated Chart";
      const description = "Chart generated from prompt";

      // Chart type detection based on keywords
      if (prompt.includes("trend") || prompt.includes("time") || prompt.includes("over time")) {
        chartType = CHART_TYPES.LINE;
        title = "Trend Analysis";
        mockData = generateMockTimeSeriesData();
      } else if (
        prompt.includes("pie") ||
        prompt.includes("distribution") ||
        prompt.includes("proportion")
      ) {
        chartType = CHART_TYPES.PIE;
        title = "Distribution Chart";
        mockData = generateMockPieData();
      } else if (
        prompt.includes("area") ||
        prompt.includes("cumulative") ||
        prompt.includes("volume")
      ) {
        chartType = CHART_TYPES.AREA;
        title = "Area Analysis";
        mockData = generateMockAreaData();
      } else {
        chartType = CHART_TYPES.BAR;
        title = "Comparison Chart";
        mockData = generateMockBarData();
      }

      // Generate config based on data
      const config = generateChartConfig(mockData, chartType);

      return {
        success: true,
        chartType,
        data: mockData,
        config,
        title,
        description: `Generated based on: "${request.prompt}"`,
        reasoning: `Selected ${chartType} chart because the prompt suggested ${getChartTypeReason(chartType, prompt)}`,
      };
    } catch (error) {
      return {
        success: false,
        chartType: "bar",
        data: [],
        config: {},
        title: "Error",
        description: "Failed to generate chart",
        reasoning: "An error occurred during processing",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// Chart Styling Agent - Optimizes visual appearance
export const chartStylingAgent: AIAgent = {
  name: "Chart Stylist",
  description: "Optimizes chart colors, styling, and visual hierarchy",

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    // This would enhance the chart with better styling based on data characteristics
    // For now, it delegates to the data analysis agent
    return dataAnalysisAgent.execute(request);
  },
};

// Insight Generation Agent - Adds analytical insights
export const insightGenerationAgent: AIAgent = {
  name: "Insight Generator",
  description: "Generates insights and annotations for charts",

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    // This would add insights, trends, and analytical annotations
    return dataAnalysisAgent.execute(request);
  },
};

// Main AI Director - Orchestrates all agents
export class AIDirector {
  private agents: AIAgent[];

  constructor() {
    this.agents = [dataAnalysisAgent, chartStylingAgent, insightGenerationAgent];
  }

  async generateChart(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    try {
      // For now, we use the data analysis agent
      // In a full implementation, we'd orchestrate multiple agents
      const result = await dataAnalysisAgent.execute(request);

      // Add additional processing from other agents
      if (result.success) {
        result.description = await this.enhanceDescription(result, request);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        chartType: "bar",
        data: [],
        config: {},
        title: "Generation Failed",
        description: "AI chart generation encountered an error",
        reasoning: "System error during chart generation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async enhanceDescription(
    result: ChartGenerationResult,
    request: ChartGenerationRequest
  ): Promise<string> {
    const baseDescription = result.description;
    const insights = generateInsights(result.data, result.chartType);
    return `${baseDescription}\n\nKey Insights: ${insights}`;
  }
}

// Utility functions for mock data generation
function generateMockTimeSeriesData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, index) => ({
    month,
    revenue: 1000 + Math.random() * 500 + index * 100,
    expenses: 600 + Math.random() * 200 + index * 50,
    profit: 300 + Math.random() * 100 + index * 25,
  }));
}

function generateMockBarData() {
  const categories = ["Product A", "Product B", "Product C", "Product D"];
  return categories.map(category => ({
    category,
    sales: Math.floor(Math.random() * 1000) + 100,
    target: Math.floor(Math.random() * 800) + 200,
  }));
}

function generateMockPieData() {
  return [
    { name: "Desktop", value: 45 },
    { name: "Mobile", value: 35 },
    { name: "Tablet", value: 15 },
    { name: "Other", value: 5 },
  ];
}

function generateMockAreaData() {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  return quarters.map((quarter, index) => ({
    quarter,
    marketing: 100 + index * 20 + Math.random() * 50,
    development: 150 + index * 30 + Math.random() * 40,
    operations: 80 + index * 15 + Math.random() * 30,
  }));
}

function generateChartConfig(data: any[], chartType: string) {
  if (chartType === "pie") {
    return {}; // Pie charts don't need complex config
  }

  const sampleItem = data[0];
  if (!sampleItem) return {};

  const keys = Object.keys(sampleItem);
  const dataKeys = keys.slice(1); // Skip first key (usually category/time)

  const colors = [
    "hsl(220, 70%, 50%)", // Blue
    "hsl(160, 60%, 45%)", // Green
    "hsl(30, 80%, 55%)", // Orange
    "hsl(280, 65%, 60%)", // Purple
    "hsl(340, 75%, 55%)", // Pink
  ];

  const config: Record<string, any> = {};
  dataKeys.forEach((key, index) => {
    config[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: colors[index % colors.length],
    };
  });

  return config;
}

function getChartTypeReason(chartType: string, prompt: string): string {
  switch (chartType) {
    case "line":
      return "time-based or trending data patterns";
    case "pie":
      return "distribution or proportion keywords";
    case "area":
      return "cumulative or volume-based data";
    default:
      return "comparison or categorical data";
  }
}

function generateInsights(data: any[], chartType: string): string {
  if (chartType === "pie") {
    const total = (data as any[]).reduce((sum, item) => sum + item.value, 0);
    const largest = Math.max(...(data as any[]).map(item => item.value));
    return `Total: ${total}, Largest segment: ${((largest / total) * 100).toFixed(1)}%`;
  }

  const dataLength = data.length;
  if (dataLength === 0) return "No data available for analysis";

  return `Dataset contains ${dataLength} data points with multiple series for comprehensive analysis`;
}

// Export singleton instance
export const aiDirector = new AIDirector();
