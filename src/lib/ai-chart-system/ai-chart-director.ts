// AI Chart Director - 系统总协调器
// 整合所有组件，实现三种场景的统一处理

import { ChartType } from "@/types/chart";
import { ConversationContextPayload, ConversationMessageSummary } from "@/types";
import { AIService } from "@/lib/ai/types";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import {
  ScenarioType,
  AIChartResult,
  ChartGenerationResult,
  ChartGenerationError,
  AIChartError,
  AIChartSystemConfig,
  UnifiedDataStructure,
} from "./types";
import { CHART_TYPE_LABELS } from "@/constants/chart";
import { InputRouter, IInputRouter } from "./input-router";
import { DataExtractor, IDataExtractor } from "./data-extractor";
import { IntentAnalyzer, IIntentAnalyzer } from "./intent-analyzer";
import { ChartGenerator, IChartGenerator } from "./chart-generator";
import { getUnifiedDataSnapshot, storeUnifiedDataSnapshot } from "@/lib/conversation-memory";

const CHART_TYPE_KEYWORDS: Record<ChartType, string[]> = {
  bar: ["bar", "bar chart", "柱状", "条形", "柱状图", "条形图", "柱图", "对比", "比较"],
  line: ["line", "line chart", "折线", "折线图", "趋势", "走势", "曲线", "line graph"],
  pie: ["pie", "pie chart", "饼图", "饼状图", "占比", "比例", "份额", "donut"],
  area: ["area", "area chart", "面积图", "面积", "堆叠", "stacked"],
  radar: ["radar", "radar chart", "雷达", "蛛网", "极坐标", "spider"],
  radial: ["radial", "radial chart", "径向", "环形", "仪表", "gauge", "progress ring"],
};

/**
 * AI图表系统输入
 */
export interface AIChartSystemInput {
  prompt: string;
  files?: File[];
  conversation?: ConversationContextPayload;
  sessionId?: string;
}

/**
 * AI图表总协调器接口
 */
export interface IAIChartDirector {
  /** 处理图表生成请求 */
  generateChart(input: AIChartSystemInput): Promise<AIChartResult>;

  /** 获取系统状态 */
  getSystemStatus(): Promise<{
    aiServiceConnected: boolean;
    componentsInitialized: boolean;
    lastError?: string;
  }>;
}

/**
 * AI图表总协调器实现
 */
export class AIChartDirector implements IAIChartDirector {
  private inputRouter: IInputRouter;
  private dataExtractor: IDataExtractor;
  private intentAnalyzer: IIntentAnalyzer;
  private chartGenerator: IChartGenerator;
  private aiService: AIService;
  private lastError?: string;

  constructor(config?: Partial<AIChartSystemConfig>, aiService?: AIService) {
    console.log("🚀 [AIChartDirector] 初始化AI图表系统...");

    try {
      // 初始化AI服务
      this.aiService = aiService || createServiceFromEnv("deepseek");

      // 初始化各个组件
      this.inputRouter = new InputRouter();
      this.dataExtractor = new DataExtractor(this.aiService);
      this.intentAnalyzer = new IntentAnalyzer(this.aiService);
      this.chartGenerator = new ChartGenerator();

      console.log("✅ [AIChartDirector] 系统初始化完成");
    } catch (error) {
      console.error("❌ [AIChartDirector] 系统初始化失败:", error);
      throw new AIChartError("input_validation", "SERVICE_UNAVAILABLE", "系统初始化失败", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * 处理图表生成请求 - 主要入口
   */
  async generateChart(input: AIChartSystemInput): Promise<AIChartResult> {
    const startTime = Date.now();

    console.log("🎯 [AIChartDirector] 开始处理图表生成请求:", {
      promptLength: input.prompt.length,
      fileCount: input.files?.length || 0,
      conversationHistory: input.conversation?.history?.length || 0,
    });

    try {
      // 步骤1: 输入路由和验证
      const scenario = await this.routeAndValidateInput(input);
      console.log("✅ [AIChartDirector] 场景识别:", scenario);

      // 步骤2: 根据场景处理数据
      console.log("🐛🎯 [AIChartDirector] 开始数据提取和统一化...");
      const unifiedData = await this.extractAndUnifyData(scenario, input);

      const sessionId = input.sessionId || input.conversation?.sessionId;
      if (sessionId) {
        storeUnifiedDataSnapshot(sessionId, {
          data: unifiedData.data,
          schema: unifiedData.schema,
          metadata: unifiedData.metadata,
        });
      }
      console.log("✅🐛🎯 [AIChartDirector] 数据提取完成:", {
        rows: unifiedData.data.length,
        fields: unifiedData.schema.fields.length,
        sampleData: unifiedData.data.slice(0, 3), // 显示前3行数据样本
        dataSchema: unifiedData.schema,
        source: unifiedData.metadata.source,
        qualityScore: unifiedData.schema.qualityScore,
        isValid: unifiedData.isValid,
        validationErrors: unifiedData.validationErrors,
      });

      // 步骤3: 分析用户意图
      let chartIntent = await this.analyzeIntent(scenario, input, unifiedData);

      // 如果用户在prompt中明确指定了图表类型，则优先遵循
      const explicitType = detectChartTypeFromPrompt(input.prompt);
      if (explicitType && explicitType !== chartIntent.chartType) {
        console.log("🧭 [AIChartDirector] 检测到用户显式指定图表类型，覆盖AI建议:", {
          requested: explicitType,
          previous: chartIntent.chartType,
        });

        const chartLabel = getChartLabel(explicitType);
        const previousSuggestions = chartIntent.suggestions || {
          title: chartLabel,
          description: "",
          insights: [],
        };

        chartIntent = {
          ...chartIntent,
          chartType: explicitType,
          reasoning: `${chartIntent.reasoning || "AI分析"}；用户显式请求 ${explicitType} 图`,
          suggestions: {
            ...previousSuggestions,
            title: chartLabel,
          },
        };
      }

      console.log("✅ [AIChartDirector] 意图分析完成:", {
        chartType: chartIntent.chartType,
        confidence: chartIntent.confidence,
        reasoning: chartIntent.reasoning || "未提供推理过程",
        suggestedTitle: chartIntent.suggestions.title || "未提供标题建议",
      });

      // 步骤4: 验证数据兼容性
      const compatibility = this.intentAnalyzer.validateDataCompatibility(chartIntent, unifiedData);
      console.log("🔍 [AIChartDirector] 数据兼容性检查:", {
        isCompatible: compatibility.isCompatible,
        reason: compatibility.reason,
        chartType: chartIntent.chartType,
        dataRows: unifiedData.data.length,
        dataFields: unifiedData.schema.fields.length,
      });

      if (!compatibility.isCompatible) {
        console.error("❌ [AIChartDirector] 数据兼容性验证失败:", compatibility);
        throw new AIChartError(
          "intent_analysis",
          "INVALID_REQUEST",
          `数据与图表要求不兼容: ${compatibility.reason}`,
          { compatibility }
        );
      }

      // 步骤5: 生成图表
      console.log("🎨 [AIChartDirector] 开始生成图表...");
      const result = await this.chartGenerator.generateChart(chartIntent, unifiedData);
      console.log("📊 [AIChartDirector] 图表生成器返回结果:", {
        success: result.success,
        chartType: result.success ? result.chartType : "failed",
        dataLength: result.success ? result.data.length : 0,
        configKeys: result.success ? Object.keys(result.config) : [],
      });

      const totalTime = Date.now() - startTime;
      console.log("🎉 [AIChartDirector] 图表生成成功:", {
        chartType: result.chartType,
        processingTime: totalTime,
        confidence: result.metadata.confidence,
      });

      return result;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error("❌ [AIChartDirector] 图表生成失败:", error);

      // 构建错误结果
      const errorResult: ChartGenerationError = {
        success: false,
        error:
          error instanceof AIChartError
            ? error
            : new AIChartError("chart_generation", "UNKNOWN_ERROR", "图表生成过程中发生未知错误", {
                originalError: error instanceof Error ? error.message : error,
              }),
        failedStage: this.determineFailedStage(error),
        suggestions: this.generateErrorSuggestions(error, input),
      };

      return errorResult;
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<{
    aiServiceConnected: boolean;
    componentsInitialized: boolean;
    lastError?: string;
  }> {
    try {
      const aiServiceConnected = await this.aiService.validateConnection();

      return {
        aiServiceConnected,
        componentsInitialized: !!(
          this.inputRouter &&
          this.dataExtractor &&
          this.intentAnalyzer &&
          this.chartGenerator
        ),
        lastError: this.lastError,
      };
    } catch (error) {
      return {
        aiServiceConnected: false,
        componentsInitialized: false,
        lastError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 步骤1: 输入路由和验证
   */
  private async routeAndValidateInput(input: AIChartSystemInput): Promise<ScenarioType> {
    console.log("🔍 [Stage1] 输入路由和验证...");

    const { prompt, files = [], conversation } = input;

    // 场景分类
    const scenario = this.inputRouter.classifyScenario(prompt, files, conversation);

    // 输入验证
    const validation = this.inputRouter.validateInput(scenario, prompt, files, conversation);
    if (!validation.isValid) {
      throw new AIChartError(
        "input_validation",
        "INVALID_REQUEST",
        `输入验证失败: ${validation.errors.join(", ")}`,
        { validation }
      );
    }

    // 输出警告（如果有）
    if (validation.warnings.length > 0) {
      console.warn("⚠️ [Stage1] 输入警告:", validation.warnings);
    }

    return scenario;
  }

  /**
   * 步骤2: 数据提取和统一
   */
  private async extractAndUnifyData(scenario: ScenarioType, input: AIChartSystemInput) {
    console.log("📊 [Stage2] 数据提取和统一...");

    const { prompt, files = [], conversation } = input;

    switch (scenario) {
      case "PROMPT_ONLY":
        return this.handlePromptOnlyData(
          prompt,
          conversation,
          input.sessionId || conversation?.sessionId
        );

      case "PROMPT_WITH_FILE":
        return this.handlePromptWithFileData(prompt, files, conversation);

      case "FILE_ONLY":
        return this.handleFileOnlyData(files);

      default:
        throw new AIChartError(
          "data_extraction",
          "INVALID_REQUEST",
          `不支持的场景类型: ${scenario}`
        );
    }
  }

  /**
   * 步骤3: 意图分析
   */
  private async analyzeIntent(
    scenario: ScenarioType,
    input: AIChartSystemInput,
    data: UnifiedDataStructure
  ) {
    console.log("🎯 [Stage3] 意图分析...");

    switch (scenario) {
      case "PROMPT_ONLY":
      case "PROMPT_WITH_FILE":
        return this.intentAnalyzer.analyzeChartIntent(
          this.composePromptWithContext(input.prompt, input.conversation, data),
          data
        );

      case "FILE_ONLY":
        return this.intentAnalyzer.suggestBestVisualization(data);

      default:
        throw new AIChartError(
          "intent_analysis",
          "INVALID_REQUEST",
          `意图分析不支持场景: ${scenario}`
        );
    }
  }

  /**
   * 处理仅Prompt场景 - 优化后的流程
   */
  private async handlePromptOnlyData(
    prompt: string,
    conversation?: ConversationContextPayload,
    sessionId?: string
  ) {
    console.log("📝 [PromptOnly] 处理仅Prompt场景...");

    // 步骤1: 尝试从prompt提取结构化数据
    const extractedData = await this.dataExtractor.extractFromPrompt(prompt);

    if (extractedData && extractedData.data.length > 0) {
      // 如果找到结构化数据，直接使用
      console.log("✅ [PromptOnly] 从prompt中提取到结构化数据");
      return this.dataExtractor.normalizeData(extractedData.data, "prompt", {
        fileInfo: undefined,
      });
    }

    // 步骤1.5: 如果没有新数据但存在已有图表，复用上一张图表的数据
    if (sessionId) {
      const snapshot = getUnifiedDataSnapshot(sessionId);
      if (snapshot) {
        console.log("🗃️ [PromptOnly] 复用会话缓存的结构化数据", {
          rows: snapshot.data.length,
          fields: Object.keys(snapshot.schema?.fields ?? {}).length,
        });
        return this.dataExtractor.normalizeData(snapshot.data, "prompt", {
          fileInfo: undefined,
          ...snapshot.metadata,
        });
      }
    }

    if (conversation?.lastChart?.data && conversation.lastChart.data.length > 0) {
      console.log("🔄 [PromptOnly] 未检测到新数据，复用最近图表的数据");
      return this.dataExtractor.normalizeData(conversation.lastChart.data, "prompt", {
        fileInfo: undefined,
      });
    }

    // 步骤2: 未找到结构化数据，进行图表意图分析并生成模拟数据
    console.log("🎯 [PromptOnly] 未找到结构化数据，开始图表意图分析...");

    try {
      // 分析图表意图（不依赖数据结构）
      const chartIntent = await this.analyzeIntentFromPromptOnly(prompt, conversation);
      console.log("✅ [PromptOnly] 图表意图分析完成:", {
        chartType: chartIntent.chartType,
        reasoning: chartIntent.reasoning,
      });

      // 基于意图生成合适的模拟数据
      const mockData = await this.generateMockDataForIntent(chartIntent, prompt);
      console.log("✅ [PromptOnly] 模拟数据生成完成:", {
        rows: mockData.length,
        sampleData: mockData.slice(0, 2),
      });

      // 标准化数据
      return this.dataExtractor.normalizeData(mockData, "prompt", {
        fileInfo: undefined,
      });
    } catch (error) {
      console.error("❌ [PromptOnly] 意图分析或数据生成失败:", error);

      // 最后的降级策略：抛出友好的错误信息
      throw new AIChartError(
        "data_extraction",
        "INSUFFICIENT_DATA",
        "未在描述中发现可用的数据，且无法从描述中推断图表需求。请提供具体的数值、表格或数据列表，或上传数据文件。",
        {
          suggestions: [
            "提供具体的数字数据",
            "使用表格格式描述",
            "上传Excel或CSV文件",
            "明确说明想要展示的图表类型",
          ],
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * 从prompt分析图表意图（不依赖数据结构）
   */
  private async analyzeIntentFromPromptOnly(
    prompt: string,
    conversation?: ConversationContextPayload
  ) {
    console.log("🎯 [PromptOnlyIntent] 开始纯文本意图分析...");

    try {
      const composedPrompt = this.composePromptWithContext(prompt, conversation);
      // 使用AI分析用户意图
      const systemPrompt = `你是一个专业的数据可视化专家。从用户的描述中分析他们的图表需求。

任务要求：
1. 识别用户想要的图表类型
2. 分析数据的大致结构和特征
3. 提供图表标题和描述建议
4. 如果无法确定图表类型，选择最通用的类型

支持的图表类型：
- bar: 柱状图，适合比较分类数据
- line: 折线图，适合显示趋势变化
- pie: 饼图，适合显示比例关系
- area: 面积图，适合显示累计数据
- radar: 雷达图，适合多维度对比
- radial: 径向图，适合层次结构

响应格式（严格JSON）：
{
  "chartType": "图表类型",
  "confidence": 0.0-1.0,
  "reasoning": "选择理由",
  "suggestions": {
    "title": "建议的图表标题",
    "description": "图表描述",
    "dataStructure": "数据结构特征描述"
  }
}`;

      const response = await this.aiService.chat({
        messages: [{ role: "user", content: composedPrompt }],
        systemPrompt,
        params: {
          temperature: 0.2, // 较低温度确保一致性
          maxTokens: 500,
        },
      });

      let content = this.cleanJsonResponse(response.content);
      const parsed = JSON.parse(content);

      return {
        chartType: parsed.chartType as ChartType,
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || "基于提示词分析",
        suggestions: {
          title: parsed.suggestions?.title || "数据图表",
          description: parsed.suggestions?.description || "",
        },
      };
    } catch (error) {
      console.warn("🎯 [PromptOnlyIntent] AI分析失败，使用关键词回退:", error);

      // 回退到关键词分析
      return this.fallbackKeywordAnalysis(prompt);
    }
  }

  /**
   * 关键词回退分析
   */
  private fallbackKeywordAnalysis(prompt: string) {
    const lowerPrompt = prompt.toLowerCase();

    // 简化的关键词匹配
    const chartTypeKeywords = {
      line: [
        "line",
        "trend",
        "timeline",
        "over time",
        "growth",
        "decline",
        "走势",
        "趋势",
        "折线",
        "变化",
      ],
      bar: ["bar", "column", "compare", "comparison", "vs", "对比", "柱状", "比较"],
      pie: ["pie", "share", "percentage", "proportion", "distribution", "饼图", "占比", "比例"],
      area: ["area", "stacked", "cumulative", "filled", "coverage", "累计", "面积", "堆叠"],
      radar: ["radar", "spider", "multi", "dimension", "雷达", "多维", "综合"],
      radial: ["radial", "circular", "hierarchy", "tree", "径向", "圆形", "层次"],
    };

    let bestMatch = { type: "bar", score: 0 }; // 默认柱状图

    for (const [chartType, keywords] of Object.entries(chartTypeKeywords)) {
      const matches = keywords.filter(keyword => lowerPrompt.includes(keyword)).length;
      if (matches > bestMatch.score) {
        bestMatch = { type: chartType, score: matches };
      }
    }

    return {
      chartType: bestMatch.type as ChartType,
      confidence: bestMatch.score > 0 ? 0.6 : 0.4,
      reasoning:
        bestMatch.score > 0
          ? `基于关键词匹配: ${bestMatch.score}个相关词汇`
          : "未找到明确关键词，使用默认类型",
      suggestions: {
        title: "数据图表",
        description: "基于您的描述生成的图表",
      },
    };
  }

  /**
   * 基于图表意图生成模拟数据
   */
  private async generateMockDataForIntent(chartIntent: any, prompt: string) {
    console.log("🎲 [MockDataGen] 生成模拟数据，图表类型:", chartIntent.chartType);

    try {
      // 使用AI生成合适的模拟数据
      const systemPrompt = `你是一个数据生成专家。根据用户的描述和图表类型，生成合适的模拟数据。

图表类型：${chartIntent.chartType}
用户描述：${prompt}

要求：
1. 生成5-8行现实的数据
2. 数据应该符合图表类型的要求
3. 使用中文字段名和数据值
4. 数据应该有意义且相关

响应格式（严格JSON数组）：
[
  {"字段1": "值", "字段2": 数值, ...},
  {"字段1": "值", "字段2": 数值, ...}
]`;

      const response = await this.aiService.chat({
        messages: [
          { role: "user", content: `图表类型: ${chartIntent.chartType}\n描述: ${prompt}` },
        ],
        systemPrompt,
        params: {
          temperature: 0.4,
          maxTokens: 800,
        },
      });

      let content = this.cleanJsonResponse(response.content);
      const mockData = JSON.parse(content);

      if (Array.isArray(mockData) && mockData.length > 0) {
        console.log("✅ [MockDataGen] AI生成模拟数据成功");
        return mockData;
      }

      throw new Error("AI生成的数据格式不正确");
    } catch (error) {
      console.warn("🎲 [MockDataGen] AI生成失败，使用预设模板:", error);

      // 回退到预设模板
      return this.generateTemplateData(chartIntent.chartType);
    }
  }

  /**
   * 生成预设模板数据
   */
  private generateTemplateData(chartType: ChartType) {
    const templates: Record<ChartType, any[]> = {
      bar: [
        { category: "产品A", value: 320 },
        { category: "产品B", value: 240 },
        { category: "产品C", value: 180 },
        { category: "产品D", value: 290 },
        { category: "产品E", value: 160 },
      ],
      line: [
        { time: "1月", value: 150 },
        { time: "2月", value: 180 },
        { time: "3月", value: 160 },
        { time: "4月", value: 220 },
        { time: "5月", value: 200 },
        { time: "6月", value: 250 },
      ],
      pie: [
        { category: "类别A", value: 35 },
        { category: "类别B", value: 25 },
        { category: "类别C", value: 20 },
        { category: "类别D", value: 20 },
      ],
      area: [
        { time: "Q1", series1: 100, series2: 80 },
        { time: "Q2", series1: 120, series2: 95 },
        { time: "Q3", series1: 140, series2: 110 },
        { time: "Q4", series1: 160, series2: 125 },
      ],
      radar: [
        { dimension: "技能A", score: 85 },
        { dimension: "技能B", score: 72 },
        { dimension: "技能C", score: 68 },
        { dimension: "技能D", score: 79 },
        { dimension: "技能E", score: 91 },
      ],
      radial: [
        { category: "一级", level: 1, value: 100 },
        { category: "二级A", level: 2, value: 60 },
        { category: "二级B", level: 2, value: 40 },
        { category: "三级A", level: 3, value: 35 },
        { category: "三级B", level: 3, value: 25 },
      ],
    };

    return templates[chartType] || templates.bar;
  }

  /**
   * 清理AI响应中的JSON内容
   */
  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();

    // 移除markdown代码块
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return cleaned;
  }

  /**
   * 处理Prompt+文件场景
   */
  private async handlePromptWithFileData(
    prompt: string,
    files: File[],
    _conversation?: ConversationContextPayload
  ) {
    console.log("📁📝 [PromptWithFile] 处理Prompt+文件场景...");

    // 提取文件数据
    const fileDataList = await this.dataExtractor.extractFromFiles(files);

    if (fileDataList.length === 0) {
      throw new AIChartError("data_extraction", "INSUFFICIENT_DATA", "文件数据提取失败");
    }

    // 使用第一个文件的数据（未来可以支持多文件合并）
    const primaryFileData = fileDataList[0];

    // 标准化数据
    return this.dataExtractor.normalizeData(primaryFileData.data, "file", {
      fileInfo: {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      },
    });
  }

  /**
   * 处理仅文件场景
   */
  private async handleFileOnlyData(files: File[]) {
    console.log("📁 [FileOnly] 处理仅文件场景...");

    // 提取文件数据
    const fileDataList = await this.dataExtractor.extractFromFiles(files);

    if (fileDataList.length === 0) {
      throw new AIChartError("data_extraction", "INSUFFICIENT_DATA", "文件数据提取失败");
    }

    // 使用第一个文件的数据
    const primaryFileData = fileDataList[0];

    // 标准化数据
    return this.dataExtractor.normalizeData(primaryFileData.data, "file", {
      fileInfo: {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      },
    });
  }

  /**
   * 构建带上下文的Prompt，指导AI在多轮对话中保持状态
   */
  private composePromptWithContext(
    prompt: string,
    conversation?: ConversationContextPayload,
    data?: UnifiedDataStructure
  ): string {
    if (!conversation) {
      return prompt;
    }

    const sections: string[] = [];

    const historySummary = this.buildHistorySummary(conversation.history);
    if (historySummary) {
      sections.push(`Recent conversation context:\n${historySummary}`);
    }

    if (conversation.lastChart) {
      const chart = conversation.lastChart;
      sections.push(
        [
          "Existing chart snapshot:",
          `- Title: ${chart.title}`,
          `- Type: ${chart.chartType}`,
          chart.description ? `- Description: ${chart.description}` : undefined,
          `- Data sample:\n${this.formatDataSample(chart.data)}`,
          `- Config highlights: ${this.formatConfigHighlights(chart.config)}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    } else if (data) {
      sections.push(
        [
          "Current data preview:",
          `- Rows: ${data.data.length}`,
          `- Fields: ${data.schema.fields.map(f => f.name).join(", ")}`,
          `- Sample:\n${this.formatDataSample(data.data)}`,
        ].join("\n")
      );
    }

    sections.push(
      "Instructions: When possible, treat the user's request as a continuation of the existing chart. Modify colors, chart type, or configuration incrementally unless the user explicitly provides new data. Keep previously inferred data and context consistent."
    );

    sections.push(`Current user request:\n${prompt}`);

    return sections.join("\n\n");
  }

  private buildHistorySummary(history: ConversationMessageSummary[] = []): string {
    if (!history || history.length === 0) {
      return "";
    }

    return history
      .slice(-6)
      .map(message => {
        switch (message.kind) {
          case "user_text":
            return `User: ${this.truncateText(message.text || "", 140)}`;
          case "assistant_chart":
            return `Assistant chart: ${message.chart?.title || "Chart"} (${message.chart?.chartType})`;
          case "assistant_processing":
            return `Assistant processing: ${this.truncateText(message.text || "Processing", 100)}`;
          case "assistant_text":
            return `Assistant: ${this.truncateText(message.text || "", 140)}`;
          default:
            return null;
        }
      })
      .filter((entry): entry is string => Boolean(entry))
      .join("\n");
  }

  private formatDataSample(data: any[] = [], limit = 3): string {
    if (!Array.isArray(data) || data.length === 0) {
      return "(no data sample)";
    }

    try {
      return JSON.stringify(data.slice(0, limit), null, 2);
    } catch (error) {
      console.warn("[AIChartDirector] Failed to stringify data sample", error);
      return "(data sample unavailable)";
    }
  }

  private formatConfigHighlights(config: Record<string, any> = {}): string {
    const keys = Object.keys(config);
    if (keys.length === 0) {
      return "none";
    }

    const highlightedKeys = keys.slice(0, 8).join(", ");
    const extra = keys.length > 8 ? ` +${keys.length - 8} more` : "";
    return `${highlightedKeys}${extra}`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  /**
   * 确定失败阶段
   */
  private determineFailedStage(error: any): ChartGenerationError["failedStage"] {
    if (error instanceof AIChartError) {
      return error.stage;
    }

    // 基于错误消息推断
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (message.includes("验证") || message.includes("输入")) {
      return "input_validation";
    } else if (message.includes("数据") || message.includes("提取")) {
      return "data_extraction";
    } else if (message.includes("意图") || message.includes("分析")) {
      return "intent_analysis";
    } else {
      return "chart_generation";
    }
  }

  /**
   * 生成错误建议
   */
  private generateErrorSuggestions(error: any, input: AIChartSystemInput): string[] {
    const suggestions: string[] = [];

    if (error instanceof AIChartError) {
      switch (error.stage) {
        case "input_validation":
          suggestions.push("请检查输入的描述文本或文件格式");
          suggestions.push("确保文件为Excel (.xlsx, .xls) 或CSV格式");
          break;

        case "data_extraction":
          suggestions.push("请提供更明确的数据信息");
          suggestions.push("确保文件包含有效的数值数据");
          if (!input.files || input.files.length === 0) {
            suggestions.push("考虑上传数据文件以获得更好的效果");
          }
          break;

        case "intent_analysis":
          suggestions.push("请提供更具体的图表需求描述");
          suggestions.push("明确指出要对比、分析或展示的数据内容");
          break;

        case "chart_generation":
          suggestions.push("请检查数据格式和完整性");
          suggestions.push("尝试简化数据或调整图表要求");
          break;
      }
    } else {
      suggestions.push("请稍后重试，或联系技术支持");
      suggestions.push("确保网络连接正常");
    }

    return suggestions;
  }
}

// 导出单例实例
export const aiChartDirector = new AIChartDirector();

// 导出便捷函数
export async function generateChart(input: AIChartSystemInput): Promise<AIChartResult> {
  return aiChartDirector.generateChart(input);
}

export async function getSystemStatus() {
  return aiChartDirector.getSystemStatus();
}

function detectChartTypeFromPrompt(prompt: string): ChartType | null {
  if (!prompt) {
    return null;
  }

  const normalized = prompt.toLowerCase();
  let bestMatch: { type: ChartType; score: number } | null = null;

  for (const [chartType, keywords] of Object.entries(CHART_TYPE_KEYWORDS) as [
    ChartType,
    string[],
  ][]) {
    let score = 0;
    for (const keyword of keywords) {
      if (!keyword) continue;
      if (normalized.includes(keyword.toLowerCase())) {
        score += keyword.length >= 2 ? 2 : 1;
      }
    }

    if (score > 0) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { type: chartType, score };
      }
    }
  }

  return bestMatch?.type ?? null;
}

function getChartLabel(chartType: ChartType): string {
  const labels = CHART_TYPE_LABELS as Record<ChartType, { en?: string; zh?: string }>;
  const entry = labels[chartType];
  if (!entry) return chartType;
  return entry.zh || entry.en || chartType;
}
