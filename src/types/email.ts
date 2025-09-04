// 邮件解析系统类型定义 - 简化版本

import {
  PARSING_STATUS,
  COMMUNICATION_STAGES,
  COMMUNICATION_SUB_STAGES,
  MATCH_TYPES,
  CONFIDENCE_LEVELS,
} from "@/constants/email";

// 解析状态类型
export type ParsingStatus = (typeof PARSING_STATUS)[keyof typeof PARSING_STATUS];

// 沟通阶段类型
export type CommunicationStage = (typeof COMMUNICATION_STAGES)[keyof typeof COMMUNICATION_STAGES];

// 沟通子阶段类型
export type CommunicationSubStage =
  (typeof COMMUNICATION_SUB_STAGES)[keyof typeof COMMUNICATION_SUB_STAGES];

// 匹配类型
export type MatchType = (typeof MATCH_TYPES)[keyof typeof MATCH_TYPES];

// 置信度等级类型
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[keyof typeof CONFIDENCE_LEVELS];

/**
 * 项目信息
 */
export interface ProjectInfo {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  status: string;
}

/**
 * 沟通子阶段信息
 */
export interface SubStageInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

/**
 * 沟通阶段信息
 */
export interface StageInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  subStages?: SubStageInfo[]; // 可选的子阶段数组
  order: number;
}

/**
 * 邮件解析结果 - 核心数据结构
 */
export interface EmailParsingResult {
  // 核心解析字段
  projectName: string | null; // 项目名称
  partnerName: string | null; // 联盟客名称
  partnerEmail: string | null; // 联盟客邮箱
  communicationStage: CommunicationStage | null; // 沟通阶段
  communicationSubStage: CommunicationSubStage | null; // 沟通子阶段

  // 状态字段
  success: boolean; // 是否解析成功
  errorReason?: string; // 失败原因

  // 基础信息
  filename: string; // 邮件文件名
  emailSubject: string; // 邮件主题
  emailDate: string; // 邮件日期
  emailFrom: string; // 发件人

  // 匹配信息
  confidence: number; // 整体置信度 (0-1)
  matchType: MatchType; // 匹配类型

  // 处理时间
  processingTime: number; // 处理耗时(ms)
}

/**
 * 批量解析结果
 */
export interface BatchParsingResult {
  results: EmailParsingResult[];
  summary: {
    total: number; // 总数
    successful: number; // 成功数
    failed: number; // 失败数
    averageConfidence: number; // 平均置信度
    processingTime: number; // 总处理时间
  };
  errors: string[]; // 错误信息列表
}

/**
 * 邮件文件信息
 */
export interface EmailFile {
  filename: string;
  content: string;
  size: number;
}

/**
 * 解析配置
 */
export interface ParsingConfig {
  enableAI: boolean; // 是否启用AI
  fuzzyMatchThreshold: number; // 模糊匹配阈值
  aiConfidenceThreshold: number; // AI置信度阈值
  maxContentLength: number; // 最大内容长度
  projects: ProjectInfo[]; // 项目列表
  stages: StageInfo[]; // 阶段列表
}

/**
 * 项目匹配结果
 */
export interface ProjectMatchResult {
  projectName: string | null;
  confidence: number;
  method: string; // 匹配方法
  evidence: string[]; // 证据
}

/**
 * 联盟客信息提取结果
 */
export interface PartnerInfo {
  name: string | null;
  email: string | null;
}

/**
 * AI处理结果
 */
export interface AIResult {
  partnerName: {
    partnerName: string | null;
    confidence: number;
    evidence: string[];
  } | null;
  stage: {
    stage: CommunicationStage | null;
    confidence: number;
    reasoning: string;
  } | null;
  subStage: {
    subStage: CommunicationSubStage | null;
    confidence: number;
    reasoning: string;
  } | null;
}

/**
 * CSV导出数据格式
 */
export interface CSVExportData {
  邮件文件名: string;
  项目名称: string;
  联盟客名称: string;
  联盟客邮箱: string;
  沟通阶段: string;
  沟通子阶段: string; // 新增子阶段字段
  是否提取成功: string;
  提取失败原因: string;
  邮件主题: string;
  邮件日期: string;
}

/**
 * 批处理进度信息
 */
export interface BatchProgress {
  totalFiles: number; // 总文件数
  processedFiles: number; // 已处理文件数
  currentBatch: number; // 当前批次
  totalBatches: number; // 总批次数
  completedBatches: number; // 已完成批次数
  failedFiles: string[]; // 处理失败的文件
  processedFileNames: string[]; // 已处理的文件名列表
  startTime: string; // 开始时间
  lastUpdateTime: string; // 最后更新时间
  status: "idle" | "processing" | "paused" | "completed" | "failed";
}

/**
 * 批处理配置
 */
export interface BatchConfig {
  batchSize: number; // 批次大小
  batchDelay: number; // 批次间延迟
  enableAutoSave: boolean; // 是否启用自动保存
  resumeFromProgress: boolean; // 是否从进度文件恢复
}

/**
 * 持久化的解析结果
 */
export interface PersistedBatchResult {
  batchId: string; // 批次ID
  timestamp: string; // 时间戳
  progress: BatchProgress; // 进度信息
  results: EmailParsingResult[]; // 解析结果
  config: BatchConfig; // 使用的配置
}
