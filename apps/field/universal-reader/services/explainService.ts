import { ExplainResult, ExplainSection } from './types';
import { countLines, getComplexity, getLanguageLabel } from './fileService';

function extractImports(content: string, fileType: string): string[] {
  const imports: string[] = [];
  const lines = content.split('\n');

  const patterns: Record<string, RegExp> = {
    javascript: /^\s*import\s+.+\s+from\s+['"](.+)['"]/,
    typescript: /^\s*import\s+.+\s+from\s+['"](.+)['"]/,
    python: /^\s*(?:import|from)\s+(\S+)/,
    go: /^\s*"(.+)"/,
    rust: /^\s*use\s+(\S+)/,
    java: /^\s*import\s+(\S+);/,
    csharp: /^\s*using\s+(\S+);/,
  };

  const pat = patterns[fileType];
  if (!pat) return imports;

  for (const line of lines) {
    const m = line.match(pat);
    if (m) imports.push(m[1]);
    if (imports.length >= 20) break;
  }
  return imports;
}

function extractFunctions(content: string, fileType: string): string[] {
  const fns: string[] = [];
  const lines = content.split('\n');

  const patterns: Record<string, RegExp[]> = {
    javascript: [/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/, /^\s*(?:export\s+)?(?:async\s+)?(\w+)\s*\(/],
    typescript: [/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/],
    python: [/^\s*def\s+(\w+)\s*\(/, /^\s*async\s+def\s+(\w+)\s*\(/],
    go: [/^\s*func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/],
    rust: [/^\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/],
    java: [/^\s*(?:public|private|protected|static|\s)*\s+\w+\s+(\w+)\s*\(/],
    csharp: [/^\s*(?:public|private|protected|static|async|\s)*\s+\w+\s+(\w+)\s*\(/],
    ruby: [/^\s*def\s+(\w+)/],
    php: [/^\s*(?:public|private|protected|static|\s)*\s*function\s+(\w+)/],
    swift: [/^\s*(?:public|private|internal|open|@[\w]+\s+)*func\s+(\w+)/],
    kotlin: [/^\s*(?:fun\s+)(\w+)\s*\(/],
  };

  const pats = patterns[fileType] || [];
  for (const line of lines) {
    for (const p of pats) {
      const m = line.match(p);
      if (m && m[1] && !['if', 'for', 'while', 'switch', 'return', 'catch'].includes(m[1])) {
        if (!fns.includes(m[1])) fns.push(m[1]);
        break;
      }
    }
    if (fns.length >= 30) break;
  }
  return fns;
}

function extractClasses(content: string, fileType: string): string[] {
  const classes: string[] = [];
  const lines = content.split('\n');
  const patterns: Record<string, RegExp> = {
    javascript: /^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)/,
    typescript: /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/,
    python: /^\s*class\s+(\w+)/,
    java: /^\s*(?:public|private|abstract|\s)*\s*class\s+(\w+)/,
    csharp: /^\s*(?:public|private|abstract|sealed|\s)*\s*class\s+(\w+)/,
    ruby: /^\s*class\s+(\w+)/,
    php: /^\s*(?:abstract\s+)?class\s+(\w+)/,
    swift: /^\s*(?:public|open|internal|\s)*class\s+(\w+)/,
    kotlin: /^\s*(?:data\s+|open\s+|abstract\s+)?class\s+(\w+)/,
    rust: /^\s*(?:pub\s+)?struct\s+(\w+)|^\s*(?:pub\s+)?enum\s+(\w+)/,
    go: /^\s*type\s+(\w+)\s+struct/,
  };

  const p = patterns[fileType];
  if (!p) return classes;
  for (const line of lines) {
    const m = line.match(p);
    if (m) classes.push(m[1] || m[2]);
    if (classes.length >= 15) break;
  }
  return classes;
}

function describeImports(imports: string[], fileType: string): string {
  if (imports.length === 0) return 'No external dependencies detected.';
  const count = imports.length;
  const sample = imports.slice(0, 5).map((i) => `"${i}"`).join(', ');
  const more = count > 5 ? ` and ${count - 5} more` : '';
  return `Pulls in ${count} external dependenc${count === 1 ? 'y' : 'ies'}: ${sample}${more}. These are libraries or modules this file relies on to do its job.`;
}

function describeFunctions(fns: string[], fileType: string): string {
  if (fns.length === 0) return 'No named functions or methods detected at the top level.';
  const count = fns.length;
  const sample = fns.slice(0, 8).map((f) => `"${f}"`) .join(', ');
  const more = count > 8 ? ` and ${count - 8} more` : '';
  return `Defines ${count} function${count === 1 ? '' : 's'}: ${sample}${more}. Each function is a reusable block of logic that performs a specific task when called.`;
}

function describeClasses(classes: string[], fileType: string): string {
  if (classes.length === 0) return '';
  const count = classes.length;
  const sample = classes.slice(0, 5).map((c) => `"${c}"`).join(', ');
  const label = ['rust', 'go'].includes(fileType) ? 'data structure' : 'class';
  return `Contains ${count} ${label}${count > 1 ? 'es' : ''}: ${sample}. These are blueprints that group related data and behavior together.`;
}

function describeLanguageSpecific(content: string, fileType: string): string {
  const lower = content.toLowerCase();
  const hints: string[] = [];

  if (fileType === 'javascript' || fileType === 'typescript') {
    if (lower.includes('async') || lower.includes('await')) hints.push('uses async/await for non-blocking operations');
    if (lower.includes('react') || lower.includes('jsx') || lower.includes('tsx')) hints.push('built with React (UI component library)');
    if (lower.includes('express') || lower.includes('fastify')) hints.push('uses a Node.js web server framework');
    if (lower.includes('usestate') || lower.includes('useeffect')) hints.push('uses React Hooks for state and side effects');
    if (lower.includes('export default')) hints.push('exports a default module');
    if (lower.includes('promise')) hints.push('uses Promises for async operations');
  }
  if (fileType === 'python') {
    if (lower.includes('def __init__')) hints.push('object-oriented with class constructors');
    if (lower.includes('django') || lower.includes('flask') || lower.includes('fastapi')) hints.push('web framework code');
    if (lower.includes('pandas') || lower.includes('numpy')) hints.push('data science / data processing');
    if (lower.includes('tensorflow') || lower.includes('torch')) hints.push('machine learning / AI');
    if (lower.includes('asyncio') || lower.includes('async def')) hints.push('async programming');
    if (lower.includes('if __name__')) hints.push('entry point script (runs directly)');
  }
  if (fileType === 'go') {
    if (lower.includes('goroutine') || lower.includes('go func') || lower.includes('chan ')) hints.push('uses goroutines for concurrent execution');
    if (lower.includes('http.handle') || lower.includes('net/http')) hints.push('builds an HTTP web server');
    if (lower.includes('context.context')) hints.push('uses Go context for cancellation/timeout');
  }
  if (fileType === 'rust') {
    if (lower.includes('impl ')) hints.push('implements methods on types');
    if (lower.includes('tokio') || lower.includes('async fn')) hints.push('async runtime (Tokio)');
    if (lower.includes('result<') || lower.includes('option<')) hints.push('uses Result/Option for safe error handling');
  }
  if (fileType === 'json') {
    const keys = content.match(/"(\w+)"\s*:/g)?.map((k) => k.replace(/[":]/g, '').trim()) || [];
    const topKeys = [...new Set(keys)].slice(0, 6).map((k) => `"${k}"`).join(', ');
    return topKeys ? `Top-level keys include: ${topKeys}. This is structured data used for configuration, API responses, or data exchange.` : 'Structured data file in JSON format.';
  }
  if (fileType === 'yaml') {
    return 'YAML configuration file. Uses indentation and key-value pairs to define settings, workflows, or structured data in a human-readable format.';
  }
  if (fileType === 'html') {
    const hasScript = lower.includes('<script');
    const hasStyle = lower.includes('<style') || lower.includes('stylesheet');
    const tags = ['div', 'section', 'header', 'nav', 'main', 'footer'].filter((t) => lower.includes(`<${t}`));
    return `HTML document that structures a web page. ${tags.length > 0 ? `Uses semantic elements: ${tags.join(', ')}.` : ''} ${hasScript ? 'Includes JavaScript logic.' : ''} ${hasStyle ? 'Includes styling.' : ''}`.trim();
  }
  if (fileType === 'css') {
    const rules = (content.match(/\{[^}]*\}/g) || []).length;
    return `Stylesheet with approximately ${rules} CSS rule block${rules !== 1 ? 's' : ''}. Controls the visual appearance: layout, colors, typography, spacing, and responsive behavior.`;
  }
  if (fileType === 'sql') {
    const ops = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN'].filter((op) => content.toUpperCase().includes(op));
    return ops.length > 0 ? `SQL operations present: ${ops.join(', ')}. ${ops.includes('CREATE') ? 'Defines database schema.' : ''} ${ops.includes('SELECT') ? 'Queries and retrieves data.' : ''}`.trim() : 'SQL database script.';
  }
  if (fileType === 'markdown') {
    const headings = content.match(/^#{1,6}\s+.+/gm) || [];
    const h = headings.slice(0, 5).map((h) => (h ?? '').replace(/^#+\s+/, ''));
    return headings.length > 0 ? `Documentation with ${headings.length} section${headings.length !== 1 ? 's' : ''}: ${h.map((s) => `"${s}"`).join(', ')}${headings.length > 5 ? '...' : ''}.` : 'Markdown documentation file with formatted text.';
  }
  if (fileType === 'config') {
    return 'Configuration file that controls application settings, environment variables, build rules, or deployment behavior.';
  }

  return hints.length > 0 ? `Notable patterns: ${hints.join('; ')}.` : '';
}

function generateSummary(content: string, fileType: string, filename: string, linesOfCode: number): string {
  const lang = getLanguageLabel(fileType);
  const complexity = getComplexity(linesOfCode);
  const complexityDesc = complexity === 'Simple' ? 'short and focused' : complexity === 'Moderate' ? 'medium-sized' : 'large and comprehensive';

  const specific = describeLanguageSpecific(content, fileType);
  const specificNote = specific ? ` ${specific}` : '';

  return `"${filename}" is a ${complexityDesc} ${lang} file with ${linesOfCode} line${linesOfCode !== 1 ? 's' : ''}.${specificNote}`;
}

function analyzeStructure(content: string, fileType: string): ExplainSection[] {
  const sections: ExplainSection[] = [];
  const lines = content.split('\n');
  const linesOfCode = lines.length;

  // Section 1: What type of file is this
  const langLabel = getLanguageLabel(fileType);
  let fileTypeDesc = '';
  const typeDescriptions: Record<string, string> = {
    javascript: 'JavaScript is the main language of the web. This file contains logic that runs in a browser or Node.js server. It can define functions, handle events, fetch data, and build UIs.',
    typescript: 'TypeScript is JavaScript with type annotations. This file adds strict type checking to catch bugs early. It compiles down to plain JavaScript before running.',
    python: 'Python is a readable, general-purpose language. This file may be a script, a web backend, a data analysis tool, an AI model, or a utility — Python is used everywhere.',
    go: 'Go (Golang) is a fast, compiled language made by Google. It excels at building web servers, APIs, CLI tools, and concurrent systems.',
    rust: 'Rust is a systems programming language focused on safety and performance. It prevents memory bugs at compile time and is used for OS components, WebAssembly, and high-performance tools.',
    java: 'Java is an object-oriented language that runs on the JVM. It is widely used for enterprise applications, Android apps, and backend services.',
    kotlin: 'Kotlin is a modern JVM language, the preferred language for Android development. It is concise, null-safe, and fully interoperable with Java.',
    csharp: 'C# is a Microsoft language used for .NET applications, Unity games, desktop apps, and backend services.',
    python: 'Python is a readable, general-purpose language. This file may be a script, data science code, a web backend, AI/ML logic, or a utility.',
    swift: 'Swift is Apple\'s language for iOS, macOS, and watchOS apps. It is fast, safe, and designed for Apple platforms.',
    php: 'PHP is a server-side scripting language widely used for web backends, CMS platforms (WordPress), and APIs.',
    ruby: 'Ruby is an expressive language often used with the Rails framework for web apps and scripting.',
    bash: 'This is a shell script. It runs commands in sequence, automates tasks, manages files, sets environment variables, and chains system operations together.',
    html: 'HTML is the skeleton of every web page. It defines the structure and content — headings, paragraphs, images, links, forms, and sections.',
    css: 'CSS controls how HTML looks. It defines colors, fonts, layout, spacing, animations, and responsive behavior for different screen sizes.',
    sql: 'SQL is the language for talking to relational databases. This file defines tables, queries data, inserts records, or manages database structure.',
    json: 'JSON (JavaScript Object Notation) is a lightweight data format. It stores structured data as key-value pairs and arrays, used for APIs, configs, and data exchange.',
    yaml: 'YAML is a human-readable configuration format. It uses indentation instead of brackets. Widely used in Docker, Kubernetes, CI/CD pipelines, and app settings.',
    xml: 'XML is a markup language for storing and transporting structured data. Used in configs, APIs (SOAP), Android layouts, and document formats.',
    markdown: 'Markdown is a plain text format that converts to formatted HTML. Used for READMEs, documentation, blogs, and notes.',
    config: 'This is a configuration file. It defines settings, rules, environment variables, or build instructions that control how a tool, app, or service behaves.',
    csv: 'CSV (Comma-Separated Values) stores tabular data as plain text. Each row is a record, each column separated by commas. Opened in Excel or processed by code.',
    toml: 'TOML is a configuration file format. Clear, minimal, and widely used in Rust projects (Cargo.toml), Python (pyproject.toml), and other tools.',
    dart: 'Dart is Google\'s language for Flutter apps. Used to build cross-platform mobile, web, and desktop applications.',
    graphql: 'GraphQL is a query language for APIs. This file defines a schema (types, queries, mutations) or contains GraphQL queries/mutations.',
  };
  fileTypeDesc = typeDescriptions[fileType] || `This is a ${langLabel} file.`;
  sections.push({ title: `What is this file type?`, content: fileTypeDesc, icon: 'info' });

  // Section 2: Imports/Dependencies
  const imports = extractImports(content, fileType);
  if (['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'csharp', 'kotlin', 'swift', 'ruby', 'php'].includes(fileType)) {
    sections.push({
      title: 'Dependencies & Imports',
      content: describeImports(imports, fileType),
      icon: 'account-tree',
    });
  }

  // Section 3: Structure
  const fns = extractFunctions(content, fileType);
  const classes = extractClasses(content, fileType);
  const hasFns = fns.length > 0;
  const hasClasses = classes.length > 0;

  if (hasFns || hasClasses) {
    let structDesc = '';
    if (hasClasses) structDesc += describeClasses(classes, fileType) + '\n\n';
    if (hasFns) structDesc += describeFunctions(fns, fileType);
    sections.push({ title: 'Code Structure', content: structDesc.trim(), icon: 'account-tree' });
  }

  // Section 4: Notable patterns
  const specific = describeLanguageSpecific(content, fileType);
  if (specific) {
    sections.push({ title: 'Notable Patterns', content: specific, icon: 'lightbulb' });
  }

  // Section 5: Stats breakdown
  const commentLines = lines.filter((l) => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('"""') || t.startsWith("'''") || t.startsWith('--');
  }).length;
  const blankLines = lines.filter((l) => l.trim() === '').length;
  const codeLines = linesOfCode - commentLines - blankLines;
  sections.push({
    title: 'File Breakdown',
    content: `Total: ${linesOfCode} lines\nActual code: ~${Math.max(0, codeLines)} lines\nComments/docs: ~${commentLines} lines\nBlank lines: ${blankLines} lines\n\n${commentLines > 0 ? 'This file is well-documented — comments help explain the logic inline.' : 'No inline comments detected — the code speaks for itself.'}`,
    icon: 'bar-chart',
  });

  // Section 6: How to read it
  let howToRead = '';
  if (['javascript', 'typescript'].includes(fileType)) {
    howToRead = 'Start at the top — imports tell you what this file depends on. Then look for the main exported function or class. Follow the logic top-to-bottom. In React files, the default export is the component that renders UI.';
  } else if (fileType === 'python') {
    howToRead = 'Read imports first, then class/function definitions. The bottom of the file (if __name__ == "__main__") is where execution starts if run directly. Functions are called by name; trace calls to understand flow.';
  } else if (fileType === 'go') {
    howToRead = 'The "package" line names the module. "import" brings in libraries. The "main()" function is the entry point. "func" defines functions. Goroutines (go func()) run concurrently.';
  } else if (fileType === 'rust') {
    howToRead = 'Start with "use" statements (imports). "struct" defines data shapes, "impl" adds methods to them. "fn main()" is the entry point. "pub" means public/exported.';
  } else if (fileType === 'html') {
    howToRead = 'The <head> section has meta info and styles. The <body> is the visible content. Tags nest inside each other like a tree. <div> and <section> group content.';
  } else if (fileType === 'css') {
    howToRead = 'Each block targets HTML elements using selectors (class names, IDs, tags). Inside the {} brackets are the visual rules. Media queries (@media) handle different screen sizes.';
  } else if (fileType === 'json') {
    howToRead = 'JSON is a tree of key-value pairs. {} objects have named fields, [] arrays have ordered items. Follow the nesting from the outermost {} inward. Every key is a string in quotes.';
  } else if (fileType === 'sql') {
    howToRead = 'Each SQL statement ends with a semicolon. SELECT retrieves data, FROM specifies the table, WHERE filters rows, JOIN combines tables. CREATE TABLE defines structure.';
  } else if (fileType === 'yaml') {
    howToRead = 'YAML is read top-to-bottom. Indentation shows nesting (child items). Key: value pairs on each line. Lists use dashes (-). Anchors (&) and aliases (*) reuse values.';
  } else if (fileType === 'markdown') {
    howToRead = '# is a heading level (## is smaller). **bold**, *italic*, `code`. Links are [text](url). Rendered in GitHub, Notion, docs sites, and many editors.';
  } else if (fileType === 'bash') {
    howToRead = 'Commands run line by line. Variables are set with NAME=value and used with $NAME. if/then/fi for conditions. for/while loops. Each line is a command or script action.';
  } else {
    howToRead = 'Read from top to bottom. Notice the structure and patterns. Look for names that hint at purpose (login, fetch, config, render, etc.). Context and naming reveal intent.';
  }
  sections.push({ title: 'How to Read This File', content: howToRead, icon: 'menu-book' });

  return sections;
}

export function explainFile(content: string, fileType: string, filename: string): ExplainResult {
  const linesOfCode = countLines(content);
  const complexity = getComplexity(linesOfCode);
  const language = getLanguageLabel(fileType);
  const summary = generateSummary(content, fileType, filename, linesOfCode);
  const sections = analyzeStructure(content, fileType);

  return { summary, language, complexity, linesOfCode, sections };
}
