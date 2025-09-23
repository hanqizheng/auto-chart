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
      // 🚨 Enhanced error logging for debugging
      console.error("❌ [ChartExport] Export failed:", {
        chartId,
        filename: exportFilename,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        elementDimensions: element ? {
          width: element.offsetWidth,
          height: element.offsetHeight,
          hasStyle: !!element.style,
        } : null,
      });

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
    const maxWaitTime = 5000; // 🔧 减少最大等待时间到5秒
    const checkInterval = 100; // 🔧 增加检查频率到每100ms
    const startTime = Date.now();

    return new Promise(resolve => {
      const checkRendering = () => {
        const elapsedTime = Date.now() - startTime;

        // 查找SVG元素
        const svgElements = element.querySelectorAll("svg");

        // 🔧 超时保护 - 即使检查失败也继续导出
        if (elapsedTime >= maxWaitTime) {
          console.warn("⚠️ [ChartExport] SVG rendering check timed out; proceeding with export anyway", {
            svgCount: svgElements.length,
            containerSize: {
              width: element.offsetWidth,
              height: element.offsetHeight,
            },
          });
          resolve();
          return;
        }

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

          // 检查SVG尺寸是否有效
          if (svgWidth <= 0 || svgHeight <= 0) {
            allSvgsReady = false;
            return;
          }

          // 检查SVG内部是否有图表元素
          const chartElements = svg.querySelectorAll("path, rect, circle, line, text");

          if (chartElements.length === 0) {
            allSvgsReady = false;
            return;
          }

          // 🔧 更宽松的Recharts检查：如果有基本图表元素就认为OK
          // 不再强制要求特定的Recharts CSS类，因为这些类可能不总是存在
          const rechartsElements = svg.querySelectorAll(
            ".recharts-wrapper, .recharts-surface, .recharts-pie, .recharts-bar, .recharts-line, .recharts-area"
          );

          // 如果没有Recharts特定元素，但有基本图表元素，也认为是OK的
          if (rechartsElements.length === 0 && chartElements.length < 3) {
            console.log(`⚠️ [ChartExport] SVG ${index} has no Recharts elements and few chart elements:`, {
              rechartsElements: rechartsElements.length,
              chartElements: chartElements.length,
            });
            allSvgsReady = false;
            return;
          }
        });

        // 🔧 更宽松的容器尺寸检查
        const containerHasValidSize = element.offsetWidth > 100 && element.offsetHeight > 100;

        if (!containerHasValidSize) {
          console.log(`⚠️ [ChartExport] Container size too small:`, {
            width: element.offsetWidth,
            height: element.offsetHeight,
          });
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
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: dimensions.width,
      height: dimensions.height,
      // 基础修复：确保基本样式
      onclone: (clonedDoc: Document) => {
        this.addBasicStyles(clonedDoc);
        // Aggressively force transparency over any theme styles
        const styleEl = clonedDoc.createElement("style");
        styleEl.textContent = `
          /* Force all major elements in the capture to have a transparent background */
          body, div, svg, .recharts-wrapper {
            background-color: transparent !important;
            background: transparent !important;
          }
        `;
        clonedDoc.head.appendChild(styleEl);
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
        background: transparent;
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
