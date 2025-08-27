import { ChartType } from "./chart";

export interface AIRequest {
  message: string;
  files?: File[];
  conversationId?: string;
  userId?: string;
}

export interface AIResponse {
  id: string;
  message: string;
  chartData?: ChartGenerationResult;
  conversationId: string;
  timestamp: Date;
  processingTime?: number;
}

export interface ChartGenerationResult {
  type: ChartType;
  data: any[];
  title?: string;
  description?: string;
  insights?: string[];
  metadata?: {
    source?: string;
    generatedAt: Date;
    dataPoints: number;
    confidence?: number;
  };
}

export interface AIContextData {
  fileData?: {
    name: string;
    data: any[];
    headers: string[];
    rowCount: number;
    fileType: string;
  }[];
  previousCharts?: ChartGenerationResult[];
  userPreferences?: {
    preferredChartTypes: ChartType[];
    colorScheme?: string;
    language?: string;
  };
}

export interface MockAIService {
  processMessage(request: AIRequest, context?: AIContextData): Promise<AIResponse>;
  generateChart(prompt: string, data?: any[]): Promise<ChartGenerationResult>;
  analyzeFile(file: File): Promise<{
    data: any[];
    headers: string[];
    suggestedChartTypes: ChartType[];
  }>;
}
