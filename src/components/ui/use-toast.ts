// Toast Hook - 简化版实现
// 基于React state的基础toast系统

import * as React from "react";
import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

// 全局toast状态 (简化实现)
let globalToastState: ToastState = { toasts: [] };
let listeners: Array<(state: ToastState) => void> = [];

// 通知所有监听者
const notifyListeners = () => {
  listeners.forEach(listener => listener(globalToastState));
};

// 添加toast
const addToast = (toast: Omit<Toast, "id">) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newToast: Toast = {
    id,
    duration: 3000,
    variant: "default",
    ...toast,
  };

  globalToastState.toasts.push(newToast);
  notifyListeners();

  // 自动移除
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }

  return id;
};

// 移除toast
const removeToast = (id: string) => {
  globalToastState.toasts = globalToastState.toasts.filter(toast => toast.id !== id);
  notifyListeners();
};

// Hook
export function useToast() {
  const [state, setState] = useState<ToastState>(globalToastState);

  // 订阅状态变化
  React.useEffect(() => {
    const listener = (newState: ToastState) => {
      setState({ ...newState });
    };
    listeners.push(listener);

    // 清理函数
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const toast = useCallback((props: Omit<Toast, "id">) => {
    return addToast(props);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      removeToast(toastId);
    } else {
      // 移除所有toast
      globalToastState.toasts = [];
      notifyListeners();
    }
  }, []);

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}

// 简化的toast函数，可以直接调用
export const toast = (props: Omit<Toast, "id">) => {
  return addToast(props);
};
