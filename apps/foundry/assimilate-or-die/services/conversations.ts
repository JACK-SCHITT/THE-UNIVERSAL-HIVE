import { getSupabaseClient } from '@/template';

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  title: string;
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function createConversation(
  agentId: string,
  agentName: string,
  title: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, agent_id: agentId, agent_name: agentName, title })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getConversations(): Promise<{ data: Conversation[]; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getMessages(conversationId: string): Promise<{ data: Message[]; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<{ data: Message | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Update conversation last_message and updated_at
  await supabase
    .from('conversations')
    .update({
      last_message: content.slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  return { data, error: null };
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('conversations').update({ title }).eq('id', conversationId);
}

export async function deleteConversation(conversationId: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) return { error: error.message };
  return { error: null };
}
