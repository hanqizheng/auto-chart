"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: "google",
    name: "Google",
    icon: "🟡",
    color: "bg-red-500 hover:bg-red-600",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "⚫",
    color: "bg-gray-800 hover:bg-gray-900",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: "🟦",
    color: "bg-blue-500 hover:bg-blue-600",
  },
];

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OAuthModal({ isOpen, onClose, onSuccess }: OAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login, skipLogin } = useAuth();

  if (!isOpen) return null;

  const handleProviderLogin = async (providerId: string) => {
    setIsLoading(true);

    try {
      await login(providerId);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("登录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    skipLogin();
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* 模态框内容 */}
      <div className="bg-background relative w-full max-w-md rounded-lg border p-6 shadow-lg">
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4"
          onClick={onClose}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">登录到 Auto Chart</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            选择你喜欢的方式登录，开始创建美丽的图表
          </p>
        </div>

        {/* OAuth 提供商列表 */}
        <div className="space-y-3">
          {OAUTH_PROVIDERS.map(provider => (
            <Button
              key={provider.id}
              variant="outline"
              size="lg"
              className="w-full justify-start"
              onClick={() => handleProviderLogin(provider.id)}
              disabled={isLoading}
            >
              <span className="mr-3 text-lg">{provider.icon}</span>
              使用 {provider.name} 登录
            </Button>
          ))}
        </div>

        {/* 分割线 */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t" />
          <span className="text-muted-foreground mx-3 text-xs">或</span>
          <div className="flex-1 border-t" />
        </div>

        {/* 临时跳过登录按钮 */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={handleSkipLogin}
          disabled={isLoading}
        >
          暂时跳过登录
        </Button>

        {/* 底部说明 */}
        <p className="text-muted-foreground mt-4 text-center text-xs">
          登录即表示你同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
