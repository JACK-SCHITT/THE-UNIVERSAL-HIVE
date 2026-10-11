import { useState, useCallback, useRef } from 'react';
import {
  Zap, Plus, Play, Trash2, ChevronDown, ChevronUp, Settings2,
  CheckCircle2, XCircle, Loader2, Clock, GitBranch, Globe,
  MessageSquare, Code2, Shuffle, Repeat, Variable, Timer,
  Webhook, FileCode2, Brain, MoreVertical, Copy, X,
  ChevronRight, ToggleLeft, ToggleRight, History, AlertCircle,
  Terminal, Sparkles, GripVertical, Eye, Edit3, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getSettings } from '@/lib/storage';
import {
  getPipelines, createPipeline, updatePipeline, deletePipeline,
  getRuns, runPipeline, interpolate
} from '@/lib/automation';
import type { Pipeline, PipelineStep, RunLog, TriggerType } from '@/types/automation';
import type { GeminiModel } from '@/types';

// ─── Step catalogue ───────────────────────────────────────────────────────────

interface StepMeta {
  type: PipelineStep['type'];
  label: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  fields: {
    key: string; label: string; placeholder: string;
    type?: 'text' | 'textarea' | 'select'; options?: string[];
    hint?: string;
  }[];
  outputVarHint?: string;
}

const STEP_CATALOGUE: StepMeta[] = [
  {
    type: 'ai_prompt', label: 'AI Prompt', category: 'AI',
    icon: <Brain className="w-3.5 h-3.5" />, color: 'from-purple-500 to-violet-600',
    fields: [
      { key: 'model', label: 'Model', type: 'select', placeholder: 'gemini-2.5-flash', options: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
      { key: 'system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Summarize {{input}} and output JSON...', hint: 'Use {{varName}} to inject variables' },
    ],
    outputVarHint: 'Store AI response as variable',
  },
  {
    type: 'code_transform', label: 'Code Transform', category: 'AI',
    icon: <Code2 className="w-3.5 h-3.5" />, color: 'from-indigo-500 to-blue-600',
    fields: [
      { key: 'language', label: 'Language', placeholder: 'TypeScript' },
      { key: 'instruction', label: 'Instruction', type: 'textarea', placeholder: 'Convert to async/await, add error handling...' },
      { key: 'code', label: 'Code', type: 'textarea', placeholder: 'function example() { ... } or use {{codeVar}}' },
    ],
    outputVarHint: 'Store transformed code',
  },
  {
    type: 'http_request', label: 'HTTP Request', category: 'Network',
    icon: <Globe className="w-3.5 h-3.5" />, color: 'from-cyan-500 to-teal-600',
    fields: [
      { key: 'method', label: 'Method', type: 'select', placeholder: 'GET', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
      { key: 'url', label: 'URL', placeholder: 'https://api.example.com/endpoint' },
      { key: 'headers', label: 'Headers (JSON or key:value)', type: 'textarea', placeholder: '{"Authorization": "Bearer {{token}}"}' },
      { key: 'body', label: 'Body (JSON)', type: 'textarea', placeholder: '{"key": "{{value}}"}' },
    ],
    outputVarHint: 'Store response body',
  },
  {
    type: 'webhook_send', label: 'Send Webhook', category: 'Network',
    icon: <Webhook className="w-3.5 h-3.5" />, color: 'from-sky-500 to-cyan-600',
    fields: [
      { key: 'url', label: 'Webhook URL', placeholder: 'https://hooks.example.com/...' },
      { key: 'payload', label: 'Payload (JSON)', type: 'textarea', placeholder: '{"text": "{{aiOutput}}", "source": "TeamGemini"}' },
    ],
  },
  {
    type: 'github_create_issue', label: 'GitHub: Create Issue', category: 'GitHub',
    icon: <GitBranch className="w-3.5 h-3.5" />, color: 'from-gray-600 to-gray-700',
    fields: [
      { key: 'repo', label: 'Repository (owner/repo)', placeholder: 'myorg/myrepo' },
      { key: 'title', label: 'Issue Title', placeholder: '{{aiSummary}}' },
      { key: 'body', label: 'Issue Body', type: 'textarea', placeholder: '{{detailedOutput}}' },
      { key: 'labels', label: 'Labels (comma-separated)', placeholder: 'bug, automation' },
    ],
    outputVarHint: 'Store issue URL',
  },
  {
    type: 'github_create_pr_desc', label: 'GitHub: AI PR Description', category: 'GitHub',
    icon: <GitBranch className="w-3.5 h-3.5" />, color: 'from-slate-600 to-gray-700',
    fields: [
      { key: 'repo', label: 'Repository (owner/repo)', placeholder: 'myorg/myrepo' },
      { key: 'branch', label: 'Branch', placeholder: 'feature/my-feature' },
    ],
    outputVarHint: 'Store PR description',
  },
  {
    type: 'github_comment', label: 'GitHub: Post Comment', category: 'GitHub',
    icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'from-zinc-600 to-gray-700',
    fields: [
      { key: 'repo', label: 'Repository (owner/repo)', placeholder: 'myorg/myrepo' },
      { key: 'number', label: 'Issue/PR Number', placeholder: '42 or {{issueNumber}}' },
      { key: 'comment', label: 'Comment', type: 'textarea', placeholder: '{{aiReview}}' },
    ],
  },
  {
    type: 'slack_message', label: 'Slack Message', category: 'Messaging',
    icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'from-green-600 to-emerald-700',
    fields: [
      { key: 'webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'text', label: 'Message', type: 'textarea', placeholder: '✅ Pipeline complete: {{result}}' },
    ],
  },
  {
    type: 'discord_message', label: 'Discord Message', category: 'Messaging',
    icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'from-indigo-600 to-blue-700',
    fields: [
      { key: 'webhook_url', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' },
      { key: 'content', label: 'Message', type: 'textarea', placeholder: '**Pipeline finished:** {{summary}}' },
    ],
  },
  {
    type: 'text_transform', label: 'Text Transform', category: 'Data',
    icon: <Shuffle className="w-3.5 h-3.5" />, color: 'from-orange-500 to-amber-600',
    fields: [
      {
        key: 'operation', label: 'Operation', type: 'select', placeholder: 'summarize',
        options: ['summarize', 'translate', 'uppercase', 'lowercase', 'trim', 'reverse',
          'count-words', 'count-chars', 'json_format', 'base64_encode', 'base64_decode',
          'extract-keywords', 'sentiment-analysis', 'rewrite-formal', 'rewrite-casual'],
        hint: 'Built-in: uppercase/lowercase/trim/reverse/count-words/count-chars/json_format/base64. Others use AI.'
      },
      { key: 'text', label: 'Input Text', type: 'textarea', placeholder: '{{previousOutput}} or paste text here' },
    ],
    outputVarHint: 'Store transformed text',
  },
  {
    type: 'variable_set', label: 'Set Variable', category: 'Control',
    icon: <Variable className="w-3.5 h-3.5" />, color: 'from-yellow-500 to-orange-500',
    fields: [
      { key: 'var_name', label: 'Variable Name', placeholder: 'myVar (no curly braces)' },
      { key: 'value', label: 'Value', placeholder: 'static value or {{otherVar}}' },
    ],
  },
  {
    type: 'condition', label: 'Condition / Branch', category: 'Control',
    icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'from-pink-500 to-rose-600',
    fields: [
      { key: 'left', label: 'Left Value', placeholder: '{{status}} or "200"' },
      {
        key: 'operator', label: 'Operator', type: 'select', placeholder: 'equals',
        options: ['equals', 'not-equals', 'contains', 'not-contains', 'starts-with', 'ends-with', 'is-empty', 'is-not-empty', 'greater-than', 'less-than']
      },
      { key: 'right', label: 'Right Value', placeholder: '"200" or {{expected}}' },
    ],
    outputVarHint: 'Store result (true/false)',
  },
  {
    type: 'script_js', label: 'JavaScript', category: 'Code',
    icon: <FileCode2 className="w-3.5 h-3.5" />, color: 'from-yellow-400 to-amber-500',
    fields: [
      {
        key: 'script', label: 'Script', type: 'textarea',
        placeholder: `// vars contains all pipeline variables\n// return a value to store it\nconst data = JSON.parse(vars.response);\nreturn data.items.map(i => i.name).join(', ');`,
        hint: 'Access vars.myVariable, return a value to capture output'
      },
    ],
    outputVarHint: 'Store script return value',
  },
  {
    type: 'delay', label: 'Delay', category: 'Control',
    icon: <Timer className="w-3.5 h-3.5" />, color: 'from-slate-500 to-gray-600',
    fields: [
      { key: 'milliseconds', label: 'Delay (ms, max 10000)', placeholder: '2000' },
    ],
  },
];

const TRIGGER_OPTIONS: { value: TriggerType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'manual', label: 'Manual', icon: <Play className="w-3.5 h-3.5" />, desc: 'Run on demand' },
  { value: 'webhook', label: 'Webhook', icon: <Webhook className="w-3.5 h-3.5" />, desc: 'Triggered by incoming HTTP request' },
  { value: 'github_push', label: 'GitHub Push', icon: <GitBranch className="w-3.5 h-3.5" />, desc: 'On push to a branch' },
  { value: 'github_pr', label: 'GitHub PR', icon: <GitBranch className="w-3.5 h-3.5" />, desc: 'On PR open/update' },
];

const CATEGORIES = ['All', 'AI', 'GitHub', 'Network', 'Messaging', 'Data', 'Control', 'Code'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stepMeta(type: PipelineStep['type']): StepMeta {
  return STEP_CATALOGUE.find(s => s.type === type) || STEP_CATALOGUE[0];
}

function newStep(type: PipelineStep['type']): PipelineStep {
  const meta = stepMeta(type);
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: meta.label,
    config: {},
    enabled: true,
  };
}

function logStatusIcon(status: RunLog['status']) {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case 'running': return <Loader2 className="w-4 h-4 text-brand-400 flex-shrink-0 animate-spin" />;
    case 'skipped': return <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    default: return <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />;
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function StepCard({
  step, index, total, meta, selected, onSelect, onChange, onRemove, onMove, logs
}: {
  step: PipelineStep;
  index: number;
  total: number;
  meta: StepMeta;
  selected: boolean;
  onSelect: () => void;
  onChange: (step: PipelineStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  logs: RunLog[];
}) {
  const log = logs.find(l => l.stepId === step.id);

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all duration-150',
        selected
          ? 'border-brand-500/50 bg-brand-500/5'
          : 'border-surface-500/30 bg-surface-800/40 hover:border-surface-400/50'
      )}
    >
      {/* Step header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={onSelect}
      >
        <GripVertical className="w-4 h-4 text-gray-700 flex-shrink-0" />
        <div className={cn(
          'flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center text-white',
          meta.color
        )}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-200 truncate">{step.label}</span>
            {step.outputVar && (
              <span className="text-xs font-mono text-brand-400/80 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                → {`{{${step.outputVar}}}`}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600">{meta.category}</span>
        </div>

        {/* Status indicator */}
        {log && (
          <div className="flex items-center gap-1.5">
            {logStatusIcon(log.status)}
            {log.status === 'success' && log.finishedAt && log.startedAt && (
              <span className="text-xs text-gray-600 font-mono">
                {(new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime())}ms
              </span>
            )}
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); onChange({ ...step, enabled: !step.enabled }); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {step.enabled
            ? <ToggleRight className="w-4 h-4 text-brand-400" />
            : <ToggleLeft className="w-4 h-4 text-gray-600" />
          }
        </button>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
          <button onClick={e => { e.stopPropagation(); onMove(-1); }} disabled={index === 0} className="btn-ghost p-1">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onMove(1); }} disabled={index === total - 1} className="btn-ghost p-1">
            <ChevronDown className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="btn-ghost p-1 hover:text-red-400">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Log output inline */}
      {log && (log.output || log.error) && (
        <div className={cn(
          'mx-3 mb-2.5 p-2 rounded-lg text-xs font-mono border',
          log.status === 'failed'
            ? 'bg-red-500/5 border-red-500/20 text-red-300'
            : 'bg-surface-700/40 border-surface-500/20 text-gray-400'
        )}>
          <div className="line-clamp-3 whitespace-pre-wrap">{log.error || log.output}</div>
        </div>
      )}
    </div>
  );
}

function StepEditor({
  step, meta, onChange, onClose
}: {
  step: PipelineStep;
  meta: StepMeta;
  onChange: (step: PipelineStep) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-500/30 flex-shrink-0">
        <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', meta.color)}>
          {meta.icon}
        </div>
        <div className="flex-1">
          <input
            className="bg-transparent text-sm font-semibold text-white focus:outline-none w-full"
            value={step.label}
            onChange={e => onChange({ ...step, label: e.target.value })}
          />
          <div className="text-xs text-gray-500">{meta.category} · {step.type}</div>
        </div>
        <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {meta.fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-400 mb-1">{field.label}</label>
            {field.hint && <p className="text-xs text-gray-600 mb-1.5">{field.hint}</p>}
            {field.type === 'select' ? (
              <select
                className="input-field w-full"
                value={step.config[field.key] || ''}
                onChange={e => onChange({ ...step, config: { ...step.config, [field.key]: e.target.value } })}
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                className="input-field w-full font-mono text-xs resize-none"
                rows={4}
                placeholder={field.placeholder}
                value={step.config[field.key] || ''}
                onChange={e => onChange({ ...step, config: { ...step.config, [field.key]: e.target.value } })}
              />
            ) : (
              <input
                className="input-field w-full font-mono text-xs"
                placeholder={field.placeholder}
                value={step.config[field.key] || ''}
                onChange={e => onChange({ ...step, config: { ...step.config, [field.key]: e.target.value } })}
              />
            )}
          </div>
        ))}

        {/* Output variable */}
        <div className="pt-3 border-t border-surface-500/20">
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
            <Variable className="w-3 h-3 text-brand-400" />
            {meta.outputVarHint || 'Store output as variable (optional)'}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-mono">{'{{'}</span>
            <input
              className="input-field flex-1 font-mono text-xs"
              placeholder="variableName"
              value={step.outputVar || ''}
              onChange={e => onChange({ ...step, outputVar: e.target.value || undefined })}
            />
            <span className="text-xs text-gray-600 font-mono">{'}}'}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Reference this in later steps as <code className="font-mono text-brand-400">{`{{${step.outputVar || 'variableName'}}}`}</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type View = 'list' | 'build' | 'run';

export default function AutomationPage() {
  const { user } = useAuth();
  const settings = getSettings();
  const apiKey = user?.apiKey || settings.rootKey;

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => getPipelines());
  const [view, setView] = useState<View>('list');
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [stepCategory, setStepCategory] = useState('All');
  const [searchStep, setSearchStep] = useState('');
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [showVarPanel, setShowVarPanel] = useState(false);
  const [newPipelineModal, setNewPipelineModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const refresh = () => setPipelines(getPipelines());

  const openPipeline = (p: Pipeline) => {
    setActivePipeline({ ...p });
    setSelectedStepId(null);
    setLogs([]);
    setVars({});
    setRunStatus('idle');
    setView('build');
  };

  const handleCreatePipeline = () => {
    if (!newName.trim()) return;
    const p = createPipeline({
      name: newName.trim(),
      description: newDesc.trim(),
      trigger: 'manual',
      triggerConfig: {},
      steps: [],
      variables: {},
      createdBy: user?.id || '',
      enabled: true,
      tags: [],
    });
    refresh();
    setNewPipelineModal(false);
    setNewName('');
    setNewDesc('');
    openPipeline(p);
  };

  const savePipeline = useCallback((pl: Pipeline) => {
    updatePipeline(pl.id, pl);
    setActivePipeline(pl);
    refresh();
  }, []);

  const addStep = (type: PipelineStep['type']) => {
    if (!activePipeline) return;
    const step = newStep(type);
    const updated = { ...activePipeline, steps: [...activePipeline.steps, step] };
    savePipeline(updated);
    setSelectedStepId(step.id);
    setAddStepOpen(false);
  };

  const updateStep = (step: PipelineStep) => {
    if (!activePipeline) return;
    const steps = activePipeline.steps.map(s => s.id === step.id ? step : s);
    savePipeline({ ...activePipeline, steps });
  };

  const removeStep = (id: string) => {
    if (!activePipeline) return;
    const steps = activePipeline.steps.filter(s => s.id !== id);
    savePipeline({ ...activePipeline, steps });
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const moveStep = (id: string, dir: -1 | 1) => {
    if (!activePipeline) return;
    const steps = [...activePipeline.steps];
    const idx = steps.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
    savePipeline({ ...activePipeline, steps });
  };

  const handleRun = async () => {
    if (!activePipeline || !apiKey) {
      toast.error('No Gemini API key — add one in Settings');
      return;
    }
    setRunning(true);
    setRunStatus('running');
    setLogs([]);
    setVars({ ...activePipeline.variables });
    setView('run');

    abortRef.current = new AbortController();

    const result = await runPipeline(activePipeline, {
      apiKey,
      githubToken: user?.githubToken,
      model: (activePipeline.variables['model'] as GeminiModel) || 'gemini-2.5-flash',
      onLog: (log) => setLogs(prev => {
        const idx = prev.findIndex(l => l.stepId === log.stepId);
        if (idx >= 0) { const next = [...prev]; next[idx] = log; return next; }
        return [...prev, log];
      }),
      onVar: (v) => setVars({ ...v }),
      signal: abortRef.current.signal,
    });

    setRunStatus(result.status === 'success' ? 'success' : 'failed');
    setRunning(false);

    if (result.status === 'success') {
      toast.success(`Pipeline "${activePipeline.name}" completed successfully`);
      refresh();
    } else if (result.status === 'cancelled') {
      toast('Run cancelled');
      setRunStatus('idle');
    } else {
      toast.error('Pipeline failed — check the run log');
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const filteredSteps = STEP_CATALOGUE.filter(s => {
    const matchCat = stepCategory === 'All' || s.category === stepCategory;
    const matchSearch = s.label.toLowerCase().includes(searchStep.toLowerCase()) || s.category.toLowerCase().includes(searchStep.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedStep = activePipeline?.steps.find(s => s.id === selectedStepId);
  const selectedMeta = selectedStep ? stepMeta(selectedStep.type) : null;

  // ─── List view ───────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-400" /> Automation Builder
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Build pipelines that run on anything, anywhere, in any language</p>
          </div>
          <button
            onClick={() => setNewPipelineModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Pipeline
          </button>
        </div>

        {pipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-700/40 border border-surface-500/30 flex items-center justify-center mb-5">
              <Zap className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-400 mb-2">No pipelines yet</h2>
            <p className="text-sm text-gray-600 max-w-xs mb-6">
              Build automation pipelines that chain AI, APIs, GitHub, Slack, and custom code
            </p>
            <button onClick={() => setNewPipelineModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create your first pipeline
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map(p => (
              <div
                key={p.id}
                className="card group glass-hover cursor-pointer relative"
                onClick={() => openPipeline(p)}
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); deletePipeline(p.id); refresh(); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 truncate">{p.description || 'No description'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> {p.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> {p.runCount} runs
                  </span>
                  {p.lastRunStatus && (
                    <span className={cn(
                      'flex items-center gap-1',
                      p.lastRunStatus === 'success' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {p.lastRunStatus === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {p.lastRunStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-surface-500/20 pt-3">
                  <span className="text-xs flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {TRIGGER_OPTIONS.find(t => t.value === p.trigger)?.label || 'Manual'}
                  </span>
                  <span className="text-xs text-brand-400 group-hover:text-brand-300">
                    Open Builder →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New pipeline modal */}
        {newPipelineModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setNewPipelineModal(false)}>
            <div className="glass rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-white mb-4">New Pipeline</h2>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Pipeline Name</label>
                  <input
                    autoFocus
                    className="input-field w-full"
                    placeholder="e.g. AI Code Review → GitHub Issue"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreatePipeline()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description (optional)</label>
                  <input className="input-field w-full" placeholder="What does this pipeline do?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setNewPipelineModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreatePipeline} disabled={!newName.trim()} className="btn-primary flex-1">Create & Open</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Build / Run view ────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-500/30 bg-surface-800/40 flex-shrink-0">
        <button onClick={() => setView('list')} className="btn-ghost p-1.5 text-gray-400">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{activePipeline?.name}</h2>
          <p className="text-xs text-gray-500 truncate">{activePipeline?.description || 'No description'}</p>
        </div>

        {/* View tabs */}
        <div className="flex bg-surface-700/60 rounded-lg p-0.5 border border-surface-500/30">
          {(['build', 'run'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize flex items-center gap-1.5',
                view === v
                  ? 'bg-surface-600 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {v === 'build' ? <Edit3 className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
              {v}
            </button>
          ))}
        </div>

        {/* Run / Cancel */}
        {running ? (
          <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-medium transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!activePipeline?.steps.filter(s => s.enabled).length}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-brand-500/20"
          >
            <Play className="w-4 h-4" /> Run Pipeline
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Build view ── */}
        {view === 'build' && (
          <>
            {/* Step list */}
            <div className="w-80 flex flex-col border-r border-surface-500/30 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-500/30 flex-shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Steps ({activePipeline?.steps.filter(s => s.enabled).length}/{activePipeline?.steps.length})
                </span>
                <button
                  onClick={() => setAddStepOpen(s => !s)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    addStepOpen ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'btn-ghost'
                  )}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activePipeline?.steps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Sparkles className="w-8 h-8 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">No steps yet</p>
                    <p className="text-xs text-gray-700 mt-1">Click "Add Step" to start building</p>
                  </div>
                )}

                {activePipeline?.steps.map((step, idx) => (
                  <div key={step.id}>
                    <StepCard
                      step={step}
                      index={idx}
                      total={activePipeline.steps.length}
                      meta={stepMeta(step.type)}
                      selected={selectedStepId === step.id}
                      onSelect={() => setSelectedStepId(selectedStepId === step.id ? null : step.id)}
                      onChange={updateStep}
                      onRemove={() => removeStep(step.id)}
                      onMove={dir => moveStep(step.id, dir)}
                      logs={[]}
                    />
                    {idx < activePipeline.steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="w-3 h-3 text-gray-700 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pipeline variables */}
              <div className="border-t border-surface-500/30 flex-shrink-0">
                <button
                  onClick={() => setShowVarPanel(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-700/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Variable className="w-3.5 h-3.5 text-brand-400" />
                    Pipeline Variables ({Object.keys(activePipeline?.variables || {}).length})
                  </span>
                  {showVarPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showVarPanel && activePipeline && (
                  <div className="px-4 pb-3 space-y-2">
                    {Object.entries(activePipeline.variables).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <input
                          className="input-field flex-1 font-mono text-xs py-1"
                          value={k}
                          readOnly
                        />
                        <input
                          className="input-field flex-1 font-mono text-xs py-1"
                          value={v}
                          onChange={e => savePipeline({ ...activePipeline, variables: { ...activePipeline.variables, [k]: e.target.value } })}
                        />
                        <button
                          onClick={() => {
                            const vars = { ...activePipeline.variables };
                            delete vars[k];
                            savePipeline({ ...activePipeline, variables: vars });
                          }}
                          className="btn-ghost p-1 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const name = `var${Object.keys(activePipeline.variables).length + 1}`;
                        savePipeline({ ...activePipeline, variables: { ...activePipeline.variables, [name]: '' } });
                      }}
                      className="btn-ghost text-xs flex items-center gap-1.5 w-full justify-center py-1.5"
                    >
                      <Plus className="w-3 h-3" /> Add Variable
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step catalogue / editor */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {addStepOpen ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-surface-500/30 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-white">Add Step</h3>
                    <button onClick={() => setAddStepOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2 px-5 py-3 border-b border-surface-500/30 flex-shrink-0 flex-wrap">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setStepCategory(cat)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                          stepCategory === cat
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                            : 'bg-surface-600/40 text-gray-400 hover:text-gray-200 border border-surface-400/20'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 content-start">
                    {filteredSteps.map(s => (
                      <button
                        key={s.type}
                        onClick={() => addStep(s.type)}
                        className="flex items-start gap-3 p-3 rounded-xl border border-surface-500/30 bg-surface-800/40 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left group"
                      >
                        <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 mt-0.5', s.color)}>
                          {s.icon}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-200 group-hover:text-white">{s.label}</div>
                          <div className="text-xs text-gray-600">{s.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : selectedStep && selectedMeta ? (
                <StepEditor
                  step={selectedStep}
                  meta={selectedMeta}
                  onChange={updateStep}
                  onClose={() => setSelectedStepId(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl bg-surface-700/40 border border-surface-500/30 flex items-center justify-center mx-auto mb-4">
                      <Settings2 className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Select a step to configure</h3>
                    <p className="text-xs text-gray-700">Click any step in the list, or add a new step to get started</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Run view ── */}
        {view === 'run' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Step status list */}
            <div className="w-72 flex flex-col border-r border-surface-500/30 overflow-hidden flex-shrink-0">
              <div className="px-4 py-3 border-b border-surface-500/30 flex items-center gap-2 flex-shrink-0">
                {running
                  ? <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  : runStatus === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : runStatus === 'failed'
                      ? <XCircle className="w-4 h-4 text-red-400" />
                      : <Clock className="w-4 h-4 text-gray-500" />
                }
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {running ? 'Running...' : runStatus === 'success' ? 'Completed' : runStatus === 'failed' ? 'Failed' : 'Ready'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activePipeline?.steps.filter(s => s.enabled).map((step, idx) => {
                  const log = logs.find(l => l.stepId === step.id);
                  const meta = stepMeta(step.type);
                  return (
                    <div key={step.id}>
                      <StepCard
                        step={step}
                        index={idx}
                        total={activePipeline.steps.length}
                        meta={meta}
                        selected={false}
                        onSelect={() => {}}
                        onChange={() => {}}
                        onRemove={() => {}}
                        onMove={() => {}}
                        logs={log ? [log] : []}
                      />
                      {idx < activePipeline.steps.filter(s => s.enabled).length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowRight className="w-3 h-3 text-gray-700 rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Log console */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-500/30 flex-shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-brand-400" /> Run Console
                </span>
                {Object.keys(vars).length > 0 && (
                  <button
                    onClick={() => setShowVarPanel(s => !s)}
                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5"
                  >
                    <Variable className="w-3 h-3" />
                    {Object.keys(vars).length} vars
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono">
                {logs.length === 0 && !running && (
                  <div className="flex items-center justify-center py-16 text-gray-600 text-sm">
                    Press Run Pipeline to start
                  </div>
                )}

                {logs.map((log, i) => (
                  <div key={`${log.stepId}-${i}`} className={cn(
                    'rounded-xl border overflow-hidden',
                    log.status === 'failed' ? 'border-red-500/30 bg-red-500/5'
                      : log.status === 'success' ? 'border-emerald-500/20 bg-emerald-500/5'
                        : log.status === 'running' ? 'border-brand-500/30 bg-brand-500/5'
                          : 'border-surface-500/20'
                  )}>
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-inherit">
                      {logStatusIcon(log.status)}
                      <span className="text-xs font-semibold text-gray-200">{log.stepLabel}</span>
                      {log.finishedAt && log.startedAt && (
                        <span className="ml-auto text-xs text-gray-600">
                          {(new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime())}ms
                        </span>
                      )}
                    </div>
                    {(log.output || log.error) && (
                      <pre className={cn(
                        'p-4 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto',
                        log.status === 'failed' ? 'text-red-300' : 'text-gray-300'
                      )}>
                        {log.error || log.output}
                      </pre>
                    )}
                    {log.status === 'running' && !log.output && (
                      <div className="px-4 py-3 text-xs text-brand-400 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                      </div>
                    )}
                  </div>
                ))}

                {/* Variable snapshot */}
                {showVarPanel && Object.keys(vars).length > 0 && (
                  <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-brand-500/20">
                      <Variable className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-xs font-semibold text-brand-300">Pipeline Variables</span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {Object.entries(vars).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-3 text-xs">
                          <span className="text-brand-400 font-mono flex-shrink-0">{`{{${k}}}`}</span>
                          <span className="text-gray-400 truncate">{String(v).slice(0, 120)}{String(v).length > 120 ? '...' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
