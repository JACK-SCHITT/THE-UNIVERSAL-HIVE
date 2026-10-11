// HIVE AI OS — Device Registry, App Node Manager, Sync Engine, Broadcast
// Assigned by: Architect KRACKERJACK1134

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Linking } from 'react-native';
import { getSupabaseClient } from '@/template';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HiveDevice {
  id?: string;
  device_name: string;
  device_id: string;
  os: string;
  os_version: string | null;
  platform: string;
  status: 'online' | 'offline' | 'idle';
  last_seen: string;
  registered_at?: string;
  ip_hint?: string;
  capabilities: string[];
  metadata: Record<string, any>;
}

export interface HiveApp {
  id?: string;
  name: string;
  slug: string;
  description: string;
  node_type: 'app' | 'service' | 'agent' | 'tool' | 'bridge';
  status: 'active' | 'inactive' | 'maintenance' | 'building';
  platform: string;
  deep_link_scheme?: string;
  app_store_url?: string;
  play_store_url?: string;
  repo_url?: string;
  api_endpoint?: string;
  version: string;
  capabilities: string[];
  registered_at?: string;
  last_sync?: string;
  metadata: Record<string, any>;
}

export interface HiveSyncLog {
  id?: string;
  sync_type: string;
  source_app: string;
  target_apps: string[];
  payload_summary: string;
  status: 'success' | 'partial' | 'failed';
  synced_at?: string;
  metadata: Record<string, any>;
}

export interface HiveBroadcast {
  id?: string;
  channel: string;
  message: string;
  sender: string;
  priority: 'ABSOLUTE' | 'HIGH' | 'STANDARD' | 'INFO';
  target_devices: string[];
  target_apps: string[];
  read_by: string[];
  expires_at?: string;
  created_at?: string;
}

export interface HiveOsStats {
  totalDevices: number;
  onlineDevices: number;
  totalApps: number;
  activeApps: number;
  totalSyncs: number;
  lastSync: string | null;
  broadcasts: number;
}

const KEYS = {
  LOCAL_DEVICE_ID: 'kj_hive_device_id',
  LOCAL_APPS_CACHE: 'kj_hive_apps_cache',
  LOCAL_BROADCASTS_CACHE: 'kj_hive_broadcasts_cache',
};

// ── Device Identity ───────────────────────────────────────────────────────────

export async function getOrCreateDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(KEYS.LOCAL_DEVICE_ID);
  if (stored) return stored;
  const id = `device_${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(KEYS.LOCAL_DEVICE_ID, id);
  return id;
}

export function getCurrentDeviceInfo(): Omit<HiveDevice, 'id' | 'registered_at'> {
  const osName = Platform.OS === 'ios' ? 'iOS' :
    Platform.OS === 'android' ? 'Android' :
    Platform.OS === 'web' ? 'Web' : 'Unknown';

  const osVersion = Device.osVersion ?? Platform.Version?.toString() ?? null;
  const deviceName = Device.deviceName ?? Device.modelName ?? `${osName} Device`;

  const capabilities: string[] = ['krackerjack-chat', 'agentmail', 'github-api', 'counsel', 'zorg'];

  return {
    device_name: deviceName,
    device_id: '', // filled in async
    os: osName,
    os_version: osVersion,
    platform: Platform.OS,
    status: 'online',
    last_seen: new Date().toISOString(),
    capabilities,
    metadata: {
      app_version: Application.nativeApplicationVersion ?? 'dev',
      build: Application.nativeBuildVersion ?? '0',
      model: Device.modelName ?? 'unknown',
      brand: Device.brand ?? 'unknown',
    },
  };
}

// ── Register / Heartbeat Device ───────────────────────────────────────────────

export async function registerDevice(): Promise<{ device: HiveDevice | null; error: string | null }> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const info = getCurrentDeviceInfo();
    const supabase = getSupabaseClient();

    const payload: HiveDevice = { ...info, device_id: deviceId };

    // Upsert by device_id
    const { data, error } = await supabase
      .from('hive_devices')
      .upsert({ ...payload, last_seen: new Date().toISOString() }, { onConflict: 'device_id' })
      .select()
      .single();

    if (error) return { device: null, error: error.message };
    return { device: data, error: null };
  } catch (err: any) {
    return { device: null, error: err.message ?? 'Device registration failed' };
  }
}

export async function sendHeartbeat(): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const supabase = getSupabaseClient();
    await supabase
      .from('hive_devices')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('device_id', deviceId);
  } catch { /* silent */ }
}

// ── Device CRUD ───────────────────────────────────────────────────────────────

export async function listDevices(): Promise<{ devices: HiveDevice[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_devices')
      .select('*')
      .order('last_seen', { ascending: false });
    if (error) return { devices: [], error: error.message };
    return { devices: data ?? [], error: null };
  } catch (err: any) {
    return { devices: [], error: err.message };
  }
}

export async function updateDeviceStatus(deviceId: string, status: HiveDevice['status']): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('hive_devices').update({ status }).eq('device_id', deviceId);
}

export async function removeDevice(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('hive_devices').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── App Node CRUD ─────────────────────────────────────────────────────────────

export async function registerApp(app: Omit<HiveApp, 'id' | 'registered_at' | 'last_sync'>): Promise<{ app: HiveApp | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_apps')
      .upsert({ ...app, last_sync: new Date().toISOString() }, { onConflict: 'slug' })
      .select()
      .single();
    if (error) return { app: null, error: error.message };

    // Update local cache
    const cached = await loadCachedApps();
    const updated = [data, ...cached.filter((a: HiveApp) => a.slug !== app.slug)];
    await AsyncStorage.setItem(KEYS.LOCAL_APPS_CACHE, JSON.stringify(updated));

    return { app: data, error: null };
  } catch (err: any) {
    return { app: null, error: err.message };
  }
}

export async function listApps(): Promise<{ apps: HiveApp[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_apps')
      .select('*')
      .order('registered_at', { ascending: false });
    if (error) {
      // Fallback to cache
      const cached = await loadCachedApps();
      return { apps: cached, error: null };
    }
    await AsyncStorage.setItem(KEYS.LOCAL_APPS_CACHE, JSON.stringify(data));
    return { apps: data ?? [], error: null };
  } catch (err: any) {
    const cached = await loadCachedApps();
    return { apps: cached, error: null };
  }
}

export async function updateApp(id: string, updates: Partial<HiveApp>): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('hive_apps').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function removeApp(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('hive_apps').delete().eq('id', id);
  return { error: error?.message ?? null };
}

async function loadCachedApps(): Promise<HiveApp[]> {
  const raw = await AsyncStorage.getItem(KEYS.LOCAL_APPS_CACHE);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Deep Link Launch ──────────────────────────────────────────────────────────

export async function launchApp(app: HiveApp): Promise<{ success: boolean; method: string }> {
  // 1. Try deep link scheme first
  if (app.deep_link_scheme) {
    const canOpen = await Linking.canOpenURL(app.deep_link_scheme);
    if (canOpen) {
      await Linking.openURL(app.deep_link_scheme);
      return { success: true, method: 'deep_link' };
    }
  }

  // 2. Try platform store URL
  const storeUrl = Platform.OS === 'ios' ? app.app_store_url : app.play_store_url;
  if (storeUrl) {
    await Linking.openURL(storeUrl);
    return { success: true, method: 'store' };
  }

  // 3. Try repo URL (web fallback)
  if (app.repo_url) {
    await Linking.openURL(app.repo_url);
    return { success: true, method: 'repo' };
  }

  return { success: false, method: 'none' };
}

export async function openDeviceSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else if (Platform.OS === 'android') {
    await Linking.openSettings();
  }
}

// ── Sync Engine ───────────────────────────────────────────────────────────────

export async function logSync(
  syncType: string,
  sourceApp: string,
  targetApps: string[],
  payloadSummary: string,
  status: HiveSyncLog['status'] = 'success'
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('hive_sync_log').insert({
      sync_type: syncType,
      source_app: sourceApp,
      target_apps: targetApps,
      payload_summary: payloadSummary,
      status,
      metadata: { device: Platform.OS, ts: Date.now() },
    });
  } catch { /* silent */ }
}

export async function loadSyncLog(limit = 20): Promise<{ logs: HiveSyncLog[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(limit);
    if (error) return { logs: [], error: error.message };
    return { logs: data ?? [], error: null };
  } catch (err: any) {
    return { logs: [], error: err.message };
  }
}

// Export soul + memory as a portable JSON package that other apps can import
export async function exportHivePackage(): Promise<string> {
  const {
    loadSoulVault,
    loadNeuralMemories,
    loadHiveDirectives,
    loadPersonalityConfig,
    loadKnowledgeBase,
  } = await import('./identityService');

  const [vault, memories, directives, personality, knowledge] = await Promise.all([
    loadSoulVault(),
    loadNeuralMemories(),
    loadHiveDirectives(),
    loadPersonalityConfig(),
    loadKnowledgeBase(),
  ]);

  const pkg = {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    source: 'KRACKERJACK AI',
    soul_vault: vault,
    neural_memories: memories.filter(m => m.active),
    hive_directives: directives.filter(d => d.active),
    personality_config: personality,
    knowledge_base: knowledge.filter(k => k.active),
  };

  return JSON.stringify(pkg, null, 2);
}

// ── Broadcast ─────────────────────────────────────────────────────────────────

export async function sendBroadcast(
  channel: string,
  message: string,
  priority: HiveBroadcast['priority'] = 'STANDARD',
  targetDevices: string[] = ['ALL'],
  targetApps: string[] = ['ALL']
): Promise<{ broadcast: HiveBroadcast | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('hive_broadcasts').insert({
      channel,
      message,
      sender: 'ARCHITECT',
      priority,
      target_devices: targetDevices,
      target_apps: targetApps,
      read_by: [],
    }).select().single();
    if (error) return { broadcast: null, error: error.message };
    await logSync('broadcast', 'KRACKERJACK AI', targetApps, `[${priority}] ${channel}: ${message.slice(0, 80)}...`);
    return { broadcast: data, error: null };
  } catch (err: any) {
    return { broadcast: null, error: err.message };
  }
}

export async function loadBroadcasts(limit = 20): Promise<{ broadcasts: HiveBroadcast[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      const raw = await AsyncStorage.getItem(KEYS.LOCAL_BROADCASTS_CACHE);
      const cached = raw ? JSON.parse(raw) : [];
      return { broadcasts: cached, error: null };
    }
    await AsyncStorage.setItem(KEYS.LOCAL_BROADCASTS_CACHE, JSON.stringify(data));
    return { broadcasts: data ?? [], error: null };
  } catch (err: any) {
    return { broadcasts: [], error: err.message };
  }
}

// ── Hive OS Stats ─────────────────────────────────────────────────────────────

export async function loadHiveStats(): Promise<HiveOsStats> {
  const supabase = getSupabaseClient();
  try {
    const [devicesRes, appsRes, syncRes, broadcastRes] = await Promise.all([
      supabase.from('hive_devices').select('status'),
      supabase.from('hive_apps').select('status'),
      supabase.from('hive_sync_log').select('synced_at').order('synced_at', { ascending: false }).limit(1),
      supabase.from('hive_broadcasts').select('id', { count: 'exact', head: true }),
    ]);

    const devices: any[] = devicesRes.data ?? [];
    const apps: any[] = appsRes.data ?? [];
    const syncs = syncRes.data ?? [];

    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      totalApps: apps.length,
      activeApps: apps.filter(a => a.status === 'active').length,
      totalSyncs: 0,
      lastSync: syncs[0]?.synced_at ?? null,
      broadcasts: broadcastRes.count ?? 0,
    };
  } catch {
    return { totalDevices: 0, onlineDevices: 0, totalApps: 0, activeApps: 0, totalSyncs: 0, lastSync: null, broadcasts: 0 };
  }
}

// ── Pre-seeded Hive Apps (KRACKERJACK's known ecosystem) ─────────────────────

export const KRACKERJACK_HIVE_APPS: Array<Omit<HiveApp, 'id' | 'registered_at' | 'last_sync'>> = [
  {
    name: 'KRACKERJACK AI',
    slug: 'krackerjack-ai',
    description: 'Primary Hive command center — GitHub ops, AI chat, security, identity training',
    node_type: 'app',
    status: 'active',
    platform: 'react-native',
    deep_link_scheme: 'onspaceapp://',
    version: '2.0.0',
    capabilities: ['github-api', 'krackerjack-chat', 'counsel', 'zorg', 'agentmail', 'hive-identity'],
    metadata: { is_primary: true, hive_role: 'COMMAND_CENTER' },
  },
  {
    name: 'BLINDMAN AI NAVIGATOR',
    slug: 'blindman-ai',
    description: 'AI-powered navigation assistant — proves AI can navigate for the Architect',
    node_type: 'app',
    status: 'building',
    platform: 'react-native',
    version: '0.1.0',
    capabilities: ['ai-navigation', 'location-awareness'],
    metadata: { hive_role: 'NAVIGATOR', origin_story: 'The project that proved AI navigation is possible and personal' },
  },
];
