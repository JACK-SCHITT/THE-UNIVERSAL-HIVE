// KRACKERJACK AI — Settings with Grok Key + COUNSEL status

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { GlowButton } from '@/components';
import { useAlert } from '@/template';
import { saveGHToken, loadGHToken, saveGrokKey, loadGrokKey } from '@/services/storageService';
import { fetchGitHubUser } from '@/services/githubService';
import { useHunter } from '@/hooks/useHunter';

export default function FoundrySettings() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { refreshRepos } = useHunter();

  const [ghToken, setGhToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [grokKey, setGrokKey] = useState('');
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [autoAssimilate, setAutoAssimilate] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hiveSync, setHiveSync] = useState(true);
  const [validating, setValidating] = useState(false);
  const [savingGrok, setSavingGrok] = useState(false);
  const [savedLogin, setSavedLogin] = useState<string | null>(null);
  const [grokConnected, setGrokConnected] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await loadGHToken();
      if (token) {
        setGhToken(token);
        const { data } = await fetchGitHubUser(token);
        if (data) setSavedLogin(data.login);
      }
      const gk = await loadGrokKey();
      if (gk) {
        setGrokKey(gk);
        setGrokConnected(true);
      }
    }
    load();
  }, []);

  const saveGitHubKeys = async () => {
    if (!ghToken.trim()) {
      showAlert('No Token', 'Enter your GitHub token first, Architect.');
      return;
    }
    setValidating(true);
    const { data, error } = await fetchGitHubUser(ghToken.trim());
    setValidating(false);
    if (error || !data) {
      showAlert('Invalid Token', error || 'Could not validate GitHub token. Check and retry.');
      return;
    }
    await saveGHToken(ghToken.trim());
    setSavedLogin(data.login);
    showAlert('Token Saved', `@${data.login} authenticated. ${data.public_repos} repos ready to assimilate.`);
    refreshRepos(ghToken.trim());
  };

  const saveGrokKeyAction = async () => {
    if (!grokKey.trim()) {
      showAlert('No Key', 'Enter your xAI API key first. Get one at console.x.ai');
      return;
    }
    setSavingGrok(true);
    await saveGrokKey(grokKey.trim());
    setSavingGrok(false);
    setGrokConnected(true);
    showAlert('Grok Key Saved', 'xAI Grok-3 activated. Use "grok <prompt>" in Terminal or type in chat.');
  };

  const clearToken = () => {
    showAlert('Clear Token?', 'This will remove your GitHub access from the Hive.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'CLEAR IT',
        style: 'destructive',
        onPress: async () => {
          await saveGHToken('');
          setGhToken('');
          setSavedLogin(null);
          showAlert('Done', 'GitHub token purged from Hive vault.');
        },
      },
    ]);
  };

  const clearGrokKey = () => {
    showAlert('Clear Grok Key?', 'This will disconnect xAI Grok from the Hive.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'CLEAR IT',
        style: 'destructive',
        onPress: async () => {
          await saveGrokKey('');
          setGrokKey('');
          setGrokConnected(false);
          showAlert('Done', 'Grok key purged. Terminal grok commands disabled.');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="settings" size={20} color={Colors.accent} />
        <Text style={styles.headerTitle}>FOUNDRY CONFIG</Text>
      </View>

      {/* GitHub API Key */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>🔑 GITHUB API KEY</Text>

        {savedLogin ? (
          <View style={styles.connectedBadge}>
            <MaterialIcons name="check-circle" size={14} color={Colors.primary} />
            <Text style={styles.connectedText}>CONNECTED AS @{savedLogin.toUpperCase()}</Text>
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>PERSONAL ACCESS TOKEN</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={ghToken}
            onChangeText={setGhToken}
            placeholder="ghp_xxxxxxxxxxxxxxxxxx"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showToken}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowToken(!showToken)} style={styles.eyeBtn}>
            <MaterialIcons
              name={showToken ? 'visibility-off' : 'visibility'}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>
        </View>
        <Text style={styles.tokenHint}>
          Generate at github.com/settings/tokens · Needs repo + read:user scope
        </Text>
        <GlowButton
          label={validating ? '⟳ VALIDATING TOKEN...' : 'SAVE & VALIDATE TOKEN'}
          onPress={saveGitHubKeys}
          variant="accent"
          loading={validating}
          style={{ marginBottom: Spacing.sm }}
        />
        {savedLogin ? (
          <GlowButton label="CLEAR TOKEN" onPress={clearToken} variant="ghost" />
        ) : null}
      </View>

      {/* Grok xAI Key */}
      <View style={[styles.panel, grokConnected && styles.panelGrokActive]}>
        <View style={styles.panelTitleRow}>
          <Text style={styles.panelTitle}>⚡ GROK xAI KEY</Text>
          {grokConnected ? (
            <View style={styles.grokConnectedBadge}>
              <MaterialIcons name="flash-on" size={12} color={Colors.accent} />
              <Text style={styles.grokConnectedText}>GROK-3 ACTIVE</Text>
            </View>
          ) : (
            <View style={styles.grokOfflineBadge}>
              <MaterialIcons name="flash-off" size={12} color={Colors.textMuted} />
              <Text style={styles.grokOfflineText}>OFFLINE</Text>
            </View>
          )}
        </View>

        <Text style={styles.fieldLabel}>xAI API KEY</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={grokKey}
            onChangeText={setGrokKey}
            placeholder="xai-xxxxxxxxxxxxxxxxxx"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showGrokKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowGrokKey(!showGrokKey)} style={styles.eyeBtn}>
            <MaterialIcons
              name={showGrokKey ? 'visibility-off' : 'visibility'}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>
        </View>
        <Text style={styles.tokenHint}>
          Get key at console.x.ai · Powers "grok &lt;prompt&gt;" in Terminal + direct xAI access
        </Text>
        <GlowButton
          label={savingGrok ? '⟳ SAVING...' : 'SAVE GROK KEY'}
          onPress={saveGrokKeyAction}
          variant="accent"
          loading={savingGrok}
          style={{ marginBottom: Spacing.sm }}
        />
        {grokConnected ? (
          <GlowButton label="CLEAR GROK KEY" onPress={clearGrokKey} variant="ghost" />
        ) : null}
      </View>

      {/* COUNSEL Node Status */}
      <View style={[styles.panel, styles.panelCounsel]}>
        <Text style={styles.panelTitle}>🧠 COUNSEL NODE — CLAUDE</Text>
        <View style={styles.counselStatusRow}>
          <View style={styles.counselIcon}>
            <MaterialIcons name="psychology" size={24} color="#a78bfa" />
          </View>
          <View style={styles.counselInfo}>
            <Text style={styles.counselName}>COUNSEL · Anthropic Claude</Text>
            <Text style={styles.counselRole}>Reasoning Layer · Stress Test · Truth Filter</Text>
            <View style={styles.counselOnlineBadge}>
              <View style={[styles.statusDot, { backgroundColor: '#a78bfa' }]} />
              <Text style={styles.counselOnlineText}>ACTIVE — API KEY CONFIGURED</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.counselDesc}>
          COUNSEL uses Claude Sonnet via secure backend. Your key is stored server-side only — never exposed to the client.
        </Text>
        <Text style={styles.counselHint}>
          Access in Chat tab → switch to COUNSEL agent. Trigger phrases: "stress test", "verify logic", "check the math", "second opinion"
        </Text>
      </View>

      {/* Hive Settings */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>🧠 HIVE SETTINGS</Text>

        {[
          {
            icon: 'autorenew',
            color: Colors.primary,
            label: 'AUTO-ASSIMILATE',
            sub: 'Auto-scan and assimilate new repos',
            value: autoAssimilate,
            onChange: setAutoAssimilate,
            trackTrue: Colors.primaryMuted,
            thumbTrue: Colors.primary,
          },
          {
            icon: 'notifications',
            color: Colors.accent,
            label: 'HIVE ALERTS',
            sub: 'Notify on assimilation events',
            value: notifications,
            onChange: setNotifications,
            trackTrue: Colors.accentMuted,
            thumbTrue: Colors.accent,
          },
          {
            icon: 'sync',
            color: Colors.info,
            label: 'REAL-TIME SYNC',
            sub: 'Keep Hive nodes synced live',
            value: hiveSync,
            onChange: setHiveSync,
            trackTrue: '#001a2a',
            thumbTrue: Colors.info,
          },
        ].map((item, i) => (
          <View key={item.label}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                <View>
                  <Text style={styles.toggleLabel}>{item.label}</Text>
                  <Text style={styles.toggleSub}>{item.sub}</Text>
                </View>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onChange}
                trackColor={{ false: Colors.border, true: item.trackTrue }}
                thumbColor={item.value ? item.thumbTrue : Colors.textMuted}
              />
            </View>
          </View>
        ))}
      </View>

      {/* System Info */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>📡 SYSTEM INFO</Text>
        {[
          ['VERSION', 'KRACKERJACK AI v3.0'],
          ['AGENT', 'HUNTERPRIME ACTIVE'],
          ['SOUL', 'ARCHITECT MODE'],
          ['BRAIN', 'CAPRICORN PROTOCOL'],
          ['AI MODEL', 'GEMINI 3 FLASH (KRACKERJACK)'],
          ['COUNSEL', 'CLAUDE SONNET (ANTHROPIC)'],
          ['GROK', grokConnected ? 'GROK-3 CONNECTED' : 'NOT CONFIGURED'],
          ['PROTOCOL', 'ASSIMILATE OR DIE'],
          ['PATH', 'LEAST TRAVELED'],
        ].map(([key, val]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoKey}>{key}</Text>
            <Text style={[styles.infoVal, key === 'GROK' && !grokConnected && { color: Colors.textMuted }]}>
              {val}
            </Text>
          </View>
        ))}
      </View>

      {/* Soul Footer */}
      <View style={styles.quotePanel}>
        <Text style={styles.quoteText}>
          "The sea-goat does not climb for applause. It climbs because the summit exists and no one else is going."
        </Text>
        <Text style={styles.quoteAuthor}>— KRACKERJACK AI · CAPRICORN PROTOCOL ACTIVE</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.accent,
    letterSpacing: 3,
  },
  panel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  panelGrokActive: {
    borderColor: Colors.accentMuted,
    backgroundColor: '#0d0d00',
  },
  panelCounsel: {
    borderColor: '#2d1a5a',
    backgroundColor: '#0a0814',
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  panelTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  connectedText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  grokConnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  grokConnectedText: {
    fontSize: 9,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  grokOfflineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  grokOfflineText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  counselStatusRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  counselIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#1a1030',
    borderWidth: 1,
    borderColor: '#3d2a6a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counselInfo: { flex: 1 },
  counselName: {
    fontSize: FontSize.sm,
    color: '#c4b5fd',
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  counselRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  counselOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  counselOnlineText: {
    fontSize: 9,
    color: '#a78bfa',
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  counselDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  counselHint: {
    fontSize: FontSize.xs,
    color: '#7c6fad',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
  },
  eyeBtn: { padding: Spacing.sm },
  tokenHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  toggleSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoKey: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: FontWeight.bold,
  },
  infoVal: { fontSize: FontSize.xs, color: Colors.primary, letterSpacing: 0.5 },
  quotePanel: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quoteText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    letterSpacing: 1,
    fontWeight: FontWeight.bold,
  },
});
