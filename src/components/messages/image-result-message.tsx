"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface ImageResultMessageProps {
  message: ImageResultMessageType;
  className?: string;
  showTimestamp?: boolean;
  showMetadata?: boolean;
  onImageClick?: () => void;
  onConfigureChart?: () => void;
}

export function ImageResultMessage({
  message,
  className,
  showTimestamp = true,
  showMetadata = true,
  onImageClick,
  onConfigureChart,
}: ImageResultMessageProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  const { content, timestamp } = message;
  const { chartData, chartType, title, description, imageInfo } = content;
  const imageUrl = imageInfo.localBlobUrl;
  const metadata = {
    title,
    chartType,
    dataPoints: chartData.length,
    generatedAt: imageInfo.createdAt || timestamp,
    width: imageInfo.dimensions.width,
    height: imageInfo.dimensions.height,
    fileSize: imageInfo.size,
    ...imageInfo.metadata,
  };
  const downloadUrl = imageInfo.localBlobUrl; // For now, use the same as imageUrl

  const handleDownload = async () => {
    try {
      const url = downloadUrl || imageUrl;
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
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "链接已复制",
        description: "图片链接已复制到剪贴板",
      });
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
            {imageError ? (
              <div className="bg-muted flex aspect-video items-center justify-center">
                <div className="space-y-2 text-center">
                  <BarChart3 className="text-muted-foreground mx-auto h-12 w-12" />
                  <p className="text-muted-foreground text-sm">图片加载失败</p>
                </div>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={metadata.title || "生成的图表"}
                className={cn(
                  "h-auto max-h-[400px] w-full cursor-pointer object-contain transition-opacity",
                  isImageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsImageLoading(false);
                }}
                onClick={onImageClick}
              />
            )}

            {/* 加载状态 */}
            {isImageLoading && (
              <div className="bg-muted absolute inset-0 flex animate-pulse items-center justify-center">
                <div className="space-y-2 text-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <p className="text-muted-foreground text-sm">图片加载中...</p>
                </div>
              </div>
            )}

            {/* 图片操作悬浮按钮 */}
            {!isImageLoading && !imageError && (
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
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>下载</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyImage}
                  className="flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>复制</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
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
