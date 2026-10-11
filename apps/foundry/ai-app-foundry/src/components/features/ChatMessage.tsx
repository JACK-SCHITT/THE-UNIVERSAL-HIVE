import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import { AGENTS } from "@/constants";
import openclawAvatar from "@/assets/openclaw-avatar.png";

interface Props {
  message: ChatMessageType;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="font-mono text-primary bg-primary/10 px-1 rounded">$1</code>')
    .replace(/^→ (.+)$/gm, '<span class="text-muted-foreground">→</span> $1')
    .replace(/^✓ (.+)$/gm, '<span class="text-green-400">✓</span> $1')
    .replace(/^📈|📱|🌐|🔍|🎨|📧|🔔|🏗️|💻|🚀|📣|⚖️|💰|⚡|🧠|🔐 (.+)$/gm, '<span class="text-primary">$&</span>')
    .replace(/\n/g, "<br />");
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const agent = message.agentId ? AGENTS.find((a) => a.id === message.agentId) : null;

  const agentColor = agent?.color ?? "#00D4FF";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4 animate-fade-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar — AI side */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          {message.agentId === "openclaw" || !message.agentId ? (
            <img
              src={openclawAvatar}
              alt="OpenClaw"
              className="w-8 h-8 rounded-full border border-primary/40"
              style={{ boxShadow: "0 0 10px hsla(195,100%,50%,0.3)" }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base border"
              style={{
                borderColor: `${agentColor}60`,
                background: `${agentColor}18`,
                boxShadow: `0 0 10px ${agentColor}30`,
              }}
            >
              {agent?.icon ?? "🤖"}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary/15 border border-primary/30 text-foreground rounded-tr-sm"
            : "glass-panel text-foreground rounded-tl-sm"
        )}
      >
        {/* Agent label */}
        {!isUser && (
          <div
            className="text-xs font-mono font-semibold mb-1.5 uppercase tracking-wider"
            style={{ color: agentColor }}
          >
            {agent?.label ?? "OpenClaw Prime"}
          </div>
        )}

        {/* Content */}
        <div
          className="space-y-1"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
        />

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground/50 mt-2 font-mono">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Avatar — user side */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
            YOU
          </div>
        </div>
      )}
    </div>
  );
}
