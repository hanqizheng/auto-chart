import { useCallback, useState } from "react";

interface UseBetterScreenshotReturn {
  isCapturing: boolean;
  error: string | null;
  exportChart: (element: HTMLElement, filename?: string) => Promise<void>;
  downloadImage: (dataUrl: string, filename: string) => void;
}

export function useBetterScreenshot(): UseBetterScreenshotReturn {
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

        // Check if we're in development mode
        const isDev = process.env.NODE_ENV === "development";

        if (isDev) {
          // For localhost, use browser native screenshot API if available
          try {
            // @ts-ignore - experimental API
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
              // Use screen capture API for development
              await captureWithScreenAPI(element, filename, downloadImage);
              return;
            }
          } catch (screenError) {
            console.log("Screen API not available, falling back to html2canvas");
          }
        }

        // Fallback to html2canvas with improved configuration
        await captureWithHtml2Canvas(element, filename, downloadImage);
      } catch (err: any) {
        console.error("Chart export error:", err);
        setError(
          "Export failed. Try using the browser screenshot feature (Cmd+Shift+4 on Mac, Win+Shift+S on Windows) as an alternative."
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

// Native browser screenshot approach for development
async function captureWithScreenAPI(
  element: HTMLElement,
  filename: string,
  downloadImage: (dataUrl: string, filename: string) => void
) {
  // Scroll element into view
  element.scrollIntoView({ behavior: "smooth", block: "center" });

  // Wait for scroll
  await new Promise(resolve => setTimeout(resolve, 500));

  // Show user instructions
  const instruction = document.createElement("div");
  instruction.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 400px;
    text-align: center;
  `;
  instruction.innerHTML = `
    <div style="margin-bottom: 8px;">📸 Select the chart area in the screen selector</div>
    <div style="font-size: 12px; opacity: 0.8;">This will capture without style changes</div>
  `;
  document.body.appendChild(instruction);

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    video.addEventListener("loadedmetadata", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      // Stop stream
      stream.getTracks().forEach(track => track.stop());

      // Download image
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
    });
  } finally {
    document.body.removeChild(instruction);
  }
}

// Enhanced html2canvas approach with better CSS handling
async function captureWithHtml2Canvas(
  element: HTMLElement,
  filename: string,
  downloadImage: (dataUrl: string, filename: string) => void
) {
  // Import html2canvas dynamically
  const html2canvas = (await import("html2canvas")).default;

  // Create a clean clone of the element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.zIndex = "-1";

  // Apply clean styles to avoid CSS variable issues
  applyCleanStyles(clone);

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2, // High DPI
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
      ignoreElements: element => {
        return (
          element.tagName === "SCRIPT" ||
          element.tagName === "STYLE" ||
          element.tagName === "NOSCRIPT" ||
          element.classList.contains("no-capture")
        );
      },
      onclone: (clonedDoc, element) => {
        // Minimal processing - just ensure white background
        element.style.backgroundColor = "#ffffff";
        element.style.background = "#ffffff";
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
  } finally {
    document.body.removeChild(clone);
  }
}

// Apply clean, resolved styles to avoid CSS variable issues
function applyCleanStyles(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);

  // Apply resolved styles
  element.style.backgroundColor = computedStyle.backgroundColor || "#ffffff";
  element.style.color = computedStyle.color || "#000000";
  element.style.fontFamily = computedStyle.fontFamily || "system-ui, sans-serif";
  element.style.fontSize = computedStyle.fontSize || "14px";

  // Process all child elements
  const children = element.querySelectorAll("*");
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      const childStyle = window.getComputedStyle(child);

      // Only apply styles that are actually set
      if (childStyle.backgroundColor && childStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
        child.style.backgroundColor = childStyle.backgroundColor;
      }
      if (childStyle.color && childStyle.color !== "rgba(0, 0, 0, 0)") {
        child.style.color = childStyle.color;
      }

      // Handle SVG elements specially
      if (child.tagName.toLowerCase().startsWith("svg") || child.closest("svg")) {
        const fill = childStyle.fill;
        const stroke = childStyle.stroke;
        if (fill && fill !== "none") {
          child.setAttribute("fill", fill);
        }
        if (stroke && stroke !== "none") {
          child.setAttribute("stroke", stroke);
        }
      }
    }
  });
}
