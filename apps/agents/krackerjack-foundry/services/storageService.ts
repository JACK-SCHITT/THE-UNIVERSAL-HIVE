// KRACKERJACK AI — Local Storage Service

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GH_TOKEN: 'kj_gh_token',
  ASSIMILATED: 'kj_assimilated_ids',
  HIVE_NOTES: 'kj_hive_notes',
  GROK_KEY: 'kj_grok_api_key',
  TERMINAL_HISTORY: 'kj_terminal_history',
};

// ── GitHub Token ──────────────────────────────────────────────────────────────
export async function saveGHToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.GH_TOKEN, token);
}

export async function loadGHToken(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.GH_TOKEN)) ?? '';
}

// ── Assimilated IDs ───────────────────────────────────────────────────────────
export async function saveAssimilated(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ASSIMILATED, JSON.stringify(ids));
}

export async function loadAssimilated(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.ASSIMILATED);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Hive Notes (per-repo intel) ───────────────────────────────────────────────

export interface HiveNote {
  id: string;
  repoId: string;
  content: string;
  timestamp: string;
  tag: 'intel' | 'plan' | 'bug' | 'idea' | 'warn' | 'done';
}

export async function saveHiveNote(repoId: string, note: string): Promise<void> {
  // Legacy single-note compatibility
  const raw = await AsyncStorage.getItem(KEYS.HIVE_NOTES);
  const notes: Record<string, string> = raw ? JSON.parse(raw) : {};
  notes[repoId] = note;
  await AsyncStorage.setItem(KEYS.HIVE_NOTES, JSON.stringify(notes));
}

export async function loadHiveNotes(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(KEYS.HIVE_NOTES);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// Rich notes per repo (keyed by `kj_notes_<repoId>`)
export async function saveRepoNotes(repoId: string, notes: HiveNote[]): Promise<void> {
  await AsyncStorage.setItem(`kj_notes_${repoId}`, JSON.stringify(notes));
}

export async function loadRepoNotes(repoId: string): Promise<HiveNote[]> {
  const raw = await AsyncStorage.getItem(`kj_notes_${repoId}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addRepoNote(
  repoId: string,
  content: string,
  tag: HiveNote['tag'] = 'intel'
): Promise<HiveNote> {
  const existing = await loadRepoNotes(repoId);
  const note: HiveNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    repoId,
    content,
    timestamp: new Date().toISOString(),
    tag,
  };
  const updated = [note, ...existing];
  await saveRepoNotes(repoId, updated);
  return note;
}

export async function deleteRepoNote(repoId: string, noteId: string): Promise<void> {
  const existing = await loadRepoNotes(repoId);
  const updated = existing.filter(n => n.id !== noteId);
  await saveRepoNotes(repoId, updated);
}

// ── Grok API Key ─────────────────────────────────────────────────────────────
export async function saveGrokKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.GROK_KEY, key);
}

export async function loadGrokKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.GROK_KEY)) ?? '';
}

// ── Terminal History ──────────────────────────────────────────────────────────
export async function saveTerminalHistory(history: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TERMINAL_HISTORY, JSON.stringify(history.slice(-100)));
}

export async function loadTerminalHistory(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.TERMINAL_HISTORY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
