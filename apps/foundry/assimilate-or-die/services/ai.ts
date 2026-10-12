import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

const EDGE_FUNCTION_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || (typeof location!=="undefined"?location.origin:""))
  ? `${(process.env.EXPO_PUBLIC_SUPABASE_URL || (typeof location!=="undefined"?location.origin:""))}/functions/v1/openclaw-ai`
  : '';

export async function streamChat(
  messages: ChatMessage[],
  agentId: string,
  appIdea: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  try {
    const reader = await (async () => {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "hive-anon-key") ?? '',
        },
        body: JSON.stringify({
          messages,
          phase: agentId,
          appIdea,
          stream: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI Error: ${text}`);
      }

      return res.body?.getReader();
    })();

    if (!reader) {
      // Fallback: non-streaming
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "hive-anon-key") ?? '',
        },
        body: JSON.stringify({
          messages,
          phase: agentId,
          appIdea,
          stream: false,
        }),
      });
      const data = await res.json();
      callbacks.onChunk(data.content ?? '');
      callbacks.onComplete();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') {
          callbacks.onComplete();
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.choices?.[0]?.delta?.content ?? '';
          if (chunk) callbacks.onChunk(chunk);
        } catch {
          // Skip malformed chunks
        }
      }
    }

    callbacks.onComplete();
  } catch (err: any) {
    callbacks.onError(err.message ?? 'Unknown AI error');
  }
}

export async function sendChat(
  messages: ChatMessage[],
  agentId: string,
  appIdea: string
): Promise<{ content: string | null; error: string | null }> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.functions.invoke('openclaw-ai', {
      body: { messages, phase: agentId, appIdea, stream: false },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message}`;
        } catch {
          errorMessage = error.message;
        }
      }
      return { content: null, error: errorMessage };
    }

    return { content: data?.content ?? null, error: null };
  } catch (err: any) {
    return { content: null, error: err.message ?? 'Failed to contact OpenClaw' };
  }
}
