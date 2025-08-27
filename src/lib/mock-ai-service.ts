import { ChartType } from "@/types/chart";
import {
  AIRequest,
  AIResponse,
  ChartGenerationResult,
  AIContextData,
  MockAIService,
} from "@/types/ai";

class MockAIServiceImpl implements MockAIService {
  private conversationId = crypto.randomUUID();

  async processMessage(request: AIRequest, context?: AIContextData): Promise<AIResponse> {
    // Simulate processing delay
    await this.delay(1000 + Math.random() * 2000);

    const response: AIResponse = {
      id: crypto.randomUUID(),
      message: await this.generateResponseMessage(request.message, context),
      conversationId: request.conversationId || this.conversationId,
      timestamp: new Date(),
      processingTime: Math.random() * 2000 + 500,
    };

    // Check if we should generate a chart
    const shouldGenerateChart = this.shouldGenerateChart(request.message, context);
    if (shouldGenerateChart) {
      response.chartData = await this.generateChart(request.message, context?.fileData?.[0]?.data);
    }

    return response;
  }

  async generateChart(prompt: string, data?: any[]): Promise<ChartGenerationResult> {
    await this.delay(500 + Math.random() * 1000);

    const chartType = this.detectChartType(prompt);
    const chartData = data || this.generateMockData(chartType);

    return {
      type: chartType,
      data: chartData,
      title: this.generateChartTitle(prompt, chartType),
      description: this.generateChartDescription(prompt, chartType),
      insights: this.generateInsights(chartData, chartType),
      metadata: {
        generatedAt: new Date(),
        dataPoints: chartData.length,
        confidence: 0.8 + Math.random() * 0.2,
        source: data ? "uploaded_file" : "generated",
      },
    };
  }

  async analyzeFile(file: File): Promise<{
    data: any[];
    headers: string[];
    suggestedChartTypes: ChartType[];
  }> {
    await this.delay(1000 + Math.random() * 2000);

    // Mock file analysis
    const mockHeaders = ["Category", "Value", "Date", "Status"];
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      Category: `Category ${i + 1}`,
      Value: Math.floor(Math.random() * 1000) + 100,
      Date: new Date(2024, i % 12, i + 1).toISOString(),
      Status: i % 2 === 0 ? "Active" : "Inactive",
    }));

    return {
      data: mockData,
      headers: mockHeaders,
      suggestedChartTypes: ["bar", "line", "pie"],
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldGenerateChart(message: string, context?: AIContextData): boolean {
    const lowerMessage = message.toLowerCase();
    const chartKeywords = [
      "图表",
      "chart",
      "数据",
      "data",
      "可视化",
      "visualization",
      "柱状图",
      "bar chart",
      "折线图",
      "line chart",
      "饼图",
      "pie chart",
      "分析",
      "analyze",
      "展示",
      "show",
      "显示",
      "display",
    ];

    return (
      (chartKeywords.some(keyword => lowerMessage.includes(keyword)) ||
        (context?.fileData && context.fileData.length > 0)) ??
      false
    );
  }

  private detectChartType(prompt: string): ChartType {
    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes("柱状") ||
      lowerPrompt.includes("bar") ||
      lowerPrompt.includes("条形")
    ) {
      return "bar";
    }
    if (
      lowerPrompt.includes("折线") ||
      lowerPrompt.includes("line") ||
      lowerPrompt.includes("趋势")
    ) {
      return "line";
    }
    if (
      lowerPrompt.includes("饼图") ||
      lowerPrompt.includes("pie") ||
      lowerPrompt.includes("占比")
    ) {
      return "pie";
    }
    if (
      lowerPrompt.includes("面积") ||
      lowerPrompt.includes("area") ||
      lowerPrompt.includes("填充")
    ) {
      return "area";
    }

    // Default to bar chart
    return "bar";
  }

  private generateMockData(type: ChartType): any[] {
    const categories = ["一月", "二月", "三月", "四月", "五月", "六月"];

    switch (type) {
      case "bar":
      case "line":
      case "area":
        return categories.map(name => ({
          name,
          value: Math.floor(Math.random() * 500) + 100,
          growth: (Math.random() - 0.5) * 0.4,
        }));

      case "pie":
        return [
          { name: "桌面端", value: 45, color: "#0088FE" },
          { name: "移动端", value: 35, color: "#00C49F" },
          { name: "平板端", value: 15, color: "#FFBB28" },
          { name: "其他", value: 5, color: "#FF8042" },
        ];

      default:
        return categories.map(name => ({
          name,
          value: Math.floor(Math.random() * 500) + 100,
        }));
    }
  }

  private generateChartTitle(prompt: string, type: ChartType): string {
    const titles = {
      bar: ["月度销售数据", "产品销量对比", "地区业绩统计"],
      line: ["销售趋势分析", "增长率变化", "用户活跃度趋势"],
      pie: ["市场份额分布", "用户来源占比", "产品类别分布"],
      area: ["累积销售额", "用户增长趋势", "收入构成分析"],
    };

    const typeOptions = titles[type] || titles.bar;
    return typeOptions[Math.floor(Math.random() * typeOptions.length)];
  }

  private generateChartDescription(prompt: string, type: ChartType): string {
    const descriptions = {
      bar: "此柱状图显示了各类别的数值对比，便于快速识别最高和最低值。",
      line: "此折线图展现了数据随时间的变化趋势，有助于预测未来走向。",
      pie: "此饼图直观展示了各部分在整体中的占比关系。",
      area: "此面积图强调了数据的累积效果和总量变化。",
    };

    return descriptions[type] || descriptions.bar;
  }

  private generateInsights(data: any[], type: ChartType): string[] {
    const insights: string[] = [];

    if (data.length === 0) return insights;

    // Generic insights based on data
    const values = data.map(d => d.value || 0).filter(v => typeof v === "number");
    if (values.length > 0) {
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      insights.push(`数据范围：${min.toLocaleString()} - ${max.toLocaleString()}`);
      insights.push(`平均值：${avg.toLocaleString()}`);

      if (type === "line" || type === "area") {
        const trend = values[values.length - 1] > values[0] ? "上升" : "下降";
        insights.push(`总体趋势：${trend}`);
      }
    }

    return insights;
  }

  private async generateResponseMessage(message: string, context?: AIContextData): Promise<string> {
    const hasFiles = context?.fileData && context.fileData.length > 0;

    let response = `我已经收到您的消息："${message}"`;

    if (hasFiles) {
      const fileCount = context!.fileData!.length;
      const fileNames = context!.fileData!.map(f => f.name).join(", ");
      response += `\\n\\n您上传了 ${fileCount} 个文件：${fileNames}`;
      response += "\\n\\n我已经分析了您的数据，并生成了相应的图表。";
    } else if (this.shouldGenerateChart(message, context)) {
      response += "\\n\\n基于您的需求，我为您生成了一个数据可视化图表。";
    } else {
      response += "\\n\\n如果您需要生成图表，请告诉我您想要展示什么数据，或者上传数据文件。";
    }

    return response;
  }
}

export const mockAIService = new MockAIServiceImpl();
