import { FileRecord } from './types';

const SAVED_KEY = 'universal_reader_saved_v1';

export function getSavedFiles(): FileRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FileRecord[];
  } catch {
    return [];
  }
}

export function saveFileRecord(record: FileRecord): FileRecord[] {
  const existing = getSavedFiles();
  const filtered = existing.filter((f) => f.id !== record.id);
  const updated = [record, ...filtered].slice(0, 100);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function deleteFileRecord(id: string): FileRecord[] {
  const existing = getSavedFiles();
  const updated = existing.filter((f) => f.id !== id);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function togglePinRecord(id: string): FileRecord[] {
  const existing = getSavedFiles();
  const updated = existing.map((f) =>
    f.id === id ? { ...f, pinned: !f.pinned } : f
  );
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function detectFileType(filename: string, content: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const baseName = filename.toLowerCase();

  const codeExts: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript', dts: 'typescript',
    py: 'python', pyw: 'python', pyi: 'python',
    rb: 'ruby', erb: 'ruby', rake: 'ruby',
    go: 'go', mod: 'go',
    rs: 'rust',
    cpp: 'cpp', cxx: 'cpp', cc: 'cpp', h: 'cpp', hpp: 'cpp',
    c: 'c',
    java: 'java', kt: 'kotlin', kts: 'kotlin',
    cs: 'csharp', vb: 'csharp',
    php: 'php', phtml: 'php',
    swift: 'swift',
    sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
    html: 'html', htm: 'html',
    css: 'css', scss: 'css', sass: 'css', less: 'css',
    vue: 'vue', svelte: 'svelte',
    sql: 'sql', psql: 'sql',
    graphql: 'graphql', gql: 'graphql',
    dart: 'dart', r: 'r', lua: 'lua',
    pl: 'perl', pm: 'perl',
    ex: 'elixir', exs: 'elixir',
    hs: 'haskell', lhs: 'haskell',
    scala: 'scala', clj: 'clojure', cljs: 'clojure',
    fs: 'fsharp', fsx: 'fsharp',
    m: 'objective-c', mm: 'objective-c',
  };

  const dataExts: Record<string, string> = {
    json: 'json', json5: 'json', jsonc: 'json',
    yaml: 'yaml', yml: 'yaml',
    xml: 'xml', xsl: 'xml', xslt: 'xml', svg: 'xml',
    csv: 'csv', tsv: 'csv',
    toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini',
  };

  const docExts: Record<string, string> = {
    md: 'markdown', mdx: 'markdown', rst: 'text',
    txt: 'text', log: 'text', org: 'text',
  };

  const configFiles: Record<string, string> = {
    dockerfile: 'config', makefile: 'config', rakefile: 'config',
    gemfile: 'config', procfile: 'config', vagrantfile: 'config',
    brewfile: 'config', cakefile: 'config',
  };

  if (codeExts[ext]) return codeExts[ext];
  if (dataExts[ext]) return dataExts[ext];
  if (docExts[ext]) return docExts[ext];
  if (configFiles[baseName]) return configFiles[baseName];

  if (baseName.startsWith('.env')) return 'config';
  if (baseName.endsWith('rc') || baseName.startsWith('.')) return 'config';
  if (baseName === 'license' || baseName === 'readme') return 'text';
  if (baseName === 'package.json' || baseName.endsWith('.json')) return 'json';

  // Content sniffing
  const trimmed = content.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<') && trimmed.includes('>')) return 'xml';
  if (trimmed.startsWith('#!')) return 'bash';
  if (trimmed.startsWith('---\n') || trimmed.startsWith('---\r')) return 'yaml';

  return 'text';
}

export function getLanguageLabel(fileType: string): string {
  const labels: Record<string, string> = {
    javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
    ruby: 'Ruby', go: 'Go', rust: 'Rust', cpp: 'C++', c: 'C',
    java: 'Java', kotlin: 'Kotlin', csharp: 'C#', php: 'PHP',
    swift: 'Swift', bash: 'Bash/Shell', html: 'HTML', css: 'CSS',
    vue: 'Vue', svelte: 'Svelte', sql: 'SQL', graphql: 'GraphQL',
    dart: 'Dart', r: 'R', lua: 'Lua', perl: 'Perl', elixir: 'Elixir',
    haskell: 'Haskell', scala: 'Scala', fsharp: 'F#', 'objective-c': 'Objective-C',
    json: 'JSON', yaml: 'YAML', xml: 'XML', csv: 'CSV', toml: 'TOML',
    ini: 'Config', markdown: 'Markdown', text: 'Plain Text', config: 'Config File',
    clojure: 'Clojure',
  };
  return labels[fileType] || fileType.charAt(0).toUpperCase() + fileType.slice(1);
}

export function getFileIconName(fileType: string): string {
  const map: Record<string, string> = {
    javascript: 'javascript', typescript: 'code', python: 'code',
    ruby: 'code', go: 'code', rust: 'code', cpp: 'code', c: 'code',
    java: 'code', kotlin: 'code', csharp: 'code', php: 'code',
    swift: 'code', bash: 'terminal', html: 'web', css: 'palette',
    vue: 'code', svelte: 'code', sql: 'storage', graphql: 'hub',
    dart: 'code', json: 'data-object', yaml: 'list', xml: 'code',
    csv: 'table-chart', toml: 'settings', ini: 'settings',
    markdown: 'article', text: 'description', config: 'tune',
  };
  return map[fileType] || 'insert-drive-file';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function countLines(content: string): number {
  return content.split('\n').length;
}

export function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function getComplexity(lines: number): 'Simple' | 'Moderate' | 'Complex' {
  if (lines < 50) return 'Simple';
  if (lines < 300) return 'Moderate';
  return 'Complex';
}
