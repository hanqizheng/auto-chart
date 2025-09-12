"use client";

import { useEffect, useState } from "react";
import { ChartResultMessage as ImageResultMessageType } from "@/types/message";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Download,
  ExternalLink,
  Copy,
  Share,
  Maximize2,
  BarChart3,
  Clock,
  Database,
  Palette,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useChartExport } from "@/contexts/chart-export-context";

interface ImageResultMessageProps {
  message: ImageResultMessageType;
  className?: string;
  showTimestamp?: boolean;
  showMetadata?: boolean;
  onImageClick?: () => void;
  onConfigureChart?: () => void;
}

/**
 * 重构的图片结果消息组件
 * 使用 ChartExportContext 获取状态，简化内部逻辑
 */
export function ImageResultMessage({
  message,
  className,
  showTimestamp = true,
  showMetadata = true,
  onImageClick,
  onConfigureChart,
}: ImageResultMessageProps) {
  const { toast } = useToast();
  const { currentChart } = useChartExport();
  
  // 简单的本地图片加载状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const { content, timestamp } = message;
  const { chartData, chartType, title, description, imageInfo } = content;
  
  // 优先使用当前图表的图片信息，如果没有则使用消息中的信息
  const currentImageInfo = currentChart?.imageInfo || imageInfo;
  const imageUrl = currentImageInfo.localBlobUrl;

  console.log("🖼️ [ImageResultMessage] 组件状态:", {
    messageId: message.id,
    title,
    hasCurrentChart: !!currentChart,
    hasImageInfo: !!currentImageInfo,
    imageUrl: imageUrl?.substring(0, 50) + "...",
    imageLoaded,
    imageLoadError
  });

  // 重置图片状态当URL变化时
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageLoadError(false);
    }
  }, [imageUrl]);

  const metadata = {
    title,
    chartType,
    dataPoints: chartData.length,
    generatedAt: currentImageInfo.createdAt || timestamp,
    width: currentImageInfo.dimensions.width,
    height: currentImageInfo.dimensions.height,
    fileSize: currentImageInfo.size,
    ...currentImageInfo.metadata,
  };
  
  const downloadUrl = currentImageInfo.localBlobUrl;

  const handleDownload = async () => {
    try {
      const url = downloadUrl || imageUrl;
      if (!url) {
        toast({
          title: "下载失败",
          description: "图片还未生成完成",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${metadata.title || "chart"}_${format(metadata.generatedAt, "yyyyMMdd_HHmmss")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "下载成功",
        description: "图表图片已保存到本地",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "下载失败",
        description: "无法下载图片，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleCopyImage = async () => {
    try {
      if (!imageUrl) {
        toast({
          title: "复制失败",
          description: "图片还未生成完成",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

      toast({
        title: "复制成功",
        description: "图片已复制到剪贴板",
      });
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        title: "复制失败",
        description: "无法复制图片，请尝试下载",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!imageUrl) {
      toast({
        title: "分享失败",
        description: "图片还未生成完成",
        variant: "destructive",
      });
      return;
    }

    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${metadata.title || "chart"}.png`, { type: "image/png" });

        await navigator.share({
          title: metadata.title || "图表分享",
          text: metadata.description || "查看这个图表",
          files: [file],
        });
      } catch (error) {
        console.error("Share failed:", error);
        toast({
          title: "分享失败",
          description: "无法分享图片",
          variant: "destructive",
        });
      }
    } else {
      // 降级到复制链接
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast({
          title: "链接已复制",
          description: "图片链接已复制到剪贴板",
        });
      } catch (error) {
        toast({
          title: "分享失败",
          description: "浏览器不支持分享功能",
          variant: "destructive",
        });
      }
    }
  };

  const getChartTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar: "柱状图",
      line: "折线图",
      pie: "饼图",
      area: "面积图",
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // 简化的渲染逻辑
  const shouldShowLoading = !imageUrl || (!imageLoaded && !imageLoadError);
  const shouldShowError = imageLoadError && !imageUrl;
  const shouldShowImage = imageUrl && !imageLoadError;

  return (
    <div className={cn("mb-6 w-full", className)}>
      {/* 时间戳 */}
      {showTimestamp && (
        <div className="text-muted-foreground mb-2 px-2 text-xs">
          {format(timestamp, "HH:mm:ss", { locale: zhCN })}
        </div>
      )}

      {/* 图片结果卡片 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* 图片容器 */}
          <div className="relative bg-gray-50 dark:bg-gray-900">
            {shouldShowLoading && (
              <div className="bg-muted flex aspect-video items-center justify-center">
                <div className="space-y-2 text-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <p className="text-muted-foreground text-sm">正在生成图片...</p>
                </div>
              </div>
            )}

            {shouldShowError && (
              <div className="bg-muted flex aspect-video items-center justify-center">
                <div className="space-y-2 text-center">
                  <BarChart3 className="text-muted-foreground mx-auto h-12 w-12" />
                  <p className="text-muted-foreground text-sm">图片加载失败</p>
                  <Button variant="outline" size="sm" onClick={() => {
                    setImageLoadError(false);
                    setImageLoaded(false);
                  }}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    重试
                  </Button>
                </div>
              </div>
            )}

            {shouldShowImage && (
              <>
                <img
                  src={imageUrl}
                  alt={metadata.title || "生成的图表"}
                  className={cn(
                    "h-auto max-h-[400px] w-full cursor-pointer object-contain transition-opacity",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => {
                    console.log("✅ [ImageResultMessage] 图片加载成功:", {
                      messageId: message.id,
                      title
                    });
                    setImageLoaded(true);
                    setImageLoadError(false);
                  }}
                  onError={(e) => {
                    console.error("❌ [ImageResultMessage] 图片加载失败:", {
                      messageId: message.id,
                      url: imageUrl?.substring(0, 50) + "...",
                      error: e
                    });
                    setImageLoadError(true);
                    setImageLoaded(false);
                  }}
                  onClick={onImageClick}
                />

                {/* 图片加载状态（overlay） */}
                {!imageLoaded && (
                  <div className="bg-muted/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                    <div className="space-y-2 text-center">
                      <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                      <p className="text-muted-foreground text-sm">图片加载中...</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 图片操作悬浮按钮 */}
            {shouldShowImage && imageLoaded && (
              <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onImageClick}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 图表信息和操作 */}
          <div className="space-y-4 p-4">
            {/* 标题和描述 */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-foreground line-clamp-2 text-lg font-semibold">
                  {metadata.title}
                </h3>
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  <BarChart3 className="mr-1 h-3 w-3" />
                  {getChartTypeLabel(metadata.chartType)}
                </Badge>
              </div>

              {metadata.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm">{metadata.description}</p>
              )}
            </div>

            {/* 元数据 */}
            {showMetadata && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Database className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">数据行数:</span>
                    <span className="font-medium">{chartData?.length || 0}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Palette className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">图片尺寸:</span>
                    <span className="font-medium">
                      {metadata.width}×{metadata.height}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">生成时间:</span>
                    <span className="font-medium">
                      {format(metadata.generatedAt, "HH:mm", { locale: zhCN })}
                    </span>
                  </div>

                  {metadata.fileSize && (
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">文件大小:</span>
                      <span className="font-medium">{formatFileSize(metadata.fileSize)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!imageUrl}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>下载</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyImage}
                  disabled={!imageUrl}
                  className="flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>复制</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={!imageUrl}
                  className="flex items-center space-x-1"
                >
                  <Share className="h-4 w-4" />
                  <span>分享</span>
                </Button>
              </div>

              {onConfigureChart && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onConfigureChart}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>配置调整</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}