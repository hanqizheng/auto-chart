"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabValue } from "@/types/common";
import { MOBILE_TAB_VALUES } from "@/constants";

interface MobileTabsProps {
  chatPanel: React.ReactNode;
  chartPanel: React.ReactNode;
  defaultValue?: MobileTabValue;
}

export function MobileTabs({
  chatPanel,
  chartPanel,
  defaultValue = MOBILE_TAB_VALUES.CHAT,
}: MobileTabsProps) {
  const t = useTranslations();

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue={defaultValue} className="flex h-full flex-col">
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent
            value="chat"
            className="m-0 h-full p-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            {chatPanel}
          </TabsContent>
          <TabsContent
            value="chart"
            className="m-0 h-full p-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            {chartPanel}
          </TabsContent>
        </div>

        {/* Bottom Tab Bar */}
        <div className="bg-background border-t">
          <TabsList className="grid h-16 w-full grid-cols-2 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-full flex-col items-center gap-1"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">{t("mobile.tabs.chat")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-full flex-col items-center gap-1"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">{t("mobile.tabs.chart")}</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
