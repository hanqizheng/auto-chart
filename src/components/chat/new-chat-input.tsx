"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/types";
import { Send, Paperclip, X, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Turnstile } from "@marsidev/react-turnstile";
import { SecurityVerificationPayload } from "@/types/security";
import { setClientTurnstileToken } from "@/lib/security-context";

interface NewChatInputProps {
  onSendMessage: (
    message: string,
    files: FileAttachment[],
    security?: SecurityVerificationPayload
  ) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isCancelling?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export function NewChatInput({
  onSendMessage,
  onCancel,
  isLoading = false,
  isCancelling = false,
  disabled = false,
  placeholder = "描述你想要的图表或上传数据文件...",
  maxFiles = 3,
  acceptedFileTypes = [".xlsx", ".xls", ".csv"],
  className,
}: NewChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const turnstileEnabled = useMemo(() => process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === "true", []);
  const hasTurnstile = useMemo(
    () => turnstileEnabled && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    [turnstileEnabled]
  );
  const { toast } = useToast();

  const handleSend = useCallback(() => {
    if (!message.trim() && files.length === 0) return;

    if (hasTurnstile && !turnstileToken) {
      toast({
        title: "请先完成人机验证",
        description: "点击下方验证后再发送消息",
        variant: "destructive",
      });
      return;
    }

    onSendMessage(message.trim(), files, {
      turnstileToken: turnstileToken || undefined,
    });
    setMessage("");
    setFiles([]);
    if (hasTurnstile) {
      setTurnstileToken(null);
      setClientTurnstileToken(null);
      setTurnstileKey(prev => prev + 1);
    }
  }, [
    message,
    files,
    onSendMessage,
    hasTurnstile,
    turnstileToken,
    toast,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposing || e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled) {
        handleSend();
      }
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileAttachment[] = [];

    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];

      // 检查文件类型
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(extension)) {
        toast({
          title: "文件类型不支持",
          description: `请选择 ${acceptedFileTypes.join(", ")} 格式的文件`,
          variant: "destructive",
        });
        continue;
      }

      // 检查文件大小 (10MB限制)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "文件大小不能超过 10MB",
          variant: "destructive",
        });
        continue;
      }

      newFiles.push({
        id: `${Date.now()}_${i}`,
        name: file.name,
        size: file.size,
        type: getFileType(file),
        file: file,
        uploadedAt: new Date(),
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "文件上传成功",
        description: `已添加 ${newFiles.length} 个文件`,
      });
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* 文件上传区域 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div
        className={cn(
          "rounded-lg border transition-colors",
          isDragOver && "border-primary bg-primary/5",
          isLoading && "opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-3">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="max-h-[200px] min-h-[60px] resize-none border-0 p-0 focus-visible:ring-0"
            rows={3}
          />
        </div>

        {/* 输入工具栏 */}
        <div className="flex items-center justify-between p-3 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* 文件上传按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading || files.length >= maxFiles}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* 文件数量提示 */}
            {files.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {files.length}/{maxFiles}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasTurnstile && (
              <div className="min-w-[150px]">
                <Turnstile
                  key={turnstileKey}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={token => {
                    setTurnstileToken(token);
                    setClientTurnstileToken(token);
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                    setClientTurnstileToken(null);
                  }}
                  onError={() => {
                    setTurnstileToken(null);
                    setClientTurnstileToken(null);
                    toast({
                      title: "人机验证失败",
                      description: "请刷新验证组件后再试",
                      variant: "destructive",
                    });
                  }}
                  options={{
                    appearance: "interaction-only",
                  }}
                />
              </div>
            )}
            {/* 取消按钮 */}
            {isLoading && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isCancelling}
                className="h-8"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "取消"}
              </Button>
            )}

            {/* 发送按钮 */}
            <Button
              onClick={handleSend}
              disabled={
                disabled ||
                isLoading ||
                (!message.trim() && files.length === 0) ||
                (hasTurnstile && !turnstileToken)
              }
              size="sm"
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" />
                  发送
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(",")}
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 拖拽提示 */}
      {isDragOver && (
        <div className="bg-primary/10 border-primary pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <FileSpreadsheet className="text-primary mx-auto mb-2 h-8 w-8" />
            <p className="text-primary text-sm font-medium">释放文件以上传</p>
            <p className="text-muted-foreground text-xs">
              支持 {acceptedFileTypes.join(", ")} 格式
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 根据文件确定附件类型
 */
function getFileType(file: File): FileAttachment["type"] {
  const extension = file.name.toLowerCase().split(".").pop();

  switch (extension) {
    case "xlsx":
    case "xls":
      return "excel";
    case "csv":
      return "csv";
    case "json":
      return "json";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "image";
    default:
      return "excel"; // 默认类型
  }
}
