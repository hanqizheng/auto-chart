/**
 * 会话存储管理服务
 * 处理 localStorage 和 IndexedDB 的混合存储
 * 支持会话数据、文件和图片的持久化
 */

import { 
  SerializableChatSession, 
  SingleChatSession, 
  SessionStorageService 
} from "@/types";
import { serializeSession, deserializeSession } from "./session-serializer";

/**
 * IndexedDB 数据库配置
 */
const DB_NAME = "AutoChartSessions";
const DB_VERSION = 1;
const SESSIONS_STORE = "sessions";
const FILES_STORE = "files";
const CHARTS_STORE = "charts";

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  SESSION_LIST: "auto_chart_sessions",
  SESSION_PREFIX: "auto_chart_session_",
  SETTINGS: "auto_chart_storage_settings",
} as const;

/**
 * 存储配置
 */
interface StorageSettings {
  maxSessions: number;
  maxAge: number; // 天数
  autoCleanup: boolean;
  lastCleanup: number;
}

const DEFAULT_SETTINGS: StorageSettings = {
  maxSessions: 50,
  maxAge: 30,
  autoCleanup: true,
  lastCleanup: Date.now(),
};

/**
 * IndexedDB 数据库管理类
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.initPromise = Promise.reject(new Error("IndexedDB not available in this environment"));
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ [Storage] IndexedDB 打开失败:", request.error);
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ [Storage] IndexedDB 初始化成功");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建存储对象
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE, { keyPath: "key" });
        }
        
        if (!db.objectStoreNames.contains(CHARTS_STORE)) {
          db.createObjectStore(CHARTS_STORE, { keyPath: "key" });
        }

        console.log("📦 [Storage] IndexedDB 数据库结构创建完成");
      };
    });

    return this.initPromise;
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("IndexedDB not initialized");
    }
    return this.db;
  }

  /**
   * 存储数据到指定的存储对象
   */
  async store(storeName: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从指定的存储对象获取数据
   */
  async get(storeName: string, key: string): Promise<any> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从指定的存储对象删除数据
   */
  async delete(storeName: string, key: string): Promise<boolean> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error(`❌ [Storage] 删除数据失败 ${storeName}/${key}:`, request.error);
        resolve(false);
      };
    });
  }

  /**
   * 获取存储对象中所有的键
   */
  async getAllKeys(storeName: string): Promise<string[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    sessionsCount: number;
    filesCount: number;
    chartsCount: number;
    totalSize: number;
  }> {
    try {
      const [sessionKeys, fileKeys, chartKeys] = await Promise.all([
        this.getAllKeys(SESSIONS_STORE),
        this.getAllKeys(FILES_STORE),
        this.getAllKeys(CHARTS_STORE),
      ]);

      // 估算存储大小（实际大小需要遍历所有数据）
      const estimatedSize = (sessionKeys.length * 1024) + // 每个会话约1KB
                           (fileKeys.length * 512 * 1024) + // 每个文件约512KB
                           (chartKeys.length * 100 * 1024);  // 每个图表约100KB

      return {
        sessionsCount: sessionKeys.length,
        filesCount: fileKeys.length,
        chartsCount: chartKeys.length,
        totalSize: estimatedSize,
      };
    } catch (error) {
      console.error("❌ [Storage] 获取存储统计失败:", error);
      return { sessionsCount: 0, filesCount: 0, chartsCount: 0, totalSize: 0 };
    }
  }
}

/**
 * 会话存储服务实现
 */
class SessionStorageServiceImpl implements SessionStorageService {
  private indexedDB: IndexedDBManager;
  private settings: StorageSettings;

  constructor() {
    this.indexedDB = new IndexedDBManager();
    this.settings = this.loadSettings();
    
    // 只在浏览器环境中异步初始化
    if (typeof window !== 'undefined') {
      this.init().catch(error => {
        console.error("❌ [Storage] 服务初始化失败:", error);
      });
    }
  }

  private async init(): Promise<void> {
    await this.indexedDB.init();
    
    // 自动清理过期会话
    if (this.settings.autoCleanup) {
      const now = Date.now();
      const daysSinceLastCleanup = (now - this.settings.lastCleanup) / (24 * 60 * 60 * 1000);
      
      if (daysSinceLastCleanup >= 1) {
        console.log("🧹 [Storage] 执行自动清理过期会话");
        const cleaned = await this.clearExpiredSessions(this.settings.maxAge);
        console.log(`🧹 [Storage] 清理完成，删除了 ${cleaned} 个过期会话`);
        
        this.settings.lastCleanup = now;
        this.saveSettings();
      }
    }
  }

  /**
   * 加载存储设置
   */
  private loadSettings(): StorageSettings {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.warn("⚠️ [Storage] 加载设置失败，使用默认设置:", error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * 保存存储设置
   */
  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error("❌ [Storage] 保存设置失败:", error);
    }
  }

  /**
   * 获取会话列表
   */
  private getSessionList(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      console.error("❌ [Storage] 获取会话列表失败:", error);
      return [];
    }
  }

  /**
   * 更新会话列表
   */
  private updateSessionList(sessionId: string, action: 'add' | 'remove'): void {
    try {
      const sessionList = this.getSessionList();
      
      if (action === 'add' && !sessionList.includes(sessionId)) {
        sessionList.unshift(sessionId); // 新会话添加到开头
        
        // 限制会话数量
        if (sessionList.length > this.settings.maxSessions) {
          const removed = sessionList.splice(this.settings.maxSessions);
          // 异步删除超出限制的会话
          removed.forEach(id => {
            this.deleteSession(id).catch(err => 
              console.error(`❌ [Storage] 删除超限会话失败 ${id}:`, err)
            );
          });
        }
      } else if (action === 'remove') {
        const index = sessionList.indexOf(sessionId);
        if (index > -1) {
          sessionList.splice(index, 1);
        }
      }
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(sessionList));
      }
    } catch (error) {
      console.error("❌ [Storage] 更新会话列表失败:", error);
    }
  }

  // 实现 SessionStorageService 接口

  async saveSession(sessionId: string, sessionData: SingleChatSession): Promise<void> {
    console.log(`💾 [Storage] 保存会话 ${sessionId}`);
    
    try {
      // 序列化会话数据
      const serialized = await serializeSession(sessionData);
      
      // 保存到 localStorage（轻量数据）
      const lightData = {
        id: serialized.id,
        title: serialized.title,
        createdAt: serialized.createdAt,
        lastActivity: serialized.lastActivity,
        version: serialized.version,
        source: serialized.source,
        messageCount: serialized.messages.length,
        hasFiles: (serialized._storage?.totalFiles || 0) > 0,
        hasCharts: (serialized._storage?.totalCharts || 0) > 0,
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_KEYS.SESSION_PREFIX}${sessionId}`, JSON.stringify(lightData));
      }
      
      // 保存完整数据到 IndexedDB
      await this.indexedDB.store(SESSIONS_STORE, serialized);
      
      // 保存相关的大文件到 IndexedDB
      if (serialized._storage?.indexeddbKeys) {
        for (const key of serialized._storage.indexeddbKeys) {
          console.log(`💾 [Storage] 需要保存大文件/图片: ${key}`);
          // TODO: 从当前的 File 对象或 Blob URL 中获取实际数据并保存
        }
      }
      
      // 更新会话列表
      this.updateSessionList(sessionId, 'add');
      
      console.log(`✅ [Storage] 会话保存成功 ${sessionId}`);
    } catch (error) {
      console.error(`❌ [Storage] 会话保存失败 ${sessionId}:`, error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SingleChatSession | null> {
    console.log(`📖 [Storage] 读取会话 ${sessionId}`);
    
    try {
      // 从 IndexedDB 获取完整数据
      const serializedData = await this.indexedDB.get(SESSIONS_STORE, sessionId);
      if (!serializedData) {
        console.log(`⚠️ [Storage] 会话不存在 ${sessionId}`);
        return null;
      }
      
      // 反序列化
      const session = await deserializeSession(serializedData);
      
      console.log(`✅ [Storage] 会话读取成功 ${sessionId}`);
      return session;
    } catch (error) {
      console.error(`❌ [Storage] 会话读取失败 ${sessionId}:`, error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    console.log(`🗑️ [Storage] 删除会话 ${sessionId}`);
    
    try {
      // 获取会话数据以确定需要删除的关联文件
      const serializedData = await this.indexedDB.get(SESSIONS_STORE, sessionId);
      
      if (serializedData?._storage?.indexeddbKeys) {
        // 删除关联的文件和图片
        for (const key of serializedData._storage.indexeddbKeys) {
          if (key.startsWith('files/')) {
            await this.deleteFile(key);
          } else if (key.startsWith('charts/')) {
            await this.deleteChart(key);
          }
        }
      }
      
      // 删除会话数据
      await this.indexedDB.delete(SESSIONS_STORE, sessionId);
      
      // 删除 localStorage 中的轻量数据
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(`${STORAGE_KEYS.SESSION_PREFIX}${sessionId}`);
      }
      
      // 更新会话列表
      this.updateSessionList(sessionId, 'remove');
      
      console.log(`✅ [Storage] 会话删除成功 ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ [Storage] 会话删除失败 ${sessionId}:`, error);
      return false;
    }
  }

  async listSessions(): Promise<string[]> {
    return this.getSessionList();
  }

  async saveFile(key: string, file: File | Blob): Promise<void> {
    console.log(`💾 [Storage] 保存文件 ${key}`);
    
    try {
      const fileData = {
        key,
        data: file,
        size: file.size,
        type: file.type,
        savedAt: new Date(),
      };
      
      await this.indexedDB.store(FILES_STORE, fileData);
      console.log(`✅ [Storage] 文件保存成功 ${key}`);
    } catch (error) {
      console.error(`❌ [Storage] 文件保存失败 ${key}:`, error);
      throw error;
    }
  }

  async getFile(key: string): Promise<File | Blob | null> {
    try {
      const fileData = await this.indexedDB.get(FILES_STORE, key);
      return fileData?.data || null;
    } catch (error) {
      console.error(`❌ [Storage] 文件读取失败 ${key}:`, error);
      return null;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    return this.indexedDB.delete(FILES_STORE, key);
  }

  async saveChart(key: string, imageBlob: Blob): Promise<void> {
    console.log(`💾 [Storage] 保存图表 ${key}`);
    
    try {
      const chartData = {
        key,
        data: imageBlob,
        size: imageBlob.size,
        type: imageBlob.type,
        savedAt: new Date(),
      };
      
      await this.indexedDB.store(CHARTS_STORE, chartData);
      console.log(`✅ [Storage] 图表保存成功 ${key}`);
    } catch (error) {
      console.error(`❌ [Storage] 图表保存失败 ${key}:`, error);
      throw error;
    }
  }

  async getChart(key: string): Promise<Blob | null> {
    try {
      const chartData = await this.indexedDB.get(CHARTS_STORE, key);
      return chartData?.data || null;
    } catch (error) {
      console.error(`❌ [Storage] 图表读取失败 ${key}:`, error);
      return null;
    }
  }

  async deleteChart(key: string): Promise<boolean> {
    return this.indexedDB.delete(CHARTS_STORE, key);
  }

  async clearExpiredSessions(maxAge: number): Promise<number> {
    console.log(`🧹 [Storage] 清理 ${maxAge} 天前的过期会话`);
    
    let cleanedCount = 0;
    const cutoffTime = Date.now() - (maxAge * 24 * 60 * 60 * 1000);
    
    try {
      const sessionList = this.getSessionList();
      
      for (const sessionId of sessionList) {
        try {
          // 检查轻量数据中的时间戳
          if (typeof window === 'undefined' || !window.localStorage) continue;
          const lightData = localStorage.getItem(`${STORAGE_KEYS.SESSION_PREFIX}${sessionId}`);
          if (lightData) {
            const parsed = JSON.parse(lightData);
            const lastActivity = new Date(parsed.lastActivity).getTime();
            
            if (lastActivity < cutoffTime) {
              await this.deleteSession(sessionId);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ [Storage] 清理会话失败 ${sessionId}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ [Storage] 批量清理失败:", error);
    }
    
    return cleanedCount;
  }

  async getStorageStats(): Promise<{
    sessionsCount: number;
    filesCount: number;
    chartsCount: number;
    totalSize: number;
  }> {
    return this.indexedDB.getStorageStats();
  }
}

// 懒加载单例实例
let _sessionStorageService: SessionStorageServiceImpl | null = null;

/**
 * 获取会话存储服务实例
 * 懒加载，只在浏览器环境中创建
 */
export function getSessionStorageService(): SessionStorageServiceImpl | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!_sessionStorageService) {
    _sessionStorageService = new SessionStorageServiceImpl();
  }
  
  return _sessionStorageService;
}

// 导出工具函数
export { IndexedDBManager };

/**
 * 临时存储键名生成器
 */
export const TEMP_STORAGE_KEYS = {
  PENDING_SESSION: "pending_session",
  DEMO_SESSION: "demo_session",
  HOMEPAGE_SESSION: "homepage_session",
} as const;