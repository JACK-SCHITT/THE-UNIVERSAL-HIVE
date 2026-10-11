import { useState } from 'react';
import {
  Plug, Plus, X, Check, ExternalLink, Globe, Database,
  Cloud, Code, Terminal, Webhook, Cpu, ChevronRight, Copy, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docs?: string;
  codeExample?: string;
  language?: string;
}

const TEMPLATES: IntegrationTemplate[] = [
  {
    id: 'webhook', name: 'Webhook', category: 'Automation',
    description: 'Send HTTP POST requests to any endpoint on events',
    icon: '🪝', color: '#0d7fe8',
    fields: [{ key: 'url', label: 'Webhook URL', placeholder: 'https://hooks.example.com/...' }],
    codeExample: `// Trigger TeamGemini webhook
fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'message', data: { ... } })
});`,
    language: 'javascript',
  },
  {
    id: 'rest_api', name: 'REST API', category: 'Developer',
    description: 'Connect any REST API — authentication, endpoints, headers',
    icon: '⚡', color: '#8b5cf6',
    fields: [
      { key: 'base_url', label: 'Base URL', placeholder: 'https://api.example.com/v1' },
      { key: 'api_key', label: 'API Key', placeholder: 'sk-...', secret: true },
      { key: 'auth_header', label: 'Auth Header', placeholder: 'Authorization' },
    ],
    codeExample: `# Python REST integration
import requests
r = requests.get('BASE_URL/endpoint',
  headers={'Authorization': f'Bearer {API_KEY}'}
)
print(r.json())`,
    language: 'python',
  },
  {
    id: 'slack', name: 'Slack', category: 'Communication',
    description: 'Post AI responses and alerts to Slack channels',
    icon: '💬', color: '#611f69',
    fields: [{ key: 'webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }],
    codeExample: `# Send to Slack
curl -X POST -H 'Content-type: application/json' \\
  --data '{"text":"AI response: ..."}' \\
  YOUR_SLACK_WEBHOOK`,
    language: 'bash',
  },
  {
    id: 'discord', name: 'Discord', category: 'Communication',
    description: 'Forward AI outputs and notifications to Discord',
    icon: '🎮', color: '#5865f2',
    fields: [{ key: 'webhook_url', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' }],
  },
  {
    id: 'jira', name: 'Jira', category: 'Project Management',
    description: 'Create, update, and query Jira issues with AI',
    icon: '📋', color: '#0052cc',
    fields: [
      { key: 'domain', label: 'Jira Domain', placeholder: 'yourcompany.atlassian.net' },
      { key: 'email', label: 'Email', placeholder: 'you@company.com' },
      { key: 'api_token', label: 'API Token', placeholder: 'your-jira-token', secret: true },
    ],
    codeExample: `// Create Jira issue via API
const res = await fetch('https://DOMAIN/rest/api/3/issue', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('EMAIL:TOKEN'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ fields: { summary: 'AI-generated task', ... } }),
});`,
    language: 'javascript',
  },
  {
    id: 'database', name: 'Database', category: 'Data',
    description: 'Connect PostgreSQL, MySQL, MongoDB connection strings',
    icon: '🗄️', color: '#10b981',
    fields: [
      { key: 'connection_string', label: 'Connection String', placeholder: 'postgresql://user:pass@host:5432/db', secret: true },
      { key: 'name', label: 'Display Name', placeholder: 'Production DB' },
    ],
    codeExample: `# Python PostgreSQL
import psycopg2
conn = psycopg2.connect(CONNECTION_STRING)
cur = conn.cursor()
cur.execute("SELECT * FROM table LIMIT 10")
print(cur.fetchall())`,
    language: 'python',
  },
  {
    id: 'docker', name: 'Docker', category: 'DevOps',
    description: 'Manage containers, trigger builds and deployments',
    icon: '🐳', color: '#2496ed',
    fields: [
      { key: 'host', label: 'Docker Host', placeholder: 'tcp://host:2376 or unix:///var/run/docker.sock' },
      { key: 'registry', label: 'Registry', placeholder: 'registry.hub.docker.com' },
    ],
    codeExample: `# Docker build & push
docker build -t myapp:latest .
docker push registry/myapp:latest
docker run -d -p 8080:80 myapp:latest`,
    language: 'bash',
  },
  {
    id: 'aws', name: 'AWS', category: 'Cloud',
    description: 'Lambda, S3, EC2, and other AWS service integrations',
    icon: '☁️', color: '#ff9900',
    fields: [
      { key: 'access_key', label: 'Access Key ID', placeholder: 'AKIA...', secret: true },
      { key: 'secret_key', label: 'Secret Access Key', placeholder: '...', secret: true },
      { key: 'region', label: 'Region', placeholder: 'us-east-1' },
    ],
    codeExample: `# AWS Lambda invoke (Python)
import boto3
client = boto3.client('lambda', region_name=REGION)
response = client.invoke(
    FunctionName='my-function',
    Payload=json.dumps({'key': 'value'})
)`,
    language: 'python',
  },
  {
    id: 'vercel', name: 'Vercel', category: 'Deployment',
    description: 'Trigger deployments and manage Vercel projects',
    icon: '▲', color: '#000000',
    fields: [{ key: 'token', label: 'Vercel Token', placeholder: 'your-vercel-token', secret: true }],
    codeExample: `# Deploy via Vercel API
curl -X POST https://api.vercel.com/v13/deployments \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-app", "gitSource": {...}}'`,
    language: 'bash',
  },
  {
    id: 'kubernetes', name: 'Kubernetes', category: 'DevOps',
    description: 'Manage K8s clusters, deployments, and pods',
    icon: '⎈', color: '#326ce5',
    fields: [
      { key: 'cluster_url', label: 'Cluster API URL', placeholder: 'https://k8s.example.com' },
      { key: 'token', label: 'Service Account Token', placeholder: 'eyJhbGci...', secret: true },
    ],
  },
  {
    id: 'custom', name: 'Custom Integration', category: 'Developer',
    description: 'Define your own integration with any tool or API',
    icon: '🔧', color: '#6b7280',
    fields: [
      { key: 'name', label: 'Integration Name', placeholder: 'My Custom Tool' },
      { key: 'endpoint', label: 'Endpoint / Config', placeholder: 'https://...' },
      { key: 'notes', label: 'Notes', placeholder: 'How to use this integration...' },
    ],
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

interface ConfiguredIntegration {
  id: string;
  templateId: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
  createdAt: string;
}

export default function IntegrationsPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<IntegrationTemplate | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configured, setConfigured] = useState<ConfiguredIntegration[]>(() => {
    try { return JSON.parse(localStorage.getItem('tg_integrations') || '[]'); } catch { return []; }
  });
  const [saving, setSaving] = useState(false);
  const [activeIntegration, setActiveIntegration] = useState<ConfiguredIntegration | null>(null);

  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const saveIntegration = () => {
    if (!modal) return;
    setSaving(true);
    setTimeout(() => {
      const newInt: ConfiguredIntegration = {
        id: `int-${Date.now()}`,
        templateId: modal.id,
        name: config.name || modal.name,
        enabled: true,
        config,
        createdAt: new Date().toISOString(),
      };
      const updated = [...configured, newInt];
      setConfigured(updated);
      localStorage.setItem('tg_integrations', JSON.stringify(updated));
      setSaving(false);
      setModal(null);
      setConfig({});
      toast.success(`${modal.name} integration saved!`);
    }, 600);
  };

  const deleteIntegration = (id: string) => {
    const updated = configured.filter(i => i.id !== id);
    setConfigured(updated);
    localStorage.setItem('tg_integrations', JSON.stringify(updated));
    toast.success('Integration removed');
  };

  const toggleIntegration = (id: string) => {
    const updated = configured.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i);
    setConfigured(updated);
    localStorage.setItem('tg_integrations', JSON.stringify(updated));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
          <p className="text-gray-500 text-sm mt-0.5">Connect any platform, tool, or programming language</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-slow" />
          {configured.filter(i => i.enabled).length} active
        </div>
      </div>

      {/* Active integrations */}
      {configured.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Configured ({configured.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {configured.map(i => {
              const tmpl = TEMPLATES.find(t => t.id === i.templateId);
              return (
                <div key={i.id} className="card flex items-center gap-3 group" style={{ borderLeft: `2px solid ${tmpl?.color || '#444'}` }}>
                  <span className="text-xl">{tmpl?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">{i.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${i.enabled ? 'bg-accent-400' : 'bg-gray-600'}`} />
                      <span className="text-xs text-gray-500">{i.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleIntegration(i.id)} className="btn-ghost p-1 text-xs">
                      {i.enabled ? <X className="w-3.5 h-3.5 text-yellow-400" /> : <Check className="w-3.5 h-3.5 text-green-400" />}
                    </button>
                    <button onClick={() => deleteIntegration(i.id)} className="btn-ghost p-1">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input
            className="input-field w-full pl-4"
            placeholder="Search integrations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-surface-600/40 text-gray-400 hover:text-gray-200 border border-surface-400/30'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(t => {
          const isConfigured = configured.some(i => i.templateId === t.id);
          return (
            <button
              key={t.id}
              onClick={() => { setModal(t); setConfig({}); }}
              className="card text-left group glass-hover relative"
              style={{ borderTop: `2px solid ${t.color}20` }}
            >
              {isConfigured && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-400" />
              )}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-200 group-hover:text-white">{t.name}</div>
                  <div className="text-xs text-gray-600">{t.category}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{t.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-500/20">
                <span className="text-xs text-brand-400 group-hover:text-brand-300">Configure →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">{modal.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">{modal.name}</h2>
                <p className="text-xs text-gray-500">{modal.description}</p>
              </div>
              <button onClick={() => setModal(null)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 mb-5">
              {modal.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                  <input
                    type={f.secret ? 'password' : 'text'}
                    className="input-field w-full"
                    placeholder={f.placeholder}
                    value={config[f.key] || ''}
                    onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {modal.codeExample && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-400">Quick Start</span>
                  <button onClick={() => { copyToClipboard(modal.codeExample!); toast.success('Copied!'); }} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="bg-[#0a0d14] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto border border-surface-500/30">
                  {modal.codeExample}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveIntegration} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Integration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
