/**
 * 会话序列化服务
 * 处理 SingleChatSession 与可序列化数据之间的转换
 * 支持文件和图片的结构化存储
 */

import { 
  SingleChatSession, 
  SerializableChatSession,
  FileAttachment, 
  SerializableFileAttachment,
  ChatMessage,
  SerializableChatMessage,
  UserMessage,
 
} from "@/types";
import { MESSAGE_TYPES } from "@/constants/message";

/**
 * 文件大小限制（字节）
 */
const MAX_BASE64_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * 将 File 对象转换为 Base64 字符串
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 将 Base64 字符串转换为 File 对象
 */
export function base64ToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * 将 FileAttachment 转换为可序列化格式
 */
export async function serializeFileAttachment(
  attachment: FileAttachment,
  generateStorageKey: (id: string) => string
): Promise<SerializableFileAttachment> {
  const baseAttachment: SerializableFileAttachment = {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    uploadedAt: attachment.uploadedAt,
    storageType: 'base64', // 默认值，后面可能会修改
  };

  try {
    // 小文件直接转换为Base64
    if (attachment.size <= MAX_BASE64_FILE_SIZE) {
      console.log(`📦 [Serializer] 小文件 ${attachment.name} 使用Base64存储`);
      baseAttachment.dataUrl = await fileToBase64(attachment.file);
      baseAttachment.storageType = 'base64';
    } else {
      // 大文件使用IndexedDB存储
      console.log(`📦 [Serializer] 大文件 ${attachment.name} 使用IndexedDB存储`);
      baseAttachment.storageKey = generateStorageKey(attachment.id);
      baseAttachment.storageType = 'indexeddb';
    }

    // 如果文件包含额外的元数据，也保存
    if (attachment.file instanceof File && attachment.file.lastModified) {
      baseAttachment.metadata = {
        lastModified: attachment.file.lastModified,
        webkitRelativePath: (attachment.file as any).webkitRelativePath || '',
      };
    }

    return baseAttachment;
  } catch (error) {
    console.error(`❌ [Serializer] 文件序列化失败 ${attachment.name}:`, error);
    // 失败时返回基础信息
    return {
      ...baseAttachment,
      storageType: 'indexeddb', // 标记为需要IndexedDB，让存储服务处理
      storageKey: generateStorageKey(attachment.id),
    };
  }
}

/**
 * 将可序列化的文件附件恢复为 FileAttachment
 */
export function deserializeFileAttachment(
  serializableAttachment: SerializableFileAttachment
): FileAttachment | null {
  try {
    let file: File;

    if (serializableAttachment.storageType === 'base64' && serializableAttachment.dataUrl) {
      // 从Base64恢复文件
      file = base64ToFile(serializableAttachment.dataUrl, serializableAttachment.name);
      console.log(`📦 [Serializer] 从Base64恢复文件 ${serializableAttachment.name}`);
    } else {
      // 大文件或其他存储类型暂时创建占位符文件
      // 实际的文件内容需要从IndexedDB或其他存储中异步获取
      const placeholder = new Uint8Array(0);
      file = new File([placeholder], serializableAttachment.name, {
        type: getFileTypeFromAttachmentType(serializableAttachment.type),
      });
      console.log(`📦 [Serializer] 创建占位符文件 ${serializableAttachment.name}，需异步加载实际内容`);
    }

    return {
      id: serializableAttachment.id,
      name: serializableAttachment.name,
      type: serializableAttachment.type,
      size: serializableAttachment.size,
      file: file,
      uploadedAt: serializableAttachment.uploadedAt,
    };
  } catch (error) {
    console.error(`❌ [Serializer] 文件反序列化失败 ${serializableAttachment.name}:`, error);
    return null;
  }
}

/**
 * 根据附件类型获取MIME类型
 */
function getFileTypeFromAttachmentType(type: string): string {
  const typeMap: Record<string, string> = {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    json: 'application/json',
    image: 'image/png',
  };
  return typeMap[type] || 'application/octet-stream';
}

/**
 * 将消息转换为可序列化格式
 */
export async function serializeChatMessage(
  message: ChatMessage,
  generateStorageKey: (id: string) => string
): Promise<SerializableChatMessage> {
  if (message.type === MESSAGE_TYPES.USER) {
    const userMessage = message as UserMessage;
    const serializedAttachments: SerializableFileAttachment[] = [];

    // 处理附件
    if (userMessage.content.attachments) {
      for (const attachment of userMessage.content.attachments) {
        const serialized = await serializeFileAttachment(attachment, generateStorageKey);
        serializedAttachments.push(serialized);
      }
    }

    return {
      ...userMessage,
      content: {
        ...userMessage.content,
        attachments: serializedAttachments.length > 0 ? serializedAttachments : undefined,
      },
    } as SerializableChatMessage;
  }

  // 处理消息和图表结果消息不需要特殊序列化
  return message as SerializableChatMessage;
}

/**
 * 将可序列化的消息恢复为普通消息
 */
export function deserializeChatMessage(serializableMessage: SerializableChatMessage): ChatMessage | null {
  try {
    if (serializableMessage.type === MESSAGE_TYPES.USER) {
      const userMsg = serializableMessage as any;
      const restoredAttachments: FileAttachment[] = [];

      // 恢复附件
      if (userMsg.content.attachments) {
        for (const serializableAttachment of userMsg.content.attachments) {
          const restored = deserializeFileAttachment(serializableAttachment);
          if (restored) {
            restoredAttachments.push(restored);
          }
        }
      }

      return {
        ...userMsg,
        content: {
          ...userMsg.content,
          attachments: restoredAttachments.length > 0 ? restoredAttachments : undefined,
        },
      } as UserMessage;
    }

    // 其他类型消息直接返回
    return serializableMessage as ChatMessage;
  } catch (error) {
    console.error(`❌ [Serializer] 消息反序列化失败:`, error);
    return null;
  }
}

/**
 * 序列化完整的会话
 */
export async function serializeSession(
  session: SingleChatSession,
  generateStorageKey: (id: string) => string = (id) => `files/${id}`
): Promise<SerializableChatSession> {
  console.log(`📦 [Serializer] 开始序列化会话 ${session.id}`);

  const serializedMessages: SerializableChatMessage[] = [];
  const indexeddbKeys: string[] = [];
  let totalFiles = 0;
  let totalCharts = session.currentChart ? 1 : 0;

  // 序列化所有消息
  for (const message of session.messages) {
    const serialized = await serializeChatMessage(message, generateStorageKey);
    
    // 收集IndexedDB存储键
    if (serialized.type === MESSAGE_TYPES.USER) {
      const userMsg = serialized as any;
      if (userMsg.content.attachments) {
        for (const attachment of userMsg.content.attachments) {
          totalFiles++;
          if (attachment.storageType === 'indexeddb' && attachment.storageKey) {
            indexeddbKeys.push(attachment.storageKey);
          }
        }
      }
    }
    
    // 收集图表存储键
    if (serialized.type === MESSAGE_TYPES.CHART_RESULT) {
      const chartMsg = serialized as any;
      if (chartMsg.content.imageInfo?.storageKey) {
        indexeddbKeys.push(chartMsg.content.imageInfo.storageKey);
      }
    }

    serializedMessages.push(serialized);
  }

  // 处理当前图表的存储键
  if (session.currentChart?.imageInfo?.storageKey) {
    indexeddbKeys.push(session.currentChart.imageInfo.storageKey);
  }

  const serializedSession: SerializableChatSession = {
    ...session,
    messages: serializedMessages,
    _storage: {
      totalFiles,
      totalCharts,
      storageTypes: ['base64', 'indexeddb'],
      indexeddbKeys: [...new Set(indexeddbKeys)], // 去重
    },
  };

  console.log(`✅ [Serializer] 会话序列化完成:`, {
    sessionId: session.id,
    messagesCount: serializedMessages.length,
    totalFiles,
    totalCharts,
    indexeddbKeysCount: indexeddbKeys.length,
  });

  return serializedSession;
}

/**
 * 反序列化完整的会话
 */
export async function deserializeSession(
  serializableSession: SerializableChatSession
): Promise<SingleChatSession> {
  console.log(`📦 [Serializer] 开始反序列化会话 ${serializableSession.id}`);

  const restoredMessages: ChatMessage[] = [];

  // 反序列化所有消息
  for (const serializableMessage of serializableSession.messages) {
    const restored = deserializeChatMessage(serializableMessage);
    if (restored) {
      restoredMessages.push(restored);
    }
  }

  const restoredSession: SingleChatSession = {
    id: serializableSession.id,
    title: serializableSession.title,
    messages: restoredMessages,
    currentChart: serializableSession.currentChart,
    createdAt: new Date(serializableSession.createdAt),
    lastActivity: new Date(serializableSession.lastActivity),
    version: serializableSession.version,
    source: serializableSession.source,
    _autoTrigger: serializableSession._autoTrigger,
    _demoReplay: serializableSession._demoReplay,
    _storage: serializableSession._storage,
    _pendingProcessing: serializableSession._pendingProcessing,
    _security: serializableSession._security,
  };

  console.log(`✅ [Serializer] 会话反序列化完成:`, {
    sessionId: serializableSession.id,
    messagesCount: restoredMessages.length,
    hasStorage: !!serializableSession._storage,
  });

  return restoredSession;
}

/**
 * 生成会话导出数据
 */
export async function exportSessionData(
  session: SingleChatSession,
  options: {
    includeFiles?: boolean;
    includeCharts?: boolean;
    format?: 'json' | 'compressed';
  } = {}
): Promise<{
  sessionData: SerializableChatSession;
  additionalFiles?: Record<string, Blob>;
  exportSize: number;
}> {
  const { includeFiles = true, includeCharts = true, format = 'json' } = options;

  console.log(`📤 [Serializer] 开始导出会话数据:`, {
    sessionId: session.id,
    includeFiles,
    includeCharts,
    format,
  });

  // 序列化会话
  const serializedSession = await serializeSession(session);
  
  // TODO: 如果需要包含大文件，从IndexedDB获取并打包
  // const additionalFiles: Record<string, Blob> = {};
  // if (includeFiles && serializedSession._storage?.indexeddbKeys) {
  //   // 从IndexedDB获取文件内容
  // }

  const exportData = JSON.stringify(serializedSession, null, 2);
  const exportSize = new Blob([exportData]).size;

  console.log(`✅ [Serializer] 会话导出完成:`, {
    sessionId: session.id,
    exportSize: `${(exportSize / 1024).toFixed(2)} KB`,
  });

  return {
    sessionData: serializedSession,
    exportSize,
  };
}
