"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart, LineChart, PieChart, TrendingUp, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OAuthModal } from "@/components/auth/oauth-modal";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const handleStartClick = () => {
    if (isAuthenticated) {
      // 已登录用户直接跳转到 dashboard
      router.push("/dashboard");
    } else {
      // 未登录用户显示登录模态框
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    router.push("/dashboard");
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className="bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
              <BarChart className="text-primary-foreground h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Auto Chart</h1>
          </div>

          {/* 登录状态提示 */}
          {isAuthenticated && (
            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <span>欢迎回来!</span>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-primary">
                  前往工作台
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Hero Content */}
          <div className="mb-8">
            <div className="mb-6 flex justify-center space-x-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <div className="bg-primary/10 rounded-full p-3">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <div className="bg-primary/10 rounded-full p-3">
                <FileSpreadsheet className="text-primary h-6 w-6" />
              </div>
            </div>

            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
              AI-Powered
              <br />
              <span className="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-transparent">
                Chart Generation
              </span>
            </h2>

            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
              Turn your ideas and data into beautiful, informative charts instantly. Simply describe
              what you want or upload your Excel files, and watch as AI creates professional
              visualizations ready for sharing and presentation.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-12 grid gap-8 md:grid-cols-3">
            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                  <BarChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold">Natural Language</h3>
              <p className="text-muted-foreground text-sm">
                Describe your chart in plain English and let AI generate the perfect visualization
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <LineChart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold">File Upload</h3>
              <p className="text-muted-foreground text-sm">
                Upload Excel files and instantly transform your data into interactive charts
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                  <PieChart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold">Export Ready</h3>
              <p className="text-muted-foreground text-sm">
                Generate high-quality images perfect for presentations and reports
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button size="lg" className="px-8 py-3 text-lg" onClick={handleStartClick}>
              {isAuthenticated ? "进入工作台" : "开始使用 Auto Chart"}
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-muted-foreground text-sm">
              {isAuthenticated ? "继续使用你的图表生成器" : "免费使用，快速登录"}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="text-muted-foreground container mx-auto px-4 text-center text-sm">
          <p>&copy; 2024 Auto Chart. Powered by AI for beautiful data visualization.</p>
        </div>
      </footer>

      {/* OAuth Modal */}
      <OAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
