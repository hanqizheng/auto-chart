"use client";

import { LocalImageInfo, StorageService } from "@/types";

/**
 * 本地存储服务
 * 处理图片的本地保存和管理，预留云存储扩展接口
 */
export class LocalStorageService implements StorageService {
  private readonly STORAGE_KEY = "auto_chart_images";
  private readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB 限制

  /**
   * 保存图片到本地
   */
  async saveImage(blob: Blob, filename: string, metadata = {}): Promise<LocalImageInfo> {
    try {
      // 1. 检查存储空间
      await this.checkStorageQuota(blob.size);

      // 2. 生成唯一文件名
      const uniqueFilename = this.generateUniqueFilename(filename);

      // 3. 创建 blob URL
      const blobUrl = URL.createObjectURL(blob);

      // 4. 获取图片尺寸
      const dimensions = await this.getImageDimensions(blob);

      // 5. 创建图片信息对象
      const imageInfo: LocalImageInfo = {
        filename: uniqueFilename,
        localBlobUrl: blobUrl,
        size: blob.size,
        format: this.getFormatFromFilename(uniqueFilename),
        dimensions,
        createdAt: new Date(),
        metadata,
      };

      // 6. 存储到 localStorage 索引
      await this.storeImageIndex(imageInfo);

      // 图片已保存到内存中，可供后续下载使用
      console.log(`✅ [LocalStorage] 图片已保存: ${uniqueFilename}`);
      return imageInfo;
    } catch (error) {
      console.error("❌ [LocalStorage] 保存图片失败:", error);
      throw new Error(`保存图片失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 获取指定图片信息
   */
  async getImage(filename: string): Promise<LocalImageInfo | null> {
    try {
      const images = this.getStoredImages();
      return images.find(img => img.filename === filename) || null;
    } catch (error) {
      console.error("❌ [LocalStorage] 获取图片失败:", error);
      return null;
    }
  }

  /**
   * 删除指定图片
   */
  async deleteImage(filename: string): Promise<boolean> {
    try {
      const images = this.getStoredImages();
      const imageIndex = images.findIndex(img => img.filename === filename);

      if (imageIndex === -1) {
        return false;
      }

      // 清理 blob URL
      const image = images[imageIndex];
      if (image.localBlobUrl) {
        URL.revokeObjectURL(image.localBlobUrl);
      }

      // 从索引中移除
      images.splice(imageIndex, 1);
      this.saveStoredImages(images);

      console.log(`✅ [LocalStorage] 图片已删除: ${filename}`);
      return true;
    } catch (error) {
      console.error("❌ [LocalStorage] 删除图片失败:", error);
      return false;
    }
  }

  /**
   * 列出所有图片
   */
  async listImages(): Promise<LocalImageInfo[]> {
    try {
      return this.getStoredImages();
    } catch (error) {
      console.error("❌ [LocalStorage] 获取图片列表失败:", error);
      return [];
    }
  }

  /**
   * 清理过期的图片记录
   */
  async cleanupExpiredImages(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const images = this.getStoredImages();
      const now = new Date().getTime();
      const expiredImages = images.filter(img => now - img.createdAt.getTime() > maxAge);

      for (const image of expiredImages) {
        await this.deleteImage(image.filename);
      }

      console.log(`✅ [LocalStorage] 清理了 ${expiredImages.length} 个过期图片`);
      return expiredImages.length;
    } catch (error) {
      console.error("❌ [LocalStorage] 清理过期图片失败:", error);
      return 0;
    }
  }

  // ========== 私有方法 ==========

  /**
   * 生成唯一文件名
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalFilename.split(".").pop() || "png";
    const baseName = originalFilename.replace(/\.[^/.]+$/, "");

    return `${baseName}_${timestamp}_${random}.${extension}`;
  }

  /**
   * 从文件名获取格式
   */
  private getFormatFromFilename(filename: string): LocalImageInfo["format"] {
    const extension = filename.toLowerCase().split(".").pop();
    return extension === "png" ? "png" : "png"; // 目前只支持 PNG
  }

  /**
   * 检查存储配额
   */
  private async checkStorageQuota(newFileSize: number): Promise<void> {
    try {
      // 检查浏览器存储配额
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 0) - (estimate.usage || 0);

        if (newFileSize > available) {
          throw new Error("存储空间不足");
        }
      }

      // 检查我们的索引大小
      const currentImages = this.getStoredImages();
      const currentTotalSize = currentImages.reduce((sum, img) => sum + img.size, 0);

      if (currentTotalSize + newFileSize > this.MAX_STORAGE_SIZE) {
        throw new Error("超出应用存储限制");
      }
    } catch (error) {
      console.warn("⚠️ [LocalStorage] 存储配额检查失败:", error);
      // 不阻止保存操作，只是警告
    }
  }

  /**
   * 获取图片尺寸
   */
  private async getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("无法加载图片以获取尺寸"));
      };

      img.src = url;
    });
  }

  /**
   * 存储图片索引到 localStorage
   */
  private async storeImageIndex(imageInfo: LocalImageInfo): Promise<void> {
    try {
      const images = this.getStoredImages();
      images.push(imageInfo);
      this.saveStoredImages(images);
    } catch (error) {
      throw new Error("无法保存图片索引");
    }
  }

  /**
   * 获取存储的图片列表
   */
  private getStoredImages(): LocalImageInfo[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // 转换日期字符串回 Date 对象
      return parsed.map((img: any) => ({
        ...img,
        createdAt: new Date(img.createdAt),
      }));
    } catch (error) {
      console.error("❌ [LocalStorage] 读取图片索引失败:", error);
      return [];
    }
  }

  /**
   * 保存图片列表到 localStorage
   */
  private saveStoredImages(images: LocalImageInfo[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
    } catch (error) {
      throw new Error("无法保存图片索引到本地存储");
    }
  }

  /**
   * 触发浏览器下载
   */
  private async downloadBlob(blob: Blob, filename: string): Promise<void> {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 延迟清理 URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("❌ [LocalStorage] 下载失败:", error);
      throw new Error("无法下载文件");
    }
  }
}
