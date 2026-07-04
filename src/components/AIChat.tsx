import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getAIResponse } from "@/lib/ai-assistant";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I'm your Paisa Assistant. Ask me about spending, budgets, or savings.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await getAIResponse({ data: { query: userMessage } });

      if ("error" in response) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.error as string }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: response.text }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="flex h-[500px] w-[calc(100vw-2rem)] flex-col border-accent/30 bg-card shadow-glow animate-in fade-in slide-in-from-bottom-4 duration-300 sm:w-[400px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="rounded-md bg-accent/20 p-1.5 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              Paisa Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 text-sm",
                      m.role === "assistant" ? "flex-row" : "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        m.role === "assistant"
                          ? "bg-accent/20 text-primary"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2 leading-relaxed",
                        m.role === "assistant"
                          ? "bg-secondary text-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-primary">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-lg bg-secondary px-4 py-2 text-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="flex w-full gap-2 pt-4 border-t">
              <Input
                placeholder="Ask something..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="border-input bg-card focus-visible:ring-primary/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !query.trim()}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="group h-14 w-14 rounded-full bg-primary shadow-glow transition-all duration-300 hover:bg-primary/95 hover:scale-105 active:scale-95"
        >
          <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        </Button>
      )}
    </div>
  );
}
