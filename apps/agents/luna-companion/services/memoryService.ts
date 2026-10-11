import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface Memory {
  id: string;
  user_id: string;
  character_id: string;
  memory_key: string;
  memory_value: string;
  category: 'personal' | 'preference' | 'event' | 'emotion' | 'general';
  importance: number;
  updated_at: string;
  created_at: string;
}

export const memoryService = {
  async loadMemories(characterId: string): Promise<Memory[]> {
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('character_id', characterId)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) { console.error('Load memories error:', error); return []; }
      return data || [];
    } catch (err) {
      console.error('Load memories exception:', err);
      return [];
    }
  },

  async upsertMemory(
    characterId: string,
    memoryKey: string,
    memoryValue: string,
    category: Memory['category'] = 'general',
    importance: number = 1
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_memories')
        .upsert({
          user_id: user.id,
          character_id: characterId,
          memory_key: memoryKey,
          memory_value: memoryValue,
          category,
          importance,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,character_id,memory_key' });

      if (error) { console.error('Upsert memory error:', error); return false; }
      return true;
    } catch (err) {
      console.error('Upsert memory exception:', err);
      return false;
    }
  },

  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_memories').delete().eq('id', memoryId);
      if (error) { console.error('Delete memory error:', error); return false; }
      return true;
    } catch (err) {
      return false;
    }
  },

  async extractAndSaveMemories(
    characterId: string,
    conversationExcerpt: string,
    session: { access_token: string }
  ): Promise<void> {
    // Call edge function to extract memories from conversation
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'extract_memories',
          characterId,
          conversationExcerpt,
        }),
      });

      if (!response.ok) {
        console.error('Memory extraction failed:', await response.text());
        return;
      }

      const result = await response.json();
      const memories: Array<{ key: string; value: string; category: string; importance: number }> =
        result.memories || [];

      console.log(`🧠 Extracted ${memories.length} memories`);

      for (const mem of memories) {
        await memoryService.upsertMemory(
          characterId,
          mem.key,
          mem.value,
          mem.category as Memory['category'],
          mem.importance
        );
      }
    } catch (err) {
      console.error('Extract memories exception:', err);
    }
  },

  formatMemoriesForPrompt(memories: Memory[]): string {
    if (!memories.length) return '';
    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(`${m.memory_key}: ${m.memory_value}`);
    }
    const lines: string[] = ['[What you remember about the user:]'];
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`  ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items.join('; ')}`);
    }
    return lines.join('\n');
  },
};
