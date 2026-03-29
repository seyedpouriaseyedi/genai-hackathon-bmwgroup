import { useState, useRef, useEffect } from "react";
import { Bot, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { ArrowUp, Square } from "lucide-react";
import { scenarios } from "@/data/scenarios";

interface Message {
  role: "assistant" | "user";
  content: string;
  suggestedScenario?: string;
}

interface ScenarioAdvisorProps {
  selected: string[];
  onToggleScenario: (id: string) => void;
  onClose: () => void;
}

function getAIResponse(input: string): Message {
  const lower = input.toLowerCase();

  if (lower.match(/crisis|risk|disrupt|supplier|uncertain|emergency|shortage/)) {
    return {
      role: "assistant",
      content: `Based on your focus on **risk and disruption**, I'd recommend **Supply Chain Disruption**.\n\nBest for crisis handling, supplier issues, and fast decision-making under pressure.`,
      suggestedScenario: "supply-chain",
    };
  }

  if (lower.match(/digital|tech|innovat|transform|automat|ai|data|modern/)) {
    return {
      role: "assistant",
      content: `Your interest in **technology and innovation** points to **Digital Transformation**.\n\nBest for process change, system adoption, and cross-functional transformation.`,
      suggestedScenario: "digital-transform",
    };
  }

  if (lower.match(/stable|continu|internal|maintain|steady|optim|efficien|lean/)) {
    return {
      role: "assistant",
      content: `For **operational stability and continuity**, I'd suggest **Operational Continuity**.\n\nBest for stable operations, internal coordination, and continuity-focused leadership.`,
      suggestedScenario: "operational",
    };
  }

  return {
    role: "assistant",
    content: `I can help you choose! Here are the three available scenarios:\n\n1. **Supply Chain Disruption** — Best for crisis handling, supplier issues, and fast decision-making under pressure.\n2. **Digital Transformation** — Best for process change, system adoption, and cross-functional transformation.\n3. **Operational Continuity** — Best for stable operations, internal coordination, and continuity-focused leadership.\n\nTell me more about your priorities. For example:\n- Are you dealing with a *crisis* or *disruption*?\n- Is your focus on *digital innovation*?\n- Do you need *stability* and *continuity*?`,
  };
}

const ScenarioAdvisor = ({ selected, onToggleScenario, onClose }: ScenarioAdvisorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your scenario advisor. Tell me about your current business priorities and I'll recommend the best scenario for your candidate evaluation.\n\nWhat challenges are you facing?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const response = getAIResponse(userMsg.content);
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 800 + Math.random() * 600);
  };

  const scenarioTitle = (id: string) => scenarios.find((s) => s.id === id)?.title || id;

  return (
    <div className="glass-card p-0 overflow-hidden animate-fade-in w-full max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">Scenario Advisor</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-64 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-card-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="space-y-2">
                  {msg.content.split("\n").map((line, j) => {
                    if (!line.trim()) return <br key={j} />;
                    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
                    return <p key={j} dangerouslySetInnerHTML={{ __html: formatted }} />;
                  })}
                  {msg.suggestedScenario && (
                    <button
                      onClick={() => onToggleScenario(msg.suggestedScenario!)}
                      className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        selected.includes(msg.suggestedScenario)
                          ? "bg-success/20 text-success"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                      }`}
                    >
                      {selected.includes(msg.suggestedScenario) ? (
                        <><Check className="w-3 h-3" /> {scenarioTitle(msg.suggestedScenario)} selected</>
                      ) : (
                        <>Select {scenarioTitle(msg.suggestedScenario)}</>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="border-0 bg-transparent p-0"
        >
          <PromptInputTextarea placeholder="Describe your business priorities..." />
          <PromptInputActions className="justify-end pt-2">
            <PromptInputAction tooltip={isLoading ? "Stop" : "Send"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
};

export default ScenarioAdvisor;
