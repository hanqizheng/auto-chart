"use client";

import { useAuth } from "@/hooks/use-auth";
import { OAuthModal } from "@/components/auth/oauth-modal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, fallback = null, redirectTo = "/" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        setShowModal(true);
      }
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // 未认证状态
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-semibold">需要登录</h2>
            <p className="text-muted-foreground mb-6">请登录后继续使用 Auto Chart</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2"
            >
              登录
            </button>
          </div>
        </div>

        <OAuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      </>
    );
  }

  // 已认证，正常显示内容
  return <>{children}</>;
}
