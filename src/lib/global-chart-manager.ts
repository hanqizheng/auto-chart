/**
 * Global Chart Manager
 * Unified management of chart rendering, export, and status updates
 */

import { ChartResultContent } from "@/types";
import { chartExportService, ExportState } from "@/services/chart-export-service";

type ChartUpdateHandler = (updatedChart: ChartResultContent) => void;
type ExportStatusHandler = (chartId: string, status: ExportState) => void;
type ChartAppendHandler = (chart: ChartResultContent) => void;

interface ChartRenderInfo {
  chartId: string;
  element: HTMLElement;
  chartData: ChartResultContent;
  isRendered: boolean;
  renderTime?: Date;
  exportAttempts: number;
  lastExportError?: string;
}

class GlobalChartManager {
  private updateHandlers = new Set<ChartUpdateHandler>();
  private exportStatusHandler: ExportStatusHandler | null = null;
  private appendHandler: ChartAppendHandler | null = null;
  private renderingCharts = new Map<string, ChartRenderInfo>();
  private pendingExports = new Set<string>();

  /**
   * Set chart update handler
   */
  setUpdateHandler(handler: ChartUpdateHandler) {
    this.updateHandlers.add(handler);
    console.log("🌐 [GlobalChartManager] Registered update handler:", {
      handlersCount: this.updateHandlers.size,
    });
  }

  /**
   * Remove chart update handler
   */
  removeUpdateHandler(handler: ChartUpdateHandler) {
    if (this.updateHandlers.delete(handler)) {
      console.log("🧹 [GlobalChartManager] Removed update handler:", {
        handlersCount: this.updateHandlers.size,
      });
    }
  }

  /**
   * Set chart append handler
   */
  setAppendHandler(handler: ChartAppendHandler | null) {
    this.appendHandler = handler;
    console.log("🌐 [GlobalChartManager] Set append handler:", {
      hasHandler: !!handler,
    });
  }

  /**
   * Set export status handler
   */
  setExportStatusHandler(handler: ExportStatusHandler | null) {
    this.exportStatusHandler = handler;
    console.log("🌐 [GlobalChartManager] 设置导出状态处理器:", {
      hasHandler: !!handler,
    });
  }

  /**
   * Register chart rendering
   * Called when chart component rendering is completed
   */
  registerChartRender(chartId: string, element: HTMLElement, chartData: ChartResultContent) {
    console.log("📊 [GlobalChartManager] 注册图表渲染:", {
      chartId,
      title: chartData.title,
      hasElement: !!element,
    });

    const renderInfo: ChartRenderInfo = {
      chartId,
      element,
      chartData,
      isRendered: true,
      renderTime: new Date(),
      exportAttempts: 0,
    };

    this.renderingCharts.set(chartId, renderInfo);

    // Auto-trigger export
    this.scheduleExport(chartId);
  }

  /**
   * 安排导出任务
   */
  private scheduleExport(chartId: string, delay: number = 1000) {
    if (this.pendingExports.has(chartId)) {
      console.log("📋 [GlobalChartManager] 图表已在导出队列中:", { chartId });
      return;
    }

    this.pendingExports.add(chartId);

    console.log("⏰ [GlobalChartManager] 安排导出任务:", {
      chartId,
      delay,
    });

    setTimeout(async () => {
      await this.executeExport(chartId);
    }, delay);
  }

  /**
   * 执行导出
   */
  private async executeExport(chartId: string) {
    const renderInfo = this.renderingCharts.get(chartId);

    if (!renderInfo) {
      console.warn("⚠️ [GlobalChartManager] 找不到图表渲染信息:", { chartId });
      this.pendingExports.delete(chartId);
      return;
    }

    console.log("🚀 [GlobalChartManager] 开始执行导出:", {
      chartId,
      title: renderInfo.chartData.title,
      attempts: renderInfo.exportAttempts + 1,
    });

    renderInfo.exportAttempts++;

    try {
      // 通知开始导出
      this.notifyExportStatus(chartId, {
        isExporting: true,
        progress: 0,
        stage: "preparing",
      });

      // 执行导出
      const result = await chartExportService.exportChart(
        renderInfo.element,
        chartId,
        renderInfo.chartData.title
      );

      if (result.success) {
        // 导出成功，更新图表数据
        const updatedChart: ChartResultContent = {
          ...renderInfo.chartData,
          imageInfo: {
            filename: result.filename,
            localBlobUrl: result.blobUrl,
            size: result.size,
            format: "png",
            dimensions: result.dimensions,
            createdAt: new Date(),
          },
        };

        console.log("✅ [GlobalChartManager] 导出成功:", {
          chartId,
          filename: result.filename,
          size: result.size,
          url: result.blobUrl.substring(0, 50) + "...",
        });

        // 通知导出完成
        this.notifyExportStatus(chartId, {
          isExporting: false,
          progress: 100,
          stage: "completed",
        });

        // 更新图表
        this.updateChart(updatedChart);
      } else {
        // 导出失败
        console.error("❌ [GlobalChartManager] 导出失败:", {
          chartId,
          error: result.error,
          details: result.details,
          attempts: renderInfo.exportAttempts,
        });

        renderInfo.lastExportError = result.error;

        // 通知导出错误
        this.notifyExportStatus(chartId, {
          isExporting: false,
          progress: 0,
          stage: "error",
          error: result.error,
        });

        // 重试逻辑
        if (result.retry && renderInfo.exportAttempts < 3) {
          const retryDelay = Math.pow(2, renderInfo.exportAttempts) * 1000; // 指数退避
          console.log("🔄 [GlobalChartManager] 准备重试导出:", {
            chartId,
            attempt: renderInfo.exportAttempts + 1,
            delay: retryDelay,
          });

          setTimeout(() => {
            this.scheduleExport(chartId);
          }, retryDelay);

          return; // 不移除 pending 状态
        }
      }
    } catch (error) {
      console.error("💥 [GlobalChartManager] 导出过程异常:", {
        chartId,
        error: error instanceof Error ? error.message : error,
      });

      renderInfo.lastExportError = error instanceof Error ? error.message : "未知错误";

      this.notifyExportStatus(chartId, {
        isExporting: false,
        progress: 0,
        stage: "error",
        error: renderInfo.lastExportError,
      });
    } finally {
      this.pendingExports.delete(chartId);
    }
  }

  /**
   * 通知导出状态变化
   */
  private notifyExportStatus(chartId: string, status: ExportState) {
    if (this.exportStatusHandler) {
      this.exportStatusHandler(chartId, status);
    }
  }

  /**
   * 更新图表
   */
  updateChart(updatedChart: ChartResultContent) {
    console.log("🔄 [GlobalChartManager] 更新图表:", {
      title: updatedChart.title,
      handlersCount: this.updateHandlers.size,
      hasImageUrl: !!updatedChart.imageInfo?.localBlobUrl,
    });

    if (this.updateHandlers.size > 0) {
      this.updateHandlers.forEach(handler => handler(updatedChart));
    } else {
      console.warn("⚠️ [GlobalChartManager] 没有设置更新处理器");
    }
  }

  /**
   * 追加新的图表消息
   */
  appendChart(chart: ChartResultContent) {
    console.log("➕ [GlobalChartManager] 追加图表:", {
      title: chart.title,
      hasHandler: !!this.appendHandler,
    });

    if (this.appendHandler) {
      this.appendHandler(chart);
    } else {
      console.warn("⚠️ [GlobalChartManager] 没有设置追加处理器");
    }
  }

  /**
   * 手动重试导出
   */
  retryExport(chartId: string) {
    const renderInfo = this.renderingCharts.get(chartId);
    if (renderInfo) {
      console.log("🔄 [GlobalChartManager] 手动重试导出:", { chartId });
      renderInfo.exportAttempts = 0; // 重置重试次数
      this.scheduleExport(chartId, 100); // 立即重试
    }
  }

  /**
   * 取消导出
   */
  cancelExport(chartId: string) {
    console.log("🚫 [GlobalChartManager] 取消导出:", { chartId });
    this.pendingExports.delete(chartId);
    chartExportService.cancelExport(chartId);

    this.notifyExportStatus(chartId, {
      isExporting: false,
      progress: 0,
      stage: "idle",
    });
  }

  /**
   * 获取图表渲染信息
   */
  getChartInfo(chartId: string): ChartRenderInfo | undefined {
    return this.renderingCharts.get(chartId);
  }

  /**
   * 获取导出状态
   */
  getExportStatus(chartId: string): ExportState | null {
    return chartExportService.getExportState(chartId);
  }

  /**
   * 清除图表
   */
  clearChart(chartId: string) {
    console.log("🧹 [GlobalChartManager] 清除图表:", { chartId });
    this.renderingCharts.delete(chartId);
    this.pendingExports.delete(chartId);
    chartExportService.cancelExport(chartId);
  }

  /**
   * 清除所有处理器
   */
  clearHandlers() {
    this.updateHandlers.clear();
    this.exportStatusHandler = null;
    this.appendHandler = null;
    console.log("🧹 [GlobalChartManager] 清除所有处理器");
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      renderingCharts: this.renderingCharts.size,
      pendingExports: this.pendingExports.size,
      hasUpdateHandler: this.updateHandlers.size > 0,
      hasExportStatusHandler: !!this.exportStatusHandler,
    };
  }
}

// 导出全局单例实例
export const globalChartManager = new GlobalChartManager();
