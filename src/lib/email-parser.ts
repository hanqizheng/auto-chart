// 统一邮件解析器 - 简化版本

import { simpleParser } from "mailparser";
import Fuse from "fuse.js";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import type { AIService } from "@/lib/ai/types";
import {
  CONFIDENCE_LEVELS,
  MATCH_TYPES,
  EMAIL_FIELD_PATTERNS,
  BLUEFOCUS_DOMAINS,
  EMAIL_PARSER_CONFIG,
} from "@/constants/email";
import type {
  EmailFile,
  ParsingConfig,
  EmailParsingResult,
  BatchParsingResult,
  ProjectInfo,
  StageInfo,
  ProjectMatchResult,
  PartnerInfo,
  AIResult,
  CommunicationStage,
  MatchType,
} from "@/types/email";

/**
 * 统一邮件解析器
 * 合并了项目匹配、联盟客信息提取、AI处理功能
 */
export class SimpleEmailParser {
  private aiService: AIService;
  private projectFuse: Fuse<ProjectInfo> | null = null;

  constructor() {
    this.aiService = createServiceFromEnv("deepseek");
  }

  /**
   * 批量解析邮件
   */
  async parseEmails(files: EmailFile[], config: ParsingConfig): Promise<BatchParsingResult> {
    const startTime = Date.now();
    const results: EmailParsingResult[] = [];
    const errors: string[] = [];

    console.log(`📧 [SimpleEmailParser] 开始批量解析 ${files.length} 个邮件文件`);

    // 初始化项目模糊搜索
    this.initializeProjectFuse(config.projects);

    for (const file of files) {
      try {
        console.log(`📧 [SimpleEmailParser] 处理文件: ${file.filename}`);
        const result = await this.parseSingleEmail(file, config);
        results.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "未知错误";
        console.error(`❌ [SimpleEmailParser] 解析失败: ${file.filename}`, errorMsg);
        
        // 创建错误结果对象，确保filename被包含
        const errorResult: EmailParsingResult = {
          projectName: null,
          partnerName: null,
          partnerEmail: null,
          communicationStage: null,
          success: false,
          errorReason: errorMsg,
          filename: file.filename,
          emailSubject: "解析失败",
          emailDate: "",
          emailFrom: "",
          confidence: 0,
          matchType: "exact",
          processingTime: 0,
        };
        results.push(errorResult);
        errors.push(`${file.filename}: ${errorMsg}`);
      }
    }

    const processingTime = Date.now() - startTime;
    const summary = {
      total: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length + errors.length,
      averageConfidence: results.length > 0 
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
        : 0,
      processingTime,
    };

    console.log(`✅ [SimpleEmailParser] 批量解析完成:`, summary);

    return { results, summary, errors };
  }

  /**
   * 解析单个邮件
   */
  async parseSingleEmail(file: EmailFile, config: ParsingConfig): Promise<EmailParsingResult> {
    const startTime = Date.now();

    console.log(`📧 [SimpleEmailParser] 开始解析邮件: ${file.filename}`);

    // 1. 解析邮件文件
    const parsedEmail = await simpleParser(file.content);
    
    // 2. 提取基本信息
    const basicInfo = this.extractBasicInfo(parsedEmail, file.filename);
    console.log(`📧 [SimpleEmailParser] 邮件基本信息:`, {
      filename: file.filename,
      subject: basicInfo.subject,
      from: basicInfo.from,
      date: basicInfo.date,
      contentLength: basicInfo.content.length,
      contentPreview: basicInfo.content.substring(0, 200) + '...'
    });

    // 3. 项目匹配
    const projectMatch = this.matchProject(basicInfo.subject, basicInfo.content, config.projects);
    console.log(`🎯 [SimpleEmailParser] 项目匹配结果:`, {
      filename: file.filename,
      projectName: projectMatch.projectName,
      confidence: projectMatch.confidence,
      method: projectMatch.method,
      evidence: projectMatch.evidence
    });

    // 4. 联盟客信息提取
    const partnerInfo = this.extractPartnerInfo(parsedEmail, basicInfo.content);
    console.log(`👤 [SimpleEmailParser] 联盟客信息提取:`, {
      filename: file.filename,
      name: partnerInfo.name,
      email: partnerInfo.email
    });

    // 5. AI处理（如果启用）
    let aiResult: AIResult | null = null;
    if (config.enableAI) {
      try {
        console.log(`🤖 [SimpleEmailParser] 启用AI处理: ${file.filename}`);
        aiResult = await this.processWithAI(basicInfo.content, partnerInfo, config.stages);
        console.log(`🤖 [SimpleEmailParser] AI处理结果:`, {
          filename: file.filename,
          aiPartnerName: aiResult.partnerName?.partnerName,
          aiStage: aiResult.stage?.stage,
        });
      } catch (aiError) {
        console.warn(`🤖 [SimpleEmailParser] AI处理失败，继续使用规则匹配:`, aiError);
      }
    }

    // 6. 合并结果
    const result = this.mergeResults(
      basicInfo,
      projectMatch,
      partnerInfo,
      aiResult,
      Date.now() - startTime,
      config
    );

    console.log(`✅ [SimpleEmailParser] 邮件解析最终结果: ${file.filename}`, {
      success: result.success,
      projectName: result.projectName,
      partnerName: result.partnerName,
      partnerEmail: result.partnerEmail,
      communicationStage: result.communicationStage,
      confidence: result.confidence,
      matchType: result.matchType,
      errorReason: result.errorReason
    });

    return result;
  }

  /**
   * 初始化项目模糊搜索
   */
  private initializeProjectFuse(projects: ProjectInfo[]) {
    if (projects.length === 0) {
      this.projectFuse = null;
      return;
    }

    const fuseOptions = {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "aliases", weight: 0.3 },
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2,
    };

    this.projectFuse = new Fuse(projects, fuseOptions);
    console.log(`🔍 [SimpleEmailParser] 项目模糊搜索初始化完成，共 ${projects.length} 个项目`);
  }

  /**
   * 提取邮件基本信息
   */
  private extractBasicInfo(parsedEmail: any, filename: string) {
    let content = parsedEmail.text || parsedEmail.html || "";
    
    // 简单内容清理
    content = this.cleanEmailContent(content);

    return {
      subject: parsedEmail.subject || "无主题",
      content: content.substring(0, EMAIL_PARSER_CONFIG.MAX_CONTENT_LENGTH),
      date: parsedEmail.date?.toISOString() || "",
      from: parsedEmail.from?.value?.[0]?.address || parsedEmail.from?.text || "",
      to: parsedEmail.to?.value?.map((addr: any) => addr.address) || [],
      filename,
    };
  }

  /**
   * 简单邮件内容清理
   */
  private cleanEmailContent(content: string): string {
    if (!content) return "";

    return content
      // 移除HTML标签
      .replace(/<[^>]*>/g, " ")
      // 移除多余空白
      .replace(/\s+/g, " ")
      // 移除base64数据
      .replace(/[A-Za-z0-9+/=]{100,}/g, "[附件数据]")
      .trim();
  }

  /**
   * 项目匹配
   */
  private matchProject(subject: string, content: string, projects: ProjectInfo[]): ProjectMatchResult {
    const searchText = (subject + " " + content).toLowerCase();
    const evidence: string[] = [];
    
    // 1. 精确匹配
    for (const project of projects) {
      const projectName = project.name.toLowerCase();
      
      if (searchText.includes(projectName)) {
        evidence.push(`精确匹配项目名称: "${project.name}"`);
        return {
          projectName: project.name,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH,
          method: "exact_match",
          evidence,
        };
      }

      // 检查别名
      if (project.aliases) {
        for (const alias of project.aliases) {
          if (searchText.includes(alias.toLowerCase())) {
            evidence.push(`别名匹配: "${alias}" -> "${project.name}"`);
            return {
              projectName: project.name,
              confidence: CONFIDENCE_LEVELS.HIGH,
              method: "alias_match",
              evidence,
            };
          }
        }
      }
    }

    // 2. 模糊匹配
    if (this.projectFuse) {
      try {
        const fuzzyResults = this.projectFuse.search(searchText.substring(0, 500));
        if (fuzzyResults.length > 0) {
          const bestResult = fuzzyResults[0] as any;
          if (bestResult.score && bestResult.score < 0.5) {
            evidence.push(`模糊匹配: "${bestResult.item.name}"`);
            return {
              projectName: bestResult.item.name,
              confidence: Math.max(1 - bestResult.score, CONFIDENCE_LEVELS.LOW),
              method: "fuzzy_match",
              evidence,
            };
          }
        }
      } catch (error) {
        console.warn("模糊匹配失败:", error);
      }
    }

    return {
      projectName: null,
      confidence: 0,
      method: "no_match",
      evidence,
    };
  }

  /**
   * 提取联盟客信息
   */
  private extractPartnerInfo(parsedEmail: any, content: string): PartnerInfo {
    let partnerName: string | null = null;
    let partnerEmail: string | null = null;

    // 1. 从邮件头提取
    if (parsedEmail.headers) {
      const fromEmail = this.extractEmailFromHeader(parsedEmail.from);
      const toEmails = this.extractEmailsFromHeader(parsedEmail.to);

      // 根据BlueFocus规则确定联盟客
      if (fromEmail && this.isBlueFocus(fromEmail)) {
        // 发件人是BlueFocus，联盟客在收件人中
        for (const email of toEmails) {
          if (!this.isBlueFocus(email)) {
            partnerEmail = email;
            partnerName = this.extractNameFromHeader(parsedEmail.to, email);
            break;
          }
        }
      } else if (fromEmail && !this.isBlueFocus(fromEmail)) {
        // 发件人不是BlueFocus，发件人就是联盟客
        partnerEmail = fromEmail;
        partnerName = this.extractNameFromHeader(parsedEmail.from);
      }
    }

    // 2. 从内容中提取邮箱（备用）
    if (!partnerEmail) {
      const contentEmails = this.extractEmailsFromContent(content);
      for (const email of contentEmails) {
        if (!this.isBlueFocus(email)) {
          partnerEmail = email;
          break;
        }
      }
    }

    // 3. 从内容中提取姓名（备用）
    if (!partnerName) {
      partnerName = this.extractNameFromContent(content);
    }

    return { name: partnerName, email: partnerEmail };
  }

  /**
   * AI处理
   */
  private async processWithAI(content: string, partnerInfo: PartnerInfo, stages: StageInfo[]): Promise<AIResult> {
    const result: AIResult = { partnerName: null, stage: null };

    try {
      // AI提取联盟客姓名
      if (!partnerInfo.name || partnerInfo.name.includes("@")) {
        const nameResponse = await this.aiService.chat({
          messages: [{ 
            role: "user", 
            content: `请从以下邮件内容中提取联盟客的姓名或公司名称。邮件内容：\n${content.substring(0, 1500)}` 
          }],
          systemPrompt: `你是邮件分析专家。请分析邮件内容，提取联盟客的姓名或公司名称。
          
返回JSON格式：
{
  "partnerName": "姓名或公司名称",
  "confidence": 0.8,
  "evidence": ["证据1", "证据2"]
}

如果无法确定，返回：
{
  "partnerName": null,
  "confidence": 0,
  "evidence": []
}`,
          params: { temperature: 0.1, maxTokens: 300 },
        });

        try {
          const nameResult = JSON.parse(nameResponse.content.replace(/```json\n?|\n?```/g, ''));
          if (nameResult.partnerName) {
            result.partnerName = {
              partnerName: nameResult.partnerName,
              confidence: nameResult.confidence || 0,
              evidence: nameResult.evidence || [],
            };
          }
        } catch (error) {
          console.warn("AI姓名提取结果解析失败:", error);
        }
      }

      // AI检测沟通阶段
      const stageContext = stages.map(s => `- ${s.id}: ${s.name} (${s.description})`).join('\n');
      const stageResponse = await this.aiService.chat({
        messages: [{ 
          role: "user", 
          content: `请分析以下邮件内容，判断当前的沟通阶段。

可选阶段：
${stageContext}

邮件内容：
${content.substring(0, 1500)}` 
        }],
        systemPrompt: `你是商务沟通专家。请分析邮件内容和语境，判断当前处于哪个沟通阶段。

返回JSON格式：
{
  "stage": "stage-id",
  "confidence": 0.7,
  "reasoning": "判断依据"
}`,
        params: { temperature: 0.2, maxTokens: 400 },
      });

      try {
        const stageResult = JSON.parse(stageResponse.content.replace(/```json\n?|\n?```/g, ''));
        if (stageResult.stage) {
          result.stage = {
            stage: stageResult.stage as CommunicationStage,
            confidence: stageResult.confidence || 0,
            reasoning: stageResult.reasoning || "",
          };
        }
      } catch (error) {
        console.warn("AI阶段识别结果解析失败:", error);
      }

    } catch (error) {
      console.error("AI处理失败:", error);
      throw error;
    }

    return result;
  }

  /**
   * 合并各部分结果
   */
  private mergeResults(
    basicInfo: any,
    projectMatch: ProjectMatchResult,
    partnerInfo: PartnerInfo,
    aiResult: AIResult | null,
    processingTime: number,
    config: ParsingConfig
  ): EmailParsingResult {
    // 确定最终的项目名称
    const projectName = projectMatch.projectName;

    // 确定最终的联盟客姓名（优先使用AI结果）
    const partnerName = aiResult?.partnerName?.partnerName || partnerInfo.name;

    // 确定最终的联盟客邮箱
    const partnerEmail = partnerInfo.email;

    // 确定最终的沟通阶段
    const communicationStage = aiResult?.stage?.stage || null;

    // 计算总体置信度
    const confidenceScores = [
      projectMatch.confidence,
      aiResult?.partnerName?.confidence || (partnerInfo.name ? CONFIDENCE_LEVELS.MEDIUM : 0),
      aiResult?.stage?.confidence || 0,
    ].filter(score => score > 0);

    const overallConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score) / confidenceScores.length
      : 0;

    // 判断解析是否成功
    const success = !!(projectName && partnerEmail && overallConfidence > config.aiConfidenceThreshold);

    // 确定匹配类型
    let matchType: MatchType = MATCH_TYPES.EXACT;
    if (projectMatch.method === "fuzzy_match") {
      matchType = MATCH_TYPES.FUZZY;
    } else if (aiResult?.partnerName || aiResult?.stage) {
      matchType = MATCH_TYPES.AI_EXTRACTED;
    }

    return {
      projectName,
      partnerName,
      partnerEmail,
      communicationStage,
      success,
      errorReason: success ? undefined : this.generateErrorReason(projectName, partnerEmail, overallConfidence),
      filename: basicInfo.filename,
      emailSubject: basicInfo.subject,
      emailDate: basicInfo.date,
      emailFrom: basicInfo.from,
      confidence: overallConfidence,
      matchType,
      processingTime,
    };
  }

  /**
   * 生成错误原因
   */
  private generateErrorReason(projectName: any, partnerEmail: any, confidence: number): string {
    const reasons = [];
    if (!projectName) reasons.push("项目名称未识别");
    if (!partnerEmail) reasons.push("联盟客邮箱未找到");
    if (confidence < 0.5) reasons.push("置信度过低");
    return reasons.join("; ");
  }

  // 辅助方法
  private isBlueFocus(email: string): boolean {
    return BLUEFOCUS_DOMAINS.some(domain => email.toLowerCase().includes(domain));
  }

  private extractEmailFromHeader(headerValue: any): string | null {
    if (!headerValue) return null;
    if (typeof headerValue === "string") {
      const match = headerValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return match ? match[1].toLowerCase() : null;
    }
    if (headerValue.value && Array.isArray(headerValue.value)) {
      return headerValue.value[0]?.address?.toLowerCase() || null;
    }
    return null;
  }

  private extractEmailsFromHeader(headerValue: any): string[] {
    if (!headerValue) return [];
    const emails: string[] = [];
    
    if (headerValue.value && Array.isArray(headerValue.value)) {
      headerValue.value.forEach((addr: any) => {
        if (addr.address) emails.push(addr.address.toLowerCase());
      });
    } else if (typeof headerValue === "string") {
      const matches = headerValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
      if (matches) emails.push(...matches.map(e => e.toLowerCase()));
    }
    
    return emails;
  }

  private extractNameFromHeader(headerValue: any, targetEmail?: string): string | null {
    if (!headerValue) return null;
    
    if (headerValue.value && Array.isArray(headerValue.value)) {
      for (const addr of headerValue.value) {
        if (!targetEmail || addr.address?.toLowerCase() === targetEmail) {
          if (addr.name) return addr.name.trim().replace(/['"]/g, "");
        }
      }
    } else if (typeof headerValue === "string") {
      const match = headerValue.match(/^"?(.+?)"?\s*<[^>]+>$/);
      if (match) return match[1].trim().replace(/['"]/g, "");
    }
    
    return null;
  }

  private extractEmailsFromContent(content: string): string[] {
    const matches = Array.from(content.matchAll(EMAIL_FIELD_PATTERNS.EMAIL_PATTERN));
    return matches.map(match => match[1].toLowerCase());
  }

  private extractNameFromContent(content: string): string | null {
    for (const pattern of EMAIL_FIELD_PATTERNS.NAME_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        let name = matches[0][1].trim()
          .replace(/^(Hi|Hello|Dear|Best|Regards|Thanks)\s+/i, "")
          .replace(/[,，:;]$/, "")
          .trim();
        if (this.isValidName(name)) return name;
      }
    }
    return null;
  }

  private isValidName(name: string): boolean {
    if (name.length < 2 || name.length > 100) return false;
    if (name.includes("@") || name.includes("http")) return false;
    if (/^\d+$/.test(name)) return false;
    if (!/[a-zA-Z\u4e00-\u9fff]/.test(name)) return false;
    
    const invalidPatterns = [/team/i, /support/i, /noreply/i, /admin/i, /info@/i];
    return !invalidPatterns.some(pattern => pattern.test(name));
  }
}