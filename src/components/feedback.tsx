"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedBack() {
  const handleFeedBackClick = () => {
    window.open("https://autochart.featurebase.app/", "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleFeedBackClick}
      className="bg-primary/20 hover:bg-primary/30 border-primary h-9 w-9 animate-pulse cursor-pointer rounded-md border-2 px-0"
    >
      <MessageCircle className="text-primary h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Send Feedback</span>
    </Button>
  );
}
