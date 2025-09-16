import { NextRequest, NextResponse } from "next/server";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const { prompt, dataStructure, security } = await req.json();

    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || null;

    const verification = await verifyTurnstileToken(security?.turnstileToken, clientIp);

    if (!verification.success) {
      console.warn("🚫 [API] Turnstile 验证失败(意图分析)", verification.errorCodes);
      return NextResponse.json(
        {
          success: false,
          error: "人机验证失败，请重试",
          details: {
            errorCodes: verification.errorCodes,
          },
        },
        { status: 403 }
      );
    }

    // 在服务端创建AI服务（可以访问环境变量）
    const aiService = createServiceFromEnv("deepseek");

    // 验证连接
    const isConnected = await aiService.validateConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "AI服务连接失败",
        },
        { status: 503 }
      );
    }

    const systemPrompt = `你是一个专业的数据可视化专家。根据用户需求和数据特征，推荐最合适的图表类型。

支持的图表类型：
- bar: 柱状图，用于比较不同类别的数值
- line: 折线图，用于显示趋势和时间序列变化
- pie: 饼图，用于显示部分与整体的比例关系
- area: 面积图，用于显示累积数据和多系列对比

数据信息：
- 字段：${dataStructure.schema.fields.map((f: any) => `${f.name}(${f.type})`).join(", ")}
- 数据行数：${dataStructure.data.length}
- 数值字段：${dataStructure.metadata.statistics.numericFields.join(", ")}
- 分类字段：${dataStructure.metadata.statistics.categoricalFields.join(", ")}

请分析用户需求并以JSON格式回复：
{
  "chartType": "bar|line|pie|area",
  "confidence": 0.0-1.0,
  "reasoning": "选择理由",
  "visualMapping": {
    "xAxis": "字段名",
    "yAxis": ["数值字段1", "数值字段2"],
    "colorBy": "可选的颜色分组字段"
  },
  "title": "图表标题",
  "description": "图表描述",
  "insights": ["洞察1", "洞察2"]
}`;

    const response = await aiService.chat({
      messages: [{ role: "user", content: prompt }],
      systemPrompt,
      params: {
        temperature: 0.3,
        maxTokens: 800,
        response_format: { type: "json_object" },
      },
    });

    if (!response.content || response.content.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "AI返回空响应",
          details: {
            finishReason: response.finishReason,
            requestId: response.requestId,
          },
        },
        { status: 500 }
      );
    }

    // 清理和解析JSON响应
    let cleaned = response.content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          error: "AI返回的内容不是有效JSON格式",
          details: {
            rawContent: cleaned.slice(0, 500),
            jsonError: (jsonError as Error).message,
          },
        },
        { status: 500 }
      );
    }

    // 验证AI响应
    if (!parsed.chartType || !["bar", "line", "pie", "area"].includes(parsed.chartType)) {
      return NextResponse.json(
        {
          success: false,
          error: "AI返回了无效的图表类型",
          details: {
            chartType: parsed.chartType,
            fullResponse: parsed,
          },
        },
        { status: 500 }
      );
    }

    // 构建标准的ChartIntent对象
    const chartIntent = {
      chartType: parsed.chartType,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      reasoning: parsed.reasoning || "AI智能推荐",
      requiredFields: extractRequiredFields(parsed.visualMapping, dataStructure),
      optionalFields: [parsed.visualMapping?.colorBy].filter(Boolean),
      visualMapping: {
        xAxis:
          parsed.visualMapping?.xAxis ||
          dataStructure.metadata.statistics.categoricalFields[0] ||
          "category",
        yAxis:
          parsed.visualMapping?.yAxis ||
          dataStructure.metadata.statistics.numericFields.slice(0, 2),
        colorBy: parsed.visualMapping?.colorBy,
      },
      suggestions: {
        title: parsed.title || "数据可视化图表",
        description: parsed.description || "基于数据智能生成的可视化图表",
        insights: Array.isArray(parsed.insights) ? parsed.insights : ["数据已经过AI智能分析处理"],
      },
    };

    return NextResponse.json({
      success: true,
      chartIntent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

// 辅助函数
function extractRequiredFields(visualMapping: any, dataStructure: any): string[] {
  const required: string[] = [];

  if (visualMapping?.xAxis) {
    const field = dataStructure.schema.fields.find((f: any) => f.name === visualMapping.xAxis);
    if (field) required.push(field.name);
  }

  if (Array.isArray(visualMapping?.yAxis)) {
    visualMapping.yAxis.forEach((fieldName: string) => {
      const field = dataStructure.schema.fields.find((f: any) => f.name === fieldName);
      if (field) required.push(field.name);
    });
  }

  return [...new Set(required)];
}
