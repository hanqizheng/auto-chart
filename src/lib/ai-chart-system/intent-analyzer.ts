// Intent Analyzer - 意图分析器
// 负责AI驱动的用户意图分析和图表类型推荐

import { ChartType } from "@/types/chart";
import { AIService } from "@/lib/ai/types";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import {
  ChartIntent,
  CompatibilityResult,
  UnifiedDataStructure,
  AutoAnalysisResult,
  VisualMapping,
  AIChartError,
  DataRow,
} from "./types";

const KEYWORD_MAP: Record<ChartType, string[]> = {
  line: [
    "line",
    "line chart",
    "line graph",
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
  area: [
    "area",
    "area chart",
    "stacked",
    "cumulative",
    "filled",
    "coverage",
    "累计",
    "面积",
    "堆叠",
  ],
  bar: [
    "bar",
    "column",
    "compare",
    "comparison",
    "versus",
    "ranking",
    "top",
    "bottom",
    "对比",
    "比较",
    "柱状",
    "条形",
  ],
  pie: [
    "pie",
    "donut",
    "share",
    "portion",
    "ratio",
    "percentage",
    "percent",
    "distribution",
    "breakdown",
    "composition",
    "占比",
    "比例",
    "份额",
    "饼图",
  ],
};

const FALLBACK_CHART_LABEL: Record<ChartType, string> = {
  bar: "Bar Chart",
  line: "Line Chart",
  pie: "Pie Chart",
  area: "Area Chart",
};

interface HeuristicAnalysis {
  bestType: ChartType | null;
  bestScore: number;
  secondScore: number;
  scores: Record<ChartType, number>;
  matchedKeywords: string[];
  reasons: string[];
}

interface HeuristicRecommendation {
  intent: ChartIntent | null;
  analysis: HeuristicAnalysis;
}

/**
 * 意图分析器接口
 */
export interface IIntentAnalyzer {
  /** 分析图表意图 */
  analyzeChartIntent(prompt: string, dataStructure: UnifiedDataStructure): Promise<ChartIntent>;

  /** 验证数据兼容性 */
  validateDataCompatibility(intent: ChartIntent, data: UnifiedDataStructure): CompatibilityResult;

  /** 自动推荐最佳可视化方案 */
  suggestBestVisualization(data: UnifiedDataStructure): Promise<ChartIntent>;
}

/**
 * 意图分析器实现
 */
export class IntentAnalyzer implements IIntentAnalyzer {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || createServiceFromEnv("deepseek");
  }

  /**
   * 分析用户的图表意图
   */
  async analyzeChartIntent(
    prompt: string,
    dataStructure: UnifiedDataStructure
  ): Promise<ChartIntent> {
    console.log("🎯 [IntentAnalyzer] 开始AI意图分析...");

    try {
      const heuristic = this.buildHeuristicRecommendation(prompt, dataStructure);

      // 使用AI分析
      const aiIntent = await this.aiAnalyzeIntent(prompt, dataStructure);
      if (aiIntent) {
        console.log("✅ [IntentAnalyzer] AI意图分析成功:", aiIntent.chartType);

        const compatibility = this.validateDataCompatibility(aiIntent, dataStructure);
        const fallbackIntent = heuristic.intent;
        const fallbackCompatibility = fallbackIntent
          ? this.validateDataCompatibility(fallbackIntent, dataStructure)
          : null;

        // 如果AI结果与数据不兼容，而回退方案可行，则优先回退
        if (!compatibility.isCompatible && fallbackIntent && fallbackCompatibility?.isCompatible) {
          console.warn(
            "🧭 [IntentAnalyzer] AI意图与数据不兼容，使用回退策略:",
            fallbackIntent.chartType
          );
          return fallbackIntent;
        }

        // 语义上有明显的图表类型偏好但AI结果不一致时执行回退
        const hasStrongPreference =
          fallbackIntent &&
          fallbackIntent.chartType !== aiIntent.chartType &&
          heuristic.analysis.matchedKeywords.length > 0 &&
          heuristic.analysis.bestScore - heuristic.analysis.secondScore >= 1;

        if (hasStrongPreference) {
          console.warn("🧭 [IntentAnalyzer] 语义偏好与AI结果不一致，优先遵循用户关键词:", {
            aiChartType: aiIntent.chartType,
            preferredChartType: fallbackIntent.chartType,
            matchedKeywords: heuristic.analysis.matchedKeywords,
          });
          return fallbackIntent;
        }

        return aiIntent;
      }

      // AI意图分析失败时尝试回退逻辑
      if (heuristic.intent) {
        console.warn(
          "🧭 [IntentAnalyzer] AI分析失败，使用本地回退策略:",
          heuristic.intent.chartType
        );
        return heuristic.intent;
      }

      throw new AIChartError(
        "intent_analysis",
        "SERVICE_UNAVAILABLE",
        "AI意图分析失败，无法确定合适的图表类型",
        {
          prompt,
          dataStructure: {
            rows: dataStructure.data.length,
            fields: dataStructure.schema.fields.length,
          },
        }
      );
    } catch (error) {
      console.error("❌ [IntentAnalyzer] 意图分析失败:", error);

      if (error instanceof AIChartError) {
        throw error; // 重新抛出AI错误
      }

      const heuristic = this.buildHeuristicRecommendation(prompt, dataStructure);
      if (heuristic.intent) {
        console.warn("🧭 [IntentAnalyzer] AI分析异常，已使用回退策略:", {
          chartType: heuristic.intent.chartType,
          reason: heuristic.intent.reasoning,
        });
        return heuristic.intent;
      }

      throw new AIChartError("intent_analysis", "UNKNOWN_ERROR", "意图分析过程发生未知错误", {
        error: error instanceof Error ? error.message : String(error),
        prompt,
      });
    }
  }

  /**
   * 验证数据与意图的兼容性
   */
  validateDataCompatibility(intent: ChartIntent, data: UnifiedDataStructure): CompatibilityResult {
    console.log("🔍 [IntentAnalyzer] 验证数据兼容性...");

    const missingFields: string[] = [];
    const incompatibleTypes: string[] = [];
    const suggestions: string[] = [];

    // 检查必需字段
    for (const requiredField of intent.requiredFields) {
      const field = data.schema.fields.find(f => f.name === requiredField);
      if (!field) {
        missingFields.push(requiredField);
      }
    }

    // 检查字段类型兼容性
    const compatibility = this.checkChartTypeCompatibility(intent.chartType, data);
    if (!compatibility.isCompatible) {
      incompatibleTypes.push(...compatibility.issues);
      suggestions.push(...compatibility.suggestions);
    }

    // 数据质量检查
    if (data.schema.qualityScore < 0.6) {
      suggestions.push("数据质量较低，建议检查和清理数据");
    }

    // 数据量检查 - 根据图表类型调整最小数据要求
    const minDataRequirement = this.getMinimumDataRequirement(intent.chartType);
    if (data.data.length < minDataRequirement.min) {
      incompatibleTypes.push(
        `${intent.chartType}图至少需要${minDataRequirement.min}行数据，${minDataRequirement.reason}`
      );
    }

    const isCompatible = missingFields.length === 0 && incompatibleTypes.length === 0;

    return {
      isCompatible,
      reason: isCompatible
        ? "数据与意图完全兼容"
        : `存在兼容性问题：${[...missingFields, ...incompatibleTypes].join(", ")}`,
      missingFields,
      incompatibleTypes,
      suggestions,
    };
  }

  /**
   * 自动推荐最佳可视化方案（文件场景）
   */
  async suggestBestVisualization(data: UnifiedDataStructure): Promise<ChartIntent> {
    console.log("🤖 [IntentAnalyzer] AI推荐最佳可视化方案...");

    try {
      // 构建针对数据分析的prompt
      const dataAnalysisPrompt = `请分析以下数据结构并推荐最合适的图表类型：

数据信息：
- 数据行数：${data.data.length}
- 字段信息：${data.schema.fields.map(f => `${f.name}(${f.type})`).join(", ")}
- 数值字段：${data.metadata.statistics.numericFields.join(", ")}
- 分类字段：${data.metadata.statistics.categoricalFields.join(", ")}
- 时间字段：${data.metadata.statistics.dateFields.join(", ")}

数据预览：
${JSON.stringify(data.data.slice(0, 3), null, 2)}

请推荐最适合的图表类型并说明原因。`;

      // 使用AI进行数据特征分析和图表推荐
      const aiIntent = await this.aiAnalyzeIntent(dataAnalysisPrompt, data);
      if (aiIntent) {
        console.log("✅ [IntentAnalyzer] AI自动推荐完成:", aiIntent.chartType);
        return aiIntent;
      }

      // AI分析失败，抛出错误
      throw new AIChartError(
        "intent_analysis",
        "SERVICE_UNAVAILABLE",
        "AI无法分析数据特征并推荐图表类型",
        { dataStructure: { rows: data.data.length, fields: data.schema.fields.length } }
      );
    } catch (error) {
      console.error("❌ [IntentAnalyzer] AI推荐失败:", error);

      if (error instanceof AIChartError) {
        throw error;
      }

      throw new AIChartError("intent_analysis", "UNKNOWN_ERROR", "数据可视化推荐过程发生错误", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * AI驱动的意图分析 - 通过API调用
   */
  private async aiAnalyzeIntent(
    prompt: string,
    dataStructure: UnifiedDataStructure
  ): Promise<ChartIntent | null> {
    try {
      const response = await fetch("/api/ai/analyze-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          dataStructure,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API调用失败: ${errorData.error}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`AI意图分析失败: ${result.error}`);
      }

      return result.chartIntent;
    } catch (error) {
      console.warn(
        "⚠️ [AI Intent] AI意图分析失败:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * 获取不同图表类型的最小数据要求
   */
  private getMinimumDataRequirement(chartType: ChartType): { min: number; reason: string } {
    switch (chartType) {
      case "pie":
        return { min: 1, reason: "可以显示单个数据点的占比" };
      case "bar":
        return { min: 1, reason: "可以显示单个类别的数值" };
      case "line":
        return { min: 2, reason: "需要至少两个数据点来显示趋势" };
      case "area":
        return { min: 2, reason: "需要至少两个数据点来显示面积变化" };
      default:
        return { min: 1, reason: "基础数据要求" };
    }
  }

  /**
   * 检查图表类型与数据的兼容性
   */
  private checkChartTypeCompatibility(
    chartType: ChartType,
    data: UnifiedDataStructure
  ): {
    isCompatible: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const stats = data.metadata.statistics;

    switch (chartType) {
      case "pie":
        if (stats.numericFields.length === 0) {
          issues.push("饼图需要至少一个数值字段");
        }
        if (data.data.length > 10) {
          suggestions.push("饼图类别过多，考虑合并小类别或使用柱状图");
        }
        break;

      case "line":
        if (stats.numericFields.length === 0) {
          issues.push("折线图需要至少一个数值字段");
        }
        if (stats.dateFields.length === 0 && stats.categoricalFields.length === 0) {
          issues.push("折线图需要时间或分类字段作为X轴");
        }
        break;

      case "bar":
      case "area":
        if (stats.numericFields.length === 0) {
          issues.push(`${chartType}图需要至少一个数值字段`);
        }
        if (stats.categoricalFields.length === 0 && stats.dateFields.length === 0) {
          issues.push(`${chartType}图需要分类或时间字段作为X轴`);
        }
        break;
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // 辅助方法

  private extractRequiredFields(
    visualMapping: VisualMapping,
    data: UnifiedDataStructure
  ): string[] {
    const required: string[] = [];

    if (visualMapping?.xAxis) {
      const field = data.schema.fields.find(f => f.name === visualMapping.xAxis);
      if (field) required.push(field.name);
    }

    if (Array.isArray(visualMapping?.yAxis)) {
      visualMapping.yAxis.forEach((fieldName: string) => {
        const field = data.schema.fields.find(f => f.name === fieldName);
        if (field) required.push(field.name);
      });
    }

    return [...new Set(required)];
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();

    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return cleaned;
  }

  private generateFallbackIntent(prompt: string, data: UnifiedDataStructure): ChartIntent | null {
    return this.buildHeuristicRecommendation(prompt, data).intent;
  }

  private buildHeuristicRecommendation(
    prompt: string,
    data: UnifiedDataStructure
  ): HeuristicRecommendation {
    const stats = data.metadata?.statistics ?? {
      numericFields: [],
      categoricalFields: [],
      dateFields: [],
      missingValues: 0,
    };

    const numericFields = stats.numericFields || [];
    const categoricalFields = stats.categoricalFields || [];
    const dateFields = stats.dateFields || [];

    if (numericFields.length === 0) {
      console.warn("🛟 [IntentAnalyzer] 回退策略失败：缺少数值字段");
      return {
        intent: null,
        analysis: {
          bestType: null,
          bestScore: Number.NEGATIVE_INFINITY,
          secondScore: Number.NEGATIVE_INFINITY,
          scores: { line: 0, area: 0, bar: 0, pie: 0 },
          matchedKeywords: [],
          reasons: ["缺少数值字段，无法生成图表"],
        },
      };
    }

    const scores: Record<ChartType, number> = {
      line: 0,
      area: 0,
      bar: 0,
      pie: 0,
    };

    const reasons: string[] = [];
    const matchedKeywords: string[] = [];
    const normalizedPrompt = prompt.toLowerCase();

    (Object.entries(KEYWORD_MAP) as [ChartType, string[]][]).forEach(([chartType, keywords]) => {
      keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedPrompt.includes(normalizedKeyword)) {
          scores[chartType] += 2;
          matchedKeywords.push(keyword);
        }
      });
    });

    if (matchedKeywords.length > 0) {
      reasons.push(`Keyword hints: ${matchedKeywords.join(", ")}`);
    }

    if (dateFields.length > 0) {
      scores.line += 1.5;
      scores.area += 1.2;
      reasons.push(`Detected time-related field ${dateFields[0]} which favors trend charts`);
    }

    if (categoricalFields.length > 0) {
      scores.bar += 1.2;
      reasons.push(`Categorical field ${categoricalFields[0]} suggests comparison visuals`);
    }

    if (numericFields.length > 1) {
      scores.line += 0.8;
      scores.area += 1.0;
    }

    const rowCount = data.data.length;
    if (rowCount <= 8) {
      scores.pie += 0.6;
    }
    if (rowCount > 15) {
      scores.pie -= 1;
      reasons.push(`Large category count (${rowCount}) reduces pie chart suitability`);
    }

    if (
      normalizedPrompt.includes("percent") ||
      normalizedPrompt.includes("percentage") ||
      normalizedPrompt.includes("share") ||
      normalizedPrompt.includes("ratio") ||
      normalizedPrompt.includes("%") ||
      prompt.includes("占比") ||
      prompt.includes("比例") ||
      prompt.includes("份额")
    ) {
      scores.pie += 2.5;
      reasons.push("Prompt mentions proportion or percentage, increasing pie chart weight");
    }

    if (
      normalizedPrompt.includes("compare") ||
      normalizedPrompt.includes("comparison") ||
      normalizedPrompt.includes("versus") ||
      prompt.includes("对比") ||
      prompt.includes("比较")
    ) {
      scores.bar += 2;
      reasons.push("Comparison language detected, boosting bar chart score");
    }

    if (
      normalizedPrompt.includes("trend") ||
      normalizedPrompt.includes("over time") ||
      normalizedPrompt.includes("growth") ||
      normalizedPrompt.includes("decline") ||
      prompt.includes("趋势") ||
      prompt.includes("走势")
    ) {
      scores.line += 2;
      scores.area += 1;
      reasons.push("Trend language detected, boosting line/area scores");
    }

    if (
      normalizedPrompt.includes("cumulative") ||
      normalizedPrompt.includes("stacked") ||
      normalizedPrompt.includes("area") ||
      prompt.includes("累计") ||
      prompt.includes("堆叠") ||
      prompt.includes("面积")
    ) {
      scores.area += 2.2;
      reasons.push("Stacked or cumulative language detected, boosting area chart score");
    }

    const sortedScoreEntries = (Object.entries(scores) as [ChartType, number][]).sort(
      (a, b) => b[1] - a[1]
    );

    let [selectedType, maxScore] = sortedScoreEntries[0];
    const secondScore = sortedScoreEntries[1]?.[1] ?? Number.NEGATIVE_INFINITY;

    if (!selectedType || maxScore <= 0) {
      if (dateFields.length > 0) {
        selectedType = "line";
      } else if (categoricalFields.length > 0) {
        selectedType = "bar";
      } else {
        selectedType = "line";
      }
      maxScore = Math.max(maxScore, 0.5);
      reasons.push("No strong hints found, falling back to data-driven inference");
    }

    if (selectedType === "pie") {
      const uniqueCategoryCount = this.countUniqueCategories(data, categoricalFields[0]);
      if (
        categoricalFields.length === 0 ||
        numericFields.length === 0 ||
        uniqueCategoryCount > 12
      ) {
        selectedType =
          categoricalFields.length > 0 ? "bar" : dateFields.length > 0 ? "line" : "bar";
        reasons.push("Pie chart unsuitable for this data, switching to a more robust type");
      }
    }

    const xAxis = this.pickFallbackXAxis(selectedType, data);
    const yAxis = this.pickFallbackYAxis(selectedType, data, xAxis);

    if (!xAxis || yAxis.length === 0) {
      console.warn("🛟 [IntentAnalyzer] 回退策略未能生成有效的轴映射", { xAxis, yAxis });
      return {
        intent: null,
        analysis: {
          bestType: selectedType,
          bestScore: maxScore,
          secondScore,
          scores,
          matchedKeywords,
          reasons,
        },
      };
    }

    const requiredFields = Array.from(new Set([xAxis, ...yAxis].filter(Boolean)));
    const optionalFields = categoricalFields.filter(field => field !== xAxis);

    const confidence = Math.max(0.5, Math.min(0.9, 0.55 + maxScore * 0.08));

    const suggestions = this.buildFallbackSuggestions(selectedType, xAxis, yAxis, data);
    reasons.push(`Selected ${selectedType} chart with confidence ${confidence.toFixed(2)}`);

    const intent: ChartIntent = {
      chartType: selectedType,
      confidence,
      reasoning: reasons.join("; "),
      requiredFields,
      optionalFields,
      visualMapping: {
        xAxis,
        yAxis,
        colorBy: selectedType === "pie" ? undefined : optionalFields[0],
      },
      suggestions,
    };

    return {
      intent,
      analysis: {
        bestType: selectedType,
        bestScore: maxScore,
        secondScore,
        scores,
        matchedKeywords,
        reasons,
      },
    };
  }

  private pickFallbackXAxis(chartType: ChartType, data: UnifiedDataStructure): string | null {
    const stats = data.metadata.statistics;
    const stringField = data.schema.fields.find(field => field.type === "string")?.name;
    const dateField = data.schema.fields.find(field => field.type === "date")?.name;
    const fallback = stringField || dateField || data.schema.fields[0]?.name || null;

    if (chartType === "line" || chartType === "area") {
      return stats.dateFields[0] || stats.categoricalFields[0] || dateField || fallback;
    }

    if (chartType === "pie") {
      return stats.categoricalFields[0] || fallback;
    }

    return stats.categoricalFields[0] || stats.dateFields[0] || fallback;
  }

  private pickFallbackYAxis(
    chartType: ChartType,
    data: UnifiedDataStructure,
    xAxis: string | null
  ): string[] {
    const numericFields = data.metadata.statistics.numericFields;
    const available = numericFields.filter(field => field !== xAxis);

    const selected = available.length > 0 ? available : numericFields;

    if (selected.length === 0) {
      const numericFallback = data.schema.fields.find(field => field.type === "number")?.name;
      return numericFallback ? [numericFallback] : [];
    }

    if (chartType === "pie") {
      return [selected[0]];
    }

    if (chartType === "bar") {
      return selected.slice(0, 2);
    }

    return selected.slice(0, 3);
  }

  private buildFallbackSuggestions(
    chartType: ChartType,
    xAxis: string,
    yAxis: string[],
    data: UnifiedDataStructure
  ): ChartIntent["suggestions"] {
    const chartLabel = FALLBACK_CHART_LABEL[chartType];
    const formattedMetricList = yAxis.join(", ");

    const title = `${chartLabel} of ${this.toTitleCase(xAxis)}`;
    const description = `${chartLabel} automatically generated from ${data.data.length} records highlighting ${formattedMetricList}`;
    const insights = this.generateFallbackInsights(chartType, xAxis, yAxis, data);

    return {
      title,
      description,
      insights,
    };
  }

  private generateFallbackInsights(
    chartType: ChartType,
    xAxis: string,
    yAxis: string[],
    data: UnifiedDataStructure
  ): string[] {
    const insights: string[] = [];
    const primaryMetric = yAxis[0];

    if (primaryMetric) {
      const numericEntries = data.data
        .map(row => {
          const rawValue = row[primaryMetric];
          const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
          if (Number.isFinite(numericValue)) {
            return { value: numericValue, row };
          }
          return null;
        })
        .filter((item): item is { value: number; row: DataRow } => item !== null);

      if (numericEntries.length > 0) {
        const maxEntry = numericEntries.reduce((best, current) =>
          current.value > best.value ? current : best
        );
        const minEntry = numericEntries.reduce((best, current) =>
          current.value < best.value ? current : best
        );

        insights.push(
          `${this.formatMetric(primaryMetric)} peaks at ${this.extractRowLabel(maxEntry.row, xAxis)} with ${maxEntry.value}`
        );

        if (numericEntries.length > 1 && chartType !== "pie") {
          insights.push(
            `${this.formatMetric(primaryMetric)} is lowest at ${this.extractRowLabel(minEntry.row, xAxis)} with ${minEntry.value}`
          );
        }
      }
    }

    if (insights.length === 0) {
      insights.push("Data automatically analysed to highlight the main trend");
    }

    return insights.slice(0, 3);
  }

  private extractRowLabel(row: DataRow, field: string): string {
    const raw = row[field];
    if (raw instanceof Date) {
      return raw.toISOString().split("T")[0];
    }
    if (typeof raw === "number") {
      return String(raw);
    }
    return raw ? String(raw) : "N/A";
  }

  private formatMetric(metric: string): string {
    return this.toTitleCase(metric.replace(/[_-]/g, " "));
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(" ");
  }

  private countUniqueCategories(data: UnifiedDataStructure, field?: string): number {
    if (!field) return data.data.length;
    const unique = new Set<string>();
    data.data.forEach(row => {
      const value = row[field];
      if (value !== undefined && value !== null) {
        unique.add(String(value));
      }
    });
    return unique.size || data.data.length;
  }
}

// 导出单例实例
export const intentAnalyzer = new IntentAnalyzer();
