import React from 'react';

// Simple markdown parser for chat messages
export function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.substring(3).trim();
        codeBlockContent = [];
      } else {
        elements.push(
          <pre key={i} className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2">
            <code className="text-sm font-mono">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold mt-3 mb-1">{line.substring(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>);
    }
    // Lists
    else if (line.match(/^[\*\-]\s/)) {
      elements.push(<li key={i} className="ml-4">{formatInline(line.substring(2))}</li>);
    }
    // Links and inline code
    else if (line.trim()) {
      elements.push(<p key={i} className="my-1">{formatInline(line)}</p>);
    } else {
      elements.push(<br key={i} />);
    }
  }

  return <div className="prose prose-invert max-w-none">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  // Inline code
  const codeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processLinks(text.substring(lastIndex, match.index), key++));
    }
    parts.push(
      <code key={key++} className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(processLinks(text.substring(lastIndex), key++));
  }

  return parts.length > 0 ? parts : text;
}

function processLinks(text: string, baseKey: number): React.ReactNode {
  // Links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = baseKey;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processBold(text.substring(lastIndex, match.index), key++));
    }
    parts.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(processBold(text.substring(lastIndex), key++));
  }

  return parts.length > 0 ? parts : text;
}

function processBold(text: string, baseKey: number): React.ReactNode {
  // Bold **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = baseKey;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={key++} className="font-bold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
