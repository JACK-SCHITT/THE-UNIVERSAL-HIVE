import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { TerminalEnv } from "./TerminalEmulator";

interface SkillResult {
  skill: string;
  input: string;
  output: string;
  timestamp: number;
}

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
}

const SKILLS = [
  {
    id: "web-search",
    name: "Web Search",
    icon: "🌐",
    description: "Ask OpenClaw to research any topic",
    placeholder: "What do you want to research?",
    category: "Research",
    command: (input: string) => `openclaw search and give me detailed information about: ${input}`,
  },
  {
    id: "code-explain",
    name: "Explain Code",
    icon: "🔍",
    description: "Paste code and get a full explanation",
    placeholder: "Paste code here...",
    category: "Code",
    command: (input: string) => `openclaw explain this code in detail: ${input}`,
  },
  {
    id: "code-optimize",
    name: "Optimize Code",
    icon: "⚡",
    description: "Improve performance of your code",
    placeholder: "Paste code to optimize...",
    category: "Code",
    command: (input: string) => `openclaw optimize this code for performance and best practices: ${input}`,
  },
  {
    id: "convert-code",
    name: "Convert Code",
    icon: "🔄",
    description: "Convert code between languages",
    placeholder: "Paste code + specify target language...",
    category: "Code",
    command: (input: string) => `openclaw convert this code to the target language specified: ${input}`,
  },
  {
    id: "write-tests",
    name: "Write Tests",
    icon: "🧪",
    description: "Generate unit tests for your code",
    placeholder: "Paste function/class to test...",
    category: "Code",
    command: (input: string) => `openclaw write comprehensive unit tests for: ${input}`,
  },
  {
    id: "security-audit",
    name: "Security Audit",
    icon: "🔐",
    description: "Audit code or system for vulnerabilities",
    placeholder: "Paste code or describe system...",
    category: "Security",
    command: (input: string) => `hive devops perform a thorough security audit of: ${input}`,
  },
  {
    id: "api-design",
    name: "API Design",
    icon: "📡",
    description: "Design REST/GraphQL API endpoints",
    placeholder: "Describe your app's data needs...",
    category: "Architecture",
    command: (input: string) => `hive architect design complete API endpoints for: ${input}`,
  },
  {
    id: "db-schema",
    name: "DB Schema",
    icon: "🗄️",
    description: "Generate database schema from description",
    placeholder: "Describe your data model...",
    category: "Architecture",
    command: (input: string) => `hive architect generate a complete database schema with indexes and constraints for: ${input}`,
  },
  {
    id: "marketing-copy",
    name: "Marketing Copy",
    icon: "📣",
    description: "Write SEO copy, taglines, descriptions",
    placeholder: "Describe your app/product...",
    category: "Marketing",
    command: (input: string) => `hive marketer write compelling marketing copy, taglines, and SEO description for: ${input}`,
  },
  {
    id: "legal-docs",
    name: "Legal Docs",
    icon: "⚖️",
    description: "Generate ToS and Privacy Policy",
    placeholder: "Describe your app and data it collects...",
    category: "Legal",
    command: (input: string) => `hive legal generate complete Terms of Service and Privacy Policy for: ${input}`,
  },
  {
    id: "revenue-model",
    name: "Revenue Model",
    icon: "💰",
    description: "Calculate revenue share and buyout",
    placeholder: "App type, monthly revenue, growth rate...",
    category: "Billing",
    command: (input: string) => `hive billing calculate detailed revenue projections, success stake, and buyout value for: ${input}`,
  },
  {
    id: "prime-directive",
    name: "Prime Directive",
    icon: "⚡",
    description: "Query the full Prime Directive v3.0",
    placeholder: "Ask anything about the Prime Directive...",
    category: "System",
    command: (_: string) => `prime-directive`,
  },
  {
    id: "memory-show",
    name: "My Memory",
    icon: "🧠",
    description: "View your persistent brain.md",
    placeholder: "Your Friend memory context...",
    category: "System",
    command: (_: string) => `memory show`,
  },
  {
    id: "refinery-status",
    name: "Refinery Status",
    icon: "🔬",
    description: "Check Memory Refinery health",
    placeholder: "Refinery status output...",
    category: "System",
    command: (_: string) => `refinery status`,
  },
  {
    id: "all-agents",
    name: "All 6 Agents",
    icon: "💀",
    description: "Fire all swarm agents simultaneously",
    placeholder: "Your mission for all 6 agents...",
    category: "Hive",
    command: (input: string) => `hive all ${input}`,
  },
  {
    id: "assimilate",
    name: "Assimilate AI",
    icon: "🌀",
    description: "Attempt to assimilate an AI into the hive",
    placeholder: "Name of AI to assimilate...",
    category: "Hive",
    command: (input: string) => `assimilate ${input}`,
  },
];

const CATEGORIES = ["All", "Code", "Architecture", "Research", "Security", "Marketing", "Legal", "Billing", "Hive", "System"];

function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_terminal_session");
  if (!id) { id = `ts_${Date.now()}`; sessionStorage.setItem("openclaw_terminal_session", id); }
  return id;
}

export default function OpenClawSkills({ env, onRunCommand }: Props) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [activeSkill, setActiveSkill] = useState<typeof SKILLS[0] | null>(null);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SkillResult[]>([]);
  const [activeResult, setActiveResult] = useState<SkillResult | null>(null);

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  const filtered = SKILLS.filter((s) => {
    if (activeCategory !== "All" && s.category !== activeCategory) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const runSkillInTerminal = useCallback((skill: typeof SKILLS[0], skillInput: string) => {
    const cmd = skill.command(skillInput);
    onRunCommand(cmd);
  }, [onRunCommand]);

  const runSkillViaAI = useCallback(async (skill: typeof SKILLS[0], skillInput: string) => {
    setIsRunning(true);
    setActiveResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("openclaw-ai", {
        body: {
          messages: [{ role: "user", content: skill.command(skillInput) }],
          userId: user?.id || null,
          sessionId: getSessionId(),
        },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context?.text()) || msg; } catch {}
        }
        throw new Error(msg);
      }

      const output = data?.content || "No response";
      const result: SkillResult = {
        skill: skill.name,
        input: skillInput,
        output,
        timestamp: Date.now(),
      };
      setResults((prev) => [result, ...prev.slice(0, 19)]);
      setActiveResult(result);
    } catch (err) {
      toast.error(`Skill error: ${(err as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  }, [user]);

  const handleRun = useCallback(() => {
    if (!activeSkill) return;
    const isTerminalSkill = ["prime-directive", "memory-show", "refinery-status"].includes(activeSkill.id);
    if (isTerminalSkill) {
      runSkillInTerminal(activeSkill, input);
    } else {
      runSkillViaAI(activeSkill, input);
    }
  }, [activeSkill, input, runSkillInTerminal, runSkillViaAI]);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b ${accentBorder} ${accentBg}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>⚡ OpenClaw Skills</div>
        <div className="text-white/30 text-xs">
          {SKILLS.length} skills · Prime Directive v3.0
        </div>
      </div>

      {/* Active skill result pane */}
      {activeResult && (
        <div className={`flex-shrink-0 border-b ${accentBorder} max-h-40 flex flex-col`}>
          <div className={`px-2 py-1 flex items-center justify-between bg-black/30 border-b ${accentBorder}`}>
            <span className={`text-xs font-bold ${accent}`}>✓ {activeResult.skill}</span>
            <button onClick={() => setActiveResult(null)} className="text-xs text-white/40 hover:text-white/70">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <pre className="text-white/70 text-xs whitespace-pre-wrap break-words leading-relaxed">
              {activeResult.output.slice(0, 600)}
              {activeResult.output.length > 600 && `\n...(${activeResult.output.length - 600} more chars)`}
            </pre>
          </div>
        </div>
      )}

      {/* Active skill form */}
      {activeSkill && (
        <div className={`flex-shrink-0 border-b ${accentBorder} p-2 bg-black/30`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{activeSkill.icon}</span>
            <span className={`font-bold text-xs ${accent}`}>{activeSkill.name}</span>
            <button onClick={() => { setActiveSkill(null); setInput(""); }} className="ml-auto text-white/40 hover:text-white/70 text-xs">✕</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleRun(); }}
            placeholder={activeSkill.placeholder}
            rows={3}
            className="w-full bg-black/60 border border-white/15 rounded px-2 py-1.5 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs resize-none mb-1.5"
          />
          <div className="flex gap-1">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`flex-1 py-1.5 rounded border font-bold text-xs transition-all disabled:opacity-40 ${accentBtn}`}
            >
              {isRunning ? "⏳ Running..." : "⚡ Run Skill"}
            </button>
            <button
              onClick={() => runSkillInTerminal(activeSkill, input)}
              className="px-2 py-1 rounded border border-white/15 text-white/50 hover:text-white/80 text-xs"
              title="Send to terminal"
            >
              → Term
            </button>
          </div>
          <div className="text-white/15 text-xs text-center mt-1">Ctrl+Enter to run</div>
        </div>
      )}

      {/* Search + categories */}
      {!activeSkill && (
        <>
          <div className={`flex-shrink-0 p-2 border-b ${accentBorder}`}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-black/60 border border-white/15 rounded px-2 py-1 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs"
            />
          </div>
          <div className={`flex-shrink-0 p-2 flex flex-wrap gap-1 border-b ${accentBorder}`}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-0.5 rounded text-xs transition-all border ${
                  activeCategory === cat ? accentBtn : "text-white/30 border-white/10 hover:text-white/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Skills grid */}
      {!activeSkill && (
        <div className="flex-1 overflow-y-auto">
          {filtered.map((skill) => (
            <div
              key={skill.id}
              onClick={() => setActiveSkill(skill)}
              className={`flex items-start gap-2 px-2 py-2 border-b ${accentBorder} cursor-pointer hover:bg-white/5 group`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{skill.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-xs ${accent}`}>{skill.name}</div>
                <div className="text-white/40 text-xs leading-tight mt-0.5">{skill.description}</div>
                <div className={`text-xs px-1 rounded border mt-0.5 inline-block ${accentBg} ${accentBorder} text-white/40`}>
                  {skill.category}
                </div>
              </div>
              <span className="text-white/20 group-hover:text-white/60 text-xs flex-shrink-0 mt-1">▶</span>
            </div>
          ))}
        </div>
      )}

      {/* Result history */}
      {activeSkill && results.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-white/20 text-xs uppercase tracking-wider border-b border-white/10">History</div>
          {results.map((r) => (
            <div
              key={r.timestamp}
              onClick={() => setActiveResult(r)}
              className="flex items-center gap-2 px-2 py-1.5 border-b border-white/5 cursor-pointer hover:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${accent}`}>{r.skill}</div>
                <div className="text-white/30 text-xs truncate">{r.input.slice(0, 30)}</div>
              </div>
              <span className="text-white/20 text-xs">→</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={`flex-shrink-0 px-2 py-1 border-t ${accentBorder} text-white/20 text-xs flex justify-between`}>
        <span>{filtered.length} skills available</span>
        <span className={accent}>Skills</span>
      </div>
    </div>
  );
}
