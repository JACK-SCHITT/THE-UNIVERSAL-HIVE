import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateConversationTitle(firstMessage: string): string {
  return truncate(firstMessage.replace(/\n/g, ' ').trim(), 45) || 'New Chat';
}

export const MODEL_LABELS: Record<string, string> = {
  'gemini-2.5-pro': '2.5 Pro',
  'gemini-2.5-flash': '2.5 Flash',
  'gemini-2.0-flash': '2.0 Flash',
  'gemini-1.5-pro': '1.5 Pro',
  'gemini-1.5-flash': '1.5 Flash',
};

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  'gemini-2.5-pro': 'Most capable — complex reasoning, code, analysis',
  'gemini-2.5-flash': 'Fast & smart — best for most tasks',
  'gemini-2.0-flash': 'Balanced speed and quality',
  'gemini-1.5-pro': 'Long context, 2M token window',
  'gemini-1.5-flash': 'Fastest, lightweight tasks',
};

export const LANGUAGE_COLORS: Record<string, string> = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  rust: 'text-orange-400',
  go: 'text-cyan-400',
  java: 'text-red-400',
  cpp: 'text-purple-400',
  bash: 'text-gray-400',
  sql: 'text-pink-400',
  html: 'text-orange-300',
  css: 'text-blue-300',
  json: 'text-green-300',
  yaml: 'text-yellow-300',
  dockerfile: 'text-blue-400',
  default: 'text-gray-400',
};

export function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang?.toLowerCase()] || LANGUAGE_COLORS.default;
}

export function extractCodeBlocks(markdown: string): { language: string; code: string }[] {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export const PROJECT_COLORS = [
  '#0d7fe8', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export const PROJECT_ICONS = [
  '⚙️', '🚀', '🔬', '🤖', '🔧', '📊', '🛠️', '🌐',
  '🔐', '📦', '🧪', '💡', '🏗️', '🔌', '📡', '🎯',
];
