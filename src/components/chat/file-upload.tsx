"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadedFile } from "@/types/chat";

interface FileUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function FileUpload({
  uploadedFiles,
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = [".xlsx", ".xls", ".csv"],
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const t = useTranslations();

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
          // TODO: Show error message
          continue;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          // TODO: Show error message
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: file,
        };

        newFiles.push(uploadedFile);
      }

      const updatedFiles = [...uploadedFiles, ...newFiles].slice(0, maxFiles);
      onFilesChange(updatedFiles);
    },
    [uploadedFiles, onFilesChange, maxFiles, acceptedTypes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (e.dataTransfer.files) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback(
    (fileId: string) => {
      const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
      onFilesChange(updatedFiles);
    },
    [uploadedFiles, onFilesChange]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* File Upload Area */}
      <div
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
        <p className="text-muted-foreground mb-2 text-sm">{t("chat.dragDropHint")}</p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={e => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">{t("chat.uploadFile")}</span>
          </Button>
        </label>
        <p className="text-muted-foreground mt-2 text-xs">{t("chat.supportedFormats")}</p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("chat.attachedFiles")}</p>
          {uploadedFiles.map(file => (
            <Card key={file.id} className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 flex-shrink-0 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
