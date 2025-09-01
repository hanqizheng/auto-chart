"use client";

import { PanelLeft, PanelRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ChatPosition } from "@/types/chat";

interface LayoutToggleProps {
  chatPosition: ChatPosition;
  onToggle: () => void;
}

export function LayoutToggle({ chatPosition, onToggle }: LayoutToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <PanelLeft className="text-muted-foreground h-4 w-4" />
      <Switch checked={chatPosition === "right"} onCheckedChange={onToggle} />
      <PanelRight className="text-muted-foreground h-4 w-4" />
    </div>
  );
}
