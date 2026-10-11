// KRACKERJACK AI — Chat Service with Full Neural Memory + Training Injection

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  getActiveMemoriesForPrompt,
  loadHiveDirectives,
  loadPersonalityConfig,
  getTrainingExamplesForPrompt,
  getKnowledgeForPrompt,
} from '@/services/identityService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string | null;
  error: string | null;
}

// Build the full injection payload for the system prompt
async function buildInjectionPayload(): Promise<{
  neuralMemory: string;
  directives: string;
  personalityContext: string;
  trainingExamples: string;
  knowledgeBase: string;
}> {
  const [memories, allDirectives, personality, training, knowledge] = await Promise.all([
    getActiveMemoriesForPrompt(),
    loadHiveDirectives(),
    loadPersonalityConfig(),
    getTrainingExamplesForPrompt(),
    getKnowledgeForPrompt(),
  ]);

  const activeDirectives = allDirectives.filter(d => d.active);
  const directivesText = activeDirectives.length > 0
    ? `ACTIVE HIVE DIRECTIVES:\n${activeDirectives.map(d => `[${d.priority}] ${d.directive}`).join('\n')}`
    : '';

  const personalityText = `PERSONALITY CALIBRATION (Architect-set):
Directness: ${personality.directnessLevel}/10 | Wit: ${personality.witLevel}/10 | Tech Depth: ${personality.techDepth}/10
Capricorn Mode: ${personality.capricornMode}/10 | Hive Language: ${personality.hiveLanguage}/10
Response Length Preference: ${personality.responseLength.toUpperCase()}`;

  return {
    neuralMemory: memories,
    directives: directivesText,
    personalityContext: personalityText,
    trainingExamples: training,
    knowledgeBase: knowledge,
  };
}

export async function sendToKrackerjackAI(messages: ChatMessage[]): Promise<ChatResponse> {
  const supabase = getSupabaseClient();

  const injection = await buildInjectionPayload();

  const { data, error } = await supabase.functions.invoke('krackerjack-chat', {
    body: {
      messages,
      ...injection,
    },
  });

  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
      } catch {
        errorMessage = error.message || 'Failed to read AI response';
      }
    }
    return { reply: null, error: errorMessage };
  }

  return { reply: data?.reply ?? null, error: null };
}
