import { useCallback, useState } from "react";

interface UseScreenshotReturn {
  isCapturing: boolean;
  error: string | null;
  exportChart: (element: HTMLElement, filename?: string) => Promise<void>;
  downloadImage: (dataUrl: string, filename: string) => void;
}

export function useScreenshot(): UseScreenshotReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadImage = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportChart = useCallback(
    async (element: HTMLElement, filename: string = "chart.png") => {
      try {
        setIsCapturing(true);
        setError(null);

        // Import html2canvas dynamically
        const html2canvas = (await import("html2canvas")).default;

        // Use html2canvas to capture the entire chart container
        const canvas = await html2canvas(element, {
          backgroundColor: "#ffffff",
          scale: 2, // High DPI
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: element.offsetWidth,
          height: element.offsetHeight,
          ignoreElements: element => {
            // Skip elements that might have problematic styles
            return (
              element.tagName === "SCRIPT" ||
              element.tagName === "STYLE" ||
              element.tagName === "NOSCRIPT"
            );
          },
          onclone: (clonedDoc, element) => {
            // Force white background on the root element to avoid parsing issues
            element.style.backgroundColor = "#ffffff";
            element.style.background = "#ffffff";

            // Define safe color mappings for CSS variables that might contain lab()
            const safeColorMap = {
              "--chart-1": "hsl(220, 70%, 50%)", // Blue
              "--chart-2": "hsl(160, 60%, 45%)", // Green
              "--chart-3": "hsl(30, 80%, 55%)", // Orange
              "--chart-4": "hsl(280, 65%, 60%)", // Purple
              "--chart-5": "hsl(340, 75%, 55%)", // Pink
              "--background": "#ffffff",
              "--foreground": "#000000",
              "--card": "#ffffff",
              "--card-foreground": "#000000",
              "--border": "#e5e7eb",
              "--input": "#ffffff",
              "--ring": "#3b82f6",
              "--radius": "0.5rem",
            };

            // Remove all stylesheets that might contain lab() colors and replace with safe ones
            const stylesheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            stylesheets.forEach(stylesheet => {
              if (stylesheet.tagName === "STYLE" && stylesheet.textContent) {
                let content = stylesheet.textContent;

                // Replace CSS custom properties with safe values
                Object.entries(safeColorMap).forEach(([variable, safeValue]) => {
                  const regex = new RegExp(
                    `var\\(${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)`,
                    "g"
                  );
                  content = content.replace(regex, safeValue);
                });

                // Remove any remaining lab() functions
                content = content.replace(/lab\([^)]*\)/g, "#ffffff");

                stylesheet.textContent = content;
              } else if (stylesheet.tagName === "LINK") {
                // Remove external stylesheets to avoid lab() parsing
                stylesheet.remove();
              }
            });

            // Add safe replacement styles - preserve original appearance while avoiding lab() colors
            const safeStyle = clonedDoc.createElement("style");
            safeStyle.textContent = `
            /* Basic reset without overriding everything */
            * { 
              box-sizing: border-box;
            }
            
            /* Safe color replacements */
            .bg-white { background: white; }
            .text-black { color: black; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .bg-gray-50 { background: #f9fafb; }
            .border { border: 1px solid #d1d5db; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .rounded { border-radius: 0.375rem; }
            .rounded-lg { border-radius: 0.5rem; }
            
            /* Layout utilities */
            .w-full { width: 100%; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .gap-1 { gap: 0.25rem; }
            .gap-4 { gap: 1rem; }
            .justify-center { justify-content: center; }
            .items-center { align-items: center; }
            .text-center { text-align: center; }
            
            /* Typography */
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            
            /* Spacing */
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            
            /* Space between utilities */
            .space-y-1 > * + * { margin-top: 0.25rem; }
            
            /* Ensure container doesn't overflow */
            [data-chart-container] {
              width: 100%;
              max-width: 100%;
              overflow: hidden;
            }
            
            /* Preserve title and header visibility */
            h3, .text-xl, .font-bold {
              color: #000000;
              display: block;
              visibility: visible;
            }
            
            /* Ensure header content is visible */
            .text-center {
              display: block;
              visibility: visible;
            }
          `;
            clonedDoc.head.appendChild(safeStyle);

            // Process all elements to replace problematic inline styles and backgrounds
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el: Element) => {
              if (el instanceof HTMLElement || el instanceof SVGElement) {
                // Force safe background colors
                if (
                  el.style.backgroundColor &&
                  (el.style.backgroundColor.includes("lab(") ||
                    el.style.backgroundColor.includes("var(--"))
                ) {
                  el.style.backgroundColor = "#ffffff";
                }
                if (
                  el.style.background &&
                  (el.style.background.includes("lab(") || el.style.background.includes("var(--"))
                ) {
                  el.style.background = "#ffffff";
                }

                const style = el.style;

                // Check each CSS property for problematic values
                for (let i = style.length - 1; i >= 0; i--) {
                  const property = style[i];
                  const value = style.getPropertyValue(property);

                  // Replace CSS custom properties with safe values
                  if (value.includes("var(--")) {
                    let newValue = value;
                    Object.entries(safeColorMap).forEach(([variable, safeValue]) => {
                      const regex = new RegExp(
                        `var\\(${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)`,
                        "g"
                      );
                      newValue = newValue.replace(regex, safeValue);
                    });
                    style.setProperty(property, newValue);
                  }

                  // Replace lab() functions with safe colors, but preserve HSL colors
                  if (value.includes("lab(")) {
                    style.setProperty(
                      property,
                      property.includes("background") ? "#ffffff" : "#3b82f6"
                    );
                  } else if (value.startsWith("hsl(") && property === "color") {
                    // Preserve HSL colors for chart data as they are safe
                    // Do nothing - keep the original HSL color
                  }
                }

                // Handle SVG attributes that might contain problematic colors
                if (el instanceof SVGElement) {
                  ["fill", "stroke"].forEach(attr => {
                    const attrValue = el.getAttribute(attr);
                    if (attrValue && (attrValue.includes("var(--") || attrValue.includes("lab("))) {
                      let newValue = attrValue;
                      Object.entries(safeColorMap).forEach(([variable, safeValue]) => {
                        const regex = new RegExp(
                          `var\\(${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)`,
                          "g"
                        );
                        newValue = newValue.replace(regex, safeValue);
                      });
                      newValue = newValue.replace(/lab\([^)]*\)/g, "#3b82f6");
                      el.setAttribute(attr, newValue);
                    }
                  });
                }
              }
            });
          },
        });

        // Convert canvas to blob and download
        canvas.toBlob(
          blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              downloadImage(url, filename);
              URL.revokeObjectURL(url);
            }
          },
          "image/png",
          0.95
        );
      } catch (err: any) {
        console.error("Chart export error:", err);
        // Fallback error message with helpful instructions
        setError(
          "Export failed. This might be due to browser security settings. Try using a different browser or disabling ad blockers."
        );
      } finally {
        setIsCapturing(false);
      }
    },
    [downloadImage]
  );

  return {
    isCapturing,
    error,
    exportChart,
    downloadImage,
  };
}
