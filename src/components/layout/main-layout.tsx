"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChatPosition } from "@/types/chat";
import { useMobile } from "@/hooks/use-mobile";
import { MobileTabs } from "@/components/mobile-tabs";

interface MainLayoutProps {
  children?: React.ReactNode;
  chatPanel: React.ReactNode;
  chartPanel: React.ReactNode;
}

export function MainLayout({ chatPanel, chartPanel }: MainLayoutProps) {
  const [chatPosition, setChatPosition] = useState<ChatPosition>("right");
  const isMobile = useMobile();
  const t = useTranslations();

  const toggleChatPosition = () => {
    setChatPosition(prev => (prev === "left" ? "right" : "left"));
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        {/* Mobile Header */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <div className="flex h-14 items-center justify-center px-4">
            <h1 className="text-lg font-semibold">Auto Chart</h1>
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
          <h1 className="text-lg font-semibold">Auto Chart</h1>

          {/* Chat Position Toggle - Desktop Only */}
          <div className="flex items-center space-x-2">
            <PanelLeft className="h-4 w-4" />
            <Switch
              id="chat-position"
              checked={chatPosition === "right"}
              onCheckedChange={toggleChatPosition}
            />
            <PanelRight className="h-4 w-4" />
            <Label htmlFor="chat-position" className="text-sm">
              {t("layout.chatPosition")}: {t(`layout.${chatPosition}`)}
            </Label>
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
