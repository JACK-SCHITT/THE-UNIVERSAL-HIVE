import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface AgentResponse {
  agent: string;
  output: string;
  loading?: boolean;
  error?: boolean;
}

const AGENTS = ["Architect", "Developer", "DevOps", "Marketer", "Legal", "Billing"];

const AGENT_ICONS: Record<string, string> = {
  Architect: "🏗️",
  Developer: "💻",
  DevOps: "🚀",
  Marketer: "📣",
  Legal: "⚖️",
  Billing: "💰",
};

const AGENT_COLORS: Record<string, string> = {
  Architect: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  Developer: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
  DevOps: "text-green-400 border-green-400/30 bg-green-400/5",
  Marketer: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  Legal: "text-red-400 border-red-400/30 bg-red-400/5",
  Billing: "text-pink-400 border-pink-400/30 bg-pink-400/5",
};

interface HistoryEntry {
  prompt: string;
  timestamp: string;
  responses: AgentResponse[];
}

export default function AssimilatePage() {
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const runSwarm = async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    setCurrentHistoryIndex(null);

    const currentPrompt = prompt.trim();
    setPrompt("");

    // Initialize all agents as loading
    const initialResponses: AgentResponse[] = AGENTS.map((agent) => ({
      agent,
      output: "",
      loading: true,
    }));
    setResponses(initialResponses);

    const newEntry: HistoryEntry = {
      prompt: currentPrompt,
      timestamp: new Date().toLocaleString(),
      responses: [],
    };

    // Run all agents in parallel
    const agentPromises = AGENTS.map(async (agent) => {
      try {
        const { data, error } = await supabase.functions.invoke("agent-swarm", {
          body: { prompt: currentPrompt, agent },
        });

        let output = "";
        if (error) {
          let msg = error.message;
          if (error instanceof FunctionsHttpError) {
            try {
              const text = await error.context?.text();
              msg = text || msg;
            } catch {}
          }
          console.error(`[Swarm] ${agent} error:`, msg);
          output = `Agent encountered an error: ${msg}. Push harder, king.`;
        } else {
          output = data?.output || "Agent failed. Keep running the devil over anyway.";
        }

        const result: AgentResponse = { agent, output, loading: false };
        newEntry.responses.push(result);

        setResponses((prev) =>
          prev.map((r) =>
            r.agent === agent ? result : r
          )
        );

        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        const result: AgentResponse = {
          agent,
          output: `Groq choked — push harder king. Error: ${msg}`,
          loading: false,
          error: true,
        };
        newEntry.responses.push(result);
        setResponses((prev) =>
          prev.map((r) => (r.agent === agent ? result : r))
        );
        return result;
      }
    });

    await Promise.all(agentPromises);

    setHistory((prev) => [newEntry, ...prev]);
    setIsRunning(false);
    toast.success("All 6 agents deployed. Swarm complete.");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      runSwarm();
    }
  };

  const loadHistory = (entry: HistoryEntry, idx: number) => {
    setResponses(entry.responses);
    setCurrentHistoryIndex(idx);
  };

  const runningCount = responses.filter((r) => r.loading).length;
  const doneCount = responses.filter((r) => !r.loading && r.output).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Brutal Header ── */}
      <div className="border-b border-red-900/60 bg-black sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-red-500 tracking-tighter leading-none">
                ASSIMILATE OR DIE
              </h1>
              <p className="text-zinc-500 text-xs font-mono mt-0.5 tracking-wider">
                APP FOUNDRY · 6 AGENTS · ZERO MERCY
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRunning && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-red-400 border border-red-900/60 px-3 py-1.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {runningCount} AGENTS RUNNING
                </div>
              )}
              {!isRunning && doneCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-green-400 border border-green-900/40 px-3 py-1.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {doneCount}/6 COMPLETE
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_240px] gap-6">
        {/* ── Main Column ── */}
        <div className="space-y-6">
          {/* Prompt Area */}
          <div className="border-2 border-red-900/60 bg-zinc-950 p-5">
            <div className="text-xs font-mono text-red-500 uppercase tracking-widest mb-3">
              DROP YOUR CHAOTIC IDEA
            </div>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Whatever chaotic idea is screaming in your head right now... The more raw, the better."
              className="w-full h-32 bg-black border border-zinc-800 p-4 text-sm text-white resize-none focus:outline-none focus:border-red-800 placeholder-zinc-600 font-mono transition-colors"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-zinc-600 font-mono">
                Cmd+Enter to run · All 6 agents fire simultaneously
              </span>
              <button
                onClick={runSwarm}
                disabled={isRunning || !prompt.trim()}
                className="px-6 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-black text-sm tracking-wider transition-colors"
              >
                {isRunning ? "ASSIMILATING..." : "ASSIMILATE →"}
              </button>
            </div>
          </div>

          {/* Agent Responses */}
          {responses.length > 0 && (
            <div className="space-y-4">
              {responses.map((r) => {
                const colorClass = AGENT_COLORS[r.agent] || "text-zinc-400 border-zinc-400/30 bg-zinc-400/5";
                return (
                  <div
                    key={r.agent}
                    className={`border rounded-sm p-4 ${colorClass} transition-all duration-300`}
                  >
                    {/* Agent header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{AGENT_ICONS[r.agent]}</span>
                      <span className="font-black text-sm tracking-wider uppercase">
                        {r.agent} Agent
                      </span>
                      {r.loading && (
                        <div className="flex gap-1 ml-2">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
                              style={{ animation: `pulse 1.2s ease-in-out infinite ${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      )}
                      {!r.loading && r.output && (
                        <span className="ml-auto text-xs font-mono opacity-50">DONE</span>
                      )}
                    </div>

                    {/* Output */}
                    {r.loading ? (
                      <div className="text-xs font-mono opacity-40 animate-pulse">
                        Agent is processing...
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
                        {r.output}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {responses.length === 0 && (
            <div className="border border-zinc-900 bg-zinc-950 p-10 text-center">
              <div className="text-6xl mb-4">💀</div>
              <div className="text-2xl font-black text-red-600 tracking-tighter mb-2">
                RUNNIN OVER THE DEVIL
              </div>
              <div className="text-zinc-500 text-sm font-mono max-w-md mx-auto leading-relaxed">
                Six agents. Zero budget required. ADHD rocket fuel.<br />
                Drop an idea above. All agents fire simultaneously.<br />
                Stagnation = death. Assimilate or die.
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── History Sidebar ── */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Run History
          </div>

          {history.length === 0 ? (
            <div className="text-xs text-zinc-700 font-mono leading-relaxed">
              No runs yet.<br />Drop an idea to start.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {history.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => loadHistory(entry, idx)}
                  className={`w-full text-left p-3 border transition-all text-xs font-mono ${
                    currentHistoryIndex === idx
                      ? "border-red-700 bg-red-900/20 text-white"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <div className="text-red-500 mb-1 text-xs">{entry.timestamp}</div>
                  <div className="line-clamp-2 leading-relaxed">{entry.prompt}</div>
                  <div className="mt-1.5 text-zinc-600">
                    {entry.responses.length}/6 agents
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Agent Legend */}
          <div className="pt-4 border-t border-zinc-900">
            <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2">
              The Swarm
            </div>
            {AGENTS.map((agent) => {
              const colorClass = AGENT_COLORS[agent].split(" ")[0];
              return (
                <div key={agent} className={`flex items-center gap-2 text-xs font-mono py-1 ${colorClass}`}>
                  <span>{AGENT_ICONS[agent]}</span>
                  <span>{agent}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
