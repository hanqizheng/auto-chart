// Intent Analyzer - 意图分析器
// 负责AI驱动的用户意图分析和图表类型推荐

import { ChartType } from "@/types/chart";
import { AIService } from "@/lib/ai/types";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import { getClientTurnstileToken } from "@/lib/security-context";
import {
  ChartIntent,
  CompatibilityResult,
  UnifiedDataStructure,
  AutoAnalysisResult,
  VisualMapping,
  AIChartError,
} from "./types";

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
      // 使用AI分析
      const aiIntent = await this.aiAnalyzeIntent(prompt, dataStructure);
      if (aiIntent) {
        console.log("✅ [IntentAnalyzer] AI意图分析成功:", aiIntent.chartType);
        return aiIntent;
      }

      // AI分析失败，直接报错
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
      const token = getClientTurnstileToken();

      const response = await fetch('/api/ai/analyze-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          dataStructure,
          security: token ? { turnstileToken: token } : undefined,
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
      console.warn("⚠️ [AI Intent] AI意图分析失败:", error instanceof Error ? error.message : String(error));
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
}

// 导出单例实例
export const intentAnalyzer = new IntentAnalyzer();
