// Intent Analyzer - 意图分析器
// 负责AI驱动的用户意图分析和图表类型推荐

import { ChartType } from "@/types/chart";
import { AIService } from '@/lib/ai/types';
import { createServiceFromEnv } from '@/lib/ai/service-factory';
import { 
  ChartIntent, 
  CompatibilityResult, 
  UnifiedDataStructure,
  AutoAnalysisResult,
  VisualMapping,
  AIChartError 
} from './types';

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
  async analyzeChartIntent(prompt: string, dataStructure: UnifiedDataStructure): Promise<ChartIntent> {
    console.log('🎯 [IntentAnalyzer] 开始分析用户意图...');
    
    try {
      // 首先尝试AI分析
      const aiIntent = await this.aiAnalyzeIntent(prompt, dataStructure);
      if (aiIntent) {
        console.log('✅ [IntentAnalyzer] AI意图分析成功:', aiIntent.chartType);
        return aiIntent;
      }

      // AI失败时使用规则推理
      console.log('⚠️ [IntentAnalyzer] AI分析失败，使用规则推理...');
      return this.ruleBasedIntentAnalysis(prompt, dataStructure);

    } catch (error) {
      console.error('❌ [IntentAnalyzer] 意图分析失败:', error);
      throw new AIChartError(
        'intent_analysis',
        'UNKNOWN_ERROR',
        '意图分析过程失败',
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  /**
   * 验证数据与意图的兼容性
   */
  validateDataCompatibility(intent: ChartIntent, data: UnifiedDataStructure): CompatibilityResult {
    console.log('🔍 [IntentAnalyzer] 验证数据兼容性...');

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
      suggestions.push('数据质量较低，建议检查和清理数据');
    }

    // 数据量检查
    if (data.data.length < 2) {
      incompatibleTypes.push('数据行数太少，至少需要2行数据');
    }

    const isCompatible = missingFields.length === 0 && incompatibleTypes.length === 0;

    return {
      isCompatible,
      reason: isCompatible 
        ? '数据与意图完全兼容' 
        : `存在兼容性问题：${[...missingFields, ...incompatibleTypes].join(', ')}`,
      missingFields,
      incompatibleTypes,
      suggestions
    };
  }

  /**
   * 自动推荐最佳可视化方案（文件场景）
   */
  async suggestBestVisualization(data: UnifiedDataStructure): Promise<ChartIntent> {
    console.log('🤖 [IntentAnalyzer] 自动推荐最佳可视化方案...');

    try {
      // 基于数据特征自动分析
      const autoAnalysis = this.analyzeDataCharacteristics(data);
      
      // 使用AI生成推荐说明
      const aiSuggestions = await this.generateAISuggestions(data, autoAnalysis);

      const intent: ChartIntent = {
        chartType: autoAnalysis.recommendedChart,
        confidence: autoAnalysis.confidence,
        reasoning: `基于数据分析自动推荐：${autoAnalysis.reasoning}`,
        requiredFields: autoAnalysis.requiredFields,
        optionalFields: autoAnalysis.optionalFields,
        visualMapping: autoAnalysis.visualMapping,
        suggestions: aiSuggestions || {
          title: `${autoAnalysis.recommendedChart}数据可视化`,
          description: '基于数据自动生成的图表',
          insights: ['数据包含多个维度，适合进行对比分析']
        }
      };

      console.log('✅ [IntentAnalyzer] 自动推荐完成:', intent.chartType);
      return intent;

    } catch (error) {
      console.error('❌ [IntentAnalyzer] 自动推荐失败:', error);
      
      // 降级到基础推荐
      return this.getBasicRecommendation(data);
    }
  }

  /**
   * AI驱动的意图分析
   */
  private async aiAnalyzeIntent(prompt: string, dataStructure: UnifiedDataStructure): Promise<ChartIntent | null> {
    const systemPrompt = `你是一个专业的数据可视化专家。根据用户需求和数据特征，推荐最合适的图表类型。

支持的图表类型：
- bar: 柱状图，用于比较不同类别的数值
- line: 折线图，用于显示趋势和时间序列变化
- pie: 饼图，用于显示部分与整体的比例关系
- area: 面积图，用于显示累积数据和多系列对比

数据信息：
- 字段：${dataStructure.schema.fields.map(f => `${f.name}(${f.type})`).join(', ')}
- 数据行数：${dataStructure.data.length}
- 数值字段：${dataStructure.metadata.statistics.numericFields.join(', ')}
- 分类字段：${dataStructure.metadata.statistics.categoricalFields.join(', ')}

请分析用户需求并以JSON格式回复：
{
  "chartType": "bar|line|pie|area",
  "confidence": 0.0-1.0,
  "reasoning": "选择理由",
  "visualMapping": {
    "xAxis": "字段名",
    "yAxis": ["数值字段1", "数值字段2"],
    "colorBy": "可选的颜色分组字段"
  },
  "title": "图表标题",
  "description": "图表描述",
  "insights": ["洞察1", "洞察2"]
}`;

    try {
      const response = await this.aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt,
        params: {
          temperature: 0.3,
          maxTokens: 800,
        },
      });

      let content = this.cleanJsonResponse(response.content);
      const parsed = JSON.parse(content);

      // 验证AI响应
      if (!parsed.chartType || !['bar', 'line', 'pie', 'area'].includes(parsed.chartType)) {
        console.warn('AI返回了无效的图表类型');
        return null;
      }

      return {
        chartType: parsed.chartType,
        confidence: Math.max(0.1, Math.min(1.0, parsed.confidence || 0.7)),
        reasoning: parsed.reasoning || 'AI推荐',
        requiredFields: this.extractRequiredFields(parsed.visualMapping, dataStructure),
        optionalFields: [],
        visualMapping: {
          xAxis: parsed.visualMapping?.xAxis || dataStructure.metadata.statistics.categoricalFields[0] || 'category',
          yAxis: parsed.visualMapping?.yAxis || dataStructure.metadata.statistics.numericFields.slice(0, 2),
          colorBy: parsed.visualMapping?.colorBy
        },
        suggestions: {
          title: parsed.title || '数据图表',
          description: parsed.description || '基于数据生成的可视化图表',
          insights: Array.isArray(parsed.insights) ? parsed.insights : []
        }
      };

    } catch (error) {
      console.warn('🤖 [AI Intent] AI意图分析失败:', error);
      return null;
    }
  }

  /**
   * 规则推理意图分析（降级方案）
   */
  private ruleBasedIntentAnalysis(prompt: string, dataStructure: UnifiedDataStructure): ChartIntent {
    console.log('📋 [RuleAnalysis] 使用规则推理分析意图...');

    const lowerPrompt = prompt.toLowerCase();
    const stats = dataStructure.metadata.statistics;
    
    // 图表类型推理规则
    let chartType: ChartType = 'bar'; // 默认柱状图
    let confidence = 0.6;
    let reasoning = '基于关键词匹配';

    // 关键词匹配
    if (this.containsKeywords(lowerPrompt, ['趋势', '变化', '时间', 'trend', 'over time', '走势', '增长', '下降'])) {
      chartType = 'line';
      reasoning = '检测到趋势分析关键词';
      confidence = 0.7;
    } else if (this.containsKeywords(lowerPrompt, ['占比', '比例', '分布', '份额', 'proportion', 'share', 'distribution'])) {
      chartType = 'pie';
      reasoning = '检测到比例分析关键词';
      confidence = 0.7;
    } else if (this.containsKeywords(lowerPrompt, ['累积', '堆叠', 'cumulative', 'stacked', '总量'])) {
      chartType = 'area';
      reasoning = '检测到累积分析关键词';
      confidence = 0.7;
    } else if (this.containsKeywords(lowerPrompt, ['比较', '对比', 'compare', '排名', '排序'])) {
      chartType = 'bar';
      reasoning = '检测到比较分析关键词';
      confidence = 0.7;
    }

    // 数据特征推理
    if (stats.dateFields.length > 0) {
      chartType = 'line';
      reasoning += ' + 检测到时间字段';
      confidence += 0.1;
    } else if (stats.numericFields.length === 1 && stats.categoricalFields.length === 1) {
      if (dataStructure.data.length <= 6) {
        chartType = 'pie';
        reasoning += ' + 适合饼图的数据结构';
        confidence += 0.1;
      }
    }

    confidence = Math.min(0.9, confidence);

    // 构建视觉映射
    const visualMapping = {
      xAxis: stats.categoricalFields[0] || stats.dateFields[0] || 'category',
      yAxis: stats.numericFields.slice(0, 2),
      colorBy: stats.categoricalFields[1]
    };

    return {
      chartType,
      confidence,
      reasoning,
      requiredFields: [visualMapping.xAxis, ...visualMapping.yAxis].filter(Boolean),
      optionalFields: [visualMapping.colorBy].filter(Boolean),
      visualMapping,
      suggestions: {
        title: this.generateDefaultTitle(chartType, dataStructure),
        description: `基于${reasoning}生成的${this.getChartTypeName(chartType)}`,
        insights: this.generateBasicInsights(dataStructure)
      }
    };
  }

  /**
   * 分析数据特征（文件场景）
   */
  private analyzeDataCharacteristics(data: UnifiedDataStructure): AutoAnalysisResult {
    const stats = data.metadata.statistics;
    const fields = data.schema.fields;
    
    let chartType: ChartType = 'bar';
    let confidence = 0.6;
    let reasoning = '';

    // 数据结构分析
    if (stats.dateFields.length > 0 && stats.numericFields.length > 0) {
      chartType = 'line';
      confidence = 0.8;
      reasoning = '检测到时间序列数据，适合显示趋势变化';
    } else if (stats.numericFields.length === 1 && stats.categoricalFields.length === 1 && data.data.length <= 8) {
      chartType = 'pie';
      confidence = 0.7;
      reasoning = '单一数值分类数据，适合显示比例关系';
    } else if (stats.numericFields.length > 2 && stats.categoricalFields.length > 0) {
      chartType = 'area';
      confidence = 0.7;
      reasoning = '多系列数值数据，适合显示累积效果';
    } else if (stats.numericFields.length > 0 && stats.categoricalFields.length > 0) {
      chartType = 'bar';
      confidence = 0.7;
      reasoning = '数值分类数据，适合进行对比分析';
    }

    // 数据质量调整
    if (data.schema.qualityScore < 0.7) {
      confidence *= 0.9;
      reasoning += '（数据质量一般，请注意验证）';
    }

    const visualMapping = {
      xAxis: stats.categoricalFields[0] || stats.dateFields[0] || fields.find(f => f.type === 'string')?.name || 'index',
      yAxis: stats.numericFields.slice(0, chartType === 'pie' ? 1 : 3),
      colorBy: stats.categoricalFields[1]
    };

    return {
      recommendedChart: chartType,
      confidence,
      reasoning,
      requiredFields: [visualMapping.xAxis, ...visualMapping.yAxis].filter(Boolean),
      optionalFields: [visualMapping.colorBy].filter(Boolean),
      visualMapping
    };
  }

  /**
   * 生成AI建议
   */
  private async generateAISuggestions(
    data: UnifiedDataStructure, 
    analysis: AutoAnalysisResult
  ): Promise<ChartIntent['suggestions'] | null> {
    const systemPrompt = `基于数据分析结果，为${analysis.recommendedChart}图表生成标题、描述和洞察。

数据概要：
- 数据行数：${data.data.length}
- 字段：${data.schema.fields.map(f => f.name).join(', ')}
- 推荐理由：${analysis.reasoning}

请以JSON格式回复：
{
  "title": "简洁有力的图表标题",
  "description": "图表的详细描述",
  "insights": ["洞察1", "洞察2", "洞察3"]
}`;

    try {
      const response = await this.aiService.chat({
        messages: [{ role: 'user', content: '请生成图表元信息' }],
        systemPrompt,
        params: {
          temperature: 0.4,
          maxTokens: 400,
        },
      });

      const content = this.cleanJsonResponse(response.content);
      const parsed = JSON.parse(content);

      return {
        title: parsed.title || '数据可视化',
        description: parsed.description || '基于数据自动生成的图表',
        insights: Array.isArray(parsed.insights) ? parsed.insights : []
      };

    } catch (error) {
      console.warn('AI建议生成失败:', error);
      return null;
    }
  }

  /**
   * 检查图表类型与数据的兼容性
   */
  private checkChartTypeCompatibility(chartType: ChartType, data: UnifiedDataStructure): {
    isCompatible: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const stats = data.metadata.statistics;

    switch (chartType) {
      case 'pie':
        if (stats.numericFields.length === 0) {
          issues.push('饼图需要至少一个数值字段');
        }
        if (data.data.length > 10) {
          suggestions.push('饼图类别过多，考虑合并小类别或使用柱状图');
        }
        break;

      case 'line':
        if (stats.numericFields.length === 0) {
          issues.push('折线图需要至少一个数值字段');
        }
        if (stats.dateFields.length === 0 && stats.categoricalFields.length === 0) {
          issues.push('折线图需要时间或分类字段作为X轴');
        }
        break;

      case 'bar':
      case 'area':
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
      suggestions
    };
  }

  /**
   * 获取基础推荐（最后降级方案）
   */
  private getBasicRecommendation(data: UnifiedDataStructure): ChartIntent {
    const stats = data.metadata.statistics;
    
    return {
      chartType: 'bar',
      confidence: 0.5,
      reasoning: '使用默认柱状图推荐',
      requiredFields: [
        stats.categoricalFields[0] || 'category',
        stats.numericFields[0] || 'value'
      ].filter(Boolean),
      optionalFields: [],
      visualMapping: {
        xAxis: stats.categoricalFields[0] || 'category',
        yAxis: stats.numericFields.slice(0, 1),
      },
      suggestions: {
        title: '数据图表',
        description: '基于数据的可视化展示',
        insights: ['数据可视化有助于更好地理解数据模式']
      }
    };
  }

  // 辅助方法

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private extractRequiredFields(visualMapping: VisualMapping, data: UnifiedDataStructure): string[] {
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

  private generateDefaultTitle(chartType: ChartType, data: UnifiedDataStructure): string {
    const typeNames = {
      bar: '柱状图分析',
      line: '趋势分析',
      pie: '比例分布',
      area: '面积分析'
    };
    
    return typeNames[chartType] || '数据分析';
  }

  private getChartTypeName(chartType: ChartType): string {
    const names = {
      bar: '柱状图',
      line: '折线图', 
      pie: '饼图',
      area: '面积图'
    };
    
    return names[chartType] || '图表';
  }

  private generateBasicInsights(data: UnifiedDataStructure): string[] {
    const insights: string[] = [];
    const stats = data.metadata.statistics;
    
    insights.push(`数据包含${data.data.length}行记录`);
    
    if (stats.numericFields.length > 0) {
      insights.push(`包含${stats.numericFields.length}个数值字段：${stats.numericFields.join(', ')}`);
    }
    
    if (stats.missingValues > 0) {
      insights.push(`发现${stats.missingValues}个缺失值，可能影响分析结果`);
    }
    
    return insights;
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();
    
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return cleaned;
  }
}

// 导出单例实例
export const intentAnalyzer = new IntentAnalyzer();