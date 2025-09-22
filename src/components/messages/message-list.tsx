"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/message";
import { cn } from "@/lib/utils";
import { UserMessage } from "./user-message";
import { ProcessingMessage } from "./processing-message";
import { ImageResultMessage } from "./image-result-message";
import { Button } from "@/components/ui/button";
import { ArrowDown, Trash2 } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  className?: string;
  isLoading?: boolean;
  showScrollToBottom?: boolean;
  showClearButton?: boolean;
  onToggleProcessingExpanded?: (messageId: string) => void;
  onImageClick?: (imageUrl: string, title?: string) => void;
  onConfigureChart?: (message: any) => void;
  onClearMessages?: () => void;
  emptyState?: React.ReactNode;
}

export function MessageList({
  messages,
  className,
  isLoading = false,
  showScrollToBottom = true,
  showClearButton = true,
  onToggleProcessingExpanded,
  onImageClick,
  onConfigureChart,
  onClearMessages,
  emptyState,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleImageClick = (message: Extract<ChatMessage, { type: "chart_result" }>) => {
    onImageClick?.(message.content.imageInfo.localBlobUrl, message.content.title);
  };

  const handleConfigureChart = (message: Extract<ChatMessage, { type: "chart_result" }>) => {
    onConfigureChart?.(message.content);
  };

  // 空状态
  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn("flex h-full", className)}>
        <div className="flex flex-1 items-center justify-center p-8">
          {emptyState || <DefaultEmptyState />}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      {/* 消息列表滚动区域 */}
      <div ref={scrollAreaRef} className="flex-1 space-y-1 overflow-y-auto p-4">
        {/* 渲染消息列表 */}
        {messages.map(message => {
          switch (message.type) {
            case "user":
              return <UserMessage key={message.id} message={message as any} />;

            case "processing":
              return (
                <ProcessingMessage
                  key={message.id}
                  message={message as any}
                  onToggleExpanded={() => onToggleProcessingExpanded?.(message.id)}
                />
              );

            case "chart_result":
              return (
                <ImageResultMessage
                  key={message.id}
                  message={message as any}
                  onImageClick={() => handleImageClick(message as any)}
                  onConfigureChart={() => handleConfigureChart(message as any)}
                />
              );

            default:
              return null;
          }
        })}

        {/* 加载状态 */}
        {isLoading && <LoadingMessage />}

        {/* 底部锚点 */}
        <div ref={bottomRef} />
      </div>

      {/* 浮动操作按钮 */}
      <div className="absolute right-4 bottom-4 flex flex-col space-y-2">
        {/* 滚动到底部按钮 */}
        {showScrollToBottom && messages.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="bg-background/80 h-9 w-9 p-0 shadow-lg backdrop-blur-sm"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}

        {/* 清空消息按钮 */}
        {showClearButton && messages.length > 0 && onClearMessages && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearMessages}
            className="bg-background/80 text-destructive hover:text-destructive h-9 w-9 p-0 shadow-lg backdrop-blur-sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 默认空状态组件
 */
function DefaultEmptyState() {
  return (
    <div className="max-w-md space-y-4 text-center">
      <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
        <svg
          className="text-muted-foreground h-10 w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-muted-foreground text-lg font-semibold">开始对话</h3>
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>发送消息开始创建图表：</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span>描述数据需求</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>上传Excel文件</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-400" />
              <span>指定图表类型</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 加载消息组件
 */
function LoadingMessage() {
  return (
    <div className="mb-6 w-full">
      <div className="bg-muted/30 border-border w-full rounded-lg border p-4">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 animate-pulse rounded-full bg-blue-500" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
