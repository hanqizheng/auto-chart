/**
 * 存储系统类型定义
 * 用于本地图片存储和未来云存储扩展
 */

import { EXPORT_FORMATS } from "@/constants";
import { UploadStatus } from "./data";
import { ChartType } from "./chart";

/**
 * 本地图片信息
 * 支持本地存储和未来 OSS 迁移
 */
export interface LocalImageInfo {
  filename: string;
  localBlobUrl: string;
  size: number;
  format: ExportFormat;
  dimensions: {
    width: number;
    height: number;
  };
  createdAt: Date;

  // 未来扩展字段
  cloudUrl?: string;
  uploadStatus?: UploadStatus;
  metadata?: ImageMetadata;
}

/**
 * 导出格式类型
 */
export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

// UploadStatus 类型从 data.ts 导入，不在这里重复定义

/**
 * 图片元数据
 */
export interface ImageMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  quality?: number;
  compression?: number;
  dpi?: number;
  chartType?: ChartType; // 图表类型
  dataPoints?: number; // 数据点数量
  exportMethod?: string; // 导出方法
}

/**
 * 存储配置
 */
export interface StorageConfig {
  maxFileSize: number;
  allowedFormats: ExportFormat[];
  autoUpload: boolean;
  compression: {
    enabled: boolean;
    quality: number;
  };
  cdn?: {
    baseUrl: string;
    accessKey: string;
    bucket: string;
  };
}

/**
 * 存储服务接口
 */
export interface StorageService {
  saveImage(blob: Blob, filename: string, metadata?: ImageMetadata): Promise<LocalImageInfo>;
  getImage(filename: string): Promise<LocalImageInfo | null>;
  deleteImage(filename: string): Promise<boolean>;
  listImages(): Promise<LocalImageInfo[]>;

  // 未来云存储方法
  uploadToCloud?(imageInfo: LocalImageInfo): Promise<LocalImageInfo>;
  downloadFromCloud?(cloudUrl: string): Promise<Blob>;
}
