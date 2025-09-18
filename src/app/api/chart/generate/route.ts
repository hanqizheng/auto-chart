import { NextRequest, NextResponse } from "next/server";
import { ChartIntentAgent } from "@/lib/ai-agents";
import { createServiceFromEnv } from "@/lib/ai/service-factory";

export async function POST(req: NextRequest) {
  try {
    const { prompt, files } = await req.json();

    console.log("🚀 [API] 开始处理图表生成请求:", {
      prompt: prompt?.substring(0, 100) + "...",
      fileCount: files?.length || 0,
    });

    // 在服务端创建AI服务（可以访问环境变量）
    const aiService = createServiceFromEnv("deepseek");

    // 创建图表意图分析代理
    const chartAgent = new ChartIntentAgent(aiService);

    // 分析用户意图并生成图表
    const request = {
      prompt,
      uploadedFile: files?.[0], // 暂时只处理第一个文件
      context: [],
    };

    const result = await chartAgent.execute(request);

    if (!result.success) {
      throw new Error(result.error || "图表生成失败");
    }

    // 构建图表结果
    const chartResult = {
      chartData: result.data,
      chartConfig: result.config,
      chartType: result.chartType,
      title: result.title,
      description: result.description,
      imageInfo: {
        filename: `chart-${Date.now()}.png`,
        localBlobUrl: "",
        size: 0,
        format: "png",
        dimensions: { width: 800, height: 600 },
        createdAt: new Date(),
      },
    };

    console.log("✅ [API] 图表生成成功:", {
      chartType: result.chartType,
      dataCount: result.data.length,
      title: result.title,
    });

    return NextResponse.json({
      success: true,
      chartResult,
    });
  } catch (error) {
    console.error("❌ [API] 图表生成失败:", error);

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
