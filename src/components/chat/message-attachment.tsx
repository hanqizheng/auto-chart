"use client";

import { FileText, FileImage, FileSpreadsheet, Archive, File, Download } from "lucide-react";
import { UploadedFile } from "@/types/chat";

interface MessageAttachmentProps {
  file: UploadedFile;
  isUserMessage?: boolean;
}

export function MessageAttachment({ file, isUserMessage = false }: MessageAttachmentProps) {
  // 根据文件类型获取对应的图标和颜色
  const getFileIconAndColor = (type: string, name: string) => {
    const lowerType = type.toLowerCase();
    const lowerName = name.toLowerCase();

    // Excel 文件 - 绿色
    if (
      lowerType.includes("spreadsheet") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".csv")
    ) {
      return {
        icon: <FileSpreadsheet className="h-3 w-3" />,
        color: "text-green-600 dark:text-green-400",
      };
    }

    // 图片文件 - 蓝色
    if (lowerType.startsWith("image/")) {
      return {
        icon: <FileImage className="h-3 w-3" />,
        color: "text-blue-600 dark:text-blue-400",
      };
    }

    // 文档文件 - 橙色
    if (
      lowerType.includes("text/") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".pdf")
    ) {
      return {
        icon: <FileText className="h-3 w-3" />,
        color: "text-orange-600 dark:text-orange-400",
      };
    }

    // 压缩文件 - 紫色
    if (lowerName.endsWith(".zip") || lowerName.endsWith(".rar") || lowerName.endsWith(".7z")) {
      return {
        icon: <Archive className="h-3 w-3" />,
        color: "text-purple-600 dark:text-purple-400",
      };
    }

    // 默认文件图标 - 灰色
    return {
      icon: <File className="h-3 w-3" />,
      color: "text-gray-600 dark:text-gray-400",
    };
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // 截断长文件名
  const truncateFileName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;

    const extension = name.split(".").pop();
    const baseName = name.substring(0, name.lastIndexOf("."));
    const truncated = baseName.substring(0, maxLength - extension!.length - 4) + "...";

    return `${truncated}.${extension}`;
  };

  const handleFileClick = () => {
    // TODO: 实现文件预览或下载功能
    if (file.url) {
      window.open(file.url, "_blank");
    } else {
      console.log("预览文件:", file);
    }
  };

  const { icon, color } = getFileIconAndColor(file.type, file.name);

  return (
    <div
      className={`inline-flex cursor-pointer items-center rounded-full px-2 py-1 text-xs transition-all hover:scale-105 ${
        isUserMessage
          ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
          : "bg-secondary hover:bg-secondary/80 border-border/50 border"
      }`}
      onClick={handleFileClick}
      title={`${file.name} (${formatFileSize(file.size)})`}
    >
      {/* 文件图标 */}
      <div className={`mr-1.5 flex-shrink-0 ${isUserMessage ? "text-primary-foreground" : color}`}>
        {icon}
      </div>

      {/* 文件信息 - 只显示文件名 */}
      <span className="max-w-[120px] truncate text-xs font-medium">
        {truncateFileName(file.name, 20)}
      </span>

      {/* 下载图标 */}
      <div
        className={`ml-1.5 flex-shrink-0 opacity-60 ${
          isUserMessage ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Download className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}

interface MessageAttachmentsProps {
  files: UploadedFile[];
  isUserMessage?: boolean;
}

export function MessageAttachments({ files, isUserMessage = false }: MessageAttachmentsProps) {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.map(file => (
        <MessageAttachment key={file.id} file={file} isUserMessage={isUserMessage} />
      ))}
    </div>
  );
}
