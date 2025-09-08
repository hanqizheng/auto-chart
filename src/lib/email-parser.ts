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
  CommunicationSubStage,
  MatchType,
  BatchConfig,
  BatchProgress,
  PersistedBatchResult,
} from "@/types/email";
import { BatchProcessor, delay } from "./batch-processor";

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
          communicationSubStage: null, // 新增子阶段字段
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
      averageConfidence:
        results.length > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length : 0,
      processingTime,
    };

    console.log(`✅ [SimpleEmailParser] 批量解析完成:`, summary);

    return { results, summary, errors };
  }

  /**
   * 分批解析邮件（支持断点续传和结果持久化）
   */
  async parseEmailsInBatches(
    files: EmailFile[],
    config: ParsingConfig,
    batchConfig: BatchConfig,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<{ combinedResults: EmailParsingResult[]; progress: BatchProgress }> {
    const batchProcessor = new BatchProcessor();
    const batchSize = batchConfig.batchSize;

    console.log(
      `🚀 [SimpleEmailParser] 开始分批解析 ${files.length} 个邮件文件，批次大小: ${batchSize}`
    );

    // 1. 尝试加载之前的进度
    let progress: BatchProgress;
    let remainingFiles = files;

    if (batchConfig.resumeFromProgress) {
      const savedProgress = await batchProcessor.loadProgress();
      if (savedProgress && savedProgress.status !== "completed") {
        progress = savedProgress;
        remainingFiles = batchProcessor.filterUnprocessedFiles(
          files,
          savedProgress.processedFileNames
        );
        console.log(`🔄 [SimpleEmailParser] 从断点恢复: ${remainingFiles.length} 个文件待处理`);
      } else {
        progress = batchProcessor.initializeProgress(files.length, batchSize);
      }
    } else {
      progress = batchProcessor.initializeProgress(files.length, batchSize);
    }

    // 2. 创建批次
    const batches = batchProcessor.createBatches(remainingFiles, batchSize);

    // 3. 初始化项目模糊搜索
    this.initializeProjectFuse(config.projects);

    // 4. 逐批处理
    progress.status = "processing";
    await batchProcessor.saveProgress(progress);
    onProgress?.(progress);

    for (let i = progress.currentBatch; i < batches.length; i++) {
      const batch = batches[i];
      const batchId = batchProcessor.generateBatchId();

      console.log(
        `📦 [SimpleEmailParser] 处理批次 ${i + 1}/${batches.length} (${batch.length} 个文件)`
      );

      progress.currentBatch = i;
      progress.status = "processing";

      try {
        // 处理当前批次
        const batchResult = await this.parseEmails(batch, config);

        // 保存批次结果
        if (batchConfig.enableAutoSave) {
          const persistedResult: PersistedBatchResult = {
            batchId,
            timestamp: new Date().toISOString(),
            progress: { ...progress },
            results: batchResult.results,
            config: batchConfig,
          };
          await batchProcessor.saveBatchResult(persistedResult);
        }

        // 更新进度
        const processedFileNames = batch.map(f => f.filename);
        const failedFiles = batchResult.results.filter(r => !r.success).map(r => r.filename);

        progress = batchProcessor.updateProgress(
          progress,
          batch.length,
          failedFiles,
          processedFileNames
        );

        progress.completedBatches = i + 1;

        // 保存进度
        await batchProcessor.saveProgress(progress);
        onProgress?.(progress);

        console.log(
          `✅ [SimpleEmailParser] 批次 ${i + 1} 完成: ${batchResult.summary.successful}/${batchResult.summary.total} 成功`
        );

        // 批次间延迟
        if (i < batches.length - 1 && batchConfig.batchDelay > 0) {
          console.log(`⏳ [SimpleEmailParser] 批次间延迟 ${batchConfig.batchDelay}ms`);
          await delay(batchConfig.batchDelay);
        }
      } catch (error) {
        console.error(`❌ [SimpleEmailParser] 批次 ${i + 1} 处理失败:`, error);
        progress.status = "failed";
        await batchProcessor.saveProgress(progress);
        onProgress?.(progress);
        throw error;
      }
    }

    // 5. 完成处理
    progress.status = "completed";
    progress.lastUpdateTime = new Date().toISOString();
    await batchProcessor.saveProgress(progress);
    onProgress?.(progress);

    // 6. 获取合并结果
    const combinedResults = await batchProcessor.getCombinedResults();

    console.log(`🎉 [SimpleEmailParser] 分批解析完成: ${combinedResults.length} 个结果`);

    // 7. 清理旧结果（可选）
    await batchProcessor.cleanupOldResults(10);

    return { combinedResults, progress };
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
      contentPreview: basicInfo.content.substring(0, 200) + "...",
    });

    // 3. 项目匹配
    const projectMatch = this.matchProject(basicInfo.subject, basicInfo.content, config.projects);
    console.log(`🎯 [SimpleEmailParser] 项目匹配结果:`, {
      filename: file.filename,
      projectName: projectMatch.projectName,
      confidence: projectMatch.confidence,
      method: projectMatch.method,
      evidence: projectMatch.evidence,
    });

    // 4. 联盟客信息提取
    const partnerInfo = this.extractPartnerInfo(parsedEmail, basicInfo.content);
    console.log(`👤 [SimpleEmailParser] 联盟客信息提取:`, {
      filename: file.filename,
      name: partnerInfo.name,
      email: partnerInfo.email,
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
      errorReason: result.errorReason,
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

    return (
      content
        // 移除HTML标签
        .replace(/<[^>]*>/g, " ")
        // 移除多余空白
        .replace(/\s+/g, " ")
        // 移除base64数据
        .replace(/[A-Za-z0-9+/=]{100,}/g, "[附件数据]")
        .trim()
    );
  }

  /**
   * 文本标准化处理
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, " ") // 保留字母数字中文和空格，其他字符转为空格
      .replace(/\s+/g, " ") // 多个空格合并为一个（移到最后，避免产生意外的词汇组合）
      .trim();
  }

  /**
   * 提取项目名称的核心词汇
   */
  private extractCoreWords(projectName: string): string[] {
    const normalized = this.normalizeText(projectName);
    // 过滤掉常见的地区和平台后缀
    const commonSuffixes = ["us", "uk", "de", "eu", "ca", "fr", "es", "amz", "dtc", "awin"];
    
    return normalized
      .split(" ")
      .filter(word => word.length > 1) // 过滤单字符
      .filter(word => !commonSuffixes.includes(word)) // 过滤常见后缀
      .filter(word => !/^\d+$/.test(word)); // 过滤纯数字
  }

  /**
   * 双向项目匹配
   */
  private bidirectionalMatch(searchText: string, projectName: string, aliases: string[] = []): {
    matched: boolean;
    method: string;
    evidence: string;
    confidence: number;
  } {
    const normalizedSearchText = this.normalizeText(searchText);
    const normalizedProjectName = this.normalizeText(projectName);
    
    // 特殊项目的详细调试
    if (projectName.toLowerCase().includes('ugreen') || projectName.toLowerCase().includes('oppo')) {
      console.log(`🔍 [BidirectionalMatch] 检查关键项目: "${projectName}"`);
      console.log(`🔍 [BidirectionalMatch] 项目别名: [${aliases.join(', ')}]`);
      console.log(`🔍 [BidirectionalMatch] 标准化项目名: "${normalizedProjectName}"`);
      console.log(`🔍 [BidirectionalMatch] 标准化搜索文本包含检查: "${normalizedProjectName}" in "${normalizedSearchText.substring(0, 100)}..."`);
    }
    
    // 1. 标准化后的精确匹配（使用完整单词匹配）
    if (this.isWholeWordMatch(normalizedProjectName, normalizedSearchText)) {
      if (projectName.toLowerCase().includes('ugreen') || projectName.toLowerCase().includes('oppo')) {
        console.log(`✅ [BidirectionalMatch] 精确匹配成功: "${projectName}"`);
      }
      return {
        matched: true,
        method: "exact_match",
        evidence: `精确匹配: "${projectName}"`,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      };
    }

    // 2. 反向匹配：项目名包含搜索关键词（改进版 - 完整单词匹配）
    const coreWords = this.extractCoreWords(projectName);
    for (const coreWord of coreWords) {
      if (coreWord.length > 2 && this.isWholeWordMatch(coreWord, normalizedSearchText)) {
        return {
          matched: true,
          method: "reverse_match",
          evidence: `反向匹配核心词: "${coreWord}" 来自项目 "${projectName}"`,
          confidence: CONFIDENCE_LEVELS.HIGH
        };
      }
    }

    // 3. 别名匹配（严格版 - 使用完整单词匹配）
    for (const alias of aliases) {
      const normalizedAlias = this.normalizeText(alias);
      
      // 标准化别名匹配（使用完整单词匹配）
      if (this.isWholeWordMatch(normalizedAlias, normalizedSearchText)) {
        return {
          matched: true,
          method: "alias_match",
          evidence: `别名匹配: "${alias}" -> "${projectName}"`,
          confidence: CONFIDENCE_LEVELS.HIGH
        };
      }
      
      // 反向别名匹配（使用完整单词匹配）
      const aliasWords = normalizedAlias.split(" ").filter(word => word.length > 2);
      for (const word of aliasWords) {
        if (this.isWholeWordMatch(word, normalizedSearchText)) {
          return {
            matched: true,
            method: "alias_reverse_match",
            evidence: `别名反向匹配: "${word}" 来自别名 "${alias}"`,
            confidence: CONFIDENCE_LEVELS.MEDIUM
          };
        }
      }
    }

    // 4. 部分词匹配（宽松匹配）
    const searchWords = normalizedSearchText.split(" ").filter(word => word.length > 2);
    const projectWords = normalizedProjectName.split(" ").filter(word => word.length > 2);
    
    for (const searchWord of searchWords) {
      for (const projectWord of projectWords) {
        // 词汇相似度匹配
        if (this.calculateSimilarity(searchWord, projectWord) > 0.8) {
          return {
            matched: true,
            method: "partial_match",
            evidence: `部分匹配: "${searchWord}" 相似于 "${projectWord}"`,
            confidence: CONFIDENCE_LEVELS.MEDIUM
          };
        }
      }
    }

    return {
      matched: false,
      method: "no_match",
      evidence: "",
      confidence: 0
    };
  }

  /**
   * 检查是否为完整单词匹配（避免单词重合问题）
   * 支持中英文混合匹配
   */
  private isWholeWordMatch(coreWord: string, searchText: string): boolean {
    // 对于中文项目名，使用简单的空格分割匹配
    if (/[\u4e00-\u9fff]/.test(coreWord)) {
      // 中文字符，使用空格或标点作为分界
      const chineseRegex = new RegExp(`(^|[\\s\\p{P}])${this.escapeRegex(coreWord)}($|[\\s\\p{P}])`, 'iu');
      return chineseRegex.test(searchText);
    }
    
    // 对于英文项目名，使用单词边界匹配
    // \b 表示单词边界，确保匹配的是完整单词而不是子字符串
    const wordRegex = new RegExp(`\\b${this.escapeRegex(coreWord)}\\b`, 'i');
    const result = wordRegex.test(searchText);
    
    // 额外的调试信息
    if (coreWord.toLowerCase() === 'oppo' || coreWord.toLowerCase() === 'ugreen') {
      console.log(`🔍 [WholeWordMatch] 检查单词: "${coreWord}" 在 "${searchText.substring(0, 100)}..." 中`);
      console.log(`🔍 [WholeWordMatch] 正则表达式: ${wordRegex.toString()}`);
      console.log(`🔍 [WholeWordMatch] 匹配结果: ${result}`);
    }
    
    return result;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 计算两个字符串的相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length < 3 || str2.length < 3) return 0;
    
    // 简单的编辑距离相似度
    const maxLen = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLen - distance) / maxLen;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 严格的项目匹配（优先匹配明确的项目名称）
   */
  private matchProject(
    subject: string,
    content: string,
    projects: ProjectInfo[]
  ): ProjectMatchResult {
    const searchText = subject + " " + content;
    const evidence: string[] = [];

    console.log(`🔍 [ProjectMatch] 开始匹配项目，搜索文本长度: ${searchText.length}`);
    console.log(`🔍 [ProjectMatch] 邮件标题: "${subject}"`);
    console.log(`🔍 [ProjectMatch] 内容前200字符: "${content.substring(0, 200)}..."`);
    console.log(`🔍 [ProjectMatch] 项目总数: ${projects.length}`);

    // 1. 优先在邮件标题中寻找项目名称（最高优先级）
    console.log(`🔍 [ProjectMatch] 步骤1: 在邮件标题中寻找项目名称`);
    for (const project of projects) {
      const matchResult = this.bidirectionalMatch(subject, project.name, project.aliases);
      
      if (matchResult.matched) {
        evidence.push(matchResult.evidence + " (来源: 邮件标题)");
        console.log(`✅ [ProjectMatch] 标题匹配成功: ${project.name}, 方法: ${matchResult.method}, 置信度: ${matchResult.confidence}`);
        
        return {
          projectName: project.name,
          confidence: matchResult.confidence,
          method: matchResult.method + "_title",
          evidence,
        };
      }
    }

    // 2. 在完整内容中寻找项目名称（次高优先级）
    console.log(`🔍 [ProjectMatch] 步骤2: 在完整内容中寻找项目名称`);
    for (const project of projects) {
      const matchResult = this.bidirectionalMatch(searchText, project.name, project.aliases);
      
      if (matchResult.matched) {
        evidence.push(matchResult.evidence);
        console.log(`✅ [ProjectMatch] 内容匹配成功: ${project.name}, 方法: ${matchResult.method}, 置信度: ${matchResult.confidence}`);
        
        return {
          projectName: project.name,
          confidence: matchResult.confidence,
          method: matchResult.method,
          evidence,
        };
      }
    }

    // 2. 增强的模糊匹配
    console.log(`🔍 [ProjectMatch] 双向匹配失败，尝试模糊匹配`);
    if (this.projectFuse) {
      try {
        // 使用标准化文本进行模糊搜索
        const normalizedSearchText = this.normalizeText(searchText);
        console.log(`🔍 [ProjectMatch] 标准化搜索文本: "${normalizedSearchText.substring(0, 200)}..."`);
        const fuzzyResults = this.projectFuse.search(normalizedSearchText.substring(0, 500));
        
        console.log(`🔍 [ProjectMatch] 模糊匹配结果数量: ${fuzzyResults.length}`);
        if (fuzzyResults.length > 0) {
          // 显示前3个结果
          for (let i = 0; i < Math.min(3, fuzzyResults.length); i++) {
            const result = fuzzyResults[i] as any;
            console.log(`🔍 [ProjectMatch] 模糊匹配结果 ${i+1}: ${result.item.name} (分数: ${result.score}, 相似度: ${(1-result.score).toFixed(3)})`);
          }
          
          const bestResult = fuzzyResults[0] as any;
          // 降低模糊匹配的阈值，提高匹配成功率
          if (bestResult.score && bestResult.score < 0.6) {
            evidence.push(`模糊匹配: "${bestResult.item.name}" (相似度: ${(1 - bestResult.score).toFixed(3)})`);
            console.log(`✅ [ProjectMatch] 模糊匹配成功: ${bestResult.item.name}, 分数: ${bestResult.score}`);
            
            return {
              projectName: bestResult.item.name,
              confidence: Math.max(1 - bestResult.score, CONFIDENCE_LEVELS.LOW),
              method: "fuzzy_match",
              evidence,
            };
          } else {
            console.log(`❌ [ProjectMatch] 最佳模糊匹配分数过低: ${bestResult.score}`);
          }
        }
      } catch (error) {
        console.warn("❌ [ProjectMatch] 模糊匹配失败:", error);
      }
    } else {
      console.log(`❌ [ProjectMatch] 模糊搜索未初始化`);
    }

    console.log(`❌ [ProjectMatch] 未找到匹配的项目`);
    return {
      projectName: null,
      confidence: 0,
      method: "no_match",
      evidence,
    };
  }

  /**
   * 从邮箱域名提取公司信息
   */
  private extractCompanyFromEmail(email: string): string | null {
    if (!email || !email.includes("@")) {
      return null;
    }

    console.log(`📧 [CompanyExtraction] 分析邮箱: ${email}`);

    // 跳过BlueFocus内部邮箱
    if (this.isBlueFocus(email)) {
      console.log(`📧 [CompanyExtraction] 跳过BlueFocus内部邮箱: ${email}`);
      return null;
    }

    const domain = email.split("@")[1].toLowerCase();
    console.log(`📧 [CompanyExtraction] 提取域名: ${domain}`);

    // 移除子域名（保留主域名）
    const mainDomain = this.extractMainDomain(domain);
    console.log(`📧 [CompanyExtraction] 主域名: ${mainDomain}`);

    // 域名转公司名
    const companyName = this.domainToCompanyName(mainDomain);
    console.log(`📧 [CompanyExtraction] 转换后的公司名: ${companyName}`);

    return companyName;
  }

  /**
   * 提取主域名（去除子域名）
   */
  private extractMainDomain(domain: string): string {
    const parts = domain.split(".");
    
    // 处理常见的域名结构
    if (parts.length >= 2) {
      // 对于如 mail.company.com -> company.com
      // 或 company.co.uk -> company.co.uk
      const commonTlds = ["com", "org", "net", "edu", "gov", "mil", "co"];
      const secondLevelDomains = ["co", "com", "org", "net", "edu", "gov"];
      
      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];
        
        // 处理如 .co.uk, .com.cn 等双级域名
        if (secondLevelDomains.includes(secondLastPart) && parts.length >= 3) {
          return parts.slice(-3).join(".");
        } else if (commonTlds.includes(lastPart)) {
          return parts.slice(-2).join(".");
        }
      }
      
      // 默认返回最后两部分
      return parts.slice(-2).join(".");
    }
    
    return domain;
  }

  /**
   * 将域名转换为公司名称
   */
  private domainToCompanyName(domain: string): string | null {
    // 移除常见的顶级域名后缀
    let companyPart = domain
      .replace(/\.(com|org|net|edu|gov|mil|co\.uk|co\.jp|co\.kr|com\.cn|com\.au)$/i, "")
      .replace(/\.(uk|jp|kr|cn|au|de|fr|it|es|ca|in)$/i, "");

    console.log(`📧 [CompanyExtraction] 清理后的公司部分: ${companyPart}`);

    // 过滤掉明显不是公司名的域名
    const invalidDomains = [
      "gmail", "yahoo", "hotmail", "outlook", "aol", "icloud", "qq", "163", "126",
      "mail", "email", "webmail", "temp", "temporary", "test", "example",
      "localhost", "admin", "support", "noreply", "no-reply"
    ];

    if (invalidDomains.includes(companyPart.toLowerCase())) {
      console.log(`📧 [CompanyExtraction] 过滤无效域名: ${companyPart}`);
      return null;
    }

    // 长度验证
    if (companyPart.length < 2 || companyPart.length > 50) {
      console.log(`📧 [CompanyExtraction] 公司名长度不合理: ${companyPart}`);
      return null;
    }

    // 转换为合理的公司名格式
    const companyName = companyPart
      .split(/[-_.]/)  // 按分隔符分割
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // 首字母大写
      .join(" ");

    console.log(`📧 [CompanyExtraction] 最终公司名: ${companyName}`);
    
    return companyName.trim() || null;
  }

  /**
   * 从邮件签名提取公司信息
   */
  private extractCompanyFromSignature(content: string): string | null {
    if (!content) return null;

    console.log(`✍️ [SignatureExtraction] 开始分析邮件签名，内容长度: ${content.length}`);

    // 识别签名区域的常见分隔符
    const signatureDelimiters = [
      "best regards",
      "kind regards", 
      "regards",
      "sincerely",
      "thanks",
      "thank you",
      "cheers",
      "best",
      "--",
      "___",
      "sent from",
      "发自",
      "此致敬礼",
      "谢谢",
      "谨上"
    ];

    // 查找签名开始位置
    let signatureStart = -1;
    const lowerContent = content.toLowerCase();
    
    for (const delimiter of signatureDelimiters) {
      const index = lowerContent.lastIndexOf(delimiter);
      if (index > signatureStart) {
        signatureStart = index;
      }
    }

    if (signatureStart === -1) {
      console.log(`✍️ [SignatureExtraction] 未找到签名分隔符`);
      return null;
    }

    // 提取签名部分（通常在最后1000字符内）
    const signatureSection = content.slice(Math.max(0, signatureStart)).slice(0, 1000);
    console.log(`✍️ [SignatureExtraction] 签名区域: ${signatureSection.substring(0, 200)}...`);

    // 公司名称匹配模式
    const companyPatterns = [
      // 典型格式："John Doe | Company Name" 或 "John Doe, Company Name"
      /(?:^|\n)([^|\n,]+?)[\|,]\s*([A-Z][^|\n,]{2,50})/gm,
      
      // "Company Name\nJohn Doe" 格式  
      /(?:^|\n)([A-Z][A-Za-z\s&\.]{2,50})\s*\n+\s*[A-Z][a-z]+\s+[A-Z][a-z]+/gm,
      
      // "Sent from Company Name" 格式
      /sent\s+from\s+([A-Z][A-Za-z\s&\.]{2,50})/gi,
      
      // 包含 Inc, LLC, Corp, Ltd 等的公司名
      /([A-Z][A-Za-z\s&\.]+(?:Inc|LLC|Corp|Ltd|Co|Company|Corporation|Limited)\.?)/gi,
      
      // 中文公司名模式
      /([\u4e00-\u9fff]+(?:公司|集团|企业|科技|有限|股份))/g
    ];

    const foundCompanies = new Set<string>();

    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(signatureSection)) !== null) {
        // 通常取第二个捕获组，如果没有则取第一个
        let companyName = (match[2] || match[1]).trim();
        
        console.log(`✍️ [SignatureExtraction] 模式匹配到: "${companyName}"`);
        
        // 清理和验证公司名
        companyName = this.cleanCompanyName(companyName);
        if (companyName && this.isValidCompanyName(companyName)) {
          foundCompanies.add(companyName);
          console.log(`✍️ [SignatureExtraction] 有效公司名: "${companyName}"`);
        }
      }
    }

    if (foundCompanies.size > 0) {
      // 返回最长的公司名（通常更完整）
      const companies = Array.from(foundCompanies);
      const bestCompany = companies.reduce((prev, current) => 
        current.length > prev.length ? current : prev
      );
      
      console.log(`✍️ [SignatureExtraction] 选择最佳公司名: "${bestCompany}"`);
      return bestCompany;
    }

    console.log(`✍️ [SignatureExtraction] 未找到有效的公司名`);
    return null;
  }

  /**
   * 清理公司名称
   */
  private cleanCompanyName(companyName: string): string {
    return companyName
      .replace(/^\s*[\|,\-\.\:]\s*/, "") // 移除开头的分隔符
      .replace(/\s*[\|,\-\.\:]\s*$/, "") // 移除结尾的分隔符
      .replace(/\s+/g, " ")              // 规范化空格
      .replace(/^(mr|ms|dr|prof)\.?\s+/i, "") // 移除称谓
      .trim();
  }

  /**
   * 验证是否为有效的公司名称
   */
  private isValidCompanyName(companyName: string): boolean {
    if (!companyName || companyName.length < 2 || companyName.length > 100) {
      return false;
    }

    // 过滤掉明显的个人姓名（简单启发式）
    const personalNamePatterns = [
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "First Last" 格式
      /^(mr|ms|dr|prof|sir|madam)\.?\s+/i, // 带称谓的
    ];

    for (const pattern of personalNamePatterns) {
      if (pattern.test(companyName)) {
        console.log(`✍️ [SignatureExtraction] 过滤个人姓名: "${companyName}"`);
        return false;
      }
    }

    // 过滤掉常见的非公司词汇
    const invalidWords = [
      "email", "phone", "mobile", "tel", "fax", "address", "website", "www",
      "best", "regards", "thanks", "sincerely", "sent", "from", "mailto"
    ];

    const lowerName = companyName.toLowerCase();
    for (const word of invalidWords) {
      if (lowerName.includes(word)) {
        console.log(`✍️ [SignatureExtraction] 包含无效词汇: "${companyName}"`);
        return false;
      }
    }

    return true;
  }

  /**
   * 提取联盟客信息（重构版 - 专注公司/品牌名称）
   */
  private extractPartnerInfo(parsedEmail: any, content: string): PartnerInfo {
    let partnerName: string | null = null;
    let partnerEmail: string | null = null;

    console.log(`👥 [PartnerExtraction] 开始提取联盟客信息`);

    // 1. 从邮件头提取邮箱
    if (parsedEmail.headers) {
      const fromEmail = this.extractEmailFromHeader(parsedEmail.from);
      const toEmails = this.extractEmailsFromHeader(parsedEmail.to);

      console.log(`👥 [PartnerExtraction] 邮件头信息 - 发件人: ${fromEmail}, 收件人: ${toEmails.join(', ')}`);

      // 根据BlueFocus规则确定联盟客邮箱
      if (fromEmail && this.isBlueFocus(fromEmail)) {
        // 发件人是BlueFocus，联盟客在收件人中
        for (const email of toEmails) {
          if (!this.isBlueFocus(email)) {
            partnerEmail = email;
            console.log(`👥 [PartnerExtraction] 联盟客邮箱 (收件人): ${email}`);
            break;
          }
        }
      } else if (fromEmail && !this.isBlueFocus(fromEmail)) {
        // 发件人不是BlueFocus，发件人就是联盟客
        partnerEmail = fromEmail;
        console.log(`👥 [PartnerExtraction] 联盟客邮箱 (发件人): ${fromEmail}`);
      }
    }

    // 2. 从内容中提取邮箱（备用）
    if (!partnerEmail) {
      console.log(`👥 [PartnerExtraction] 邮件头未找到联盟客邮箱，尝试从内容提取`);
      const contentEmails = this.extractEmailsFromContent(content);
      for (const email of contentEmails) {
        if (!this.isBlueFocus(email)) {
          partnerEmail = email;
          console.log(`👥 [PartnerExtraction] 联盟客邮箱 (内容): ${email}`);
          break;
        }
      }
    }

    // 3. 提取公司/品牌名称 - 简化版本，优先使用邮箱域名
    if (partnerEmail) {
      console.log(`👥 [PartnerExtraction] 开始提取公司名，基于邮箱: ${partnerEmail}`);
      
      // 主要从邮箱域名提取公司名
      const companyFromEmail = this.extractCompanyFromEmail(partnerEmail);
      if (companyFromEmail) {
        partnerName = companyFromEmail;
        console.log(`👥 [PartnerExtraction] 从邮箱域名提取公司名: ${companyFromEmail}`);
      } else {
        console.log(`👥 [PartnerExtraction] 邮箱域名无法提取有效公司名`);
      }
    }

    // 4. 最后备用方案：如果邮箱域名无法提取公司名，回退到个人姓名（兼容性）
    if (!partnerName && partnerEmail) {
      console.log(`👥 [PartnerExtraction] 邮箱域名提取失败，回退到个人姓名提取`);
      // 从邮件头提取个人姓名
      if (parsedEmail.headers) {
        if (partnerEmail === this.extractEmailFromHeader(parsedEmail.from)) {
          partnerName = this.extractNameFromHeader(parsedEmail.from);
        } else {
          partnerName = this.extractNameFromHeader(parsedEmail.to, partnerEmail);
        }
      }
      
      // 从内容提取个人姓名（备用）
      if (!partnerName) {
        partnerName = this.extractNameFromContent(content);
      }
      
      console.log(`👥 [PartnerExtraction] 个人姓名 (备用): ${partnerName}`);
    }

    const result = { name: partnerName, email: partnerEmail };
    console.log(`👥 [PartnerExtraction] 最终结果:`, result);
    
    return result;
  }

  /**
   * AI处理（优化版 - 专注公司识别）
   */
  private async processWithAI(
    content: string,
    partnerInfo: PartnerInfo,
    stages: StageInfo[]
  ): Promise<AIResult> {
    const result: AIResult = { partnerName: null, stage: null, subStage: null };

    try {
      console.log(`🤖 [AI] 开始AI处理，已有联盟客信息:`, partnerInfo);

      // AI增强公司名称识别（仅在需要时使用）
      const needsCompanyExtraction = !partnerInfo.name || 
                                   partnerInfo.name.includes("@") || 
                                   partnerInfo.name.length < 3;

      if (needsCompanyExtraction) {
        console.log(`🤖 [AI] 需要AI增强公司名称识别`);
        
        // 构建上下文信息
        let contextInfo = "";
        if (partnerInfo.email) {
          const emailDomain = partnerInfo.email.split("@")[1];
          contextInfo += `\n- 联盟客邮箱域名: ${emailDomain}`;
        }
        
        const nameResponse = await this.aiService.chat({
          messages: [
            {
              role: "user",
              content: `请从以下邮件内容中提取联盟客的公司或品牌名称。
              
上下文信息：${contextInfo}

邮件内容：
${content.substring(0, 1500)}`,
            },
          ],
          systemPrompt: `你是商务邮件分析专家，专门识别B2B合作中的公司和品牌信息。

**任务目标：**
从邮件中识别联盟客的公司名称或品牌名称（优先级：公司名 > 品牌名 > 个人姓名）

**识别策略：**
1. 优先寻找公司/企业名称（如：Apple Inc.、华为技术有限公司）
2. 其次寻找品牌名称（如：iPhone、华为）
3. 关注邮件签名中的公司信息
4. 分析邮箱域名相关的公司信息
5. 避免提取明显的个人姓名（除非没有其他选择）

**重点关注：**
- 邮件签名区域的公司信息
- 包含"Inc、LLC、Corp、Ltd、公司、集团、科技"等企业后缀的名称
- 与业务讨论相关的品牌或产品名称
- 邮箱域名对应的公司名称

返回JSON格式：
{
  "partnerName": "公司或品牌名称",
  "type": "company|brand|person",
  "confidence": 0.8,
  "evidence": ["识别依据1", "识别依据2"],
  "source": "signature|domain|content|header"
}

如果无法确定，返回：
{
  "partnerName": null,
  "type": null,
  "confidence": 0,
  "evidence": [],
  "source": null
}`,
          params: { temperature: 0.1, maxTokens: 400 },
        });

        try {
          const nameResult = JSON.parse(nameResponse.content.replace(/```json\n?|\n?```/g, ""));
          console.log(`🤖 [AI] AI公司名称识别结果:`, nameResult);
          
          if (nameResult.partnerName) {
            // 提高公司和品牌名称的置信度
            let adjustedConfidence = nameResult.confidence || 0;
            if (nameResult.type === "company") {
              adjustedConfidence = Math.min(adjustedConfidence + 0.1, 1.0);
            } else if (nameResult.type === "brand") {
              adjustedConfidence = Math.min(adjustedConfidence + 0.05, 1.0);
            }
            
            result.partnerName = {
              partnerName: nameResult.partnerName,
              confidence: adjustedConfidence,
              evidence: nameResult.evidence || [],
            };
            
            console.log(`🤖 [AI] AI提取的联盟客名称: ${nameResult.partnerName} (类型: ${nameResult.type}, 置信度: ${adjustedConfidence})`);
          }
        } catch (error) {
          console.warn("🤖 [AI] AI公司名称提取结果解析失败:", error);
        }
      } else {
        console.log(`🤖 [AI] 已有可用的联盟客名称，跳过AI公司名称提取: ${partnerInfo.name}`);
      }

      // AI检测沟通阶段
      const stageContext = stages.map(s => `- ${s.id}: ${s.name} (${s.description})`).join("\n");
      const stageResponse = await this.aiService.chat({
        messages: [
          {
            role: "user",
            content: `请分析以下邮件内容，判断当前的沟通阶段。

可选阶段：
${stageContext}

邮件内容：
${content.substring(0, 1500)}`,
          },
        ],
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
        const stageResult = JSON.parse(stageResponse.content.replace(/```json\n?|\n?```/g, ""));
        if (stageResult.stage) {
          result.stage = {
            stage: stageResult.stage as CommunicationStage,
            confidence: stageResult.confidence || 0,
            reasoning: stageResult.reasoning || "",
          };

          // 进一步识别子阶段
          result.subStage = await this.identifySubStage(content, stageResult.stage, stages);
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
   * 识别沟通子阶段
   */
  private async identifySubStage(
    content: string,
    mainStage: string,
    stages: StageInfo[]
  ): Promise<{
    subStage: CommunicationSubStage | null;
    confidence: number;
    reasoning: string;
  } | null> {
    try {
      // 找到对应的主阶段信息
      const stageInfo = stages.find(s => s.id === mainStage);
      if (!stageInfo || !stageInfo.subStages || stageInfo.subStages.length === 0) {
        console.log(`🔍 [SimpleEmailParser] 主阶段 ${mainStage} 无子阶段或子阶段为空`);
        return null;
      }

      // 构建子阶段上下文
      const subStageContext = stageInfo.subStages
        .map(sub => `- ${sub.id}: ${sub.name} (${sub.description})`)
        .join("\n");

      console.log(`🔍 [SimpleEmailParser] 开始识别主阶段 ${mainStage} 的子阶段`);

      // AI识别子阶段
      const subStageResponse = await this.aiService.chat({
        messages: [
          {
            role: "user",
            content: `请分析以下邮件内容，判断在"${stageInfo.name}"阶段下的具体子阶段。

主阶段：${stageInfo.name} - ${stageInfo.description}

可选子阶段：
${subStageContext}

邮件内容：
${content.substring(0, 1500)}`,
          },
        ],
        systemPrompt: `你是商务沟通专家。请根据邮件内容和上下文，判断当前处于主阶段下的哪个具体子阶段。

分析要点：
1. 仔细理解每个子阶段的业务含义
2. 根据邮件中的关键词、语境和意图进行判断
3. 子阶段之间没有严格的先后顺序
4. 如果邮件内容模糊或包含多个子阶段特征，选择最主要的一个

返回JSON格式：
{
  "subStage": "substage-id",
  "confidence": 0.8,
  "reasoning": "基于邮件内容的具体判断依据"
}

如果无法确定子阶段，返回：
{
  "subStage": null,
  "confidence": 0,
  "reasoning": "无法确定子阶段的原因"
}`,
        params: { temperature: 0.1, maxTokens: 500 },
      });

      try {
        const subStageResult = JSON.parse(
          subStageResponse.content.replace(/```json\n?|\n?```/g, "")
        );
        console.log(`🔍 [SimpleEmailParser] AI子阶段识别结果:`, {
          subStage: subStageResult.subStage,
          confidence: subStageResult.confidence,
          reasoning: subStageResult.reasoning?.substring(0, 100) + "...",
        });

        return {
          subStage: subStageResult.subStage as CommunicationSubStage,
          confidence: subStageResult.confidence || 0,
          reasoning: subStageResult.reasoning || "",
        };
      } catch (error) {
        console.warn("AI子阶段识别结果解析失败:", error);
        return null;
      }
    } catch (error) {
      console.error("子阶段识别失败:", error);
      return null;
    }
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

    // 确定最终的沟通子阶段
    const communicationSubStage = aiResult?.subStage?.subStage || null;

    // 计算总体置信度（包含子阶段置信度）
    const confidenceScores = [
      projectMatch.confidence,
      aiResult?.partnerName?.confidence || (partnerInfo.name ? CONFIDENCE_LEVELS.MEDIUM : 0),
      aiResult?.stage?.confidence || 0,
      aiResult?.subStage?.confidence || 0, // 新增子阶段置信度
    ].filter(score => score > 0);

    const overallConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, score) => sum + score) / confidenceScores.length
        : 0;

    // 判断解析是否成功
    const success = !!(
      projectName &&
      partnerEmail &&
      overallConfidence > config.aiConfidenceThreshold
    );

    // 确定匹配类型
    let matchType: MatchType = MATCH_TYPES.EXACT;
    if (projectMatch.method === "fuzzy_match") {
      matchType = MATCH_TYPES.FUZZY;
    } else if (aiResult?.partnerName || aiResult?.stage || aiResult?.subStage) {
      matchType = MATCH_TYPES.AI_EXTRACTED;
    }

    return {
      projectName,
      partnerName,
      partnerEmail,
      communicationStage,
      communicationSubStage, // 新增子阶段字段
      success,
      errorReason: success
        ? undefined
        : this.generateErrorReason(projectName, partnerEmail, overallConfidence),
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
        let name = matches[0][1]
          .trim()
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
