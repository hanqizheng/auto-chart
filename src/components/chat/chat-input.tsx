"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, Square, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { UploadedFile } from "@/types/chat";
import { useMobile } from "@/hooks/use-mobile";

interface ChatInputProps {
  onSendMessage: (message: string, files: UploadedFile[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isCancelling?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onCancel,
  isLoading = false,
  isCancelling = false,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();
  const t = useTranslations();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if ((!message.trim() && uploadedFiles.length === 0) || isLoading || disabled) {
        return;
      }

      onSendMessage(message.trim(), uploadedFiles);
      setMessage("");
      setUploadedFiles([]);
    },
    [message, uploadedFiles, onSendMessage, isLoading, disabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  const handleCancel = useCallback(() => {
    if (onCancel && !isCancelling) {
      onCancel();
    }
  }, [onCancel, isCancelling]);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const newFiles: UploadedFile[] = [];
      const acceptedTypes = [".xlsx", ".xls", ".csv"];
      const maxFiles = 5;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
          console.warn(`Unsupported file type: ${file.name}`);
          continue;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File too large: ${file.name}`);
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: file,
        };

        newFiles.push(uploadedFile);
      }

      const updatedFiles = [...uploadedFiles, ...newFiles].slice(0, maxFiles);
      setUploadedFiles(updatedFiles);
    },
    [uploadedFiles]
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback(
    (fileId: string) => {
      const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
      setUploadedFiles(updatedFiles);
    },
    [uploadedFiles]
  );

  const canSend = (message.trim() || uploadedFiles.length > 0) && !isLoading && !disabled;
  const showCancelButton = isLoading && onCancel;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`bg-background border-t ${isMobile ? "p-3" : "p-4"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={e => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("chat.attachedFiles")}</p>
            {uploadedFiles.map(file => (
              <Card key={file.id} className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 flex-shrink-0 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={`flex items-center space-x-2 ${isMobile ? "pb-safe" : ""}`}>
          {/* File Upload Button */}
          <Button
            type="button"
            variant="outline"
            size={isMobile ? "sm" : "icon"}
            onClick={triggerFileSelect}
            className={`flex-shrink-0 ${isMobile ? "h-10 w-10 p-0" : ""}`}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Text Input */}
          <div className="relative flex-1">
            <Textarea
              name="message"
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.inputPlaceholder")}
              disabled={disabled}
              className={`resize-none pr-12 ${isMobile ? "min-h-[40px] text-base" : "min-h-[44px]"}`}
              rows={1}
              style={{
                paddingTop: isMobile ? "8px" : "10px",
                paddingBottom: isMobile ? "8px" : "10px",
                lineHeight: "1.4",
              }}
            />

            {/* Send/Cancel Button */}
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              {showCancelButton ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className={`p-0 ${isMobile ? "h-7 w-7" : "h-8 w-8"}`}
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSend}
                  className={`p-0 ${isMobile ? "h-7 w-7" : "h-8 w-8"}`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Text */}
        {isLoading && (
          <p className="text-muted-foreground text-sm">
            {isCancelling ? t("common.cancel") + "..." : t("chat.aiThinking")}
          </p>
        )}
      </form>
    </div>
  );
}
