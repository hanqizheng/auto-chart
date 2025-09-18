"use client";

/**
 * 图表导出服务
 * 重构版本：简化逻辑，优化性能，提供更可靠的导出功能
 */

export interface ExportResult {
  success: true;
  blobUrl: string;
  blob: Blob;
  filename: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ExportError {
  success: false;
  error: string;
  details?: string;
  retry?: boolean;
}

export type ExportResponse = ExportResult | ExportError;

/**
 * 导出状态接口
 */
export interface ExportState {
  isExporting: boolean;
  progress: number; // 0-100
  stage: "idle" | "preparing" | "capturing" | "processing" | "completed" | "error";
  error?: string;
}

class ChartExportService {
  private exportingCharts = new Map<string, ExportState>();

  /**
   * 导出图表为图片
   * @param element 要导出的DOM元素
   * @param chartId 图表唯一标识符
   * @param filename 导出文件名
   */
  async exportChart(
    element: HTMLElement,
    chartId: string,
    filename?: string
  ): Promise<ExportResponse> {
    // 检查是否正在导出
    if (this.isExporting(chartId)) {
      return {
        success: false,
        error: "Chart export is already in progress",
        details: "Please wait for the current export to finish",
        retry: false,
      };
    }

    // 生成文件名
    const exportFilename = filename || this.generateFilename(chartId);

    try {
      // 初始化导出状态
      this.setExportState(chartId, {
        isExporting: true,
        progress: 0,
        stage: "preparing",
      });

      console.log("🎯 [ChartExport] Begin exporting chart:", { chartId, filename: exportFilename });

      // 阶段1: 准备导出环境
      await this.prepareForExport(element);
      this.updateProgress(chartId, 20, "preparing");

      // 阶段2: 执行截图
      const canvas = await this.captureElement(element);
      this.updateProgress(chartId, 60, "capturing");

      // 阶段3: 处理图片
      const blob = await this.processCanvas(canvas);
      this.updateProgress(chartId, 90, "processing");

      // 阶段4: 生成结果
      const blobUrl = URL.createObjectURL(blob);
      const dimensions = this.getElementDimensions(element);

      this.updateProgress(chartId, 100, "completed");

      const result: ExportResult = {
        success: true,
        blobUrl,
        blob,
        filename: exportFilename,
        size: blob.size,
        dimensions,
      };

      console.log("✅ [ChartExport] Export completed:", {
        chartId,
        filename: exportFilename,
        size: blob.size,
        url: blobUrl.substring(0, 50) + "...",
      });

      return result;
    } catch (error) {
      console.error("❌ [ChartExport] Export failed:", { chartId, error });

      this.setExportState(chartId, {
        isExporting: false,
        progress: 0,
        stage: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
        details: error instanceof Error ? error.stack : undefined,
        retry: true,
      };
    } finally {
      // 清除导出状态
      this.clearExportState(chartId);
    }
  }

  /**
   * 检查图表是否正在导出
   */
  isExporting(chartId: string): boolean {
    const state = this.exportingCharts.get(chartId);
    return state?.isExporting || false;
  }

  /**
   * 获取导出状态
   */
  getExportState(chartId: string): ExportState | null {
    return this.exportingCharts.get(chartId) || null;
  }

  /**
   * 取消导出
   */
  cancelExport(chartId: string): void {
    this.clearExportState(chartId);
    console.log("🚫 [ChartExport] Cancel export:", { chartId });
  }

  // ========== 私有方法 ==========

  private setExportState(chartId: string, state: ExportState): void {
    this.exportingCharts.set(chartId, state);
  }

  private updateProgress(chartId: string, progress: number, stage: ExportState["stage"]): void {
    const currentState = this.exportingCharts.get(chartId);
    if (currentState) {
      this.setExportState(chartId, {
        ...currentState,
        progress,
        stage,
      });
    }
  }

  private clearExportState(chartId: string): void {
    this.exportingCharts.delete(chartId);
  }

  private generateFilename(chartId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `chart_${chartId}_${timestamp}.png`;
  }

  private async prepareForExport(element: HTMLElement): Promise<void> {
    console.log("⏳ [ChartExport] Waiting for chart to fully render...");

    // 智能等待SVG图表渲染完成
    await this.waitForSVGRendering(element);

    // 确保所有字体和样式都已加载
    await document.fonts.ready;

    console.log("✅ [ChartExport] Chart render ready");
  }

  /**
   * 智能等待SVG图表渲染完成
   * 检测Recharts SVG是否真正渲染完成，而不是简单等待固定时间
   */
  private async waitForSVGRendering(element: HTMLElement): Promise<void> {
    const maxWaitTime = 10000; // 最大等待10秒
    const checkInterval = 200; // 每200ms检查一次
    const startTime = Date.now();

    return new Promise(resolve => {
      const checkRendering = () => {
        const elapsedTime = Date.now() - startTime;

        // 超时保护
        if (elapsedTime >= maxWaitTime) {
          console.warn("⚠️ [ChartExport] SVG rendering check timed out; proceeding with export");
          resolve();
          return;
        }

        // 查找SVG元素
        const svgElements = element.querySelectorAll("svg");
        console.log(`🔍 [ChartExport] Checking SVG render state (${elapsedTime}ms)`, {
          svgCount: svgElements.length,
          containerSize: {
            width: element.offsetWidth,
            height: element.offsetHeight,
          },
        });

        if (svgElements.length === 0) {
          // 没有找到SVG，继续等待
          setTimeout(checkRendering, checkInterval);
          return;
        }

        let allSvgsReady = true;

        svgElements.forEach((svg, index) => {
          const svgRect = svg.getBoundingClientRect();
          const svgWidth = svgRect.width;
          const svgHeight = svgRect.height;

          console.log(`📊 [ChartExport] SVG${index + 1} status:`, {
            size: `${svgWidth}×${svgHeight}`,
            hasValidSize: svgWidth > 0 && svgHeight > 0,
          });

          // 检查SVG尺寸是否有效
          if (svgWidth <= 0 || svgHeight <= 0) {
            allSvgsReady = false;
            return;
          }

          // 检查SVG内部是否有图表元素
          const chartElements = svg.querySelectorAll("path, rect, circle, line, text");
          console.log(`🎨 [ChartExport] SVG${index + 1} chart elements:`, {
            elementCount: chartElements.length,
            hasChartContent: chartElements.length > 0,
          });

          if (chartElements.length === 0) {
            allSvgsReady = false;
            return;
          }

          // 特别检查Recharts的关键元素
          const rechartsElements = svg.querySelectorAll(
            ".recharts-wrapper, .recharts-surface, .recharts-pie, .recharts-bar, .recharts-line, .recharts-area"
          );

          console.log(`📈 [ChartExport] SVG${index + 1} Recharts elements:`, {
            rechartsCount: rechartsElements.length,
            hasRechartsContent: rechartsElements.length > 0,
          });

          if (rechartsElements.length === 0) {
            allSvgsReady = false;
            return;
          }
        });

        // 检查容器是否被SVG撑开
        const containerHasValidSize = element.offsetWidth > 200 && element.offsetHeight > 150;
        console.log(`📦 [ChartExport] Container size check:`, {
          size: `${element.offsetWidth}×${element.offsetHeight}`,
          isValid: containerHasValidSize,
        });

        if (!containerHasValidSize) {
          allSvgsReady = false;
        }

        if (allSvgsReady) {
          console.log(`✅ [ChartExport] SVG rendering finished after ${elapsedTime}ms`);
          // 额外等待一点时间确保样式完全应用
          setTimeout(() => resolve(), 300);
        } else {
          // 继续等待
          setTimeout(checkRendering, checkInterval);
        }
      };

      // 开始检查
      checkRendering();
    });
  }

  private async captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    // 动态导入 html2canvas-pro
    const html2canvas = await this.loadHtml2Canvas();

    // 获取元素尺寸
    const dimensions = this.getElementDimensions(element);

    console.log("📐 [ChartExport] Capture dimensions:", dimensions);

    // 执行截图 - 针对Tailwind CSS + Shadcn/UI优化
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: dimensions.width,
      height: dimensions.height,
      // 基础修复：确保基本样式
      onclone: (clonedDoc: Document) => {
        // 只添加基础样式，不进行复杂的样式修复
        this.addBasicStyles(clonedDoc);
      },
    });

    return canvas;
  }

  private async processCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to Blob"));
          }
        },
        "image/png",
        1.0
      );
    });
  }

  private getElementDimensions(element: HTMLElement): { width: number; height: number } {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    const width = Math.max(
      rect.width,
      element.offsetWidth,
      element.scrollWidth,
      parseFloat(computedStyle.width) || 0,
      400 // 最小宽度
    );

    const height = Math.max(
      rect.height,
      element.offsetHeight,
      element.scrollHeight,
      parseFloat(computedStyle.height) || 0,
      300 // 最小高度
    );

    return {
      width: Math.ceil(width),
      height: Math.ceil(height),
    };
  }

  /**
   * 添加基础样式到克隆文档
   * 简化的样式处理，专注于时序解决方案
   */
  private addBasicStyles(clonedDoc: Document): void {
    console.log("🎨 [ChartExport] Injecting basic styles");

    // 添加基础样式重置
    const styleEl = clonedDoc.createElement("style");
    styleEl.textContent = `
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
        background: white;
      }
      /* Ensure SVG renders correctly */
      svg {
        display: block;
        max-width: 100%;
        height: auto;
      }
    `;
    clonedDoc.head.appendChild(styleEl);

    console.log("✅ [ChartExport] Base styles applied");
  }

  private async loadHtml2Canvas(): Promise<any> {
    try {
      const module = await import("html2canvas-pro");
      return module.default;
    } catch (error) {
      throw new Error("Failed to load chart export library");
    }
  }
}

// 导出单例实例
export const chartExportService = new ChartExportService();
