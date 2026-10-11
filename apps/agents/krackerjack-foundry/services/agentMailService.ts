// AGENTMAIL — Email API for Agents
// KRACKERJACK AI Hive Communication Layer
// API Key stored server-side in Edge Function secrets

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  INBOX_CONFIG: 'kj_agentmail_inbox',
  EMAIL_CACHE: 'kj_agentmail_emails',
};

export interface AgentMailInbox {
  id: string;
  address: string;
  created_at: string;
}

export interface AgentMailEmail {
  id: string;
  inbox_id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  received_at: string;
  read: boolean;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from_inbox_id?: string;
}

// ── Local inbox cache ─────────────────────────────────────────────────────────
export async function saveInboxConfig(inbox: AgentMailInbox): Promise<void> {
  await AsyncStorage.setItem(KEYS.INBOX_CONFIG, JSON.stringify(inbox));
}

export async function loadInboxConfig(): Promise<AgentMailInbox | null> {
  const raw = await AsyncStorage.getItem(KEYS.INBOX_CONFIG);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearInboxConfig(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.INBOX_CONFIG);
  await AsyncStorage.removeItem(KEYS.EMAIL_CACHE);
}

// ── Edge Function proxy ───────────────────────────────────────────────────────
async function callAgentMail(action: string, payload: Record<string, any> = {}): Promise<{ data: any; error: string | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('agentmail-proxy', {
    body: { action, ...payload },
  });

  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
      } catch {
        errorMessage = error.message || 'AgentMail proxy error';
      }
    }
    return { data: null, error: errorMessage };
  }

  return { data, error: null };
}

// ── Create Inbox ──────────────────────────────────────────────────────────────
export async function createInbox(username?: string): Promise<{ inbox: AgentMailInbox | null; error: string | null }> {
  const { data, error } = await callAgentMail('create_inbox', { username });
  if (error || !data?.inbox) return { inbox: null, error: error ?? 'Failed to create inbox' };
  await saveInboxConfig(data.inbox);
  return { inbox: data.inbox, error: null };
}

// ── List Inboxes ──────────────────────────────────────────────────────────────
export async function listInboxes(): Promise<{ inboxes: AgentMailInbox[]; error: string | null }> {
  const { data, error } = await callAgentMail('list_inboxes');
  if (error) return { inboxes: [], error };
  return { inboxes: data?.inboxes ?? [], error: null };
}

// ── Send Email ────────────────────────────────────────────────────────────────
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error: string | null }> {
  const inbox = await loadInboxConfig();
  const { data, error } = await callAgentMail('send_email', {
    ...params,
    from_inbox_id: params.from_inbox_id ?? inbox?.id,
  });
  if (error) return { success: false, error };
  return { success: true, error: null };
}

// ── List Emails (received) ────────────────────────────────────────────────────
export async function listEmails(inboxId?: string, limit = 20): Promise<{ emails: AgentMailEmail[]; error: string | null }> {
  const inbox = await loadInboxConfig();
  const resolvedId = inboxId ?? inbox?.id;
  if (!resolvedId) return { emails: [], error: 'No inbox configured' };

  const { data, error } = await callAgentMail('list_emails', { inbox_id: resolvedId, limit });
  if (error) return { emails: [], error };

  const emails: AgentMailEmail[] = data?.emails ?? [];

  // Cache locally
  await AsyncStorage.setItem(KEYS.EMAIL_CACHE, JSON.stringify(emails));
  return { emails, error: null };
}

// ── Get Email ─────────────────────────────────────────────────────────────────
export async function getEmail(emailId: string, inboxId?: string): Promise<{ email: AgentMailEmail | null; error: string | null }> {
  const inbox = await loadInboxConfig();
  const resolvedId = inboxId ?? inbox?.id;
  if (!resolvedId) return { email: null, error: 'No inbox configured' };

  const { data, error } = await callAgentMail('get_email', { inbox_id: resolvedId, email_id: emailId });
  if (error || !data?.email) return { email: null, error: error ?? 'Email not found' };
  return { email: data.email, error: null };
}

// ── Delete Email ──────────────────────────────────────────────────────────────
export async function deleteEmail(emailId: string, inboxId?: string): Promise<{ success: boolean; error: string | null }> {
  const inbox = await loadInboxConfig();
  const resolvedId = inboxId ?? inbox?.id;
  if (!resolvedId) return { success: false, error: 'No inbox configured' };

  const { data, error } = await callAgentMail('delete_email', { inbox_id: resolvedId, email_id: emailId });
  if (error) return { success: false, error };
  return { success: true, error: null };
}

// ── Load cached emails (offline) ──────────────────────────────────────────────
export async function loadCachedEmails(): Promise<AgentMailEmail[]> {
  const raw = await AsyncStorage.getItem(KEYS.EMAIL_CACHE);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
