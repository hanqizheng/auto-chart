"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { ChatPosition } from "@/types/chat";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { MobileTabs } from "@/components/mobile-tabs";
import { LayoutToggle } from "@/components/layout/layout-toggle";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children?: React.ReactNode;
  chatPanel: React.ReactNode;
  chartPanel: React.ReactNode;
}

export function MainLayout({ chatPanel, chartPanel }: MainLayoutProps) {
  const [chatPosition, setChatPosition] = useState<ChatPosition>("right");
  const isMobile = useMobile();
  const { user, isAuthenticated } = useAuth();

  const toggleChatPosition = () => {
    setChatPosition(prev => (prev === "left" ? "right" : "left"));
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        {/* Mobile Header */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Auto Chart</h1>
            {/* 用户头像或占位符 */}
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <UserAvatar user={user} />
              ) : (
                <div className="w-10" /> /* 占位符保持布局 */
              )}
            </div>
          </div>
        </header>

        {/* Mobile Content with Tabs */}
        <div className="flex-1 overflow-hidden">
          <MobileTabs chatPanel={chatPanel} chartPanel={chartPanel} defaultValue="chat" />
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen flex-col">
      {/* Desktop Header */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Auto Chart</h1>
          </div>

          {/* 右侧控件区域 */}
          <div className="flex items-center space-x-3">
            {/* Chat Position Toggle - Desktop Only */}
            <LayoutToggle chatPosition={chatPosition} onToggle={toggleChatPosition} />

            {/* 用户头像 */}
            {isAuthenticated && user && <UserAvatar user={user} />}
          </div>
        </div>
      </header>

      {/* Desktop Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {chatPosition === "left" ? (
          <>
            {/* Chat Panel - Left */}
            <div className="flex w-96 flex-col border-r">{chatPanel}</div>

            {/* Chart Panel - Right */}
            <div className="flex flex-1 flex-col">{chartPanel}</div>
          </>
        ) : (
          <>
            {/* Chart Panel - Left */}
            <div className="flex flex-1 flex-col">{chartPanel}</div>

            {/* Chat Panel - Right */}
            <div className="flex w-96 flex-col border-l">{chatPanel}</div>
          </>
        )}
      </div>
    </div>
  );
}
