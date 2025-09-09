"use client";

import { LocalImageInfo } from "@/types";

/**
 * 自动导出服务
 * 基于 test-export 页面的导出逻辑，提供自动化的图表导出功能
 */
export class AutoExportService {
  private isExporting = false;

  /**
   * 导出图表元素为图片
   */
  async exportChart(element: HTMLElement, filename: string = "chart.png"): Promise<Blob> {
    if (this.isExporting) {
      throw new Error("正在进行其他导出操作，请稍候重试");
    }

    this.isExporting = true;
    let originalStyles: Array<{ element: HTMLElement; property: string; value: string }> = [];

    try {
      console.log("🎯 [AutoExport] 开始导出图表:", filename);

      // 1. 临时移除高度限制，让内容完全展开
      originalStyles = this.temporarilyRemoveHeightConstraints(element);

      // 2. 动态导入 html2canvas-pro
      const html2canvas = await this.importHtml2Canvas();

      // 3. 智能计算元素的真实内容尺寸
      const elementDimensions = this.getElementContentDimensions(element);

      console.log("📐 [AutoExport] 元素尺寸信息:", {
        offset: { width: element.offsetWidth, height: element.offsetHeight },
        scroll: { width: element.scrollWidth, height: element.scrollHeight },
        client: { width: element.clientWidth, height: element.clientHeight },
        computed: elementDimensions,
      });

      // 4. 使用 html2canvas-pro 渲染
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // 高质量输出
        useCORS: true,
        allowTaint: true,
        logging: false,
        // 使用智能计算的尺寸，确保不会截断内容
        width: elementDimensions.width,
        height: elementDimensions.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // 重要：处理溢出内容
        windowWidth: elementDimensions.width,
        windowHeight: elementDimensions.height,
      });

      console.log("✅ [AutoExport] html2canvas-pro 渲染完成");

      // 5. 恢复原始样式
      this.restoreOriginalStyles(element, originalStyles);

      // 6. 转换为 blob
      const blob = await this.canvasToBlob(canvas);

      console.log("✅ [AutoExport] 图表导出完成:", {
        filename,
        size: blob.size,
        type: blob.type,
      });

      return blob;
    } catch (error) {
      // 确保在出错时也恢复样式
      if (originalStyles.length > 0) {
        this.restoreOriginalStyles(element, originalStyles);
      }

      console.error("❌ [AutoExport] 导出失败:", error);
      throw new Error(`图表导出失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * 创建隐藏的渲染容器
   */
  createHiddenContainer(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: -10000px;
      left: -10000px;
      width: 800px;
      height: 600px;
      background: white;
      z-index: -1000;
      pointer-events: none;
      opacity: 0;
    `;

    document.body.appendChild(container);
    return container;
  }

  /**
   * 清理隐藏容器
   */
  cleanupHiddenContainer(container: HTMLElement): void {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }

  // ========== 私有方法 ==========

  /**
   * 动态导入 html2canvas-pro
   */
  private async importHtml2Canvas(): Promise<any> {
    try {
      const module = await import("html2canvas-pro");
      return module.default;
    } catch (error) {
      console.error("❌ [AutoExport] 无法导入 html2canvas-pro:", error);
      throw new Error("图表导出库加载失败");
    }
  }

  /**
   * Canvas 转 Blob
   */
  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas 转换为 Blob 失败"));
          }
        },
        "image/png",
        1.0 // 最高质量
      );
    });
  }

  /**
   * 临时移除高度限制，让图表内容完全展开
   */
  private temporarilyRemoveHeightConstraints(
    element: HTMLElement
  ): Array<{ element: HTMLElement; property: string; value: string }> {
    const originalStyles: Array<{ element: HTMLElement; property: string; value: string }> = [];

    // 处理当前元素及其所有子元素
    const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];

    allElements.forEach(el => {
      // 保存并移除高度限制
      const heightProperties = ["height", "maxHeight", "minHeight"];

      heightProperties.forEach(prop => {
        const currentValue = el.style.getPropertyValue(prop);
        if (currentValue) {
          originalStyles.push({ element: el, property: prop, value: currentValue });
          el.style.removeProperty(prop);
        }
      });

      // 如果元素有固定高度的 class，临时设置为 auto
      // 需要安全地处理 SVGElement 的 className（SVGAnimatedString）
      const classNameStr =
        typeof el.className === "string" ? el.className : (el.className as any)?.baseVal || "";
      if (
        classNameStr.includes("h-[") ||
        classNameStr.includes("h-96") ||
        classNameStr.includes("h-full")
      ) {
        originalStyles.push({ element: el, property: "height", value: el.style.height || "" });
        el.style.height = "auto";
      }

      // 移除 overflow hidden 以免截断内容
      if (el.style.overflow === "hidden") {
        originalStyles.push({ element: el, property: "overflow", value: "hidden" });
        el.style.overflow = "visible";
      }
    });

    console.log(`🔧 [AutoExport] 临时移除了 ${originalStyles.length} 个样式约束`);
    return originalStyles;
  }

  /**
   * 恢复原始样式
   */
  private restoreOriginalStyles(
    element: HTMLElement,
    originalStyles: Array<{ element: HTMLElement; property: string; value: string }>
  ): void {
    originalStyles.forEach(({ element: el, property, value }) => {
      if (value) {
        el.style.setProperty(property, value);
      } else {
        el.style.removeProperty(property);
      }
    });

    console.log(`🔄 [AutoExport] 恢复了 ${originalStyles.length} 个样式`);
  }

  /**
   * 智能计算元素的真实内容尺寸
   * 解决容器高度限制导致图表被截断的问题
   */
  private getElementContentDimensions(element: HTMLElement): { width: number; height: number } {
    // 获取各种尺寸
    const offsetWidth = element.offsetWidth;
    const offsetHeight = element.offsetHeight;
    const scrollWidth = element.scrollWidth;
    const scrollHeight = element.scrollHeight;
    const clientWidth = element.clientWidth;
    const clientHeight = element.clientHeight;

    // 检查是否有 SVG 子元素，SVG 可能有更大的内容
    const svgElements = element.querySelectorAll("svg");
    let maxSvgWidth = 0;
    let maxSvgHeight = 0;

    svgElements.forEach(svg => {
      const svgRect = svg.getBoundingClientRect();
      const svgWidth = Math.max(
        svgRect.width,
        parseFloat(svg.getAttribute("width") || "0"),
        svg.scrollWidth || 0
      );
      const svgHeight = Math.max(
        svgRect.height,
        parseFloat(svg.getAttribute("height") || "0"),
        svg.scrollHeight || 0
      );

      maxSvgWidth = Math.max(maxSvgWidth, svgWidth);
      maxSvgHeight = Math.max(maxSvgHeight, svgHeight);
    });

    // 计算最终尺寸：取各种尺寸的最大值，确保不遗漏任何内容
    const finalWidth = Math.max(
      offsetWidth,
      scrollWidth,
      clientWidth,
      maxSvgWidth,
      400 // 最小宽度
    );

    const finalHeight = Math.max(
      offsetHeight,
      scrollHeight,
      clientHeight,
      maxSvgHeight,
      300 // 最小高度
    );

    return {
      width: Math.ceil(finalWidth),
      height: Math.ceil(finalHeight),
    };
  }
}
