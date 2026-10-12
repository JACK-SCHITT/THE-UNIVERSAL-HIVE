import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ChatMessage } from '@/constants/storage';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || (typeof location!=="undefined"?location.origin:"")) || '';
const ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "hive-anon-key") || '';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/openclaw-ai`;

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export async function sendMessage(
  messages: ChatMessage[],
  agentId: string | undefined,
  phase: string,
  appIdea: string,
  callbacks: StreamCallbacks
): Promise<void> {
  if (!SUPABASE_URL || !ANON_KEY) {
    callbacks.onError('Backend not configured.');
    return;
  }

  try {
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        messages: apiMessages,
        phase,
        appIdea,
        agentId,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[${response.status}] ${errText}`);
    }

    // Cross-platform streaming: reader on mobile, text fallback on web
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const chunk = parseSSELine(line);
          if (chunk) callbacks.onChunk(chunk);
        }
      }
      // Flush any remaining buffer
      if (buffer) {
        const chunk = parseSSELine(buffer);
        if (chunk) callbacks.onChunk(chunk);
      }
    } else {
      // Web SSR fallback: parse full text
      const text = await response.text();
      for (const line of text.split('\n')) {
        const chunk = parseSSELine(line);
        if (chunk) callbacks.onChunk(chunk);
      }
    }

    callbacks.onDone();
  } catch (err: any) {
    console.error('[aiService] Error:', err.message);
    callbacks.onError(err.message || 'Connection failed. Please try again.');
  }
}

function parseSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6).trim();
  if (data === '[DONE]') return null;
  try {
    const json = JSON.parse(data);
    return json.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}
