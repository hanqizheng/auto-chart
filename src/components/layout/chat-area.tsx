"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  className?: string;
  messageList: ReactNode;
  input?: ReactNode;
  chatInput?: ReactNode;
}

export function ChatArea({ className, messageList, input, chatInput }: ChatAreaProps) {
  const inputElement = chatInput || input;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex-1 overflow-hidden">{messageList}</div>
      {inputElement && <div className="flex-shrink-0">{inputElement}</div>}
    </div>
  );
}
