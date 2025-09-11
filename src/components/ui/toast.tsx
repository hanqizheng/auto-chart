"use client";

import { useToast, Toast } from "./use-toast";
import { cn } from "@/lib/utils";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./button";

/**
 * Toast显示组件
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:top-auto sm:right-0 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * 单个Toast组件
 */
function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const { id, title, description, variant = "default" } = toast;

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        "bg-background text-foreground",
        variant === "destructive" && "border-destructive/50 text-destructive",
        "animate-in slide-in-from-right-full duration-300"
      )}
    >
      <div className="grid gap-1">
        {title && (
          <div className={cn(
            "text-sm font-semibold flex items-center gap-2",
            variant === "destructive" ? "text-destructive" : "text-foreground"
          )}>
            {variant === "destructive" && <AlertCircle className="h-4 w-4" />}
            {variant === "default" && <CheckCircle className="h-4 w-4" />}
            {title}
          </div>
        )}
        {description && (
          <div className={cn(
            "text-sm opacity-90 whitespace-pre-line",
            variant === "destructive" ? "text-destructive/90" : "text-muted-foreground"
          )}>
            {description}
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100",
          "h-6 w-6",
          variant === "destructive" && "text-destructive hover:text-destructive"
        )}
        onClick={() => onDismiss(id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}