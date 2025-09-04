// 批量处理和结果持久化工具类

import { promises as fs } from 'fs';
import path from 'path';
import type { 
  BatchProgress, 
  BatchConfig, 
  PersistedBatchResult, 
  EmailParsingResult,
  EmailFile 
} from '@/types/email';
import { EMAIL_PARSER_CONFIG } from '@/constants/email';

/**
 * 批量处理管理器 - 支持分批处理、结果持久化和断点续传
 */
export class BatchProcessor {
  private resultsDir: string;
  private progressFile: string;

  constructor(baseDir?: string) {
    this.resultsDir = baseDir || EMAIL_PARSER_CONFIG.RESULT_STORAGE_PATH;
    this.progressFile = path.join(this.resultsDir, EMAIL_PARSER_CONFIG.PROGRESS_FILE);
  }

  /**
   * 确保结果存储目录存在
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(this.resultsDir);
    } catch {
      await fs.mkdir(this.resultsDir, { recursive: true });
      console.log(`📁 [BatchProcessor] 创建结果存储目录: ${this.resultsDir}`);
    }
  }

  /**
   * 保存批处理进度
   */
  async saveProgress(progress: BatchProgress): Promise<void> {
    await this.ensureStorageDir();
    
    const progressData = {
      ...progress,
      lastUpdateTime: new Date().toISOString()
    };

    await fs.writeFile(
      this.progressFile, 
      JSON.stringify(progressData, null, 2), 
      'utf-8'
    );
    
    console.log(`💾 [BatchProcessor] 保存进度: ${progress.processedFiles}/${progress.totalFiles} 文件已处理`);
  }

  /**
   * 加载批处理进度
   */
  async loadProgress(): Promise<BatchProgress | null> {
    try {
      const progressData = await fs.readFile(this.progressFile, 'utf-8');
      const progress: BatchProgress = JSON.parse(progressData);
      console.log(`📂 [BatchProcessor] 加载进度: ${progress.processedFiles}/${progress.totalFiles} 文件已处理`);
      return progress;
    } catch (error) {
      console.log(`📂 [BatchProcessor] 未找到进度文件，开始新的批处理`);
      return null;
    }
  }

  /**
   * 保存批处理结果
   */
  async saveBatchResult(result: PersistedBatchResult): Promise<string> {
    await this.ensureStorageDir();
    
    const filename = `batch-result-${result.batchId}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    await fs.writeFile(
      filepath, 
      JSON.stringify(result, null, 2), 
      'utf-8'
    );
    
    console.log(`💾 [BatchProcessor] 保存批次结果: ${filename} (${result.results.length} 个结果)`);
    return filepath;
  }

  /**
   * 加载所有批处理结果
   */
  async loadAllBatchResults(): Promise<PersistedBatchResult[]> {
    try {
      await this.ensureStorageDir();
      const files = await fs.readdir(this.resultsDir);
      const resultFiles = files.filter(f => f.startsWith('batch-result-') && f.endsWith('.json'));
      
      const results: PersistedBatchResult[] = [];
      
      for (const file of resultFiles) {
        try {
          const filepath = path.join(this.resultsDir, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const result: PersistedBatchResult = JSON.parse(content);
          results.push(result);
        } catch (error) {
          console.warn(`⚠️ [BatchProcessor] 跳过损坏的结果文件: ${file}`);
        }
      }
      
      // 按时间戳排序
      results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      console.log(`📂 [BatchProcessor] 加载 ${results.length} 个历史批处理结果`);
      return results;
    } catch (error) {
      console.log(`📂 [BatchProcessor] 首次运行，无历史结果`);
      return [];
    }
  }

  /**
   * 合并所有批处理结果
   */
  async getCombinedResults(): Promise<EmailParsingResult[]> {
    const batchResults = await this.loadAllBatchResults();
    const allResults: EmailParsingResult[] = [];
    
    for (const batch of batchResults) {
      allResults.push(...batch.results);
    }
    
    console.log(`🔀 [BatchProcessor] 合并 ${batchResults.length} 个批次，共 ${allResults.length} 个解析结果`);
    return allResults;
  }

  /**
   * 创建批次分组
   */
  createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    console.log(`📦 [BatchProcessor] 创建 ${batches.length} 个批次，每批 ${batchSize} 个项目`);
    return batches;
  }

  /**
   * 初始化批处理进度
   */
  initializeProgress(totalFiles: number, batchSize: number): BatchProgress {
    const totalBatches = Math.ceil(totalFiles / batchSize);
    
    const progress: BatchProgress = {
      totalFiles,
      processedFiles: 0,
      currentBatch: 0,
      totalBatches,
      completedBatches: 0,
      failedFiles: [],
      processedFileNames: [],
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      status: 'idle'
    };
    
    console.log(`🚀 [BatchProcessor] 初始化批处理: ${totalFiles} 个文件，${totalBatches} 个批次`);
    return progress;
  }

  /**
   * 更新批处理进度
   */
  updateProgress(
    progress: BatchProgress,
    processedCount: number,
    failedFiles: string[] = [],
    processedFileNames: string[] = []
  ): BatchProgress {
    const updated: BatchProgress = {
      ...progress,
      processedFiles: progress.processedFiles + processedCount,
      failedFiles: [...progress.failedFiles, ...failedFiles],
      processedFileNames: [...progress.processedFileNames, ...processedFileNames],
      lastUpdateTime: new Date().toISOString()
    };
    
    console.log(`📈 [BatchProcessor] 更新进度: ${updated.processedFiles}/${updated.totalFiles} 文件已处理`);
    return updated;
  }

  /**
   * 生成批次ID
   */
  generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理旧的结果文件（保留最近N个批次）
   */
  async cleanupOldResults(keepCount: number = 10): Promise<void> {
    try {
      const results = await this.loadAllBatchResults();
      
      if (results.length <= keepCount) {
        console.log(`🧹 [BatchProcessor] 结果文件数量在限制内，无需清理`);
        return;
      }
      
      // 删除较旧的结果文件
      const toDelete = results.slice(0, results.length - keepCount);
      
      for (const result of toDelete) {
        const filename = `batch-result-${result.batchId}.json`;
        const filepath = path.join(this.resultsDir, filename);
        
        try {
          await fs.unlink(filepath);
          console.log(`🗑️ [BatchProcessor] 删除旧结果文件: ${filename}`);
        } catch (error) {
          console.warn(`⚠️ [BatchProcessor] 删除文件失败: ${filename}`);
        }
      }
      
      console.log(`🧹 [BatchProcessor] 清理完成，删除 ${toDelete.length} 个旧结果文件`);
    } catch (error) {
      console.warn(`⚠️ [BatchProcessor] 清理过程中出现错误:`, error);
    }
  }

  /**
   * 过滤未处理的文件
   */
  filterUnprocessedFiles(allFiles: EmailFile[], processedFileNames: string[]): EmailFile[] {
    const processedSet = new Set(processedFileNames);
    const unprocessed = allFiles.filter(file => !processedSet.has(file.filename));
    
    console.log(`🔍 [BatchProcessor] 过滤结果: ${unprocessed.length} 个未处理文件，${allFiles.length - unprocessed.length} 个已处理`);
    return unprocessed;
  }
}

/**
 * 延迟函数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};