/**
 * 会话标题自动生成服务
 * 基于会话内容智能生成标题
 * 支持AI生成和规则生成的降级策略
 */

import { ChatMessage, SingleChatSession } from "@/types";
import { MESSAGE_TYPES } from "@/constants/message";

/**
 * 标题生成配置
 */
interface TitleGenerationConfig {
  maxLength: number;
  useAI: boolean;
  fallbackStrategy: 'rule_based' | 'timestamp' | 'default';
  aiTimeout: number; // AI生成超时时间（毫秒）
}

const DEFAULT_CONFIG: TitleGenerationConfig = {
  maxLength: 50,
  useAI: true,
  fallbackStrategy: 'rule_based',
  aiTimeout: 5000,
};

/**
 * 标题生成结果
 */
interface TitleGenerationResult {
  title: string;
  method: 'ai' | 'rule_based' | 'timestamp' | 'default';
  confidence: number; // 0-1，标题质量置信度
  reasoning?: string;
}

/**
 * 会话标题生成器类
 */
class SessionTitleGenerator {
  private config: TitleGenerationConfig;

  constructor(config: Partial<TitleGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 为会话生成标题
   */
  async generateTitle(session: SingleChatSession): Promise<TitleGenerationResult> {
    console.log(`📝 [TitleGen] 开始生成会话标题: ${session.id}`);

    // 如果已有标题且不是默认标题，直接返回
    if (session.title && !this.isDefaultTitle(session.title)) {
      return {
        title: session.title,
        method: 'default',
        confidence: 1.0,
        reasoning: '使用现有标题',
      };
    }

    // 获取会话的关键消息
    const keyMessages = this.extractKeyMessages(session.messages);
    if (keyMessages.length === 0) {
      return this.generateDefaultTitle(session);
    }

    // 尝试AI生成
    if (this.config.useAI) {
      try {
        const aiResult = await this.generateWithAI(keyMessages);
        if (aiResult) {
          console.log(`✅ [TitleGen] AI生成标题成功: "${aiResult.title}"`);
          return aiResult;
        }
      } catch (error) {
        console.warn("⚠️ [TitleGen] AI生成标题失败，使用降级策略:", error);
      }
    }

    // 降级到基于规则的生成
    return this.generateWithRules(keyMessages, session);
  }

  /**
   * 提取关键消息
   */
  private extractKeyMessages(messages: ChatMessage[]): ChatMessage[] {
    const keyMessages: ChatMessage[] = [];
    
    // 获取前3条用户消息和第一条AI回复
    let userMessageCount = 0;
    let hasAIReply = false;

    for (const message of messages) {
      if (message.type === MESSAGE_TYPES.USER && userMessageCount < 3) {
        keyMessages.push(message);
        userMessageCount++;
      } else if (message.type === MESSAGE_TYPES.CHART_RESULT && !hasAIReply) {
        keyMessages.push(message);
        hasAIReply = true;
      }
      
      // 如果已有足够的关键信息，提前结束
      if (userMessageCount >= 2 && hasAIReply) break;
    }

    return keyMessages;
  }

  /**
   * 使用AI生成标题
   */
  private async generateWithAI(messages: ChatMessage[]): Promise<TitleGenerationResult | null> {
    console.log("🤖 [TitleGen] 尝试AI生成标题");

    // 构造消息摘要
    const messagesSummary = messages.map(msg => {
      if (msg.type === MESSAGE_TYPES.USER) {
        const userMsg = msg as any;
        const hasFiles = userMsg.content.attachments && userMsg.content.attachments.length > 0;
        return `用户: ${userMsg.content.text}${hasFiles ? ' [包含文件]' : ''}`;
      } else if (msg.type === MESSAGE_TYPES.CHART_RESULT) {
        const chartMsg = msg as any;
        return `AI生成: ${chartMsg.content.chartType}图表 - ${chartMsg.content.title}`;
      }
      return '';
    }).filter(text => text).join('\n');

    const prompt = `请根据以下对话内容，生成一个简洁的会话标题（不超过${this.config.maxLength}个字符）：

${messagesSummary}

要求：
1. 标题要准确概括对话主题
2. 优先体现数据分析或图表类型
3. 语言简洁明了，适合作为会话列表显示
4. 不要包含引号或特殊符号

直接返回标题文本，不要额外说明。`;

    try {
      // 这里需要集成实际的AI服务
      // 由于当前没有直接可用的AI服务接口，我们先返回null让其降级到规则生成
      console.log("🤖 [TitleGen] AI服务暂未集成，使用规则生成");
      return null;
      
      // TODO: 集成AI服务
      // const response = await aiService.chat({
      //   messages: [{ role: 'user', content: prompt }],
      //   params: { temperature: 0.3, maxTokens: 100 }
      // });
      // 
      // const title = response.content.trim();
      // return {
      //   title: this.truncateTitle(title),
      //   method: 'ai',
      //   confidence: 0.9,
      //   reasoning: 'AI智能生成'
      // };
    } catch (error) {
      console.error("❌ [TitleGen] AI生成失败:", error);
      return null;
    }
  }

  /**
   * 使用规则生成标题
   */
  private generateWithRules(messages: ChatMessage[], session: SingleChatSession): TitleGenerationResult {
    console.log("📋 [TitleGen] 使用规则生成标题");

    // 分析用户消息内容
    const userMessages = messages.filter(msg => msg.type === MESSAGE_TYPES.USER) as any[];
    const chartMessages = messages.filter(msg => msg.type === MESSAGE_TYPES.CHART_RESULT) as any[];

    let title = '';
    let confidence = 0.7;
    let reasoning = '基于关键词规则生成';

    if (chartMessages.length > 0) {
      // 基于生成的图表
      const chartMsg = chartMessages[0];
      const chartType = this.getChartTypeDisplayName(chartMsg.content.chartType);
      
      if (chartMsg.content.title) {
        title = `${chartType} - ${chartMsg.content.title}`;
      } else if (userMessages.length > 0) {
        const keywords = this.extractKeywords(userMessages[0].content.text);
        title = keywords.length > 0 ? `${chartType} - ${keywords[0]}` : `${chartType}分析`;
      } else {
        title = `${chartType}分析`;
      }
      confidence = 0.8;
    } else if (userMessages.length > 0) {
      // 基于用户消息
      const firstMessage = userMessages[0];
      const keywords = this.extractKeywords(firstMessage.content.text);
      const hasFiles = firstMessage.content.attachments && firstMessage.content.attachments.length > 0;

      if (keywords.length > 0) {
        title = hasFiles ? `${keywords[0]}数据分析` : `${keywords[0]}分析`;
      } else if (hasFiles) {
        const fileName = firstMessage.content.attachments[0]?.name;
        if (fileName) {
          const baseName = fileName.split('.')[0];
          title = `${baseName}数据分析`;
        } else {
          title = '数据分析';
        }
      } else {
        title = '数据可视化';
      }
      confidence = 0.6;
    } else {
      // 最终降级
      return this.generateDefaultTitle(session);
    }

    return {
      title: this.truncateTitle(title),
      method: 'rule_based',
      confidence,
      reasoning,
    };
  }

  /**
   * 生成默认标题
   */
  private generateDefaultTitle(session: SingleChatSession): TitleGenerationResult {
    let title: string;
    let method: 'timestamp' | 'default' = 'default';
    
    if (this.config.fallbackStrategy === 'timestamp') {
      const date = session.createdAt;
      title = `会话 ${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      method = 'timestamp';
    } else {
      title = '新建图表';
    }

    return {
      title,
      method,
      confidence: 0.3,
      reasoning: '使用默认标题',
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 图表类型关键词
    const chartKeywords = {
      '柱状图': ['柱状', '柱图', '条形', 'bar'],
      '折线图': ['折线', '线图', '趋势', 'line', '增长', '变化'],
      '饼图': ['饼图', '比例', '占比', '分布', 'pie'],
      '面积图': ['面积', '累积', 'area', '堆叠'],
    };

    // 业务领域关键词
    const domainKeywords = [
      '销售', '营收', '收入', '利润',
      '用户', '客户', '流量', '访问',
      '产品', '订单', '交易', '支付',
      '市场', '增长', '分析', '统计',
      '数据', '报表', '指标', '趋势',
    ];

    // 检查图表类型
    for (const [chartType, patterns] of Object.entries(chartKeywords)) {
      for (const pattern of patterns) {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          keywords.push(chartType);
          break;
        }
      }
    }

    // 检查业务领域
    for (const keyword of domainKeywords) {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    // 提取可能的数据名称（中文词汇）
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,8}/g) || [];
    for (const word of chineseWords) {
      // 过滤掉常见的无意义词汇
      if (!['生成', '创建', '制作', '帮我', '请你', '可以', '需要', '想要'].includes(word)) {
        keywords.push(word);
      }
    }

    return keywords.slice(0, 3); // 最多返回3个关键词
  }

  /**
   * 获取图表类型显示名称
   */
  private getChartTypeDisplayName(chartType: string): string {
    const typeMap: Record<string, string> = {
      'bar': '柱状图',
      'line': '折线图',
      'pie': '饼图',
      'area': '面积图',
    };
    return typeMap[chartType] || '图表';
  }

  /**
   * 截断标题到指定长度
   */
  private truncateTitle(title: string): string {
    if (title.length <= this.config.maxLength) {
      return title;
    }
    return title.substring(0, this.config.maxLength - 3) + '...';
  }

  /**
   * 判断是否为默认标题
   */
  private isDefaultTitle(title: string): boolean {
    const defaultTitles = ['新建图表', '数据分析', '图表分析', '会话'];
    return defaultTitles.some(defaultTitle => title.includes(defaultTitle));
  }

  /**
   * 批量生成标题
   */
  async generateBatchTitles(sessions: SingleChatSession[]): Promise<Map<string, TitleGenerationResult>> {
    console.log(`📝 [TitleGen] 批量生成 ${sessions.length} 个会话标题`);
    
    const results = new Map<string, TitleGenerationResult>();
    const promises = sessions.map(async session => {
      try {
        const result = await this.generateTitle(session);
        results.set(session.id, result);
      } catch (error) {
        console.error(`❌ [TitleGen] 会话 ${session.id} 标题生成失败:`, error);
        results.set(session.id, this.generateDefaultTitle(session));
      }
    });

    await Promise.all(promises);
    console.log(`✅ [TitleGen] 批量标题生成完成: ${results.size}/${sessions.length}`);
    
    return results;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TitleGenerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ [TitleGen] 配置已更新:", this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): TitleGenerationConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const sessionTitleGenerator = new SessionTitleGenerator();

// 导出类型和工具函数
export type { TitleGenerationResult, TitleGenerationConfig };

/**
 * 快速生成会话标题的便捷函数
 */
export async function generateSessionTitle(session: SingleChatSession): Promise<string> {
  const result = await sessionTitleGenerator.generateTitle(session);
  return result.title;
}

/**
 * 验证标题是否合适的工具函数
 */
export function validateTitle(title: string): { valid: boolean; reason?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, reason: '标题不能为空' };
  }
  
  if (title.length > 100) {
    return { valid: false, reason: '标题过长' };
  }
  
  // 检查是否包含特殊字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(title)) {
    return { valid: false, reason: '标题包含非法字符' };
  }
  
  return { valid: true };
}