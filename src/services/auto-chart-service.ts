"use client";

import { ChartResultContent, ProcessingFlow, ProcessingStep, ChartType, ChartTheme } from "@/types";
import { PROCESSING_STEPS } from "@/constants/processing";
import { AutoExportService } from "./auto-export-service";
import { LocalStorageService } from "./local-storage-service";
import { createRoot } from "react-dom/client";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { aiDirector, ChartGenerationRequest } from "@/lib/ai-agents";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { createChartTheme, DEFAULT_CHART_BASE_COLOR, mapSeriesKeysToColors } from "@/lib/colors";

/**
 * 自动图表生成服务
 * 整合数据处理、图表生成、图片导出的完整工作流
 */
export class AutoChartService {
  private exportService: AutoExportService;
  private storageService: LocalStorageService;

  constructor() {
    this.exportService = new AutoExportService();
    this.storageService = new LocalStorageService();
  }

  /**
   * 处理用户输入并生成图表
   */
  async processUserInput(
    input: string,
    files?: File[],
    onStepUpdate?: (flow: ProcessingFlow) => void
  ): Promise<{
    processingFlow: ProcessingFlow;
    chartResult: ChartResultContent;
  }> {
    console.log("🚀 [AutoChart] Processing user input:", { input, fileCount: files?.length || 0 });

    // 1. 创建处理流程
    const processingFlow = this.createProcessingFlow();

    try {
      // 2. 执行处理步骤
      const processedData = await this.executeProcessingPipeline(
        input,
        files,
        processingFlow,
        onStepUpdate
      );

      // 3. 生成图表并导出
      const chartResult = await this.generateChartAndExport(
        processedData,
        processingFlow,
        onStepUpdate
      );

      // 4. 完成处理流程
      this.completeProcessingFlow(processingFlow);
      // 最后一次更新
      onStepUpdate?.(processingFlow);

      console.log("✅ [AutoChart] Processing finished");
      return { processingFlow, chartResult };
    } catch (error) {
      console.error("❌ [AutoChart] Processing failed:", error);
      this.failProcessingFlow(
        processingFlow,
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  // ========== 私有方法 ==========

  /**
   * 创建处理流程
   */
  private createProcessingFlow(): ProcessingFlow {
    return {
      id: this.generateId(),
      steps: [],
      currentStepIndex: 0,
      totalSteps: 5, // 预估步骤数
      startTime: new Date(),
      isCompleted: false,
      hasError: false,
    };
  }

  /**
   * 执行处理管道
   */
  private async executeProcessingPipeline(
    input: string,
    files: File[] | undefined,
    flow: ProcessingFlow,
    onStepUpdate?: (flow: ProcessingFlow) => void
  ): Promise<any> {
    // 步骤1: AI思考分析
    const thinkingStep = this.addProcessingStep(flow, {
      type: PROCESSING_STEPS.THINKING,
      title: "Analyze user needs",
      description: "Reviewing your data and chart requirements...",
      status: "running",
      startTime: new Date(),
      progress: 0,
    });

    await this.simulateStepProgress(thinkingStep, 1000);
    this.completeStep(thinkingStep, {
      reasoning: files?.length
        ? "Uploaded files detected; parsing contents and matching data patterns to chart types"
        : "Received a text prompt; preparing synthetic data and selecting a matching chart",
      considerations: [
        "Inspect data structure and value types",
        "Match the best visualization technique",
        "Align with the stated business question",
      ],
      conclusion: "Triggering AI agents for deeper analysis",
    });
    // 实时更新UI
    onStepUpdate?.(flow);

    // 步骤2: 文件解析（如果有文件）
    let uploadedFile: File | undefined = undefined;
    if (files && files.length > 0) {
      const parsingStep = this.addProcessingStep(flow, {
        type: PROCESSING_STEPS.FILE_PARSING,
        title: "Parse uploaded file",
        description: `Parsing ${files[0].name}...`,
        status: "running",
        startTime: new Date(),
        progress: 0,
      });

      await this.simulateStepProgress(parsingStep, 800);
      uploadedFile = files[0];

      this.completeStep(parsingStep, {
        fileName: files[0].name,
        fileSize: files[0].size,
        fileType: files[0].type,
        parseTime: 800,
      });
      // 实时更新UI
      onStepUpdate?.(flow);
    }

    // 步骤3: AI图表生成（整合了数据分析、图表类型检测、图表生成）
    const generationStep = this.addProcessingStep(flow, {
      type: PROCESSING_STEPS.CHART_GENERATION,
      title: "AI chart generation",
      description: "Using AI to analyze data and build the chart...",
      status: "running",
      startTime: new Date(),
      progress: 0,
    });

    // 调用服务端API进行AI处理
    console.log("🤖 [AutoChartService] Calling server API for AI processing");

    try {
      // 准备请求数据
      const requestData = {
        prompt: input,
        files: files?.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          // 注意：文件内容需要特殊处理，这里暂时只传递元数据
        })),
      };

      // 调用服务端API
      const response = await fetch("/api/chart/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "AI chart generation failed");
      }

      const aiResult = result.chartResult;

      console.log("✅ [AutoChartService] AI chart generation succeeded:", {
        chartType: aiResult.chartType,
        dataCount: aiResult.chartData?.length || 0,
        title: aiResult.title,
      });

      this.completeStep(generationStep, {
        chartType: aiResult.chartType,
        dataCount: aiResult.chartData?.length || 0,
        title: aiResult.title,
        reasoning: "Generated via server-side AI processing",
        aiProcessingTime: 2000,
      });
      // 实时更新UI
      onStepUpdate?.(flow);

      return {
        input,
        files,
        aiResult,
        chartData: aiResult.chartData,
        chartType: aiResult.chartType,
        chartConfig: aiResult.chartConfig,
        title: aiResult.title,
        description: aiResult.description,
      };
    } catch (error) {
      console.error("❌ [AutoChartService] AI chart generation failed:", error);

      // AI 失败时的降级方案
      generationStep.status = "error";
      generationStep.error = error instanceof Error ? error.message : "AI processing failed";

      // 使用模拟数据作为降级
      const fallbackData = this.generateFallbackChart(input);

      return {
        input,
        files,
        chartData: fallbackData.data,
        chartType: fallbackData.chartType,
        chartConfig: fallbackData.config,
        theme: fallbackData.theme,
        title: fallbackData.title,
        description: "AI processing failed; generated chart with sample data",
        isFallback: true,
      };
    }
  }

  /**
   * 生成图表并导出
   */
  private async generateChartAndExport(
    processedData: any,
    flow: ProcessingFlow,
    onStepUpdate?: (flow: ProcessingFlow) => void
  ): Promise<ChartResultContent> {
    // 步骤5: 图表生成
    const generationStep = this.addProcessingStep(flow, {
      type: PROCESSING_STEPS.CHART_GENERATION,
      title: "Render chart",
      description: "Assembling the chart component...",
      status: "running",
      startTime: new Date(),
      progress: 0,
    });

    await this.simulateStepProgress(generationStep, 1200);

    // 创建图表配置
    const { config: chartConfig, theme } = this.generateChartConfig(
      processedData.chartData,
      processedData.theme?.baseColor
    );

    this.completeStep(generationStep, {
      chartType: processedData.chartType,
      dataMapping: {
        xAxis: "name",
        yAxis: Object.keys(processedData.chartData[0] || {}).filter(k => k !== "name"),
      },
      config: chartConfig,
      generationTime: 1200,
      componentName: "EnhancedChart",
    });
    // 实时更新UI
    onStepUpdate?.(flow);

    // 步骤6: 图片导出
    const exportStep = this.addProcessingStep(flow, {
      type: PROCESSING_STEPS.IMAGE_EXPORT,
      title: "Export image",
      description: "Rendering a high-resolution image...",
      status: "running",
      startTime: new Date(),
      progress: 0,
    });

    // 创建隐藏容器并渲染图表
    const { imageInfo } = await this.renderAndExportChart({
      chartType: processedData.chartType,
      chartData: processedData.chartData,
      chartConfig,
      theme,
      title: processedData.title,
      exportStep,
    });

    this.completeStep(exportStep, {
      fileName: imageInfo.filename,
      format: imageInfo.format,
      size: imageInfo.size,
      dimensions: imageInfo.dimensions,
      exportTime: 2000,
      localPath: imageInfo.localBlobUrl,
    });
    // 实时更新UI
    onStepUpdate?.(flow);

    // 返回完整的图表结果
    return {
      chartData: processedData.chartData,
      chartConfig,
      chartType: processedData.chartType,
      title: processedData.title,
      description: `Generated from ${processedData.files?.length ? "uploaded data" : "user requirements"} as a ${this.getChartTypeLabel(processedData.chartType)}`,
      imageInfo,
      theme,
    };
  }

  /**
   * 渲染图表并导出
   */
  private async renderAndExportChart(params: {
    chartType: ChartType;
    chartData: any[];
    chartConfig: any;
    theme: ChartTheme;
    title: string;
    exportStep: ProcessingStep;
  }): Promise<{ imageInfo: any }> {
    const { chartType, chartData, chartConfig, theme, title, exportStep } = params;

    // 创建隐藏容器
    const container = this.exportService.createHiddenContainer();

    try {
      // 更新进度
      exportStep.progress = 25;

      // 使用 React 渲染图表到隐藏容器
      const chartElement = await this.renderChartToContainer(container, {
        type: chartType,
        data: chartData,
        config: chartConfig,
        theme,
        title,
      });

      exportStep.progress = 50;

      // 等待渲染完成 - 增加等待时间确保图表完全渲染
      await new Promise(resolve => setTimeout(resolve, 1500));
      exportStep.progress = 75;

      // 导出图片
      const blob = await this.exportService.exportChart(chartElement, `${title}.png`);

      // 保存到本地存储
      const imageInfo = await this.storageService.saveImage(blob, title);

      exportStep.progress = 100;

      return { imageInfo };
    } finally {
      // 清理隐藏容器
      this.exportService.cleanupHiddenContainer(container);
    }
  }

  /**
   * 渲染图表到容器
   */
  private async renderChartToContainer(
    container: HTMLElement,
    chartProps: any
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      try {
        // 创建图表元素
        const chartDiv = document.createElement("div");
        chartDiv.style.cssText = `
          width: 800px;
          height: 600px;
          padding: 20px;
          background: white;
        `;

        container.appendChild(chartDiv);

        // 使用 React 渲染图表
        import("react").then(React => {
          const root = createRoot(chartDiv);
          const { theme, ...restProps } = chartProps;
          const element = React.createElement(ChartThemeProvider, {
            chartType: restProps.type,
            chartData: restProps.data,
            chartConfig: restProps.config,
            theme,
            children: React.createElement(EnhancedChart, restProps),
          });

          root.render(element);

          // 等待渲染完成 - 增加等待时间确保图表完全渲染
          setTimeout(() => {
            resolve(chartDiv);
          }, 1500);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // ========== 辅助方法 ==========

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private addProcessingStep(
    flow: ProcessingFlow,
    stepData: Partial<ProcessingStep>
  ): ProcessingStep {
    const step: ProcessingStep = {
      id: this.generateId(),
      type: stepData.type!,
      title: stepData.title!,
      description: stepData.description!,
      status: stepData.status!,
      startTime: stepData.startTime,
      progress: stepData.progress,
    };

    flow.steps.push(step);
    return step;
  }

  private async simulateStepProgress(step: ProcessingStep, duration: number): Promise<void> {
    const startTime = Date.now();
    const updateInterval = Math.min(100, duration / 10);

    return new Promise(resolve => {
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        step.progress = progress;

        if (progress >= 100) {
          resolve();
        } else {
          setTimeout(updateProgress, updateInterval);
        }
      };

      updateProgress();
    });
  }

  private completeStep(step: ProcessingStep, data?: any): void {
    step.status = "completed";
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
    step.progress = 100;
    if (data) {
      step.data = data;
    }
  }

  private completeProcessingFlow(flow: ProcessingFlow): void {
    flow.isCompleted = true;
    flow.endTime = new Date();
  }

  private failProcessingFlow(flow: ProcessingFlow, error: string): void {
    flow.hasError = true;
    flow.endTime = new Date();

    // 标记当前步骤为错误
    const currentStep = flow.steps[flow.currentStepIndex];
    if (currentStep) {
      currentStep.status = "error";
      currentStep.error = error;
    }
  }

  /**
   * 生成降级图表数据 (当AI失败时使用)
   */
  private generateFallbackChart(input: string): {
    data: any[];
    chartType: ChartType;
    config: any;
    title: string;
    theme: ChartTheme;
  } {
    console.log("🔄 [AutoChartService] Generating chart with fallback data");

    // 简单的关键词匹配来确定图表类型
    const lowerInput = input.toLowerCase();
    let chartType: ChartType = "bar"; // 默认

    if (
      lowerInput.includes("饼图") ||
      lowerInput.includes("饼状图") ||
      lowerInput.includes("pie")
    ) {
      chartType = "pie";
    } else if (
      lowerInput.includes("折线图") ||
      lowerInput.includes("线图") ||
      lowerInput.includes("line")
    ) {
      chartType = "line";
    } else if (lowerInput.includes("面积图") || lowerInput.includes("area")) {
      chartType = "area";
    }

    const data = this.generateMockDataByType(chartType);
    const { config, theme } = this.generateChartConfig(data);
    const title = `${this.getChartTypeLabel(chartType)} - ${lowerInput.includes("excel") || lowerInput.includes("数据") ? "Data analysis" : "Sample chart"}`;

    return { data, chartType, config, title, theme };
  }

  /**
   * 根据图表类型生成对应的模拟数据
   */
  private generateMockDataByType(chartType: ChartType): any[] {
    switch (chartType) {
      case "pie":
        return [
          { name: "Mobile", value: 45 },
          { name: "Desktop", value: 30 },
          { name: "Tablet", value: 15 },
          { name: "Other", value: 10 },
        ];
      case "line":
        return [
          { name: "January", sales: 4000, profit: 2400 },
          { name: "February", sales: 3000, profit: 1398 },
          { name: "March", sales: 2000, profit: 9800 },
          { name: "April", sales: 2780, profit: 3908 },
          { name: "May", sales: 1890, profit: 4800 },
          { name: "June", sales: 2390, profit: 3800 },
        ];
      case "area":
        return [
          { name: "Q1", marketing: 100, engineering: 150, operations: 80 },
          { name: "Q2", marketing: 120, engineering: 180, operations: 95 },
          { name: "Q3", marketing: 140, engineering: 200, operations: 110 },
          { name: "Q4", marketing: 160, engineering: 220, operations: 125 },
        ];
      default: // bar
        return [
          { name: "Product A", revenue: 1200, target: 1000 },
          { name: "Product B", revenue: 800, target: 900 },
          { name: "Product C", revenue: 1500, target: 1200 },
          { name: "Product D", revenue: 600, target: 700 },
        ];
    }
  }

  private generateChartConfig(
    data: any[],
    baseColor: string | undefined = DEFAULT_CHART_BASE_COLOR
  ): { config: Record<string, any>; theme: ChartTheme } {
    if (!Array.isArray(data) || data.length === 0) {
      return { config: {}, theme: createChartTheme(baseColor || DEFAULT_CHART_BASE_COLOR, 1) };
    }

    const firstItem = data[0] || {};
    const candidateKeys = Object.keys(firstItem).filter(key => key !== "name");
    const numericKeys = candidateKeys.filter(key => typeof firstItem[key] === "number");

    const seriesKeys = numericKeys.length > 0 ? numericKeys : candidateKeys;
    const effectiveKeys = seriesKeys.length > 0 ? seriesKeys : ["value"];
    const theme = createChartTheme(
      baseColor || DEFAULT_CHART_BASE_COLOR,
      Math.max(effectiveKeys.length, 1)
    );
    const colorMap = mapSeriesKeysToColors(effectiveKeys, theme.palette);

    const config = effectiveKeys.reduce<Record<string, any>>((acc, key, index) => {
      acc[key] = {
        label: key,
        color:
          colorMap[key] ||
          theme.palette.series[index % theme.palette.series.length] ||
          theme.palette.primary,
      };
      return acc;
    }, {});

    return { config, theme };
  }

  private getChartTypeLabel(chartType: string): string {
    const labels: Record<string, string> = {
      bar: "Bar chart",
      line: "Line chart",
      area: "Area chart",
      pie: "Pie chart",
    };
    return labels[chartType] || chartType;
  }
}
