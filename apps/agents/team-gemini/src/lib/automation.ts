
import type { Pipeline, PipelineRun, RunLog, PipelineStep } from '@/types/automation';
import type { GeminiModel } from '@/types';

const PIPELINES_KEY = 'tg_pipelines';
const RUNS_KEY = 'tg_pipeline_runs';

// ─── Storage ──────────────────────────────────────────────────────────────────

export function getPipelines(): Pipeline[] {
  try { return JSON.parse(localStorage.getItem(PIPELINES_KEY) || '[]'); } catch { return []; }
}

export function savePipelines(p: Pipeline[]) {
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(p));
}

export function createPipeline(p: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>): Pipeline {
  const all = getPipelines();
  const np: Pipeline = {
    ...p,
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runCount: 0,
  };
  savePipelines([...all, np]);
  return np;
}

export function updatePipeline(id: string, updates: Partial<Pipeline>): Pipeline | null {
  const all = getPipelines();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  savePipelines(all);
  return all[idx];
}

export function deletePipeline(id: string) {
  savePipelines(getPipelines().filter(p => p.id !== id));
}

export function getRuns(pipelineId: string): PipelineRun[] {
  try {
    const all: PipelineRun[] = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]');
    return all.filter(r => r.pipelineId === pipelineId).slice(-50);
  } catch { return []; }
}

export function saveRun(run: PipelineRun) {
  try {
    const all: PipelineRun[] = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]');
    const idx = all.findIndex(r => r.id === run.id);
    if (idx >= 0) all[idx] = run; else all.push(run);
    // keep latest 200 runs total
    const trimmed = all.slice(-200);
    localStorage.setItem(RUNS_KEY, JSON.stringify(trimmed));
  } catch {}
}

// ─── Variable interpolation ────────────────────────────────────────────────────

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Gemini call ──────────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  model: GeminiModel,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const base = 'https://generativelanguage.googleapis.com/v1beta/models';
  const url = `${base}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Execution engine ─────────────────────────────────────────────────────────

export interface RunOptions {
  apiKey: string;
  githubToken?: string;
  model?: GeminiModel;
  onLog: (log: RunLog) => void;
  onVar?: (vars: Record<string, string>) => void;
  signal?: AbortSignal;
}

async function executeStep(
  step: PipelineStep,
  vars: Record<string, string>,
  opts: RunOptions
): Promise<{ output: string; newVars: Record<string, string> }> {
  const cfg = (key: string) => interpolate(step.config[key] || '', vars);
  let output = '';

  switch (step.type) {
    // ── AI Prompt ──
    case 'ai_prompt': {
      const model = (cfg('model') || opts.model || 'gemini-2.5-flash') as GeminiModel;
      const prompt = cfg('prompt');
      const system = cfg('system_prompt');
      if (!prompt) throw new Error('Prompt is required');
      output = await callGemini(opts.apiKey, model, prompt, system || undefined);
      break;
    }

    // ── HTTP Request ──
    case 'http_request': {
      const method = (cfg('method') || 'GET').toUpperCase();
      const url = cfg('url');
      if (!url) throw new Error('URL is required');
      const headersRaw = cfg('headers');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (headersRaw) {
        try {
          Object.assign(headers, JSON.parse(headersRaw));
        } catch {
          // try key:value lines
          headersRaw.split('\n').forEach(line => {
            const [k, ...v] = line.split(':');
            if (k && v.length) headers[k.trim()] = v.join(':').trim();
          });
        }
      }
      const fetchOpts: RequestInit = { method, headers };
      if (method !== 'GET' && cfg('body')) {
        fetchOpts.body = cfg('body');
      }
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      output = `Status: ${res.status}\n${text}`;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      break;
    }

    // ── Webhook Send ──
    case 'webhook_send': {
      const url = cfg('url');
      if (!url) throw new Error('Webhook URL is required');
      const payload = cfg('payload') || JSON.stringify({ timestamp: new Date().toISOString(), vars });
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      output = `Sent → ${res.status} ${res.statusText}`;
      break;
    }

    // ── GitHub: Create Issue ──
    case 'github_create_issue': {
      if (!opts.githubToken) throw new Error('GitHub token required — add in Settings');
      const repo = cfg('repo');
      if (!repo) throw new Error('repo (owner/repo) is required');
      const body = {
        title: cfg('title') || 'Auto-generated issue',
        body: cfg('body') || '',
        labels: cfg('labels') ? cfg('labels').split(',').map(s => s.trim()) : [],
      };
      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `GitHub error ${res.status}`);
      output = `Issue #${data.number} created: ${data.html_url}`;
      break;
    }

    // ── GitHub: AI PR Description ──
    case 'github_create_pr_desc': {
      if (!opts.githubToken) throw new Error('GitHub token required');
      const repo = cfg('repo');
      const branch = cfg('branch') || 'main';
      if (!repo) throw new Error('repo required');
      // fetch recent commits
      const commitsRes = await fetch(
        `https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=10`,
        { headers: { Authorization: `Bearer ${opts.githubToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!commitsRes.ok) throw new Error(`GitHub error ${commitsRes.status}`);
      const commits = await commitsRes.json();
      const commitList = commits.map((c: any) => `- ${c.commit.message.split('\n')[0]}`).join('\n');
      const prompt = `Write a professional GitHub Pull Request description based on these commits:\n${commitList}\n\nFormat: ## Summary, ## Changes, ## Testing`;
      output = await callGemini(opts.apiKey, opts.model || 'gemini-2.5-flash', prompt);
      break;
    }

    // ── GitHub: Comment on Issue/PR ──
    case 'github_comment': {
      if (!opts.githubToken) throw new Error('GitHub token required');
      const repo = cfg('repo');
      const number = cfg('number');
      const comment = cfg('comment');
      if (!repo || !number || !comment) throw new Error('repo, number, and comment are all required');
      const res = await fetch(`https://api.github.com/repos/${repo}/issues/${number}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ body: comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `GitHub error ${res.status}`);
      output = `Comment posted: ${data.html_url}`;
      break;
    }

    // ── Code Transform (AI) ──
    case 'code_transform': {
      const code = cfg('code');
      const instruction = cfg('instruction') || 'Refactor and improve this code';
      const language = cfg('language') || 'auto-detect';
      const prompt = `${instruction}\n\nLanguage: ${language}\n\`\`\`\n${code}\n\`\`\`\nReturn only the transformed code, no explanation.`;
      output = await callGemini(opts.apiKey, opts.model || 'gemini-2.5-pro', prompt);
      break;
    }

    // ── Text Transform ──
    case 'text_transform': {
      const text = cfg('text');
      const operation = cfg('operation') || 'summarize';
      const ops: Record<string, string> = {
        uppercase: text.toUpperCase(),
        lowercase: text.toLowerCase(),
        trim: text.trim(),
        reverse: text.split('').reverse().join(''),
        'count-words': `${text.trim().split(/\s+/).filter(Boolean).length} words`,
        'count-chars': `${text.length} characters`,
        json_format: JSON.stringify(JSON.parse(text), null, 2),
        base64_encode: btoa(text),
        base64_decode: atob(text),
      };
      if (ops[operation] !== undefined) {
        output = ops[operation];
      } else {
        // AI operation
        const prompt = `${operation}:\n\n${text}`;
        output = await callGemini(opts.apiKey, opts.model || 'gemini-2.5-flash', prompt);
      }
      break;
    }

    // ── Condition ──
    case 'condition': {
      const left = cfg('left');
      const operator = cfg('operator') || 'equals';
      const right = cfg('right');
      const ops: Record<string, boolean> = {
        equals: left === right,
        'not-equals': left !== right,
        contains: left.includes(right),
        'not-contains': !left.includes(right),
        'starts-with': left.startsWith(right),
        'ends-with': left.endsWith(right),
        'is-empty': left.trim() === '',
        'is-not-empty': left.trim() !== '',
        'greater-than': parseFloat(left) > parseFloat(right),
        'less-than': parseFloat(left) < parseFloat(right),
      };
      const result = ops[operator] ?? false;
      output = result ? 'true' : 'false';
      break;
    }

    // ── Variable Set ──
    case 'variable_set': {
      const varName = step.config['var_name'];
      const value = cfg('value');
      if (!varName) throw new Error('Variable name is required');
      return { output: `Set {{${varName}}} = ${value}`, newVars: { ...vars, [varName]: value } };
    }

    // ── Delay ──
    case 'delay': {
      const ms = parseInt(cfg('milliseconds') || '1000', 10);
      await new Promise(res => setTimeout(res, Math.min(ms, 10000)));
      output = `Waited ${ms}ms`;
      break;
    }

    // ── Slack Message ──
    case 'slack_message': {
      const webhookUrl = cfg('webhook_url');
      const text = cfg('text');
      if (!webhookUrl || !text) throw new Error('Slack webhook URL and message text are required');
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      output = `Slack message sent → ${res.status}`;
      break;
    }

    // ── Discord Message ──
    case 'discord_message': {
      const webhookUrl = cfg('webhook_url');
      const content = cfg('content');
      if (!webhookUrl || !content) throw new Error('Discord webhook URL and content are required');
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      output = `Discord message sent → ${res.status}`;
      break;
    }

    // ── JS Script ──
    case 'script_js': {
      const script = cfg('script');
      if (!script) throw new Error('Script is required');
      // safe eval in a Function context with vars available
      try {
        const fn = new Function('vars', 'interpolate', `"use strict";\n${script}`);
        const result = fn(vars, interpolate);
        output = result !== undefined ? String(result) : '(no return value)';
      } catch (e: any) {
        throw new Error(`Script error: ${e.message}`);
      }
      break;
    }

    default:
      output = `Unknown step type: ${step.type}`;
  }

  const newVars = { ...vars };
  if (step.outputVar && output) {
    newVars[step.outputVar] = output;
  }

  return { output, newVars };
}

export async function runPipeline(
  pipeline: Pipeline,
  opts: RunOptions,
  initialVars?: Record<string, string>
): Promise<PipelineRun> {
  const run: PipelineRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pipelineId: pipeline.id,
    startedAt: new Date().toISOString(),
    status: 'running',
    logs: [],
    variables: { ...pipeline.variables, ...initialVars },
    triggeredBy: 'manual',
  };

  saveRun(run);

  const enabledSteps = pipeline.steps.filter(s => s.enabled);

  for (const step of enabledSteps) {
    if (opts.signal?.aborted) {
      run.status = 'cancelled';
      run.finishedAt = new Date().toISOString();
      saveRun(run);
      return run;
    }

    const log: RunLog = {
      stepId: step.id,
      stepLabel: step.label,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
    run.logs.push(log);
    opts.onLog({ ...log });
    saveRun(run);

    try {
      const { output, newVars } = await executeStep(step, run.variables, opts);
      log.output = output;
      log.status = 'success';
      log.finishedAt = new Date().toISOString();
      run.variables = newVars;
      opts.onVar?.(newVars);
    } catch (e: any) {
      log.error = e.message;
      log.status = 'failed';
      log.finishedAt = new Date().toISOString();
      run.status = 'failed';
      run.finishedAt = new Date().toISOString();

      const logIdx = run.logs.findIndex(l => l.stepId === step.id);
      if (logIdx >= 0) run.logs[logIdx] = log;
      opts.onLog({ ...log });
      saveRun(run);
      return run;
    }

    const logIdx = run.logs.findIndex(l => l.stepId === step.id);
    if (logIdx >= 0) run.logs[logIdx] = log;
    opts.onLog({ ...log });
    saveRun(run);
  }

  run.status = 'success';
  run.finishedAt = new Date().toISOString();
  saveRun(run);

  // update pipeline stats
  updatePipeline(pipeline.id, {
    lastRunAt: run.finishedAt,
    lastRunStatus: 'success',
    runCount: pipeline.runCount + 1,
  });

  return run;
}
