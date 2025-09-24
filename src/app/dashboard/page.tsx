"use client";

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
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
