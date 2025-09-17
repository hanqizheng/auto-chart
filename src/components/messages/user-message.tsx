"use client";

import { UserMessage as UserMessageType } from "@/types/message";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Infer MIME type from filename
 */
function getFileTypeFromName(filename: string): string {
  const extension = filename.toLowerCase().split(".").pop();

  switch (extension) {
    case "xlsx":
    case "xls":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "txt":
      return "text/plain";
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

interface UserMessageProps {
  message: UserMessageType;
  className?: string;
  showTimestamp?: boolean;
  onRemoveFile?: (fileIndex: number) => void;
}

export function UserMessage({
  message,
  className,
  showTimestamp = true,
  onRemoveFile,
}: UserMessageProps) {
  const { content: messageContent, timestamp } = message;
  const content = messageContent.text;
  const files =
    messageContent.attachments?.map(attachment => ({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      type: attachment.file?.type || getFileTypeFromName(attachment.name),
    })) || [];

  return (
    <div className={cn("mb-4 flex justify-end", className)}>
      <div className="max-w-[80%] sm:max-w-[70%]">
        {/* 时间戳 */}
        {showTimestamp && (
          <div className="text-muted-foreground mb-1 px-2 text-right text-xs">
            {format(timestamp, "HH:mm", { locale: zhCN })}
          </div>
        )}

        {/* 消息气泡 */}
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          {/* 文字内容 */}
          {content && (
            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</div>
          )}

          {/* 文件附件 */}
          {files && files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.id}-${index}`}
                  className="bg-primary-foreground/20 flex items-center justify-between rounded-lg p-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <File className="text-primary-foreground/80 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{file.name}</div>
                      <div className="text-primary-foreground/60">
                        {formatFileSize(file.size)} • {getFileTypeLabel(file.type)}
                      </div>
                    </div>
                  </div>

                  {onRemoveFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(index)}
                      className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 文件数量徽章 */}
          {files && files.length > 1 && (
            <div className="mt-2 flex justify-end">
              <Badge
                variant="secondary"
                className="bg-primary-foreground/20 text-primary-foreground text-xs"
              >
                {files.length} file{files.length > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get file type label
 */
function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
    "application/vnd.ms-excel": "Excel",
    "text/csv": "CSV",
    "application/json": "JSON",
    "text/plain": "Text",
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "application/pdf": "PDF",
  };

  return typeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "File";
}
