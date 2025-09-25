/**
 * Global Chart Manager
 * Unified management of chart rendering, export, and status updates
 */

import { ChartResultContent } from "@/types";
import { chartExportService, ExportState } from "@/services/chart-export-service";

type ChartUpdateHandler = (updatedChart: ChartResultContent) => void;
type ExportStatusHandler = (chartId: string, status: ExportState) => void;
type ChartAppendHandler = (chart: ChartResultContent) => ChartResultContent | void;
type CurrentChartImageUpdateHandler = (payload: {
  chartId: string;
  messageId?: string;
  imageUrl: string;
  title: string;
}) => void;

interface ChartRenderInfo {
  chartId: string;
  element: HTMLElement;
  chartData: ChartResultContent;
  isRendered: boolean;
  renderTime?: Date;
  exportAttempts: number;
  lastExportError?: string;
  messageId?: string;
}

class GlobalChartManager {
  private updateHandlers = new Set<ChartUpdateHandler>();
  private exportStatusHandler: ExportStatusHandler | null = null;
  private appendHandler: ChartAppendHandler | null = null;
  private renderingCharts = new Map<string, ChartRenderInfo>();
  private pendingExports = new Set<string>();
  // 🎯 单一当前图表的图片更新回调 - 用于自动导出完成后更新DashboardLayout的图片URL
  private currentChartImageUpdateHandler: CurrentChartImageUpdateHandler | null = null;

  /**
   * Set chart update handler
   */
  setUpdateHandler(handler: ChartUpdateHandler | null) {
    if (handler) {
      this.updateHandlers.add(handler);
      console.log("🌐 [GlobalChartManager] Registered update handler:", {
        handlersCount: this.updateHandlers.size,
      });
    } else {
      // Clear all handlers when null is passed
      this.updateHandlers.clear();
      console.log("🧹 [GlobalChartManager] Cleared all update handlers");
    }
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
   * 🎯 设置当前图表的图片更新回调
   * 用于自动导出完成后更新DashboardLayout中的图片URL
   */
  setCurrentChartImageUpdateHandler(handler: CurrentChartImageUpdateHandler | null) {
    this.currentChartImageUpdateHandler = handler;
    console.log("🎯 [GlobalChartManager] 设置当前图表图片更新回调:", {
      hasHandler: !!handler,
    });
  }

  /**
   * Register chart rendering
   * Called when chart component rendering is completed
   */
  registerChartRender(
    chartId: string,
    element: HTMLElement,
    chartData: ChartResultContent,
    autoExport: boolean = true
  ) {
    console.log("📊 [GlobalChartManager] 注册图表渲染:", {
      chartId,
      title: chartData.title,
      hasElement: !!element,
      autoExport,
    });

    const renderInfo: ChartRenderInfo = {
      chartId,
      element,
      chartData,
      isRendered: true,
      renderTime: new Date(),
      exportAttempts: 0,
      messageId: chartData.messageId,
    };

    this.renderingCharts.set(chartId, renderInfo);

    // 🎯 只有非Demo图表才自动导出
    if (autoExport && !chartId.startsWith("demo-")) {
      this.scheduleExport(chartId);
    } else if (chartId.startsWith("demo-")) {
      console.log("🎨 [GlobalChartManager] Demo图表不自动导出:", { chartId });
    }
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

        // 保持导出后的图表数据与消息关联信息同步
        renderInfo.chartData = updatedChart;
        renderInfo.messageId = updatedChart.messageId;

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

        // 🔧 调用updateChart来更新消息列表中的图表数据
        this.updateChart(updatedChart);

        // 🎯 分离式更新：同时更新当前活跃图表的图片URL（用于DashboardLayout）
        if (this.currentChartImageUpdateHandler && updatedChart.imageInfo?.localBlobUrl) {
          console.log("🎯 [GlobalChartManager] 通知当前图表图片更新:", {
            chartId,
            imageUrl: updatedChart.imageInfo.localBlobUrl.substring(0, 50) + "...",
            messageId: updatedChart.messageId,
          });
          this.currentChartImageUpdateHandler({
            chartId,
            messageId: updatedChart.messageId,
            imageUrl: updatedChart.imageInfo.localBlobUrl,
            title: updatedChart.title,
          });
        }
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
    const now = new Date();
    const chartCreateTime = updatedChart.imageInfo?.createdAt || new Date(0);
    const timeDiffMinutes = (now.getTime() - chartCreateTime.getTime()) / (1000 * 60);

    console.log("🔄 [GlobalChartManager] 更新图表:", {
      title: updatedChart.title,
      handlersCount: this.updateHandlers.size,
      hasImageUrl: !!updatedChart.imageInfo?.localBlobUrl,
      messageId: updatedChart.messageId,
    });

    // 防止过时的图表导出更新影响到用户当前操作
    if (timeDiffMinutes > 10) {
      console.warn("⚠️ [GlobalChartManager] 跳过过时图表更新:", {
        title: updatedChart.title,
        timeDiffMinutes,
      });
      return;
    }

    if (this.updateHandlers.size > 0) {
      this.updateHandlers.forEach(handler => {
        try {
          if (typeof handler === 'function') {
            handler(updatedChart);
          } else {
            console.error("❌ [GlobalChartManager] Invalid handler type:", {
              handlerType: typeof handler,
              handler: handler,
            });
          }
        } catch (error) {
          console.error("❌ [GlobalChartManager] Handler execution failed:", {
            error: error instanceof Error ? error.message : error,
            handlerName: handler.name || 'anonymous',
          });
        }
      });
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
      const storedChart = this.appendHandler(chart);
      if (storedChart && typeof storedChart === 'object') {
        console.log("📌 [GlobalChartManager] 追加图表已写入会话", {
          chartId: storedChart.chartId,
          messageId: storedChart.messageId,
        });
      }
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
