// 邮件解析系统常量定义 - 简化版本

// 沟通阶段状态（对应 stages.json）
export const COMMUNICATION_STAGES = {
  INITIAL_INQUIRY: "initial-inquiry",        // 前置了解
  PROPOSAL_DISCUSSION: "proposal-discussion", // 方案沟通
  PARTNERSHIP_CONFIRMED: "partnership-confirmed", // 确认合作
  AFTER_SERVICE: "after-service",            // 售后服务
} as const;

// 解析状态
export const PARSING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing", 
  SUCCESS: "success",
  FAILED: "failed",
} as const;

// CSV导出列名
export const CSV_COLUMNS = {
  FILENAME: "邮件文件名",
  PROJECT_NAME: "项目名称",
  PARTNER_NAME: "联盟客名称", 
  PARTNER_EMAIL: "联盟客邮箱",
  COMMUNICATION_STAGE: "沟通阶段",
  PARSING_SUCCESS: "是否提取成功",
  PARSING_ERROR_REASON: "提取失败原因",
  EMAIL_SUBJECT: "邮件主题",
  EMAIL_DATE: "邮件日期",
} as const;

// 匹配置信度等级
export const CONFIDENCE_LEVELS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
  VERY_HIGH: 0.95,
} as const;

// 匹配类型
export const MATCH_TYPES = {
  EXACT: "exact",           // 精确匹配
  FUZZY: "fuzzy",          // 模糊匹配
  AI_EXTRACTED: "ai_extracted", // AI提取
} as const;

// 邮件解析基础配置
export const EMAIL_PARSER_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,     // 10MB
  MAX_FILES_COUNT: 50,                  // 最多50个文件
  FUZZY_MATCH_THRESHOLD: 0.6,          // 模糊匹配阈值
  AI_CONFIDENCE_THRESHOLD: 0.5,        // AI置信度阈值
  MAX_CONTENT_LENGTH: 5000,            // 最大内容长度（减少AI token消耗）
} as const;

// 邮件字段提取规则
export const EMAIL_FIELD_PATTERNS = {
  // 项目名称提取模式
  PROJECT_PATTERNS: [
    /\[(.+?)\]/g,                      // [项目名称]
    /关于(.+?)项目/g,                   // 关于XXX项目
    /RE:\s*(.+?)$/g,                   // RE: 项目名
    /FW:\s*(.+?)$/g,                   // FW: 项目名
  ],
  
  // 邮箱提取模式
  EMAIL_PATTERN: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  
  // 姓名提取模式
  NAME_PATTERNS: [
    /Best\s+regards?,?\s*([^<\n]+)/gi,  // Best regards, Name
    /谢谢.?([^<\n]+)/g,                 // 谢谢 Name  
    /此致.?([^<\n]+)/g,                 // 此致 Name
    /Hi\s+([^,\n]+)/gi,                // Hi Name,
    /Dear\s+([^,\n]+)/gi,              // Dear Name,
    /Hello\s+([^,\n]+)/gi,             // Hello Name,
  ],
} as const;

// BlueFocus域名识别（平台方）
export const BLUEFOCUS_DOMAINS = [
  "bluefocus.com",
  "bluefocusmedia.com",
] as const;

// 文件验证
export const FILE_VALIDATION = {
  ALLOWED_EXTENSIONS: ['.eml'],
  MAX_FILENAME_LENGTH: 255,
} as const;