import { NextRequest, NextResponse } from "next/server";
import { AIChartDirector } from "@/lib/ai-chart-system/ai-chart-director";
import { ChartResultContent, ConversationContextPayload } from "@/types";
import {
  ensureSessionId,
  persistConversationResult,
  resolveConversationContext,
} from "@/lib/conversation-memory";

export async function POST(req: NextRequest) {
  let files: any[] = []; // 声明在外层作用域，用于错误处理
  let conversationPayload: ConversationContextPayload | undefined;

  try {
    const requestBody = await req.json();
    const { prompt, files: requestFiles, conversation } = requestBody;
    conversationPayload = conversation;
    files = requestFiles || [];

    console.log("🐛🚀 [API] 主流程：开始处理图表生成请求:", {
      prompt: prompt?.substring(0, 100) + "...",
      fileCount: files.length,
      hasFiles: files.length > 0,
      firstFileName: files[0]?.name,
      hasConversation: !!conversation,
      conversationHistory: conversation?.history?.length || 0,
    });

    const resolvedConversation = resolveConversationContext(conversationPayload);
    const sessionId = ensureSessionId(resolvedConversation ?? conversationPayload);

    // 🚀 使用新的AI图表系统处理所有场景（包括仅prompt）
    const USE_NEW_SYSTEM = true; // 功能开关：统一使用新系统

    let result: any;

    if (USE_NEW_SYSTEM) {
      console.log("✅🐛🚀 [API] 主流程：使用新的AI图表系统（统一处理所有场景）");

      // 使用新的AI图表系统
      const aiDirector = new AIChartDirector();

      // 转换文件格式（从JSON到File对象）- 仅当有文件时
      const fileObjects =
        files.length > 0
          ? files.map((fileData: any) => {
              const uint8Array = new Uint8Array(fileData.data);
              const blob = new Blob([uint8Array], { type: fileData.type });
              return new File([blob], fileData.name, { type: fileData.type });
            })
          : [];

      console.log("🐛🚀 [API] 主流程：准备调用新系统:", {
        promptLength: prompt?.length || 0,
        fileCount: fileObjects.length,
        scenario: fileObjects.length > 0 ? "PROMPT_WITH_FILE" : "PROMPT_ONLY",
        sessionId,
        firstFile: fileObjects[0]
          ? {
              name: fileObjects[0].name,
              type: fileObjects[0].type,
              size: fileObjects[0].size,
            }
          : null,
        resolvedHistory: resolvedConversation?.history?.length || 0,
      });

      const aiResult = await aiDirector.generateChart({
        prompt: prompt || "请生成一个图表",
        files: fileObjects,
        conversation: resolvedConversation ?? conversationPayload,
        sessionId,
      });

      console.log("🐛🚀 [API] 主流程：新系统执行结果:", {
        success: aiResult.success,
        chartType: aiResult.success ? aiResult.chartType : undefined,
        dataLength: aiResult.success ? aiResult.data.length : undefined,
        error: !aiResult.success ? aiResult.error?.message : undefined,
      });

      // 转换为旧API格式
      if (aiResult.success) {
        result = {
          success: true,
          chartType: aiResult.chartType,
          data: aiResult.data,
          config: aiResult.config,
          title: aiResult.title,
          description: aiResult.description,
        };
      } else {
        throw new Error(aiResult.error?.message || "新系统图表生成失败");
      }
    }
    // 旧系统已移除 - 现在统一使用新的AIChartDirector系统

    if (!result || !result.success) {
      throw new Error(result?.error || "图表生成失败");
    }

    // 构建图表结果
    const chartResult: ChartResultContent = {
      chartData: result.data,
      chartConfig: result.config,
      chartType: result.chartType,
      title: result.title,
      description: result.description || "",
      imageInfo: {
        filename: `chart-${Date.now()}.png`,
        localBlobUrl: "",
        size: 0,
        format: "png",
        dimensions: { width: 800, height: 600 },
        createdAt: new Date(),
      },
    };

    persistConversationResult({
      sessionId,
      prompt: prompt || "",
      conversation: resolvedConversation ?? conversationPayload,
      chartResult,
    });

    console.log("✅🐛🚀 [API] 主流程：图表生成成功，最终结果:", {
      system:
        USE_NEW_SYSTEM && files && files.length > 0
          ? "新系统(AI-Chart-System)"
          : "旧系统(ChartIntentAgent)",
      chartType: result.chartType,
      dataCount: result.data.length,
      title: result.title,
      sampleData: result.data?.slice(0, 2),
      sessionId,
    });

    return NextResponse.json({
      success: true,
      chartResult,
    });
  } catch (error) {
    console.error("❌🐛🚀 [API] 主流程：图表生成失败:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      hasFiles: !!files && files.length > 0,
      sessionId: conversationPayload?.sessionId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
