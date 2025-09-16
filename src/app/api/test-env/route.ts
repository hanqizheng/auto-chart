import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 测试环境变量读取
  const envVars = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? "已设置" : "未设置",
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || "未设置",
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || "未设置",
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || "未设置",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: "环境变量状态",
    envVars,
    timestamp: new Date().toISOString(),
  });
}
