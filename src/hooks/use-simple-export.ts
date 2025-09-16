"use client";

import { useCallback, useState } from "react";

interface UseSimpleExportReturn {
  isExporting: boolean;
  error: string | null;
  exportChart: (element: HTMLElement, filename?: string) => Promise<void>;
}

/**
 * 图表导出功能 - 使用 html2canvas-pro 支持现代 CSS 颜色函数
 *
 * html2canvas-pro 是 html2canvas 的增强版，支持：
 * - lab(), lch(), oklab(), oklch() 等现代颜色函数
 * - color() 函数包括相对颜色
 * - 完全兼容 html2canvas API
 */
export function useSimpleExport(): UseSimpleExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportChart = useCallback(async (element: HTMLElement, filename: string = "chart.png") => {
    let originalStyles: Array<{ element: HTMLElement; property: string; value: string }> = [];

    try {
      setIsExporting(true);
      setError(null);

      console.log("🎯 [Export] 开始导出图表");

      // 临时移除高度限制，让内容完全展开
      originalStyles = temporarilyRemoveHeightConstraints(element);

      // 动态导入 html2canvas-pro
      const html2canvas = (await import("html2canvas-pro")).default;

      // 智能计算元素的真实内容尺寸
      const elementDimensions = getElementContentDimensions(element);

      console.log("📐 [Export] 元素尺寸信息:", {
        offset: { width: element.offsetWidth, height: element.offsetHeight },
        scroll: { width: element.scrollWidth, height: element.scrollHeight },
        client: { width: element.clientWidth, height: element.clientHeight },
        computed: elementDimensions,
      });

      // 简洁的配置，html2canvas-pro 可以处理现代颜色函数
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

      console.log("✅ [Export] html2canvas-pro 渲染完成");

      // 恢复原始样式
      restoreOriginalStyles(element, originalStyles);

      // 转换为 blob 并下载
      canvas.toBlob(
        blob => {
          if (blob) {
            console.log("✅ [Export] 开始下载");
            downloadBlob(blob, filename);
          } else {
            throw new Error("Canvas 转换为 Blob 失败");
          }
        },
        "image/png",
        1.0 // 最高质量
      );
    } catch (err: any) {
      // 确保在出错时也恢复样式
      if (originalStyles.length > 0) {
        restoreOriginalStyles(element, originalStyles);
      }
      console.error("❌ [Export] 导出失败:", err);
      setError(err.message || "导出失败");
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportChart,
  };
}

/**
 * 临时移除高度限制，让图表内容完全展开
 */
function temporarilyRemoveHeightConstraints(
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
      typeof el.className === "string"
        ? el.className
        : (el.className as SVGAnimatedString)?.baseVal || "";
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

  console.log(`🔧 [Export] 临时移除了 ${originalStyles.length} 个样式约束`);
  return originalStyles;
}

/**
 * 恢复原始样式
 */
function restoreOriginalStyles(
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

  console.log(`🔄 [Export] 恢复了 ${originalStyles.length} 个样式`);
}

/**
 * 智能计算元素的真实内容尺寸
 * 解决容器高度限制导致图表被截断的问题
 */
function getElementContentDimensions(element: HTMLElement): { width: number; height: number } {
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

/**
 * 下载 Blob 文件
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理 URL 对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
