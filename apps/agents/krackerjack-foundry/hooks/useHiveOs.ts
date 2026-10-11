// HIVE AI OS — State Hook for Device + App Node Management
// Assigned by: Architect KRACKERJACK1134

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  HiveDevice,
  HiveApp,
  HiveSyncLog,
  HiveBroadcast,
  HiveOsStats,
  registerDevice,
  sendHeartbeat,
  listDevices,
  removeDevice,
  updateDeviceStatus,
  listApps,
  registerApp,
  updateApp,
  removeApp,
  launchApp,
  loadSyncLog,
  exportHivePackage,
  sendBroadcast,
  loadBroadcasts,
  loadHiveStats,
  KRACKERJACK_HIVE_APPS,
  logSync,
} from '@/services/hiveOsService';
import { useAlert } from '@/template';

export interface HiveOsState {
  // Devices
  devices: HiveDevice[];
  currentDevice: HiveDevice | null;
  loadingDevices: boolean;

  // Apps
  apps: HiveApp[];
  loadingApps: boolean;

  // Sync
  syncLog: HiveSyncLog[];
  loadingSync: boolean;
  isSyncing: boolean;

  // Broadcasts
  broadcasts: HiveBroadcast[];
  loadingBroadcasts: boolean;

  // Stats
  stats: HiveOsStats;

  // Actions
  refreshAll: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshApps: () => Promise<void>;
  refreshBroadcasts: () => Promise<void>;
  bootCurrentDevice: () => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  addApp: (app: Omit<HiveApp, 'id' | 'registered_at' | 'last_sync'>) => Promise<void>;
  editApp: (id: string, updates: Partial<HiveApp>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  openApp: (app: HiveApp) => Promise<void>;
  seedHiveApps: () => Promise<void>;
  exportPackage: () => Promise<string>;
  broadcastMessage: (channel: string, message: string, priority: HiveBroadcast['priority']) => Promise<void>;
  syncAllApps: () => Promise<void>;
}

export function useHiveOs(): HiveOsState {
  const { showAlert } = useAlert();

  const [devices, setDevices] = useState<HiveDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<HiveDevice | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const [apps, setApps] = useState<HiveApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [syncLog, setSyncLog] = useState<HiveSyncLog[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [broadcasts, setBroadcasts] = useState<HiveBroadcast[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  const [stats, setStats] = useState<HiveOsStats>({
    totalDevices: 0, onlineDevices: 0, totalApps: 0, activeApps: 0,
    totalSyncs: 0, lastSync: null, broadcasts: 0,
  });

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Boot ────────────────────────────────────────────────────────────────────
  const bootCurrentDevice = useCallback(async () => {
    const { device } = await registerDevice();
    if (device) setCurrentDevice(device);
  }, []);

  // ── Devices ─────────────────────────────────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    setLoadingDevices(true);
    const { devices: list } = await listDevices();
    setDevices(list);
    setLoadingDevices(false);
  }, []);

  const deleteDevice = useCallback(async (id: string) => {
    const { error } = await removeDevice(id);
    if (error) { showAlert('Error', error); return; }
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Apps ────────────────────────────────────────────────────────────────────
  const refreshApps = useCallback(async () => {
    setLoadingApps(true);
    const { apps: list } = await listApps();
    setApps(list);
    setLoadingApps(false);
  }, []);

  const addApp = useCallback(async (appData: Omit<HiveApp, 'id' | 'registered_at' | 'last_sync'>) => {
    const { app, error } = await registerApp(appData);
    if (error) { showAlert('Error', error); return; }
    if (app) setApps(prev => [app, ...prev.filter(a => a.slug !== app.slug)]);
    await logSync('app_registered', 'KRACKERJACK AI', [appData.slug], `Registered: ${appData.name}`);
  }, []);

  const editApp = useCallback(async (id: string, updates: Partial<HiveApp>) => {
    const { error } = await updateApp(id, updates);
    if (error) { showAlert('Error', error); return; }
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteApp = useCallback(async (id: string) => {
    const { error } = await removeApp(id);
    if (error) { showAlert('Error', error); return; }
    setApps(prev => prev.filter(a => a.id !== id));
  }, []);

  const openApp = useCallback(async (app: HiveApp) => {
    const { success, method } = await launchApp(app);
    if (!success) {
      showAlert('Cannot Launch', `No launch method available for ${app.name}.\nConfigure a deep link scheme, App Store URL, or repo URL.`);
    } else {
      await logSync('app_launch', 'KRACKERJACK AI', [app.slug], `Launched ${app.name} via ${method}`);
    }
  }, []);

  const seedHiveApps = useCallback(async () => {
    for (const app of KRACKERJACK_HIVE_APPS) {
      await registerApp(app);
    }
    await refreshApps();
    showAlert('Hive Seeded', `${KRACKERJACK_HIVE_APPS.length} known apps registered to the Hive.`);
  }, []);

  // ── Sync ────────────────────────────────────────────────────────────────────
  const syncAllApps = useCallback(async () => {
    setIsSyncing(true);
    const activeApps = apps.filter(a => a.status === 'active');

    // Log sync event for each active app
    for (const app of activeApps) {
      await updateApp(app.id!, { last_sync: new Date().toISOString() });
    }

    await logSync(
      'full_sync',
      'KRACKERJACK AI',
      activeApps.map(a => a.slug),
      `Full Hive sync: ${activeApps.length} nodes synced`
    );

    const { logs } = await loadSyncLog(20);
    setSyncLog(logs);
    await refreshApps();
    setIsSyncing(false);
    showAlert('Sync Complete', `${activeApps.length} Hive nodes synced.`);
  }, [apps]);

  const exportPackage = useCallback(async (): Promise<string> => {
    const pkg = await exportHivePackage();
    await logSync('export', 'KRACKERJACK AI', ['external'], 'Full Hive package export');
    return pkg;
  }, []);

  // ── Broadcasts ──────────────────────────────────────────────────────────────
  const refreshBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true);
    const { broadcasts: list } = await loadBroadcasts(20);
    setBroadcasts(list);
    setLoadingBroadcasts(false);
  }, []);

  const broadcastMessage = useCallback(async (
    channel: string,
    message: string,
    priority: HiveBroadcast['priority']
  ) => {
    const { broadcast, error } = await sendBroadcast(channel, message, priority);
    if (error) { showAlert('Broadcast Failed', error); return; }
    if (broadcast) setBroadcasts(prev => [broadcast, ...prev]);
    showAlert('Broadcast Sent', `[${priority}] Signal transmitted to all Hive nodes.`);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    const s = await loadHiveStats();
    setStats(s);
  }, []);

  // ── Sync Log ─────────────────────────────────────────────────────────────────
  const refreshSyncLog = useCallback(async () => {
    setLoadingSync(true);
    const { logs } = await loadSyncLog(20);
    setSyncLog(logs);
    setLoadingSync(false);
  }, []);

  // ── Refresh All ──────────────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshDevices(),
      refreshApps(),
      refreshSyncLog(),
      refreshBroadcasts(),
      refreshStats(),
    ]);
  }, [refreshDevices, refreshApps, refreshSyncLog, refreshBroadcasts, refreshStats]);

  // ── Mount ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    bootCurrentDevice();
    refreshAll();

    // Heartbeat every 2 min
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat();
    }, 120_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  return {
    devices, currentDevice, loadingDevices,
    apps, loadingApps,
    syncLog, loadingSync, isSyncing,
    broadcasts, loadingBroadcasts,
    stats,
    refreshAll, refreshDevices, refreshApps, refreshBroadcasts,
    bootCurrentDevice, deleteDevice,
    addApp, editApp, deleteApp, openApp, seedHiveApps,
    exportPackage,
    broadcastMessage,
    syncAllApps,
  };
}
