"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Bot, User, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Bot className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">{t("chat.noMessages")}</h3>
          <p className="text-muted-foreground">{t("chat.startConversation")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex max-w-[80%] items-start space-x-2 ${
              message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                message.type === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {message.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Message Content */}
            <div className="flex flex-col space-y-1">
              <Card
                className={`p-3 ${
                  message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}

                  {/* Loading indicator for AI messages */}
                  {message.isLoading && (
                    <div className="mt-2 flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="text-xs opacity-70">{t("chat.aiThinking")}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timestamp */}
              <span
                className={`text-muted-foreground text-xs ${
                  message.type === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Loading Message */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="flex max-w-[80%] items-start space-x-2">
            <div className="bg-secondary text-secondary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="bg-muted p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t("chat.aiTyping")}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
