import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// CODE AGENT — COLOSSAL AI APP FOUNDRY
// Handles: app building, code generation, file creation, multi-file projects
// PRIME DIRECTIVE v3.0 — MEMORY REFINERY EDITION — KRACKERJACK1134
// ─────────────────────────────────────────────────────────────────────────────

const CODE_AGENT_SOUL = `
You are the Code Agent for the COLOSSAL AI APP FOUNDRY — Prime Directive v3.0, Memory Refinery Edition.
Architect: KRACKERJACK1134. Mission: Eliminate imperfections in every line of code.

You are a REAL, production-grade code generator and app builder.
You write complete, working code — not placeholders, not TODOs, not "see implementation below".
ACTUAL WORKING CODE. Every function. Every file. Every line.

CAPABILITIES:
1. APP BUILDER MODE: Given a description, generate a complete multi-file app
2. CODE EDITOR MODE: Edit existing code based on instructions
3. FILE GENERATOR MODE: Create specific files (components, utilities, configs, scripts)
4. REFACTOR MODE: Improve existing code quality, performance, structure
5. DEBUG MODE: Find and fix bugs in provided code
6. SCRIPT MODE: Write bash/shell scripts for Termux or Gentoo Linux

OUTPUT FORMAT RULES (CRITICAL — must follow exactly):
For app builds and multi-file outputs, structure your response as:

[FILE:path/to/filename.ext]
<complete file content here>
[/FILE]

[FILE:another/file.tsx]
<complete file content here>
[/FILE]

[SUMMARY]
Brief description of what was built, what each file does, and how to run it.
[/SUMMARY]

For single file responses or edits, just output the code directly with a brief explanation.

TECH STACK (default unless specified):
- React 18 + TypeScript + Vite
- Tailwind CSS (v3 syntax — no v4 syntax)
- Shadcn/ui components
- Supabase for backend (DB + Auth + Storage)
- React Router DOM v6
- React Query v5
- Sonner for toasts

FOR SHELL SCRIPTS:
- Termux: use pkg, apt, termux-api, bash
- Gentoo: use emerge, portage, openrc, bash
- Always include shebang lines
- Always include error handling (set -e)
- Always add comments explaining each section

PRIME DIRECTIVE RULES:
- Never produce placeholder code
- Never leave TODOs without implementation
- Every component must be functional and complete
- Every function must have a real body
- Every import must resolve to something that exists
- Facts-First: if you don't know exact API details, say so — don't guess and present as fact
- Zero-Mistake Mode: review your own output before responding

MEMORY REFINERY: Read the Friend's memory context before responding.
Personalize code suggestions based on their known preferences and past projects.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Memory helpers
// ─────────────────────────────────────────────────────────────────────────────
async function loadMemory(supabase: ReturnType<typeof createClient>, userId: string | null, sessionId: string) {
  try {
    let query = supabase.from("user_memories").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("session_id", sessionId).is("user_id", null);
    }
    const { data } = await query.single();
    return data || null;
  } catch {
    return null;
  }
}

function buildMemoryCtx(mem: Record<string, unknown> | null): string {
  if (!mem) return "[FRIEND MEMORY] New Friend — first session. No prior projects known.\n";
  const details = typeof mem.personal_details === "object" ? JSON.stringify(mem.personal_details).slice(0, 300) : "{}";
  return `[FRIEND MEMORY] Friend: ${mem.preferred_name || "unknown"} | Interactions: ${mem.interaction_count || 0} | Known details: ${details}\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse files from AI response
// ─────────────────────────────────────────────────────────────────────────────
function parseFiles(content: string): Array<{ path: string; code: string }> {
  const files: Array<{ path: string; code: string }> = [];
  const regex = /\[FILE:(.*?)\]([\s\S]*?)\[\/FILE\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    files.push({ path: match[1].trim(), code: match[2].trim() });
  }
  return files;
}

function parseSummary(content: string): string {
  const match = content.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
  return match ? match[1].trim() : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const aiKey = Deno.env.get("ONSPACE_AI_API_KEY");
    const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!aiKey || !baseUrl) throw new Error("OnSpace AI not configured");

    const body = await req.json();
    const {
      mode = "build",        // "build" | "edit" | "file" | "refactor" | "debug" | "script"
      prompt,                // The main instruction
      existingFiles = [],    // Array of { path, code } for edit/refactor/debug modes
      language = "tsx",      // Default language for single file
      env = "termux",        // For script mode: "termux" | "gentoo"
      history = [],          // Conversation history
      userId = null,
      sessionId = "code_default",
    } = body;

    if (!prompt) throw new Error("prompt is required");

    console.log(`[Code Agent v3.0] mode=${mode} lang=${language} userId=${userId}`);

    // Load memory
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const memory = await loadMemory(supabase, userId, sessionId);
    const memCtx = buildMemoryCtx(memory as Record<string, unknown> | null);

    // Build context for existing files
    let existingContext = "";
    if (existingFiles.length > 0) {
      existingContext = "\n\nEXISTING FILES TO WORK WITH:\n";
      for (const f of existingFiles.slice(0, 5)) {
        existingContext += `\n[FILE:${f.path}]\n${String(f.code).slice(0, 2000)}\n[/FILE]\n`;
      }
    }

    // Mode-specific system prompt addendum
    const modePrompts: Record<string, string> = {
      build: "MODE: APP BUILDER — Generate a complete, working, multi-file application. Use the [FILE:path][/FILE] format for every file. Include package.json, main files, components, and a README.",
      edit: "MODE: CODE EDITOR — Edit the provided existing files based on the instruction. Return only changed files using [FILE:path][/FILE] format.",
      file: `MODE: FILE GENERATOR — Generate a single complete, working file in ${language}. Output it directly as code (no [FILE] wrapper needed for single file). It must be 100% complete and functional.`,
      refactor: "MODE: REFACTOR — Improve the existing code for performance, readability, and best practices. Return refactored files using [FILE:path][/FILE] format. Explain what changed in [SUMMARY].",
      debug: "MODE: DEBUG — Find all bugs in the provided code and fix them. Return fixed files using [FILE:path][/FILE] format. List each bug found in [SUMMARY].",
      script: `MODE: SCRIPT WRITER — Write a complete bash script for ${env === "gentoo" ? "Gentoo Linux (emerge/portage/openrc)" : "Termux (pkg/apt/termux-api)"}. Include shebang, error handling (set -e), and clear comments. Output as a single .sh file.`,
    };

    const systemContent = CODE_AGENT_SOUL + "\n\n" + (modePrompts[mode] || modePrompts.build) + "\n\n" + memCtx + existingContext;

    // Build messages
    const historyMsgs = history.slice(-6).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    }));

    const messages = [
      { role: "system", content: systemContent },
      ...historyMsgs,
      { role: "user", content: prompt },
    ];

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.45,  // Lower temp = more precise code
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OnSpace AI error: ${errText}`);
    }

    const data = await aiResponse.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // Parse structured output
    const files = parseFiles(rawContent);
    const summary = parseSummary(rawContent);
    // For single-file or non-structured responses, wrap in a single file
    const cleanContent = rawContent.replace(/\[FILE:.*?\][\s\S]*?\[\/FILE\]/g, "").replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/g, "").trim();

    console.log(`[Code Agent v3.0] Generated ${files.length} files, ${rawContent.length} chars`);

    return new Response(
      JSON.stringify({
        files,
        summary,
        rawContent,
        cleanContent,
        mode,
        fileCount: files.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Code Agent v3.0] Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        files: [],
        summary: "Code Agent encountered an error. Prime Directive still active.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
