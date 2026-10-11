import { cn } from "@/lib/utils";
import { AGENTS } from "@/constants";
import type { AgentName, AgentStatus } from "@/types";

interface Props {
  activeAgent?: AgentName;
  agentStatuses?: Partial<Record<AgentName, AgentStatus>>;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "bg-muted-foreground/40",
  thinking: "bg-amber-400 animate-pulse",
  working: "bg-primary animate-pulse",
  done: "bg-green-500",
  error: "bg-destructive",
};

export default function AgentStatusBar({ activeAgent, agentStatuses = {} }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border-b border-border/60">
      {AGENTS.map((agent) => {
        const isActive = agent.id === activeAgent;
        const status = agentStatuses[agent.id] ?? "idle";
        return (
          <div
            key={agent.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono transition-all duration-300",
              isActive
                ? "bg-primary/10 border border-primary/40 text-primary"
                : "bg-secondary/50 border border-border/50 text-muted-foreground"
            )}
            title={agent.description}
          >
            <span className="text-xs">{agent.icon}</span>
            <span className="hidden sm:inline">{agent.label}</span>
            <span
              className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_COLORS[status])}
            />
          </div>
        );
      })}
    </div>
  );
}
