import { AIChatType } from "./agent";

export type ChatPosition = "left" | "right";

export interface ChatMessage {
  id: string;
  type: AIChatType;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: any;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isCancelling: boolean;
  uploadedFiles: UploadedFile[];
  position: ChatPosition;
}
