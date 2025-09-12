"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChartResultContent, ChatMessage, SingleChatSession, ProcessingStep } from "@/types";
import { NewChatInput } from "@/components/chat/new-chat-input";
import { MessageList } from "@/components/messages/message-list";
import { useChatSession } from "@/hooks/use-chat-session";
import { AutoChartService } from "@/services/auto-chart-service";
import { PROCESSING_STEPS } from "@/constants/processing";
import { ProcessingFlow } from "@/types";
import { useSecurityValidation } from "@/lib/security";
import { useToast } from "@/components/ui/use-toast";
import { autoTriggerHandler } from "@/lib/auto-trigger-handler";
import { globalChartManager } from "@/lib/global-chart-manager";

interface CenteredChatPanelProps {
  onChartGenerated: (chart: ChartResultContent) => void;
  isChartVisible: boolean;
  onProcessingUpdate?: (messageId: string, flow: ProcessingFlow) => void;
}

/**
 * 居中聊天面板组件
 * 占据全屏或一半屏幕，聊天内容垂直排列
 */
export function CenteredChatPanel({
  onChartGenerated,
  isChartVisible,
  onProcessingUpdate,
}: CenteredChatPanelProps) {
  const {
    session,
    isLoading,
    addUserMessage,
    addProcessingMessage,
    addChartResultMessage,
    updateChartResultMessage,
    updateProcessingMessage,
    toggleProcessingExpanded,
    clearMessages,
    setLoadingState,
    loadSessionFromData,
    handleAutoTrigger,
    startDemoReplay,
    generateAndUpdateTitle,
  } = useChatSession();

  // 创建 AutoChartService 实例
  const [autoChartService] = useState(() => new AutoChartService());
  
  // 安全验证hook
  const { validateRequest, resetSession } = useSecurityValidation();
  const { toast } = useToast();
  
  // 标记是否已经处理过首页输入，避免重复处理
  const hasProcessedHomepageInput = useRef(false);
  // 存储loadSessionFromData函数的引用
  const loadSessionRef = useRef(loadSessionFromData);
  loadSessionRef.current = loadSessionFromData;

  // 设置全局图表更新处理器
  useEffect(() => {
    globalChartManager.setUpdateHandler(updateChartResultMessage);
    
    return () => {
      globalChartManager.clearHandlers();
    };
  }, [updateChartResultMessage]);

  // 检查并处理自动触发的会话（首页跳转、Demo等）
  useEffect(() => {
    if (hasProcessedHomepageInput.current) return;
    
    const processAutoTrigger = async () => {
      try {
        console.log("🔍 [CenteredChatPanel] 检查自动触发会话");
        
        // 立即设置标志防止重复执行
        hasProcessedHomepageInput.current = true;
        
        const result = await handleAutoTrigger();
        
        if (result.sessionRestored) {
          console.log("✅ [CenteredChatPanel] 会话恢复成功");
          
          // 检查是否有图表结果需要显示
          if (result.chartResult) {
            console.log("📊 [CenteredChatPanel] 自动触发生成了图表，触发显示:", result.chartResult.title);
            onChartGenerated(result.chartResult);
          }
          
          // 如果有Demo重放配置，开始重放
          if (session._demoReplay?.enabled) {
            console.log("🎬 [CenteredChatPanel] 开始Demo重放");
            setTimeout(() => {
              startDemoReplay();
            }, 1000); // 1秒延迟开始重放
          }
          
          // 如果没有标题，生成标题
          if (!session.title && session.messages.length > 0) {
            setTimeout(() => {
              generateAndUpdateTitle();
            }, 2000);
          }
        } else if (result.error) {
          console.error("❌ [CenteredChatPanel] 自动触发失败:", result.error);
          toast({
            title: "⚠️ 会话恢复失败",
            description: "无法恢复之前的会话，将创建新会话",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ [CenteredChatPanel] 自动触发处理失败:", error);
      }
    };
    
    processAutoTrigger();
  }, []); // 移除会在自动触发过程中变化的依赖，只在组件挂载时执行一次

  /**
   * 处理用户消息提交
   */
  const handleMessageSubmit = async (text: string, files?: File[]) => {
    try {
      setLoadingState(true);

      // 0. 安全验证 - 将文件转换为FileAttachment格式进行验证
      const fileAttachments = files?.map(file => ({
        id: `${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: getFileAttachmentType(file),
        file: file,
        uploadedAt: new Date(),
      })) || [];

      console.log("🔐 [Security] 开始安全验证:", { 
        messageLength: text.length, 
        fileCount: fileAttachments.length 
      });

      const securityResult = await validateRequest(text, fileAttachments);
      
      if (!securityResult.isAllowed) {
        setLoadingState(false);
        
        // 显示安全限制提示
        let toastMessage = securityResult.reason || '请求被安全系统阻止';
        let toastDescription = '';
        
        if (securityResult.retryAfter) {
          const minutes = Math.ceil(securityResult.retryAfter / 60);
          toastDescription = `请等待 ${minutes} 分钟后重试`;
        }
        
        if (securityResult.requiresCaptcha) {
          toastDescription = '检测到异常活动，建议稍后再试或联系支持';
        }

        toast({
          title: "🔒 安全限制",
          description: `${toastMessage}${toastDescription ? '\n' + toastDescription : ''}`,
          variant: "destructive",
          duration: 5000,
        });

        console.warn("🚨 [Security] 请求被阻止:", securityResult);
        return;
      }

      console.log("✅ [Security] 安全验证通过");

      // 1. 添加用户消息
      const userMessageId = addUserMessage(text, files);

      // 2. 开始处理流程
      const processingMessageId = addProcessingMessage("正在分析您的请求...");

      // 3. 使用 AutoChartService 处理输入
      console.log("🚀 [CenteredChatPanel] 调用 AutoChartService 处理请求:", {
        text,
        fileCount: files?.length || 0,
      });

      // 创建处理步骤更新回调
      const onStepUpdate = (flow: ProcessingFlow) => {
        updateProcessingMessage(processingMessageId, {
          title: flow.isCompleted ? "处理完成" : "正在处理...",
          flow: flow,
        });
        // 如果有外部更新回调，也调用它
        onProcessingUpdate?.(processingMessageId, flow);
      };

      const { processingFlow, chartResult } = await autoChartService.processUserInput(
        text,
        files,
        onStepUpdate
      );

      // 4. 更新处理消息以显示详细步骤
      updateProcessingMessage(processingMessageId, {
        title: "处理完成",
        flow: processingFlow,
      });

      // 5. 添加图表结果消息
      addChartResultMessage(chartResult);

      // 6. 触发图表显示
      onChartGenerated(chartResult);

      console.log("✅ [CenteredChatPanel] 图表生成完成:", {
        chartType: chartResult.chartType,
        title: chartResult.title,
      });
    } catch (error) {
      console.error("❌ [CenteredChatPanel] 处理消息失败:", error);

      // 添加错误处理消息
      addProcessingMessage("处理失败，请重试");

      // TODO: 添加更详细的错误处理UI
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={session.messages}
          isLoading={isLoading}
          onClearMessages={clearMessages}
          onToggleProcessingExpanded={toggleProcessingExpanded}
          className={cn(
            "h-full",
            // 增大间距，提供更好的阅读体验
            isChartVisible ? "px-6 md:px-8 lg:px-12" : "px-8 md:px-12 lg:px-16 xl:px-24"
          )}
          emptyState={<CenteredEmptyState />}
        />
      </div>

      {/* 输入区域 */}
      <div
        className={cn(
          "bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t backdrop-blur",
          // 根据图表显示状态调整内边距，保持与消息列表一致
          isChartVisible ? "px-6 py-4 md:px-8 lg:px-12" : "px-8 py-6 md:px-12 lg:px-16 xl:px-24"
        )}
      >
        <div className="mx-auto max-w-4xl">
          <NewChatInput
            onSendMessage={(message, files) =>
              handleMessageSubmit(
                message,
                files.map(f => f.file)
              )
            }
            isLoading={isLoading}
            disabled={isLoading}
            placeholder={
              session.messages.length === 0
                ? "描述您想要的图表，或上传数据文件..."
                : "继续对话或上传新的数据..."
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 居中的空状态组件
 */
function CenteredEmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        {/* 图标 */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <svg
            className="text-muted-foreground h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-3">
          <h3 className="text-foreground text-xl font-semibold">开始创建图表</h3>
          <p className="text-muted-foreground leading-relaxed">
            发送消息描述您的需求，或上传数据文件，
            <br />
            AI 会为您生成专业的数据可视化图表。
          </p>
        </div>

        {/* 功能提示 */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="text-muted-foreground flex items-center justify-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span>智能数据分析</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span>多种图表类型</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-purple-400" />
            <span>高质量图片导出</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 根据文件确定附件类型
 */
function getFileAttachmentType(file: File): 'excel' | 'csv' | 'json' | 'image' {
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
