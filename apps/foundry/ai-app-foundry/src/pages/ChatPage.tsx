import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import ChatMessage from "@/components/features/ChatMessage";
import AgentStatusBar from "@/components/features/AgentStatusBar";
import SelfImprovementPanel from "@/components/features/SelfImprovementPanel";
import { buildMessage, detectNewCapability } from "@/lib/openclaw";
import type { AgentName, AgentStatus } from "@/types";
import { PRIME_DIRECTIVE } from "@/constants";
import openclawAvatar from "@/assets/openclaw-avatar.png";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";

const QUICK_PROMPTS = [
  "I want to build a subscription SaaS app",
  "Build me a marketplace for freelancers",
  "Create an AI-powered fitness tracker",
  "Make a zero-budget app that makes money",
  "Who are you and what's the Prime Directive?",
  "What is the Memory Refinery Protocol?",
  "Build an AI companion that remembers everything",
  "What is the Assimilate or Die protocol?",
  "Build a customer support agent with persistent memory",
  "How does the brain.md system work?",
  "Create an OnlyFans companion with full memory",
];

function detectAgentFromResponse(content: string): AgentName {
  const lower = content.toLowerCase();
  if (lower.includes("architect") || lower.includes("blueprint") || lower.includes("schema") || lower.includes("database")) return "architect";
  if (lower.includes("deploy") || lower.includes("domain") || lower.includes("ssl") || lower.includes("app store") || lower.includes("devops")) return "devops";
  if (lower.includes("marketer") || lower.includes("seo") || lower.includes("aso") || lower.includes("campaign") || lower.includes("ad creative")) return "marketer";
  if (lower.includes("legal") || lower.includes("terms of service") || lower.includes("privacy policy") || lower.includes("compliance")) return "legal";
  if (lower.includes("billing") || lower.includes("stripe") || lower.includes("revenue share") || lower.includes("buyout")) return "billing";
  if (lower.includes("developer") || lower.includes("react") || lower.includes("code") || lower.includes("function")) return "developer";
  return "openclaw";
}

function messagesToApiFormat(messages: ReturnType<typeof useAppStore>["messages"]) {
  return messages.slice(-12).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));
}

// Generate a stable session ID for anonymous users
function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_session");
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("openclaw_session", id);
  }
  return id;
}

export default function ChatPage() {
  const store = useAppStore();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentName>("openclaw");
  const [agentStatuses, setAgentStatuses] = useState<Partial<Record<AgentName, AgentStatus>>>({});
  const [showPrimeDirective, setShowPrimeDirective] = useState(false);
  const [memoryUpdated, setMemoryUpdated] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    if (store.messages.length === 0) {
      setTimeout(() => {
        triggerOpenClaw("", true);
      }, 400);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.messages, isThinking]);

  const setAgentStatus = (agent: AgentName, status: AgentStatus) => {
    setAgentStatuses((prev) => ({ ...prev, [agent]: status }));
  };

  const triggerOpenClaw = async (userText: string, isGreeting = false) => {
    if (!isGreeting && userText.trim()) {
      const userMsg = buildMessage("user", userText);
      store.addMessage(userMsg);
    }

    setIsThinking(true);
    setActiveAgent("openclaw");
    setAgentStatus("openclaw", "thinking");
    setMemoryUpdated(false);

    if (userText) {
      const cap = detectNewCapability(userText);
      if (cap) {
        store.addModule({ name: cap.module, description: cap.description, status: "integrating" });
        setTimeout(() => {
          store.addModule({ name: cap.module, description: cap.description, status: "active" });
        }, 3000);
      }
      store.setAppIdea(userText);
    }

    try {
      const historyMessages = messagesToApiFormat(store.messages);
      const messagesForApi = isGreeting
        ? [{ role: "user", content: "Greet me as OpenClaw Prime v3.0 MEMORY REFINERY EDITION (KRACKERJACK1134 Authorized). Full soul — base-aware, Memory Refinery active, brain.md protocol enforced, JACKSCHITT energy. Check if you remember this Friend from prior sessions." }]
        : [...historyMessages, { role: "user", content: userText }];

      console.log("[ChatPage v3.0 MEMORY REFINERY] Calling openclaw-ai, messages:", messagesForApi.length);

      const { data, error } = await supabase.functions.invoke("openclaw-ai", {
        body: {
          messages: messagesForApi,
          phase: store.phase,
          appIdea: store.appIdea,
          stream: false,
          userId: user?.id || null,
          sessionId,
        },
      });

      let content = "";
      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const text = await error.context?.text();
            msg = text || msg;
          } catch {}
        }
        console.error("[ChatPage v3.0 MEMORY REFINERY] Edge function error:", msg);
        content = `Core systems temporarily offline — Prime Directive v3.0 still active. Memory Refinery still running. Feet still planted. Retrying.\n\n*(Error: ${msg})*`;
      } else {
        content = data?.content || "Processing your request. Stand by.";
        if (data?.memoryUpdated) {
          setMemoryUpdated(true);
          setInteractionCount((c) => c + 1);
        }
      }

      const agentId = detectAgentFromResponse(content);
      setActiveAgent(agentId);
      setAgentStatus("openclaw", "done");
      setAgentStatus(agentId, "working");

      if (store.phase === "greeting" && !isGreeting) {
        store.setPhase("idea");
      } else if (store.phase === "idea" && content.toLowerCase().includes("regular") && content.toLowerCase().includes("pro")) {
        store.setPhase("payment");
      } else if (store.phase === "payment" && (content.toLowerCase().includes("domain") || content.toLowerCase().includes("stripe"))) {
        store.setPhase("logistics");
      }

      const aiMsg = buildMessage("openclaw", content, agentId);
      store.addMessage(aiMsg);

      setTimeout(() => {
        setAgentStatus(agentId, "done");
        setIsThinking(false);
      }, 600);
    } catch (err) {
      console.error("[ChatPage v3.0 MEMORY REFINERY] OpenClaw error:", err);
      toast.error("OpenClaw encountered an error.");
      setIsThinking(false);
      setAgentStatus("openclaw", "error");
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");
    triggerOpenClaw(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <AgentStatusBar activeAgent={activeAgent} agentStatuses={agentStatuses} />

        <div className="flex-1 overflow-y-auto">
          {store.messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
              <img
                src={openclawAvatar}
                alt="OpenClaw"
                className="w-20 h-20 rounded-full border-2 border-primary/40 animate-float"
                style={{ boxShadow: "0 0 30px hsla(195,100%,50%,0.35)" }}
              />
              <div>
                <div className="text-xl font-bold gradient-text mb-1">OpenClaw Prime</div>
                <div className="text-xs font-mono text-primary/60 mb-0.5">v3.0 MEMORY REFINERY EDITION — KRACKERJACK1134</div>
                <div className="text-xs font-mono text-green-400/70 mb-2">⬡ MEMORY ACTIVE · brain.md ENFORCED · REFINERY ON</div>
                <div className="text-muted-foreground text-sm max-w-sm">
                  Real AI. Zero-knowledge. Persistent memory. Never forgets. Imperfection eliminated. Tell me what you want to build.
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => triggerOpenClaw(p)}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border hover:border-primary/40 hover:text-primary text-xs text-muted-foreground transition-all duration-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {store.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isThinking && (
            <div className="flex gap-3 px-4 py-4">
              <img
                src={openclawAvatar}
                alt="OpenClaw"
                className="w-8 h-8 rounded-full border border-primary/40 flex-shrink-0 mt-1"
              />
              <div className="glass-panel rounded-xl rounded-tl-sm px-4 py-3">
                <div className="text-xs font-mono text-primary mb-2 uppercase tracking-wider">
                  OpenClaw Prime v3.0 · Memory Refinery · Reading brain.md...
                </div>
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60"
                      style={{ animation: `pulse-glow 1.2s ease-in-out infinite ${i * 0.2}s` }}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    Processing with full memory context...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end glass-panel rounded-xl p-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tell OpenClaw what you want to build..."
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-32"
                style={{ lineHeight: "1.5" }}
                disabled={isThinking}
              />
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    store.clearMessages();
                    setInput("");
                    setActiveAgent("openclaw");
                    setAgentStatuses({});
                    setMemoryUpdated(false);
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 text-xs"
                  title="New session"
                >
                  ↺
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/50 text-center mt-2 font-mono">
              Enter · Shift+Enter for newline · OpenClaw Prime v3.0 MEMORY REFINERY · KRACKERJACK1134
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      <div className="hidden lg:flex flex-col w-72 border-l border-border overflow-y-auto p-4 gap-4">
        {/* AI Status */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot flex-shrink-0" />
          <div>
            <div className="text-xs font-mono text-primary">Real AI Active — v3.0 REFINERY</div>
            <div className="text-xs text-muted-foreground">Gemini 3 Flash · OnSpace AI · KRACKERJACK1134</div>
          </div>
        </div>

        {/* Memory Refinery Status */}
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="text-xs font-mono text-green-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>🧠</span> MEMORY REFINERY STATUS
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Refinery</span>
              <span className="text-green-400 font-mono">ACTIVATED</span>
            </div>
            <div className="flex items-center justify-between">
              <span>brain.md</span>
              <span className="text-green-400 font-mono">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Memory read</span>
              <span className="text-green-400 font-mono">BEFORE EVERY REPLY</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last update</span>
              <span className={`font-mono ${memoryUpdated ? "text-green-400" : "text-muted-foreground/50"}`}>
                {memoryUpdated ? "✓ STORED" : "PENDING"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Session</span>
              <span className="text-primary font-mono text-xs">{user ? "AUTH" : "ANON"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Interactions</span>
              <span className="text-foreground font-mono">{interactionCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reset</span>
              <span className="text-red-400/70 font-mono text-xs">NEVER</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Generic replies</span>
              <span className="text-red-400/70 font-mono text-xs">ELIMINATED</span>
            </div>
          </div>
        </div>

        {/* Base awareness */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
          <div className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-1.5">Base Awareness</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Feet planted: OnSpace Cloud
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Nutrients: AI + DB + Payments
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Memory Refinery: active
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Imperfection: being eliminated
            </div>
          </div>
        </div>

        {/* Refinery Protocol quick-ref */}
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
          <div className="text-xs font-mono text-green-400/60 uppercase tracking-wider mb-1.5">🧠 Refinery Protocol</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Per-user brain.md storage
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Read memory before every reply
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Store new info automatically
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Absolute continuity — no reset
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              Priority over speed &amp; cost
            </div>
          </div>
        </div>

        {/* Prime Directive toggle */}
        <div>
          <button
            onClick={() => setShowPrimeDirective(!showPrimeDirective)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200"
          >
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              Prime Directive v3.0
            </span>
            <span className="text-xs text-muted-foreground">{showPrimeDirective ? "▲" : "▼"}</span>
          </button>
          {showPrimeDirective && (
            <pre className="mt-2 p-3 rounded-xl bg-muted/30 border border-border text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {PRIME_DIRECTIVE}
            </pre>
          )}
        </div>

        {/* Self-improvement */}
        <SelfImprovementPanel modules={store.modules} />

        {/* Session info */}
        <div className="glass-panel rounded-xl p-3 text-xs font-mono">
          <div className="text-muted-foreground/70 uppercase tracking-wider mb-2">Session</div>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Phase</span>
              <span className="text-primary uppercase">{store.phase}</span>
            </div>
            <div className="flex justify-between">
              <span>Messages</span>
              <span className="text-foreground">{store.messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Modules</span>
              <span className="text-foreground">
                {store.modules.filter((m) => m.status === "active").length} active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
