"use client";

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = "auto-chart-auth";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // 初始化时检查本地存储的登录状态
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const userData = JSON.parse(storedAuth) as User;
        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // 登录函数
  const login = useCallback(async (provider: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: 实现实际的 OAuth 登录逻辑
      // 这里应该调用后端 API 进行 OAuth 认证

      // 模拟登录成功的用户数据
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: "测试用户",
        email: "test@example.com",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        provider,
      };

      // 保存到本地存储
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      return mockUser;
    } catch (error) {
      console.error("Login failed:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // 登出函数
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // 跳过登录（临时功能）
  const skipLogin = useCallback(() => {
    const tempUser: User = {
      id: "temp_user",
      name: "临时用户",
      email: "temp@example.com",
      provider: "skip",
    };

    setAuthState({
      user: tempUser,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
    skipLogin,
  };
}
