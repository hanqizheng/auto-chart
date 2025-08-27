// 数据处理相关类型定义

import {
  UPLOAD_STATUS,
  QUALITY_ISSUE_TYPES,
  SEVERITY_LEVELS,
  DATA_PATTERN_TYPES,
  CLEANING_ACTIONS,
  DATA_ERROR_TYPES,
} from "@/constants/data";

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export type QualityIssueType = (typeof QUALITY_ISSUE_TYPES)[keyof typeof QUALITY_ISSUE_TYPES];

export type SeverityLevel = (typeof SEVERITY_LEVELS)[keyof typeof SEVERITY_LEVELS];

export type DataPatternType = (typeof DATA_PATTERN_TYPES)[keyof typeof DATA_PATTERN_TYPES];

export type CleaningAction = (typeof CLEANING_ACTIONS)[keyof typeof CLEANING_ACTIONS];

export type DataErrorType = (typeof DATA_ERROR_TYPES)[keyof typeof DATA_ERROR_TYPES];
