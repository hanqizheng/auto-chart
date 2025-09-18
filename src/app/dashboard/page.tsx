"use client";

import Link from "next/link";
import { TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ThemeToggle } from "@/components/theme-toggle";

const isTestExportEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_TEST_EXPORT === "true";

/**
 * Dashboard Page
 * Using the new simplified layout system
 */
export default function Dashboard() {
  return (
    <div className="bg-background relative h-screen">
      {/* 主布局 */}
      <DashboardLayout />

      {/* 主题切换按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 开发者测试按钮 - 保留用于图表导出测试 */}
      {isTestExportEnabled ? (
        <div className="fixed bottom-4 left-4 z-50">
          <Link href="/test-export">
            <Button
              variant="outline"
              size="sm"
              className="border-dashed border-amber-500 bg-amber-50 text-amber-700 shadow-lg hover:bg-amber-100 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Export Test
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
