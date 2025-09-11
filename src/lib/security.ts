/**
 * 安全访问控制系统
 * 防止恶意攻击和滥用AI接口
 */

import { FileAttachment } from "@/types";

// 安全配置常量
export const SECURITY_CONFIG = {
  // 速率限制配置
  RATE_LIMITS: {
    // 每个IP地址的限制
    PER_IP: {
      REQUESTS_PER_HOUR: 50,        // 每小时最多50个请求
      REQUESTS_PER_MINUTE: 10,      // 每分钟最多10个请求
      REQUESTS_PER_DAY: 200,        // 每天最多200个请求
    },
    // 每个会话的限制
    PER_SESSION: {
      REQUESTS_PER_HOUR: 30,        // 每小时最多30个请求
      REQUESTS_PER_MINUTE: 5,       // 每分钟最多5个请求
      CONSECUTIVE_REQUESTS: 3,      // 连续请求间隔至少10秒
    },
    // 文件上传限制
    FILE_UPLOAD: {
      MAX_FILES_PER_HOUR: 20,       // 每小时最多上传20个文件
      MAX_FILES_PER_REQUEST: 3,     // 每次请求最多3个文件
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
    }
  },
  
  // 内容验证配置
  CONTENT_VALIDATION: {
    MAX_MESSAGE_LENGTH: 2000,       // 最大消息长度
    MIN_MESSAGE_LENGTH: 3,          // 最小消息长度
    SUSPICIOUS_PATTERNS: [
      // SQL注入模式
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/i,
      // 脚本注入模式
      /<script[^>]*>.*?<\/script>/gi,
      // 命令注入模式
      /(\bexec\b|\beval\b|\bsystem\b|\bshell_exec\b)/i,
      // 过多重复字符（可能是垃圾信息）
      /(.)\1{50,}/g,
      // 异常长的URL
      /https?:\/\/[^\s]{200,}/g,
    ],
    // 垃圾信息检测
    SPAM_INDICATORS: [
      // 过多的特殊字符
      /[!@#$%^&*()_+=\[\]{}|;':",./<>?`~]{20,}/g,
      // 重复的短语
      /(.{5,}?)\1{5,}/g,
      // 过多的数字
      /\d{50,}/g,
    ]
  },

  // 行为分析配置
  BEHAVIOR_ANALYSIS: {
    // 可疑行为阈值
    SUSPICIOUS_THRESHOLDS: {
      RAPID_REQUESTS: 5,              // 10秒内超过5个请求
      REPEATED_IDENTICAL_REQUESTS: 3, // 相同请求重复3次
      FAILED_VALIDATIONS: 10,         // 验证失败超过10次
      ABNORMAL_FILE_UPLOADS: 15,      // 异常文件上传超过15次
    }
  }
} as const;

// 存储访问记录的接口
interface AccessRecord {
  timestamp: number;
  ip: string;
  sessionId: string;
  requestType: 'message' | 'file_upload';
  contentHash?: string;
  isBlocked?: boolean;
  reason?: string;
}

// 会话统计信息
interface SessionStats {
  sessionId: string;
  createdAt: number;
  requestCount: number;
  lastRequestTime: number;
  failedValidations: number;
  suspiciousActivityCount: number;
  isBlocked: boolean;
  blockReason?: string;
  requests: AccessRecord[];
}

/**
 * 安全访问控制类
 */
export class SecurityManager {
  private static instance: SecurityManager;
  private accessRecords: Map<string, AccessRecord[]> = new Map();
  private sessionStats: Map<string, SessionStats> = new Map();
  private blockedIPs: Set<string> = new Set();
  private blockedSessions: Set<string> = new Set();

  private constructor() {
    // 定期清理过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * 获取客户端标识（IP地址模拟）
   */
  private getClientIdentifier(): string {
    // 在浏览器环境中，我们使用fingerprinting技术
    if (typeof window !== 'undefined') {
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown'
      ].join('|');
      
      return btoa(fingerprint).slice(0, 32);
    }
    return 'server';
  }

  /**
   * 获取会话ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('auto_chart_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        sessionStorage.setItem('auto_chart_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  /**
   * 检查IP地址是否被阻止
   */
  private isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * 检查会话是否被阻止
   */
  private isSessionBlocked(sessionId: string): boolean {
    return this.blockedSessions.has(sessionId);
  }

  /**
   * 获取IP地址的访问记录
   */
  private getIPRecords(ip: string): AccessRecord[] {
    return this.accessRecords.get(ip) || [];
  }

  /**
   * 获取会话统计信息
   */
  private getSessionStats(sessionId: string): SessionStats {
    if (!this.sessionStats.has(sessionId)) {
      this.sessionStats.set(sessionId, {
        sessionId,
        createdAt: Date.now(),
        requestCount: 0,
        lastRequestTime: 0,
        failedValidations: 0,
        suspiciousActivityCount: 0,
        isBlocked: false,
        requests: []
      });
    }
    return this.sessionStats.get(sessionId)!;
  }

  /**
   * 添加访问记录
   */
  private addAccessRecord(ip: string, sessionId: string, record: Omit<AccessRecord, 'ip' | 'sessionId'>): void {
    const fullRecord: AccessRecord = { ...record, ip, sessionId };
    
    // 添加到IP记录
    if (!this.accessRecords.has(ip)) {
      this.accessRecords.set(ip, []);
    }
    this.accessRecords.get(ip)!.push(fullRecord);
    
    // 更新会话统计
    const sessionStats = this.getSessionStats(sessionId);
    sessionStats.requestCount++;
    sessionStats.lastRequestTime = Date.now();
    sessionStats.requests.push(fullRecord);
  }

  /**
   * 验证消息内容
   */
  private validateMessageContent(message: string): { isValid: boolean; reason?: string } {
    const { CONTENT_VALIDATION } = SECURITY_CONFIG;

    // 检查长度
    if (message.length < CONTENT_VALIDATION.MIN_MESSAGE_LENGTH) {
      return { isValid: false, reason: '消息内容过短' };
    }
    
    if (message.length > CONTENT_VALIDATION.MAX_MESSAGE_LENGTH) {
      return { isValid: false, reason: '消息内容过长' };
    }

    // 检查可疑模式
    for (const pattern of CONTENT_VALIDATION.SUSPICIOUS_PATTERNS) {
      if (pattern.test(message)) {
        return { isValid: false, reason: '检测到可疑内容模式' };
      }
    }

    // 检查垃圾信息指标
    for (const pattern of CONTENT_VALIDATION.SPAM_INDICATORS) {
      if (pattern.test(message)) {
        return { isValid: false, reason: '检测到垃圾信息特征' };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证文件上传
   */
  private validateFileUpload(files: FileAttachment[]): { isValid: boolean; reason?: string } {
    const { FILE_UPLOAD } = SECURITY_CONFIG.RATE_LIMITS;

    // 检查文件数量
    if (files.length > FILE_UPLOAD.MAX_FILES_PER_REQUEST) {
      return { isValid: false, reason: '文件数量超过限制' };
    }

    // 检查每个文件
    for (const file of files) {
      // 检查文件大小
      if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
        return { isValid: false, reason: '文件大小超过限制' };
      }

      // 检查文件扩展名
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension as '.xlsx' | '.xls' | '.csv')) {
        return { isValid: false, reason: '不支持的文件类型' };
      }
    }

    return { isValid: true };
  }

  /**
   * 检查速率限制
   */
  private checkRateLimit(ip: string, sessionId: string, requestType: 'message' | 'file_upload'): { 
    isAllowed: boolean; 
    reason?: string; 
    retryAfter?: number; 
  } {
    const now = Date.now();
    const { RATE_LIMITS, BEHAVIOR_ANALYSIS } = SECURITY_CONFIG;

    // 检查IP地址速率限制
    const ipRecords = this.getIPRecords(ip);
    const recentIPRecords = ipRecords.filter(r => now - r.timestamp < 60 * 60 * 1000); // 1小时内
    
    if (recentIPRecords.length >= RATE_LIMITS.PER_IP.REQUESTS_PER_HOUR) {
      return { isAllowed: false, reason: 'IP地址请求频率过高', retryAfter: 3600 };
    }

    const recentMinuteIPRecords = ipRecords.filter(r => now - r.timestamp < 60 * 1000); // 1分钟内
    if (recentMinuteIPRecords.length >= RATE_LIMITS.PER_IP.REQUESTS_PER_MINUTE) {
      return { isAllowed: false, reason: 'IP地址请求频率过高', retryAfter: 60 };
    }

    // 检查会话速率限制
    const sessionStats = this.getSessionStats(sessionId);
    const recentSessionRecords = sessionStats.requests.filter(r => now - r.timestamp < 60 * 60 * 1000);
    
    if (recentSessionRecords.length >= RATE_LIMITS.PER_SESSION.REQUESTS_PER_HOUR) {
      return { isAllowed: false, reason: '会话请求频率过高', retryAfter: 3600 };
    }

    const recentMinuteSessionRecords = sessionStats.requests.filter(r => now - r.timestamp < 60 * 1000);
    if (recentMinuteSessionRecords.length >= RATE_LIMITS.PER_SESSION.REQUESTS_PER_MINUTE) {
      return { isAllowed: false, reason: '会话请求频率过高', retryAfter: 60 };
    }

    // 检查连续请求间隔
    if (sessionStats.lastRequestTime && now - sessionStats.lastRequestTime < 10 * 1000) {
      const consecutiveCount = sessionStats.requests
        .slice(-RATE_LIMITS.PER_SESSION.CONSECUTIVE_REQUESTS)
        .filter(r => now - r.timestamp < 30 * 1000).length;
      
      if (consecutiveCount >= RATE_LIMITS.PER_SESSION.CONSECUTIVE_REQUESTS) {
        return { isAllowed: false, reason: '连续请求间隔过短', retryAfter: 10 };
      }
    }

    // 检查快速请求行为
    const rapidRequests = sessionStats.requests.filter(r => now - r.timestamp < 10 * 1000);
    if (rapidRequests.length >= BEHAVIOR_ANALYSIS.SUSPICIOUS_THRESHOLDS.RAPID_REQUESTS) {
      this.markSuspiciousActivity(sessionId, '快速连续请求');
      return { isAllowed: false, reason: '检测到异常快速请求', retryAfter: 30 };
    }

    return { isAllowed: true };
  }

  /**
   * 标记可疑活动
   */
  private markSuspiciousActivity(sessionId: string, reason: string): void {
    const sessionStats = this.getSessionStats(sessionId);
    sessionStats.suspiciousActivityCount++;
    
    console.warn(`🚨 [Security] 检测到可疑活动 - 会话: ${sessionId}, 原因: ${reason}`);
    
    // 如果可疑活动过多，阻止会话
    if (sessionStats.suspiciousActivityCount >= 5) {
      this.blockSession(sessionId, `可疑活动过多: ${reason}`);
    }
  }

  /**
   * 阻止IP地址
   */
  private blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    console.error(`🔒 [Security] 阻止IP地址: ${ip}, 原因: ${reason}`);
  }

  /**
   * 阻止会话
   */
  private blockSession(sessionId: string, reason: string): void {
    this.blockedSessions.add(sessionId);
    const sessionStats = this.getSessionStats(sessionId);
    sessionStats.isBlocked = true;
    sessionStats.blockReason = reason;
    console.error(`🔒 [Security] 阻止会话: ${sessionId}, 原因: ${reason}`);
  }

  /**
   * 创建消息哈希（支持中文字符）
   */
  private createMessageHash(message: string): string {
    try {
      // 使用 TextEncoder 处理 UTF-8 编码，然后转换为 base64
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString).slice(0, 32);
    } catch (error) {
      // 如果仍然失败，使用简单的哈希算法
      let hash = 0;
      for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36).slice(0, 32);
    }
  }

  /**
   * 清理过期数据
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24小时

    // 清理过期的访问记录
    for (const [ip, records] of this.accessRecords.entries()) {
      const validRecords = records.filter(r => now - r.timestamp < CLEANUP_THRESHOLD);
      if (validRecords.length === 0) {
        this.accessRecords.delete(ip);
      } else {
        this.accessRecords.set(ip, validRecords);
      }
    }

    // 清理过期的会话统计
    for (const [sessionId, stats] of this.sessionStats.entries()) {
      if (now - stats.createdAt > CLEANUP_THRESHOLD) {
        this.sessionStats.delete(sessionId);
        this.blockedSessions.delete(sessionId);
      }
    }

    console.log(`🧹 [Security] 已清理过期安全数据`);
  }

  /**
   * 主要安全检查方法 - 验证消息请求
   */
  public async validateMessageRequest(message: string, files: FileAttachment[] = []): Promise<{
    isAllowed: boolean;
    reason?: string;
    retryAfter?: number;
    requiresCaptcha?: boolean;
  }> {
    const ip = this.getClientIdentifier();
    const sessionId = this.getSessionId();
    const now = Date.now();

    try {
      // 1. 检查IP和会话是否被阻止
      if (this.isIPBlocked(ip)) {
        return { isAllowed: false, reason: 'IP地址已被阻止' };
      }

      if (this.isSessionBlocked(sessionId)) {
        return { isAllowed: false, reason: '会话已被阻止' };
      }

      // 2. 检查速率限制
      const rateLimitResult = this.checkRateLimit(ip, sessionId, files.length > 0 ? 'file_upload' : 'message');
      if (!rateLimitResult.isAllowed) {
        // 记录被阻止的请求
        this.addAccessRecord(ip, sessionId, {
          timestamp: now,
          requestType: files.length > 0 ? 'file_upload' : 'message',
          isBlocked: true,
          reason: rateLimitResult.reason
        });
        
        return {
          isAllowed: false,
          reason: rateLimitResult.reason,
          retryAfter: rateLimitResult.retryAfter
        };
      }

      // 3. 验证消息内容
      const messageValidation = this.validateMessageContent(message);
      if (!messageValidation.isValid) {
        const sessionStats = this.getSessionStats(sessionId);
        sessionStats.failedValidations++;
        
        // 记录验证失败
        this.addAccessRecord(ip, sessionId, {
          timestamp: now,
          requestType: 'message',
          isBlocked: true,
          reason: messageValidation.reason
        });

        // 如果验证失败过多，标记为可疑
        if (sessionStats.failedValidations >= SECURITY_CONFIG.BEHAVIOR_ANALYSIS.SUSPICIOUS_THRESHOLDS.FAILED_VALIDATIONS) {
          this.markSuspiciousActivity(sessionId, '多次内容验证失败');
        }

        return {
          isAllowed: false,
          reason: messageValidation.reason,
          requiresCaptcha: sessionStats.failedValidations >= 5
        };
      }

      // 4. 验证文件上传（如果有）
      if (files.length > 0) {
        const fileValidation = this.validateFileUpload(files);
        if (!fileValidation.isValid) {
          this.addAccessRecord(ip, sessionId, {
            timestamp: now,
            requestType: 'file_upload',
            isBlocked: true,
            reason: fileValidation.reason
          });

          return {
            isAllowed: false,
            reason: fileValidation.reason
          };
        }
      }

      // 5. 检查重复请求
      const messageHash = this.createMessageHash(message);
      const sessionStats = this.getSessionStats(sessionId);
      const recentSimilarRequests = sessionStats.requests
        .filter(r => r.contentHash === messageHash && now - r.timestamp < 60 * 1000)
        .length;

      if (recentSimilarRequests >= SECURITY_CONFIG.BEHAVIOR_ANALYSIS.SUSPICIOUS_THRESHOLDS.REPEATED_IDENTICAL_REQUESTS) {
        this.markSuspiciousActivity(sessionId, '重复相同请求');
        return {
          isAllowed: false,
          reason: '检测到重复请求',
          requiresCaptcha: true
        };
      }

      // 6. 通过所有检查，记录有效请求
      this.addAccessRecord(ip, sessionId, {
        timestamp: now,
        requestType: files.length > 0 ? 'file_upload' : 'message',
        contentHash: messageHash,
        isBlocked: false
      });

      return { isAllowed: true };

    } catch (error) {
      console.error('❌ [Security] 安全验证出错:', error);
      // 出错时采用保守策略，暂时允许但记录
      return { isAllowed: true };
    }
  }

  /**
   * 获取安全统计信息（用于监控）
   */
  public getSecurityStats(): {
    totalRequests: number;
    blockedRequests: number;
    blockedIPs: number;
    blockedSessions: number;
    activeSessions: number;
  } {
    const totalRequests = Array.from(this.accessRecords.values())
      .reduce((sum, records) => sum + records.length, 0);
    
    const blockedRequests = Array.from(this.accessRecords.values())
      .reduce((sum, records) => sum + records.filter(r => r.isBlocked).length, 0);

    return {
      totalRequests,
      blockedRequests,
      blockedIPs: this.blockedIPs.size,
      blockedSessions: this.blockedSessions.size,
      activeSessions: this.sessionStats.size
    };
  }

  /**
   * 重置会话（用于解除限制）
   */
  public resetSession(): void {
    const sessionId = this.getSessionId();
    this.sessionStats.delete(sessionId);
    this.blockedSessions.delete(sessionId);
    sessionStorage.removeItem('auto_chart_session_id');
    console.log('🔄 [Security] 会话已重置');
  }
}

// 导出单例实例
export const securityManager = SecurityManager.getInstance();

// 导出便捷的验证函数
export async function validateMessageRequest(message: string, files: FileAttachment[] = []) {
  return securityManager.validateMessageRequest(message, files);
}

/**
 * React Hook 用于安全验证
 */
export function useSecurityValidation() {
  return {
    validateRequest: validateMessageRequest,
    getSecurityStats: () => securityManager.getSecurityStats(),
    resetSession: () => securityManager.resetSession()
  };
}