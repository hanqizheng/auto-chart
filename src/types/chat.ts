import { AIChatType } from "./agent";

export type ChatPosition = "left" | "right";

export interface ChatMessage {
  id: string;
  type: AIChatType;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  files?: UploadedFile[]; // 消息附件
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: any;
  uploadedAt?: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isCancelling: boolean;
  uploadedFiles: UploadedFile[];
  position: ChatPosition;
}
