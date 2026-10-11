import type { GeminiModel, Message } from '@/types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiResponse {
  candidates: {
    content: { parts: { text: string }[]; role: string };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

function buildContents(messages: Message[], systemPrompt?: string) {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  if (systemPrompt) {
    return {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
    };
  }

  return { contents };
}

export async function sendMessage(
  apiKey: string,
  model: GeminiModel,
  messages: Message[],
  systemPrompt?: string
): Promise<string> {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
  const body = buildContents(messages, systemPrompt);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function streamMessage(
  apiKey: string,
  model: GeminiModel,
  messages: Message[],
  systemPrompt: string | undefined,
  onChunk: (text: string) => void
): Promise<string> {
  const url = `${BASE_URL}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const body = buildContents(messages, systemPrompt);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const parsed: GeminiResponse = JSON.parse(json);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk) {
            fullText += chunk;
            onChunk(chunk);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  return fullText;
}

export async function generateTitle(apiKey: string, userMessage: string): Promise<string> {
  const url = `${BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a concise 4-6 word title for a conversation starting with: "${userMessage.slice(0, 200)}". Reply with only the title, no quotes.` }],
      }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 32 },
    }),
  });
  if (!res.ok) return 'New Chat';
  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'New Chat';
}

export async function analyzeCode(
  apiKey: string,
  code: string,
  language: string,
  task: 'review' | 'explain' | 'improve' | 'debug' | 'document'
): Promise<string> {
  const prompts = {
    review: `Review this ${language} code for bugs, security issues, and best practices:\n\`\`\`${language}\n${code}\n\`\`\``,
    explain: `Explain what this ${language} code does step by step:\n\`\`\`${language}\n${code}\n\`\`\``,
    improve: `Improve this ${language} code for performance, readability, and maintainability:\n\`\`\`${language}\n${code}\n\`\`\``,
    debug: `Find and fix all bugs in this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
    document: `Add comprehensive documentation and comments to this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
  };

  const url = `${BASE_URL}/gemini-2.5-pro:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompts[task] }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
