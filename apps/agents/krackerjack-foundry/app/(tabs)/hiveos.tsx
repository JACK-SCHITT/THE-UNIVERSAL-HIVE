// HIVE AI OS — Command Center
// Device Registry · App Node Manager · Sync Engine · Broadcast · Transfer
// Assigned by: Architect KRACKERJACK1134

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useAlert } from '@/template';
import { useHiveOs } from '@/hooks/useHiveOs';
import type { HiveApp, HiveBroadcast } from '@/services/hiveOsService';

type HiveTab = 'status' | 'devices' | 'apps' | 'sync' | 'broadcast' | 'transfer';

const NODE_TYPE_COLORS: Record<HiveApp['node_type'], string> = {
  app:     Colors.primary,
  service: Colors.info,
  agent:   '#a78bfa',
  tool:    Colors.accent,
  bridge:  '#34d399',
};

const STATUS_COLORS: Record<string, string> = {
  active:      Colors.primary,
  inactive:    Colors.textMuted,
  maintenance: Colors.accent,
  building:    '#ff6b35',
  online:      Colors.primary,
  offline:     Colors.danger,
  idle:        Colors.info,
};

const PLATFORM_ICON: Record<string, string> = {
  ios:           'phone-iphone',
  android:       'phone-android',
  web:           'language',
  'react-native': 'smartphone',
  macos:         'laptop-mac',
  windows:       'laptop-windows',
  linux:         'computer',
};

export default function HiveOsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const hive = useHiveOs();

  const [activeTab, setActiveTab] = useState<HiveTab>('status');
  const [refreshing, setRefreshing] = useState(false);

  // App form
  const [showAppForm, setShowAppForm] = useState(false);
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appNodeType, setAppNodeType] = useState<HiveApp['node_type']>('app');
  const [appPlatform, setAppPlatform] = useState('react-native');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [appDeepLink, setAppDeepLink] = useState('');
  const [appRepoUrl, setAppRepoUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [appPlayUrl, setAppPlayUrl] = useState('');
  const [savingApp, setSavingApp] = useState(false);

  // Broadcast form
  const [broadcastChannel, setBroadcastChannel] = useState('ALL');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<HiveBroadcast['priority']>('STANDARD');
  const [sending, setSending] = useState(false);

  // Transfer / Export
  const [exporting, setExporting] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await hive.refreshAll();
    setRefreshing(false);
  }, [hive]);

  const handleSaveApp = async () => {
    if (!appName.trim() || !appSlug.trim()) {
      showAlert('Missing Fields', 'Name and slug are required.');
      return;
    }
    setSavingApp(true);
    await hive.addApp({
      name: appName.trim(),
      slug: appSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: appDesc.trim(),
      node_type: appNodeType,
      status: 'active',
      platform: appPlatform.trim(),
      version: appVersion.trim(),
      deep_link_scheme: appDeepLink.trim() || undefined,
      repo_url: appRepoUrl.trim() || undefined,
      app_store_url: appStoreUrl.trim() || undefined,
      play_store_url: appPlayUrl.trim() || undefined,
      capabilities: [],
      metadata: {},
    });
    setSavingApp(false);
    setShowAppForm(false);
    setAppName(''); setAppSlug(''); setAppDesc(''); setAppDeepLink(''); setAppRepoUrl('');
    setAppStoreUrl(''); setAppPlayUrl('');
    showAlert('App Registered', `${appName} is now a Hive node.`);
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setSending(true);
    await hive.broadcastMessage(broadcastChannel, broadcastMsg.trim(), broadcastPriority);
    setBroadcastMsg('');
    setSending(false);
  };

  const handleExport = async () => {
    setExporting(true);
    const pkg = await hive.exportPackage();
    setExporting(false);
    await Share.share({
      message: pkg,
      title: 'KRACKERJACK AI — Hive Export Package',
    });
  };

  const TABS: { key: HiveTab; label: string; icon: string; color: string }[] = [
    { key: 'status',    label: 'STATUS',     icon: 'dashboard',      color: Colors.primary },
    { key: 'devices',   label: 'DEVICES',    icon: 'devices',        color: Colors.info },
    { key: 'apps',      label: 'APPS',       icon: 'apps',           color: '#a78bfa' },
    { key: 'sync',      label: 'SYNC LOG',   icon: 'sync',           color: '#34d399' },
    { key: 'broadcast', label: 'BROADCAST',  icon: 'broadcast-on-home', color: Colors.accent },
    { key: 'transfer',  label: 'TRANSFER',   icon: 'swap-horiz',     color: '#ff6b35' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="hub" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>HIVE AI OS</Text>
            <Text style={styles.headerSub}>
              {hive.stats.onlineDevices} DEVICES · {hive.stats.activeApps} APPS · COMMAND CENTER
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {hive.isSyncing
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : (
              <Pressable onPress={handleRefresh}
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
                {refreshing
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <MaterialIcons name="refresh" size={18} color={Colors.primary} />}
              </Pressable>
            )}
          <View style={[styles.statusDot, { backgroundColor: hive.stats.onlineDevices > 0 ? Colors.primary : Colors.textMuted }]} />
          <Text style={[styles.statusText, { color: hive.stats.onlineDevices > 0 ? Colors.primary : Colors.textMuted }]}>
            {hive.stats.onlineDevices > 0 ? 'HIVE LIVE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll} contentContainerStyle={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable key={tab.key}
              style={[styles.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}>
              <MaterialIcons name={tab.icon as any} size={12} color={isActive ? tab.color : Colors.textMuted} />
              <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STATUS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'status' ? (
            <View style={styles.tabContent}>
              {/* Big status cards */}
              <View style={styles.statsGrid}>
                {[
                  { label: 'DEVICES',    val: hive.stats.totalDevices,    sub: `${hive.stats.onlineDevices} online`,  icon: 'devices',     color: Colors.info },
                  { label: 'APPS',       val: hive.stats.totalApps,       sub: `${hive.stats.activeApps} active`,     icon: 'apps',        color: '#a78bfa' },
                  { label: 'SYNCS',      val: hive.stats.totalSyncs,      sub: hive.stats.lastSync ? 'synced' : 'never', icon: 'sync',    color: '#34d399' },
                  { label: 'BROADCASTS', val: hive.stats.broadcasts,      sub: 'sent',                                icon: 'broadcast-on-home', color: Colors.accent },
                ].map(s => (
                  <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                    <MaterialIcons name={s.icon as any} size={18} color={s.color} />
                    <Text style={[styles.statCardNum, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.statCardLabel}>{s.label}</Text>
                    <Text style={styles.statCardSub}>{s.sub}</Text>
                  </View>
                ))}
              </View>

              {/* Current device */}
              {hive.currentDevice ? (
                <View style={[styles.panel, { borderLeftColor: Colors.primary, borderLeftWidth: 3 }]}>
                  <View style={styles.panelTitleRow}>
                    <MaterialIcons name="my-location" size={13} color={Colors.primary} />
                    <Text style={[styles.panelTitle, { color: Colors.primary }]}>THIS DEVICE</Text>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '44' }]}>
                      <View style={[styles.statusDot, { backgroundColor: Colors.primary, width: 5, height: 5 }]} />
                      <Text style={[styles.statusBadgeText, { color: Colors.primary }]}>ONLINE</Text>
                    </View>
                  </View>
                  <Text style={styles.deviceName}>{hive.currentDevice.device_name}</Text>
                  <View style={styles.deviceMeta}>
                    <View style={styles.metaChip}>
                      <MaterialIcons name={PLATFORM_ICON[hive.currentDevice.platform] as any ?? 'smartphone'} size={11} color={Colors.info} />
                      <Text style={[styles.metaChipText, { color: Colors.info }]}>{hive.currentDevice.os} {hive.currentDevice.os_version}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <MaterialIcons name="memory" size={11} color={Colors.textMuted} />
                      <Text style={styles.metaChipText}>{hive.currentDevice.capabilities.length} capabilities</Text>
                    </View>
                  </View>
                  <Text style={styles.deviceId} selectable numberOfLines={1}>
                    ID: {hive.currentDevice.device_id}
                  </Text>
                </View>
              ) : (
                <Pressable style={styles.bootBtn} onPress={hive.bootCurrentDevice}>
                  <MaterialIcons name="power" size={16} color={Colors.primary} />
                  <Text style={styles.bootBtnText}>REGISTER THIS DEVICE TO HIVE</Text>
                </Pressable>
              )}

              {/* Quick actions */}
              <View style={styles.quickActions}>
                <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
                <View style={styles.quickGrid}>
                  <Pressable style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => setActiveTab('apps')}>
                    <MaterialIcons name="add-circle" size={20} color="#a78bfa" />
                    <Text style={[styles.quickBtnText, { color: '#a78bfa' }]}>ADD APP</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
                    onPress={hive.syncAllApps} disabled={hive.isSyncing}>
                    {hive.isSyncing
                      ? <ActivityIndicator size="small" color="#34d399" />
                      : <MaterialIcons name="sync" size={20} color="#34d399" />}
                    <Text style={[styles.quickBtnText, { color: '#34d399' }]}>SYNC ALL</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => setActiveTab('broadcast')}>
                    <MaterialIcons name="broadcast-on-home" size={20} color={Colors.accent} />
                    <Text style={[styles.quickBtnText, { color: Colors.accent }]}>BROADCAST</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
                    onPress={handleExport} disabled={exporting}>
                    {exporting
                      ? <ActivityIndicator size="small" color="#ff6b35" />
                      : <MaterialIcons name="ios-share" size={20} color="#ff6b35" />}
                    <Text style={[styles.quickBtnText, { color: '#ff6b35' }]}>EXPORT</Text>
                  </Pressable>
                </View>
              </View>

              {/* Recent sync log */}
              {hive.syncLog.slice(0, 4).map(log => (
                <View key={log.id ?? log.synced_at} style={styles.logRow}>
                  <MaterialIcons
                    name={log.status === 'success' ? 'check-circle' : 'error'}
                    size={13}
                    color={log.status === 'success' ? Colors.primary : Colors.danger}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logType}>{log.sync_type.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.logSummary} numberOfLines={1}>{log.payload_summary}</Text>
                  </View>
                  <Text style={styles.logTime}>
                    {log.synced_at ? new Date(log.synced_at).toLocaleTimeString() : ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── DEVICES TAB ─────────────────────────────────────────────── */}
          {activeTab === 'devices' ? (
            <View style={styles.tabContent}>
              <View style={styles.sectionBanner}>
                <MaterialIcons name="info-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.sectionBannerText}>
                  Every device running KRACKERJACK AI registers here automatically on launch. Heartbeat sent every 2 min.
                </Text>
              </View>
              <Pressable style={styles.actionBtnFull} onPress={hive.bootCurrentDevice}>
                <MaterialIcons name="add-link" size={14} color={Colors.info} />
                <Text style={[styles.actionBtnFullText, { color: Colors.info }]}>RE-REGISTER THIS DEVICE</Text>
              </Pressable>
              {hive.loadingDevices ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.info} />
                  <Text style={styles.loadingText}>Scanning Hive for devices...</Text>
                </View>
              ) : hive.devices.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="devices" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>NO DEVICES REGISTERED</Text>
                  <Text style={styles.emptyText}>Launch KRACKERJACK AI on each device to auto-register it.</Text>
                </View>
              ) : (
                hive.devices.map(device => (
                  <View key={device.id ?? device.device_id} style={[
                    styles.deviceCard,
                    { borderLeftColor: STATUS_COLORS[device.status] ?? Colors.textMuted },
                  ]}>
                    <View style={styles.deviceCardHeader}>
                      <View style={[styles.deviceIcon, { backgroundColor: STATUS_COLORS[device.status] + '22' }]}>
                        <MaterialIcons
                          name={PLATFORM_ICON[device.platform] as any ?? 'smartphone'}
                          size={16}
                          color={STATUS_COLORS[device.status] ?? Colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceCardName}>{device.device_name}</Text>
                        <Text style={styles.deviceCardOs}>{device.os} {device.os_version}</Text>
                      </View>
                      <View style={[styles.statusBadge, {
                        backgroundColor: STATUS_COLORS[device.status] + '22',
                        borderColor: STATUS_COLORS[device.status] + '44',
                      }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[device.status], width: 5, height: 5 }]} />
                        <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[device.status] }]}>
                          {device.status.toUpperCase()}
                        </Text>
                      </View>
                      <Pressable onPress={() => device.id && hive.deleteDevice(device.id)} hitSlop={8}>
                        <MaterialIcons name="delete-outline" size={15} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                    <Text style={styles.deviceIdSmall} numberOfLines={1} selectable>
                      {device.device_id}
                    </Text>
                    <View style={styles.capabilityRow}>
                      {(device.capabilities ?? []).slice(0, 5).map(cap => (
                        <View key={cap} style={styles.capChip}>
                          <Text style={styles.capChipText}>{cap}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.lastSeen}>
                      Last seen: {new Date(device.last_seen).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {/* ── APPS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'apps' ? (
            <View style={styles.tabContent}>
              {/* Seed + Add actions */}
              <View style={styles.appActions}>
                <Pressable style={[styles.halfBtn, { borderColor: '#a78bfa33', backgroundColor: '#a78bfa11' }]}
                  onPress={hive.seedHiveApps}>
                  <MaterialIcons name="account-tree" size={14} color="#a78bfa" />
                  <Text style={[styles.halfBtnText, { color: '#a78bfa' }]}>SEED HIVE APPS</Text>
                </Pressable>
                <Pressable style={[styles.halfBtn, { borderColor: Colors.primary + '33', backgroundColor: Colors.primary + '11' }]}
                  onPress={() => setShowAppForm(!showAppForm)}>
                  <MaterialIcons name={showAppForm ? 'expand-less' : 'add'} size={14} color={Colors.primary} />
                  <Text style={[styles.halfBtnText, { color: Colors.primary }]}>
                    {showAppForm ? 'CLOSE FORM' : 'REGISTER APP'}
                  </Text>
                </Pressable>
              </View>

              {/* App registration form */}
              {showAppForm ? (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>📱 REGISTER HIVE APP NODE</Text>
                  <Text style={styles.fieldLabel}>APP NAME *</Text>
                  <TextInput style={styles.input} value={appName} onChangeText={setAppName}
                    placeholder="My App" placeholderTextColor={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>SLUG * (unique identifier)</Text>
                  <TextInput style={styles.input} value={appSlug} onChangeText={setAppSlug}
                    placeholder="my-app" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                  <TextInput style={styles.input} value={appDesc} onChangeText={setAppDesc}
                    placeholder="What this app does in the Hive..." placeholderTextColor={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>NODE TYPE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {(['app','service','agent','tool','bridge'] as HiveApp['node_type'][]).map(t => (
                      <Pressable key={t}
                        style={[styles.chip, appNodeType === t && { borderColor: NODE_TYPE_COLORS[t], backgroundColor: NODE_TYPE_COLORS[t] + '22' }]}
                        onPress={() => setAppNodeType(t)}>
                        <Text style={[styles.chipText, appNodeType === t && { color: NODE_TYPE_COLORS[t] }]}>{t.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={styles.fieldLabel}>PLATFORM</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {['react-native','ios','android','web','electron','cli'].map(p => (
                      <Pressable key={p}
                        style={[styles.chip, appPlatform === p && { borderColor: Colors.info, backgroundColor: Colors.info + '22' }]}
                        onPress={() => setAppPlatform(p)}>
                        <Text style={[styles.chipText, appPlatform === p && { color: Colors.info }]}>{p.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={styles.fieldLabel}>VERSION</Text>
                  <TextInput style={styles.input} value={appVersion} onChangeText={setAppVersion}
                    placeholder="1.0.0" placeholderTextColor={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>DEEP LINK SCHEME</Text>
                  <TextInput style={styles.input} value={appDeepLink} onChangeText={setAppDeepLink}
                    placeholder="myapp:// or onspaceapp://" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>GITHUB REPO URL</Text>
                  <TextInput style={styles.input} value={appRepoUrl} onChangeText={setAppRepoUrl}
                    placeholder="https://github.com/..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>APP STORE URL (iOS)</Text>
                  <TextInput style={styles.input} value={appStoreUrl} onChangeText={setAppStoreUrl}
                    placeholder="https://apps.apple.com/..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>PLAY STORE URL (Android)</Text>
                  <TextInput style={styles.input} value={appPlayUrl} onChangeText={setAppPlayUrl}
                    placeholder="https://play.google.com/..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                  <Pressable
                    style={[styles.actionBtn, (!appName.trim() || !appSlug.trim() || savingApp) && { opacity: 0.4 }]}
                    onPress={handleSaveApp} disabled={!appName.trim() || !appSlug.trim() || savingApp}>
                    {savingApp
                      ? <ActivityIndicator size="small" color="#000" />
                      : <MaterialIcons name="add-circle" size={15} color="#000" />}
                    <Text style={styles.actionBtnText}>REGISTER TO HIVE</Text>
                  </Pressable>
                </View>
              ) : null}

              {hive.loadingApps ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#a78bfa" />
                  <Text style={styles.loadingText}>Loading Hive nodes...</Text>
                </View>
              ) : hive.apps.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="apps" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>NO APPS REGISTERED</Text>
                  <Text style={styles.emptyText}>Seed the known Hive apps or register a new node above.</Text>
                </View>
              ) : (
                hive.apps.map(app => {
                  const typeColor = NODE_TYPE_COLORS[app.node_type] ?? Colors.textMuted;
                  const statusColor = STATUS_COLORS[app.status] ?? Colors.textMuted;
                  return (
                    <View key={app.id ?? app.slug} style={[styles.appCard, { borderLeftColor: typeColor }]}>
                      <View style={styles.appCardHeader}>
                        <View style={[styles.appIcon, { backgroundColor: typeColor + '22', borderColor: typeColor + '44' }]}>
                          <MaterialIcons name="apps" size={14} color={typeColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.appCardName, { color: typeColor }]}>{app.name}</Text>
                          <Text style={styles.appCardSlug}>/{app.slug} · v{app.version}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{app.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      {app.description ? (
                        <Text style={styles.appDesc} numberOfLines={2}>{app.description}</Text>
                      ) : null}
                      <View style={styles.appMetaRow}>
                        <View style={[styles.nodeTypeBadge, { borderColor: typeColor + '55', backgroundColor: typeColor + '11' }]}>
                          <Text style={[styles.nodeTypeBadgeText, { color: typeColor }]}>{app.node_type.toUpperCase()}</Text>
                        </View>
                        <View style={styles.metaChip}>
                          <MaterialIcons name={PLATFORM_ICON[app.platform] as any ?? 'smartphone'} size={10} color={Colors.textMuted} />
                          <Text style={styles.metaChipText}>{app.platform}</Text>
                        </View>
                        {app.last_sync ? (
                          <Text style={styles.lastSeen}>sync: {new Date(app.last_sync).toLocaleDateString()}</Text>
                        ) : null}
                      </View>
                      <View style={styles.appCardActions}>
                        <Pressable
                          style={[styles.appActionBtn, { borderColor: typeColor + '44' }]}
                          onPress={() => hive.openApp(app)}>
                          <MaterialIcons name="launch" size={12} color={typeColor} />
                          <Text style={[styles.appActionText, { color: typeColor }]}>LAUNCH</Text>
                        </Pressable>
                        {app.repo_url ? (
                          <Pressable
                            style={[styles.appActionBtn, { borderColor: Colors.info + '44' }]}
                            onPress={() => Linking.openURL(app.repo_url!)}>
                            <MaterialIcons name="code" size={12} color={Colors.info} />
                            <Text style={[styles.appActionText, { color: Colors.info }]}>REPO</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          style={[styles.appActionBtn, { borderColor: Colors.accent + '44' }]}
                          onPress={() => hive.editApp(app.id!, { status: app.status === 'active' ? 'inactive' : 'active' })}>
                          <MaterialIcons name={app.status === 'active' ? 'pause-circle' : 'play-circle'} size={12} color={Colors.accent} />
                          <Text style={[styles.appActionText, { color: Colors.accent }]}>
                            {app.status === 'active' ? 'PAUSE' : 'ACTIVATE'}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.appActionBtn, { borderColor: Colors.danger + '33' }]}
                          onPress={() => showAlert('Remove App', `Remove ${app.name} from the Hive?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => app.id && hive.deleteApp(app.id) },
                          ])}>
                          <MaterialIcons name="delete-outline" size={12} color={Colors.danger} />
                          <Text style={[styles.appActionText, { color: Colors.danger }]}>REMOVE</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {/* ── SYNC LOG TAB ────────────────────────────────────────────── */}
          {activeTab === 'sync' ? (
            <View style={styles.tabContent}>
              <View style={styles.appActions}>
                <Pressable style={[styles.halfBtn, { borderColor: '#34d39933', backgroundColor: '#34d39911', flex: 1 }]}
                  onPress={hive.syncAllApps} disabled={hive.isSyncing}>
                  {hive.isSyncing
                    ? <ActivityIndicator size="small" color="#34d399" />
                    : <MaterialIcons name="sync" size={14} color="#34d399" />}
                  <Text style={[styles.halfBtnText, { color: '#34d399' }]}>
                    {hive.isSyncing ? 'SYNCING...' : 'SYNC ALL NODES'}
                  </Text>
                </Pressable>
              </View>
              {hive.loadingSync ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#34d399" />
                  <Text style={styles.loadingText}>Loading sync history...</Text>
                </View>
              ) : hive.syncLog.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="sync-disabled" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>NO SYNC HISTORY</Text>
                  <Text style={styles.emptyText}>Run a sync to generate log entries.</Text>
                </View>
              ) : (
                hive.syncLog.map(log => (
                  <View key={log.id ?? log.synced_at} style={[
                    styles.syncCard,
                    { borderLeftColor: log.status === 'success' ? '#34d399' : log.status === 'failed' ? Colors.danger : Colors.accent }
                  ]}>
                    <View style={styles.syncCardHeader}>
                      <MaterialIcons
                        name={log.status === 'success' ? 'check-circle' : log.status === 'failed' ? 'error' : 'warning'}
                        size={14}
                        color={log.status === 'success' ? '#34d399' : log.status === 'failed' ? Colors.danger : Colors.accent}
                      />
                      <Text style={[styles.syncType, {
                        color: log.status === 'success' ? '#34d399' : log.status === 'failed' ? Colors.danger : Colors.accent
                      }]}>
                        {log.sync_type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.syncTime}>
                        {log.synced_at ? new Date(log.synced_at).toLocaleString() : ''}
                      </Text>
                    </View>
                    <Text style={styles.syncSummary}>{log.payload_summary}</Text>
                    {Array.isArray(log.target_apps) && log.target_apps.length > 0 ? (
                      <View style={styles.capabilityRow}>
                        {(log.target_apps as string[]).slice(0, 4).map((a: string) => (
                          <View key={a} style={styles.capChip}>
                            <Text style={styles.capChipText}>{a}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}

          {/* ── BROADCAST TAB ───────────────────────────────────────────── */}
          {activeTab === 'broadcast' ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📡 TRANSMIT HIVE BROADCAST</Text>
                <Text style={styles.fieldLabel}>CHANNEL</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {['ALL','DEVICES','APPS','AGENTS','SECURITY','SYNC'].map(ch => (
                    <Pressable key={ch}
                      style={[styles.chip, broadcastChannel === ch && { borderColor: Colors.accent, backgroundColor: Colors.accentMuted }]}
                      onPress={() => setBroadcastChannel(ch)}>
                      <Text style={[styles.chipText, broadcastChannel === ch && { color: Colors.accent }]}>{ch}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.fieldLabel}>PRIORITY</Text>
                <View style={styles.priorityRow}>
                  {(['ABSOLUTE','HIGH','STANDARD','INFO'] as HiveBroadcast['priority'][]).map(p => (
                    <Pressable key={p}
                      style={[styles.priorityBtn, broadcastPriority === p && {
                        borderColor: p === 'ABSOLUTE' ? Colors.danger : p === 'HIGH' ? Colors.accent : p === 'STANDARD' ? Colors.primary : Colors.info,
                        backgroundColor: (p === 'ABSOLUTE' ? Colors.danger : p === 'HIGH' ? Colors.accent : p === 'STANDARD' ? Colors.primary : Colors.info) + '22',
                      }]}
                      onPress={() => setBroadcastPriority(p)}>
                      <Text style={[styles.priorityBtnText, broadcastPriority === p && {
                        color: p === 'ABSOLUTE' ? Colors.danger : p === 'HIGH' ? Colors.accent : p === 'STANDARD' ? Colors.primary : Colors.info,
                      }]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>MESSAGE</Text>
                <TextInput
                  style={[styles.textArea]}
                  value={broadcastMsg}
                  onChangeText={setBroadcastMsg}
                  placeholder="Transmit a message to all Hive nodes..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.accent }, (!broadcastMsg.trim() || sending) && { opacity: 0.4 }]}
                  onPress={handleBroadcast} disabled={!broadcastMsg.trim() || sending}>
                  {sending
                    ? <ActivityIndicator size="small" color="#000" />
                    : <MaterialIcons name="broadcast-on-home" size={15} color="#000" />}
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>
                    {sending ? 'TRANSMITTING...' : `BROADCAST TO ${broadcastChannel}`}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.sectionLabel}>BROADCAST HISTORY</Text>
              {hive.loadingBroadcasts ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                  <Text style={styles.loadingText}>Loading broadcasts...</Text>
                </View>
              ) : hive.broadcasts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="broadcast-on-home" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>NO BROADCASTS YET</Text>
                </View>
              ) : (
                hive.broadcasts.map(b => {
                  const pColor = b.priority === 'ABSOLUTE' ? Colors.danger : b.priority === 'HIGH' ? Colors.accent : b.priority === 'STANDARD' ? Colors.primary : Colors.info;
                  return (
                    <View key={b.id ?? b.created_at} style={[styles.broadcastCard, { borderLeftColor: pColor }]}>
                      <View style={styles.broadcastHeader}>
                        <View style={[styles.catBadge, { borderColor: pColor + '55', backgroundColor: pColor + '22' }]}>
                          <Text style={[styles.catBadgeText, { color: pColor }]}>{b.priority}</Text>
                        </View>
                        <Text style={styles.broadcastChannel}>#{b.channel}</Text>
                        <Text style={styles.broadcastTime}>
                          {b.created_at ? new Date(b.created_at).toLocaleTimeString() : ''}
                        </Text>
                      </View>
                      <Text style={styles.broadcastMsg}>{b.message}</Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {/* ── TRANSFER TAB ────────────────────────────────────────────── */}
          {activeTab === 'transfer' ? (
            <View style={styles.tabContent}>
              <View style={[styles.panel, { borderLeftColor: '#ff6b35', borderLeftWidth: 3 }]}>
                <View style={styles.panelTitleRow}>
                  <MaterialIcons name="ios-share" size={14} color="#ff6b35" />
                  <Text style={[styles.panelTitle, { color: '#ff6b35' }]}>EXPORT HIVE PACKAGE</Text>
                </View>
                <Text style={styles.trainInfo}>
                  Export the complete Hive AI package — Soul Vault, Neural Memory, Directives, Knowledge Base, Personality Config — as portable JSON. Import into any other app in your ecosystem.
                </Text>
                <View style={styles.exportFeatures}>
                  {[
                    'Soul Vault (7 pillars)',
                    'Neural Memory Bank',
                    'Hive Directives',
                    'Knowledge Base',
                    'Personality Config',
                  ].map(f => (
                    <View key={f} style={styles.exportFeatureRow}>
                      <MaterialIcons name="check-circle" size={13} color="#ff6b35" />
                      <Text style={styles.exportFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#ff6b35' }, exporting && { opacity: 0.5 }]}
                  onPress={handleExport} disabled={exporting}>
                  {exporting
                    ? <ActivityIndicator size="small" color="#000" />
                    : <MaterialIcons name="file-download" size={15} color="#000" />}
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>
                    {exporting ? 'PACKAGING...' : 'EXPORT + SHARE HIVE PACKAGE'}
                  </Text>
                </Pressable>
              </View>

              {/* Connected apps sync targets */}
              <View style={styles.panel}>
                <View style={styles.panelTitleRow}>
                  <MaterialIcons name="swap-horiz" size={14} color="#34d399" />
                  <Text style={[styles.panelTitle, { color: '#34d399' }]}>SYNC TO CONNECTED APPS</Text>
                </View>
                <Text style={styles.trainInfo}>
                  Push the Hive AI identity package to connected apps via deep link or share sheet. Each app must implement the Hive import protocol to receive the package.
                </Text>
                {hive.apps.filter(a => a.status === 'active').length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="link-off" size={28} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No active apps registered. Go to APPS tab to add your apps.</Text>
                  </View>
                ) : (
                  hive.apps.filter(a => a.status === 'active').map(app => {
                    const c = NODE_TYPE_COLORS[app.node_type] ?? Colors.textMuted;
                    return (
                      <Pressable key={app.slug}
                        style={({ pressed }) => [styles.transferAppRow, pressed && { opacity: 0.7 }]}
                        onPress={async () => {
                          const pkg = await hive.exportPackage();
                          await Share.share({ message: pkg, title: `Hive Package → ${app.name}` });
                        }}>
                        <View style={[styles.appIcon, { backgroundColor: c + '22', borderColor: c + '44', width: 32, height: 32, borderRadius: 8 }]}>
                          <MaterialIcons name="apps" size={14} color={c} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.appCardName, { color: c, fontSize: FontSize.xs }]}>{app.name}</Text>
                          <Text style={styles.appCardSlug}>{app.platform} · v{app.version}</Text>
                        </View>
                        <MaterialIcons name="file-upload" size={16} color={c} />
                      </Pressable>
                    );
                  })
                )}
              </View>

              {/* Instructions */}
              <View style={styles.infoBlock}>
                <Text style={styles.infoBlockTitle}>HOW HIVE TRANSFER WORKS</Text>
                {[
                  '1. Export creates a signed JSON package with your entire AI identity',
                  '2. Share to any app that supports Hive package import',
                  '3. The receiving app loads your soul vault, memories, and directives',
                  '4. KRACKERJACK AI behaviors replicate across your entire ecosystem',
                  '5. Each app syncs back to the Hive database on launch',
                ].map(step => (
                  <View key={step} style={styles.infoRow}>
                    <Text style={styles.infoText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: '#0d1a0d', borderWidth: 1, borderColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 2 },
  headerSub: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  tabBarScroll: { borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel },
  tabBar: { paddingHorizontal: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  tabContent: { gap: Spacing.sm },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.sm, color: Colors.textWhite, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  emptyText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: 4 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 2,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 2,
  },
  statCardNum: { fontSize: 24, fontWeight: FontWeight.black },
  statCardLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  statCardSub: { fontSize: 9, color: Colors.textMuted },
  panel: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  panelTitle: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  deviceName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textWhite, marginBottom: 6 },
  deviceMeta: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 10, color: Colors.textMuted },
  deviceId: { fontSize: 9, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 4 },
  bootBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primary + '33',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  bootBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.black, letterSpacing: 1 },
  quickActions: { marginBottom: 4 },
  sectionLabel: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.sm, textTransform: 'uppercase',
  },
  quickGrid: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', gap: 4,
  },
  quickBtnText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: 4,
  },
  logType: { fontSize: 9, color: Colors.textWhite, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  logSummary: { fontSize: 9, color: Colors.textMuted },
  logTime: { fontSize: 9, color: Colors.textMuted },
  sectionBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: 4,
  },
  sectionBannerText: { fontSize: 10, color: Colors.textMuted, flex: 1, lineHeight: 15 },
  actionBtnFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.info + '33',
    borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  actionBtnFullText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  deviceCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  deviceCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  deviceIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  deviceCardName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textWhite },
  deviceCardOs: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  deviceIdSmall: {
    fontSize: 9, color: Colors.textMuted, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  capabilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  capChip: {
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2,
  },
  capChipText: { fontSize: 9, color: Colors.textMuted },
  lastSeen: { fontSize: 9, color: Colors.textMuted },
  appActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  halfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2,
  },
  halfBtnText: { fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 0.8 },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, marginBottom: 4,
  },
  textArea: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, minHeight: 80, marginBottom: 8, lineHeight: 20,
  },
  chipRow: { gap: 6, paddingVertical: 4, marginBottom: 4 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  chipText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm,
  },
  actionBtnText: { fontSize: FontSize.sm, color: '#000', fontWeight: FontWeight.black, letterSpacing: 1 },
  appCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  appCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  appIcon: {
    width: 34, height: 34, borderRadius: Radius.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  appCardName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  appCardSlug: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  appDesc: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16, marginBottom: 6 },
  appMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  nodeTypeBadge: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  nodeTypeBadgeText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  appCardActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  appActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4,
  },
  appActionText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  syncCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  syncCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  syncType: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1, flex: 1 },
  syncTime: { fontSize: 9, color: Colors.textMuted },
  syncSummary: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16, marginBottom: 4 },
  priorityRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  priorityBtn: {
    flex: 1, padding: 8, borderRadius: Radius.sm, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgPanel, alignItems: 'center',
  },
  priorityBtnText: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  broadcastCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  broadcastHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catBadge: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  broadcastChannel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold, flex: 1 },
  broadcastTime: { fontSize: 9, color: Colors.textMuted },
  broadcastMsg: { fontSize: FontSize.xs, color: Colors.textWhite, lineHeight: 18 },
  trainInfo: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16, marginBottom: Spacing.sm },
  exportFeatures: { gap: 6, marginBottom: Spacing.md },
  exportFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportFeatureText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  transferAppRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  infoBlock: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, gap: 6,
  },
  infoBlockTitle: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: 4,
  },
  infoRow: {},
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
});
