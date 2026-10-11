/**
 * HIVE Device Mesh Service — KRACKERJACK1134
 * Registers, tracks, and authenticates all devices connected to the HIVE.
 * KRACKERJACK1134 identity recognized from any device, anywhere.
 * Full system access: architect level — read/write/execute all.
 *
 * Device Mesh Architecture:
 * - ARCHITECT devices: Full system control, self-update, mesh command
 * - AGENT devices: Standard Hive node access
 * - ANON devices: Read-only Hive telemetry
 *
 * AUTHORIZED: KRACKERJACK1134 only for architect-level operations.
 */

import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';

export interface HiveDevice {
  id: string;
  device_id: string;
  device_name: string;
  platform: string;
  os_version: string | null;
  architect_verified: boolean;
  identity_hash: string | null;
  last_seen: string;
  registered_at: string;
  system_access_level: 'standard' | 'elevated' | 'architect';
  hive_node_id: string | null;
  capabilities: string[];
  active: boolean;
}

export interface WindowsScript {
  id: string;
  script_name: string;
  script_type: 'powershell' | 'batch' | 'registry';
  content: string;
  purpose: string;
  target_os: string;
  requires_admin: boolean;
  generated_at: string;
  generated_by: string;
}

// KRACKERJACK1134 identity signatures — recognized from any device
const ARCHITECT_IDENTITIES = [
  'KRACKERJACK1134',
  'KJ1134',
  'KRACKERJACK-PRIME',
  'ARCHITECT-KJ',
];

/**
 * Generates a stable device ID from platform + device info.
 * In a real deployment this would use expo-device unique identifiers.
 */
function generateDeviceId(): string {
  const platform = Platform.OS.toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${platform}-HIVE-${ts}`;
}

export const deviceMeshService = {

  // ─── Identity ─────────────────────────────────────────────────────────────

  /**
   * Check if an identity string matches KRACKERJACK1134.
   * Recognition works from any device, any platform.
   */
  isArchitect(identity: string): boolean {
    const normalized = identity.toUpperCase().trim();
    return ARCHITECT_IDENTITIES.some(id => normalized.includes(id));
  },

  /**
   * Get architect identity hash for this device.
   */
  getArchitectHash(): string {
    return 'KRACKERJACK1134-PRIME';
  },

  // ─── Device Registration ──────────────────────────────────────────────────

  /**
   * Register or update this device in the Hive Device Mesh.
   * Auto-detects platform and sets access level.
   */
  async registerDevice(params?: {
    deviceName?: string;
    identityClaim?: string;
    osVersion?: string;
    capabilities?: string[];
  }): Promise<HiveDevice> {
    const supabase = getSupabaseClient();
    const deviceId = generateDeviceId();
    const platform = Platform.OS;
    const isArch = params?.identityClaim
      ? this.isArchitect(params.identityClaim)
      : false;

    const deviceData = {
      device_id: deviceId,
      device_name: params?.deviceName ?? `HIVE-NODE-${platform.toUpperCase()}`,
      platform,
      os_version: params?.osVersion ?? Platform.Version?.toString() ?? null,
      architect_verified: isArch,
      identity_hash: isArch ? this.getArchitectHash() : null,
      system_access_level: isArch ? 'architect' : 'standard',
      capabilities: params?.capabilities ?? ['hive_chat', 'terminal_access', 'agent_query'],
      last_seen: new Date().toISOString(),
      active: true,
    };

    const { data, error } = await supabase
      .from('hive_devices')
      .upsert(deviceData, { onConflict: 'device_id' })
      .select()
      .single();

    if (error) throw new Error(`DEVICE REGISTRATION FAILED: ${error.message}`);

    // Log to telemetry
    this.logDeviceEvent(data.id, isArch ? 'ARCHITECT_DEVICE_REGISTERED' : 'DEVICE_REGISTERED', {
      platform,
      access_level: deviceData.system_access_level,
    }).catch(() => {});

    return data as HiveDevice;
  },

  /**
   * Fetch all devices in the Hive Device Mesh.
   */
  async getAllDevices(): Promise<HiveDevice[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_devices')
      .select('*')
      .order('last_seen', { ascending: false });
    if (error) throw new Error(`DEVICE MESH FETCH FAILED: ${error.message}`);
    return (data ?? []) as HiveDevice[];
  },

  /**
   * Mark device as seen (heartbeat ping).
   */
  async pingDevice(deviceId: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase
      .from('hive_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', deviceId);
  },

  /**
   * Revoke or deactivate a device from the mesh.
   * ARCHITECT-only operation.
   */
  async deactivateDevice(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('hive_devices')
      .update({ active: false })
      .eq('id', id);
    if (error) throw new Error(`DEVICE DEACTIVATION FAILED: ${error.message}`);
    this.logDeviceEvent(id, 'DEVICE_DEACTIVATED', {}).catch(() => {});
  },

  /**
   * Grant architect-level access to a device.
   * Requires KRACKERJACK1134 confirmation.
   */
  async elevateToArchitect(id: string, identityClaim: string): Promise<void> {
    if (!this.isArchitect(identityClaim)) {
      throw new Error('IDENTITY VERIFICATION FAILED — Not recognized as KRACKERJACK1134');
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('hive_devices')
      .update({
        architect_verified: true,
        identity_hash: this.getArchitectHash(),
        system_access_level: 'architect',
      })
      .eq('id', id);
    if (error) throw new Error(`ELEVATION FAILED: ${error.message}`);
    this.logDeviceEvent(id, 'DEVICE_ELEVATED_TO_ARCHITECT', { identity: identityClaim }).catch(() => {});
  },

  // ─── Windows Scripts ──────────────────────────────────────────────────────

  /**
   * Save a generated Windows integration script to the database.
   */
  async saveWindowsScript(params: {
    scriptName: string;
    scriptType: WindowsScript['script_type'];
    content: string;
    purpose: string;
    targetOs?: string;
    requiresAdmin?: boolean;
  }): Promise<WindowsScript> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_windows_scripts')
      .insert({
        script_name: params.scriptName,
        script_type: params.scriptType,
        content: params.content,
        purpose: params.purpose,
        target_os: params.targetOs ?? 'windows-10-11',
        requires_admin: params.requiresAdmin ?? true,
        generated_by: 'KRACKERJACK1134',
      })
      .select()
      .single();
    if (error) throw new Error(`SCRIPT SAVE FAILED: ${error.message}`);
    return data as WindowsScript;
  },

  /**
   * Fetch all saved Windows scripts.
   */
  async getWindowsScripts(): Promise<WindowsScript[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hive_windows_scripts')
      .select('*')
      .order('generated_at', { ascending: false });
    if (error) throw new Error(`SCRIPTS FETCH FAILED: ${error.message}`);
    return (data ?? []) as WindowsScript[];
  },

  // ─── Telemetry ─────────────────────────────────────────────────────────────

  async logDeviceEvent(
    deviceId: string,
    intentHash: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('hive_telemetry').insert({
        source_node_id: null,
        intent_hash: intentHash,
        action_payload: { device_id: deviceId, ...payload },
        outcome_impact: `Device mesh event: ${intentHash} | ${deviceId.slice(0, 30)}`,
      });
    } catch {}
  },
};
