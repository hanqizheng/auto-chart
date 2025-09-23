// AI Agents for Chart Generation
// 重构现有的 AI agents 系统，使用新的 AI 服务层

import { ChartType } from "@/types/chart";
import { CHART_TYPE_LABELS } from "@/constants/chart";
import { AIService } from "./ai/types";
import { createServiceFromEnv } from "./ai/service-factory";

/**
 * Chart Generation Request
 */
export interface ChartGenerationRequest {
  prompt: string;
  uploadedFile?: File;
  context?: string[];
}

/**
 * Chart Generation Result
 */
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

/**
 * AI Agent 接口
 */
export interface AIAgent {
  name: string;
  description: string;
  execute: (request: ChartGenerationRequest) => Promise<ChartGenerationResult>;
}

/**
 * Chart Intent Analysis Result
 */
export interface ChartIntentResult {
  chartType: ChartType;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

/**
 * Data Mapping Result
 */
export interface DataMappingResult {
  mappedData: any[];
  dataType: "mock" | "uploaded" | "hybrid" | "extracted";
  structure: {
    xAxisKey: string;
    yAxisKeys: string[];
    totalPoints: number;
  };
}

/**
 * Metadata Generation Result
 */
export interface MetadataResult {
  title: string;
  description: string;
  config: Record<string, any>;
  labels: {
    xAxis?: string;
    yAxis?: string;
  };
}

/**
 * Chart Intent Analysis Agent
 * 分析用户意图，确定最适合的图表类型
 */
export class ChartIntentAgent implements AIAgent {
  readonly name = "Chart Intent Analyzer";
  readonly description = "分析用户提示词，识别图表类型和绘制意图";

  private aiService: AIService;

  constructor(aiService?: AIService) {
    // 如果没有提供 AI 服务，使用环境变量创建默认服务
    // 注意：在客户端代码中可能无法访问环境变量，需要预先配置
    if (aiService) {
      this.aiService = aiService;
    } else {
      // 延迟初始化，在需要时再创建服务
      this.aiService = null as any;
    }
  }

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    console.log("🐛🔍 [AI-Agents] 主流程：开始处理请求:", {
      prompt: request.prompt?.substring(0, 100),
      hasFile: !!request.uploadedFile,
      fileName: request.uploadedFile?.name,
      fileType: request.uploadedFile?.type,
      fileSize: request.uploadedFile?.size,
      contextLength: request.context?.length || 0,
    });

    try {
      // 初始化AI服务（如果还未初始化）
      if (!this.aiService) {
        throw new Error("AI服务未初始化，请提供预配置的AI服务实例");
      }

      // 步骤1: 分析意图
      console.log("📊 [AI-Agents] 步骤1: 分析图表意图...");
      const intent = await this.analyzeIntent(request.prompt);
      console.log("📊 [AI-Agents] 意图分析结果:", intent);

      // 步骤2: 数据映射
      console.log("🔧 [AI-Agents] 步骤2: 映射数据...");
      const dataMapping = await this.mapData(request, intent.chartType);
      console.log("🔧 [AI-Agents] 数据映射结果:", {
        dataType: dataMapping.dataType,
        structure: dataMapping.structure,
        dataLength: dataMapping.mappedData.length,
        sampleData: dataMapping.mappedData.slice(0, 2),
      });

      // 步骤3: 生成元数据
      console.log("📝 [AI-Agents] 步骤3: 生成元数据...");
      const metadata = await this.generateMetadata(request, intent, dataMapping);
      console.log("📝 [AI-Agents] 元数据生成结果:", metadata);

      const result = {
        success: true,
        chartType: intent.chartType,
        data: dataMapping.mappedData,
        config: metadata.config,
        title: metadata.title,
        description: metadata.description,
        reasoning: `选择 ${intent.chartType} 图表因为: ${intent.reasoning}`,
      };

      console.log("✅ [AI-Agents] 图表生成成功:", {
        chartType: result.chartType,
        dataCount: result.data.length,
        title: result.title,
      });

      return result;
    } catch (error) {
      console.error("❌ [AI-Agents] 图表生成失败:", error);
      console.error(
        "❌ [AI-Agents] 错误堆栈:",
        error instanceof Error ? error.stack : "无堆栈信息"
      );

      return {
        success: false,
        chartType: "bar",
        data: [],
        config: {},
        title: "生成失败",
        description: "AI 图表生成遇到错误",
        reasoning: "系统错误",
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 使用 AI 分析用户意图
   */
  private async analyzeIntent(prompt: string): Promise<ChartIntentResult> {
    console.log("🤖 [Intent] 开始分析用户意图, prompt:", prompt);

    const systemPrompt = `你是一个图表类型推荐专家。根据用户的描述，判断最适合的图表类型。

支持的图表类型：
- bar: 柱状图，用于比较不同类别的数据
- line: 折线图，用于显示趋势和变化
- pie: 饼图，用于显示比例和分布
- area: 面积图，用于显示累积数据和容量变化

请以 JSON 格式回复，包含以下字段：
{
  "chartType": "bar|line|pie|area", 
  "confidence": 0.8,
  "reasoning": "选择此图表的原因",
  "keywords": ["关键词1", "关键词2"]
}`;

    try {
      console.log("🤖 [Intent] 调用AI服务...");
      const response = await this.aiService.chat({
        messages: [{ role: "user", content: prompt }],
        systemPrompt,
        params: {
          temperature: 0.3, // 较低的温度以获得更一致的结果
          maxTokens: 200,
        },
      });

      console.log("🤖 [Intent] AI原始响应:", response.content);

      // 解析 AI 响应，移除可能的 markdown 代码块标记
      let content = response.content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      console.log("🤖 [Intent] 清理后的JSON内容:", content);

      const result = JSON.parse(content);
      console.log("🤖 [Intent] 解析后的结果:", result);

      return {
        chartType: result.chartType || "bar",
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || "基于关键词分析",
        keywords: result.keywords || [],
      };
    } catch (error) {
      console.error("🤖 [Intent] AI 意图分析失败，使用关键词匹配:", error);
      return this.fallbackIntentAnalysis(prompt);
    }
  }

  /**
   * 降级方案：基于关键词的意图分析
   */
  private fallbackIntentAnalysis(prompt: string): ChartIntentResult {
    const lowerPrompt = prompt.toLowerCase();

    // 图表类型关键词映射
    const chartKeywords = {
      line: [
        "趋势",
        "trend",
        "变化",
        "时间",
        "time",
        "增长",
        "下降",
        "over time",
        "走势",
        "折线图",
        "线图",
        "折线",
        "line chart",
      ],
      pie: [
        "分布",
        "distribution",
        "比例",
        "proportion",
        "占比",
        "份额",
        "share",
        "构成",
        "饼图",
        "饼状图",
        "圆饼图",
        "pie chart",
        "pie",
      ],
      area: [
        "累积",
        "cumulative",
        "容量",
        "volume",
        "堆叠",
        "stacked",
        "总量",
        "面积图",
        "区域图",
        "area chart",
        "面积",
      ],
      bar: [
        "比较",
        "compare",
        "对比",
        "排名",
        "ranking",
        "分类",
        "category",
        "柱状图",
        "柱图",
        "条形图",
        "bar chart",
        "柱状",
        "条形",
      ],
    };

    let bestMatch: { type: ChartType; score: number; keywords: string[] } = {
      type: "bar",
      score: 0,
      keywords: [],
    };

    // 计算匹配分数
    for (const [chartType, keywords] of Object.entries(chartKeywords)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > bestMatch.score) {
        bestMatch = {
          type: chartType as ChartType,
          score,
          keywords: matchedKeywords,
        };
      }
    }

    return {
      chartType: bestMatch.type,
      confidence: Math.min(bestMatch.score * 0.3, 0.9),
      reasoning: `基于关键词匹配: ${bestMatch.keywords.join(", ")}`,
      keywords: bestMatch.keywords,
    };
  }

  /**
   * 数据映射
   */
  private async mapData(
    request: ChartGenerationRequest,
    chartType: ChartType
  ): Promise<DataMappingResult> {
    console.log("🐛🔧 [DataMapping] 主流程：开始数据映射, chartType:", chartType);

    // 尝试从用户提示中提取数据
    console.log("🐛🔧 [DataMapping] 主流程：尝试从prompt提取数据...");
    const extractedData = await this.extractDataFromPrompt(request.prompt, chartType);
    if (extractedData) {
      console.log("✅🐛🔧 [DataMapping] 主流程：从prompt提取到数据:", {
        dataType: extractedData.dataType,
        rowCount: extractedData.mappedData.length,
        sampleData: extractedData.mappedData.slice(0, 2),
      });
      return extractedData;
    } else {
      console.log("❌🐛🔧 [DataMapping] 主流程：prompt中未发现结构化数据");
    }

    // 如果有上传的文件，处理文件数据
    if (request.uploadedFile) {
      console.log("🐛🔧 [DataMapping] 主流程：检测到上传文件，文件信息:", {
        name: request.uploadedFile.name,
        type: request.uploadedFile.type,
        size: request.uploadedFile.size,
      });

      console.log("⚠️🚨🐛🔧 [DataMapping] 主流程：【关键问题】文件处理尚未实现！");
      console.log(
        "⚠️🚨🐛🔧 [DataMapping] 主流程：直接返回Mock数据，这就是看到'北京、上海、深圳'的原因！"
      );
      console.log("⚠️🚨🐛🔧 [DataMapping] 主流程：需要实现真正的Excel/CSV文件解析！");

      // TODO: 实现文件数据解析
      const mockResult = this.generateMockData(chartType);
      console.log("🐛🔧 [DataMapping] 主流程：返回Mock数据详情:", {
        dataType: mockResult.dataType,
        rowCount: mockResult.mappedData.length,
        sampleData: mockResult.mappedData.slice(0, 2),
      });
      return mockResult;
    }

    // 最后降级使用模拟数据
    console.log("🐛🔧 [DataMapping] 主流程：无上传文件，使用模拟数据");
    const fallbackResult = this.generateMockData(chartType);
    console.log("🐛🔧 [DataMapping] 主流程：返回后备Mock数据:", {
      dataType: fallbackResult.dataType,
      rowCount: fallbackResult.mappedData.length,
      sampleData: fallbackResult.mappedData.slice(0, 2),
    });
    return fallbackResult;
  }

  /**
   * 从用户提示中提取数据
   */
  private async extractDataFromPrompt(
    prompt: string,
    chartType: ChartType
  ): Promise<DataMappingResult | null> {
    console.log("📊 [DataExtraction] 尝试从prompt提取数据...");

    // 使用AI来解析用户提供的数据
    const systemPrompt = `你是一个数据解析专家。从用户的描述中提取结构化数据，并转换为图表所需的格式。

用户的描述可能包含：
1. 具体的数值数据（如数组、列表）
2. 分类标签和对应数值
3. 时间序列数据
4. 比例或百分比数据

请分析用户描述，如果发现具体的数据，请按以下JSON格式返回：
{
  "hasData": true,
  "xAxisKey": "横轴字段名",
  "yAxisKeys": ["数值字段1", "数值字段2"],
  "data": [
    {"横轴字段名": "值1", "数值字段1": 数值, "数值字段2": 数值},
    {"横轴字段名": "值2", "数值字段1": 数值, "数值字段2": 数值}
  ]
}

如果没有发现具体数据，返回：
{
  "hasData": false
}

注意：
- 横轴通常是分类、时间、地点等
- 纵轴是具体的数值数据
- 保持数据的原始含义和标签`;

    try {
      console.log("📊 [DataExtraction] 调用AI解析数据...");
      const response = await this.aiService.chat({
        messages: [{ role: "user", content: prompt }],
        systemPrompt,
        params: {
          temperature: 0.1, // 极低温度确保数据解析的准确性
          maxTokens: 1000,
        },
      });

      console.log("📊 [DataExtraction] AI数据解析响应:", response.content);

      // 清理和解析JSON响应
      let content = response.content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      console.log("📊 [DataExtraction] 清理后的JSON:", content);

      const parsed = JSON.parse(content);
      console.log("📊 [DataExtraction] 解析结果:", parsed);

      if (!parsed.hasData) {
        console.log("📊 [DataExtraction] AI判断没有具体数据");
        return null;
      }

      // 验证数据结构
      if (!parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
        console.log("📊 [DataExtraction] 数据格式无效");
        return null;
      }

      return {
        mappedData: parsed.data,
        dataType: "extracted",
        structure: {
          xAxisKey: parsed.xAxisKey || "category",
          yAxisKeys: parsed.yAxisKeys || [],
          totalPoints: parsed.data.length,
        },
      };
    } catch (error) {
      console.error("📊 [DataExtraction] AI数据解析失败:", error);

      // 降级方案：使用正则表达式尝试提取简单的数据格式
      return this.fallbackDataExtraction(prompt, chartType);
    }
  }

  /**
   * 降级数据提取：使用正则表达式
   */
  private fallbackDataExtraction(prompt: string, chartType: ChartType): DataMappingResult | null {
    console.log("📊 [FallbackExtraction] 尝试正则表达式提取数据...");

    // 尝试匹配类似 "北京[22, 23, 21, 25, 30]" 的格式
    const cityDataPattern = /([^[\]]+)\[([^\]]+)\]/g;
    const matches: Array<{ city: string; values: number[] }> = [];
    let match;

    while ((match = cityDataPattern.exec(prompt)) !== null) {
      const cityName = match[1].trim();
      const values = match[2]
        .split(",")
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));
      if (values.length > 0) {
        matches.push({ city: cityName, values });
      }
    }

    console.log("📊 [FallbackExtraction] 匹配到的数据:", matches);

    if (matches.length === 0) {
      return null;
    }

    // 提取日期信息（星期一到星期五）
    const dayPattern =
      /星期[一二三四五六日]|周[一二三四五六日]|monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi;
    const dayMatches = prompt.match(dayPattern) || [];

    // 构建数据结构
    const maxLength = Math.max(...matches.map(m => m.values.length));
    const days =
      dayMatches.length > 0
        ? ["星期一", "星期二", "星期三", "星期四", "星期五"].slice(0, maxLength)
        : Array.from({ length: maxLength }, (_, i) => `第${i + 1}天`);

    console.log("📊 [FallbackExtraction] 推断的时间轴:", days);

    const data = days.map((day, index) => {
      const dataPoint: any = { day };
      matches.forEach(({ city, values }) => {
        dataPoint[city] = values[index] || 0;
      });
      return dataPoint;
    });

    console.log("📊 [FallbackExtraction] 构建的数据结构:", data);

    return {
      mappedData: data,
      dataType: "extracted",
      structure: {
        xAxisKey: "day",
        yAxisKeys: matches.map(m => m.city),
        totalPoints: data.length,
      },
    };
  }

  /**
   * 生成模拟数据
   */
  private generateMockData(chartType: ChartType): DataMappingResult {
    let data: any[];
    let xAxisKey: string;
    let yAxisKeys: string[];

    switch (chartType) {
      case "line":
        xAxisKey = "month";
        yAxisKeys = ["revenue", "expenses", "profit"];
        data = [
          { month: "1月", revenue: 12000, expenses: 8000, profit: 4000 },
          { month: "2月", revenue: 15000, expenses: 9500, profit: 5500 },
          { month: "3月", revenue: 18000, expenses: 11000, profit: 7000 },
          { month: "4月", revenue: 16000, expenses: 10000, profit: 6000 },
          { month: "5月", revenue: 20000, expenses: 12000, profit: 8000 },
          { month: "6月", revenue: 22000, expenses: 13000, profit: 9000 },
        ];
        break;

      case "pie":
        data = [
          { name: "移动端", value: 45 },
          { name: "PC端", value: 30 },
          { name: "平板", value: 15 },
          { name: "其他", value: 10 },
        ];
        xAxisKey = "name";
        yAxisKeys = ["value"];
        break;

      case "area":
        xAxisKey = "quarter";
        yAxisKeys = ["marketing", "development", "operations"];
        data = [
          { quarter: "Q1", marketing: 100, development: 150, operations: 80 },
          { quarter: "Q2", marketing: 120, development: 180, operations: 95 },
          { quarter: "Q3", marketing: 140, development: 200, operations: 110 },
          { quarter: "Q4", marketing: 160, development: 220, operations: 125 },
        ];
        break;

      default: // bar
        xAxisKey = "product";
        yAxisKeys = ["sales", "target"];
        data = [
          { product: "产品A", sales: 1200, target: 1000 },
          { product: "产品B", sales: 800, target: 900 },
          { product: "产品C", sales: 1500, target: 1200 },
          { product: "产品D", sales: 600, target: 700 },
        ];
        break;
    }

    return {
      mappedData: data,
      dataType: "mock",
      structure: {
        xAxisKey,
        yAxisKeys,
        totalPoints: data.length,
      },
    };
  }

  /**
   * 生成元数据
   */
  private async generateMetadata(
    request: ChartGenerationRequest,
    intent: ChartIntentResult,
    dataMapping: DataMappingResult
  ): Promise<MetadataResult> {
    const systemPrompt = `你是一个图表元数据生成专家。根据用户需求和图表类型，生成合适的标题、描述和配置。

请以 JSON 格式回复，包含：
{
  "title": "图表标题",
  "description": "图表描述",
  "xAxisLabel": "X轴标签",
  "yAxisLabel": "Y轴标签"
}`;

    try {
      const response = await this.aiService.chat({
        messages: [
          {
            role: "user",
            content: `用户需求: ${request.prompt}\n图表类型: ${intent.chartType}\n数据结构: ${JSON.stringify(dataMapping.structure)}`,
          },
        ],
        systemPrompt,
        params: {
          temperature: 0.7,
          maxTokens: 300,
        },
      });

      // 解析 AI 响应，移除可能的 markdown 代码块标记
      let content = response.content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const result = JSON.parse(content);

      return {
        title: result.title || "数据图表",
        description: result.description || "基于数据生成的图表",
        config: this.generateChartConfig(dataMapping),
        labels: {
          xAxis: result.xAxisLabel,
          yAxis: result.yAxisLabel,
        },
      };
    } catch (error) {
      console.warn("AI 元数据生成失败，使用默认值:", error);
      return this.generateDefaultMetadata(intent.chartType, dataMapping);
    }
  }

  /**
   * 生成默认元数据
   */
  private generateDefaultMetadata(
    chartType: ChartType,
    dataMapping: DataMappingResult
  ): MetadataResult {
    return {
      title: `${CHART_TYPE_LABELS[chartType]?.zh ?? chartType}分析`,
      description: "基于数据自动生成的图表",
      config: this.generateChartConfig(dataMapping),
      labels: {
        xAxis: dataMapping.structure.xAxisKey,
        yAxis: "数值",
      },
    };
  }

  /**
   * 生成图表配置
   */
  private generateChartConfig(dataMapping: DataMappingResult): Record<string, any> {
    const colors = [
      "hsl(220, 70%, 50%)", // Blue
      "hsl(160, 60%, 45%)", // Green
      "hsl(30, 80%, 55%)", // Orange
      "hsl(280, 65%, 60%)", // Purple
      "hsl(340, 75%, 55%)", // Pink
    ];

    const config: Record<string, any> = {};

    dataMapping.structure.yAxisKeys.forEach((key, index) => {
      config[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: colors[index % colors.length],
      };
    });

    return config;
  }
}

/**
 * Data Mapping Agent
 * 专门处理数据映射和转换
 */
export class DataMappingAgent implements AIAgent {
  readonly name = "Data Mapper";
  readonly description = "处理数据映射和格式转换";

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    // 这个 agent 主要由 ChartIntentAgent 调用，很少直接使用
    throw new Error("DataMappingAgent 应该通过 ChartIntentAgent 调用");
  }
}

/**
 * Metadata Generation Agent
 * 专门生成图表元数据
 */
export class MetadataAgent implements AIAgent {
  readonly name = "Metadata Generator";
  readonly description = "生成图表标题、描述和配置信息";

  async execute(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    // 这个 agent 主要由 ChartIntentAgent 调用，很少直接使用
    throw new Error("MetadataAgent 应该通过 ChartIntentAgent 调用");
  }
}

/**
 * AI Director - 主要的协调者
 */
export class AIDirector {
  private agents: AIAgent[];
  private primaryAgent: ChartIntentAgent;

  constructor(aiService?: AIService) {
    this.primaryAgent = new ChartIntentAgent(aiService);
    this.agents = [this.primaryAgent, new DataMappingAgent(), new MetadataAgent()];
  }

  async generateChart(request: ChartGenerationRequest): Promise<ChartGenerationResult> {
    try {
      // 主要通过 ChartIntentAgent 处理
      const result = await this.primaryAgent.execute(request);

      // 可以在这里添加额外的后处理逻辑
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
        title: "生成失败",
        description: "AI 图表生成遇到错误",
        reasoning: "系统错误",
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  private async enhanceDescription(
    result: ChartGenerationResult,
    request: ChartGenerationRequest
  ): Promise<string> {
    const baseDescription = result.description;
    const insights = this.generateInsights(result.data, result.chartType);
    return `${baseDescription}\n\n关键洞察: ${insights}`;
  }

  private generateInsights(data: any[], chartType: string): string {
    if (chartType === "pie") {
      const total = (data as any[]).reduce((sum, item) => sum + item.value, 0);
      const largest = Math.max(...(data as any[]).map(item => item.value));
      return `总计: ${total}, 最大分类占比: ${((largest / total) * 100).toFixed(1)}%`;
    }

    const dataLength = data.length;
    if (dataLength === 0) return "暂无数据分析";

    return `数据集包含 ${dataLength} 个数据点，提供多维度的综合分析`;
  }
}

// 导出单例实例 - 使用延迟初始化
let _aiDirector: AIDirector | null = null;

export const aiDirector = {
  get instance(): AIDirector {
    if (!_aiDirector) {
      _aiDirector = new AIDirector();
    }
    return _aiDirector;
  },

  generateChart: (request: ChartGenerationRequest): Promise<ChartGenerationResult> => {
    return aiDirector.instance.generateChart(request);
  },
};
