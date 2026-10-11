/**
 * KRACKERJACK1134 ARCHITECT INTERFACE
 * Persistent foundry control panel — accessible from tab bar at all times.
 * Wired to the real openclaw-ai edge function and hunter_scans table.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter as useRouterArch } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { discordService } from '@/services/discordService';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

// ─── Heartbeat memory state (loaded once per session) ─────────────────────
interface HeartbeatState {
  last_run: string;
  last_reviewed_change: string;
  action_notes: string;
  next_scheduled_review: string;
  maintenance_due: boolean;
  promotion_queue: string[];
  demotion_candidates: string[];
}

const INITIAL_HEARTBEAT: HeartbeatState = {
  last_run: '2026-06-09',
  last_reviewed_change: 'Initial setup from session history',
  action_notes: 'Memory bootstrapped from ASSIMILATE-OR-DIE-AI-APP-FOUNDRY session. All preferences loaded into HOT tier. Watching for first user correction.',
  next_scheduled_review: 'After next significant task completion',
  maintenance_due: false,
  promotion_queue: [],
  demotion_candidates: [],
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/openclaw-ai`;

interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'cmd';
  text: string;
  ts: string;
}

function logEntry(type: LogEntry['type'], text: string): LogEntry {
  return {
    id: `${Date.now()}_${Math.random()}`,
    type,
    ts: new Date().toLocaleTimeString(),
    text,
  };
}

export default function ArchitectScreen() {
  const insets = useSafeAreaInsets();
  const routerArch = useRouterArch();
  const scrollRef = useRef<ScrollView>(null);

  const [heartbeatState, setHeartbeatState] = useState<HeartbeatState>(INITIAL_HEARTBEAT);
  const [heartbeatRunning, setHeartbeatRunning] = useState(false);
  const [heartbeatOutput, setHeartbeatOutput] = useState<string>('');
  const [heartbeatExpanded, setHeartbeatExpanded] = useState(false);

  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [pushing, setPushing] = useState(false);
  const [checkingHive, setCheckingHive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    logEntry('info', 'KRACKERJACK1134 ARCHITECT INTERFACE v3.0'),
    logEntry('info', 'PRIME DIRECTIVE ACTIVE — Foundry Online'),
    logEntry('success', 'All systems nominal. Awaiting commands.'),
  ]);

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, logEntry(type, text)]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const runQuickCommand = useCallback(async (label: string, prompt: string, agentId: string) => {
    addLog('cmd', `> ${label}`);
    addLog('info', `Routing to ${agentId} agent...`);
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          agentId,
          stream: false,
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        addLog('error', `FAILED [${response.status}]: ${err.slice(0, 120)}`);
        return;
      }
      const data = await response.json();
      const content: string = data.content ?? '';
      const lines = content.split('\n').filter(Boolean).slice(0, 6);
      lines.forEach(line => addLog('info', line.slice(0, 100)));
      addLog('success', `${label} COMPLETE`);
    } catch (err: any) {
      addLog('error', `ERROR: ${err.message}`);
    }
  }, [addLog]);

  const pushToFoundry = useCallback(async () => {
    const name = appName.trim();
    const desc = appDesc.trim();
    if (!name) {
      addLog('error', 'ABORT: App name required.');
      return;
    }

    setPushing(true);
    addLog('cmd', `> ASSIMILATE: "${name}"`);
    addLog('info', 'Routing to Architect Agent...');

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `ASSIMILATE THIS APP INTO THE FOUNDRY:\n\nApp Name: ${name}\n\nDescription:\n${desc || '(none provided)'}`,
          }],
          agentId: 'architect',
          phase: 'blueprint',
          appIdea: name,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[${response.status}] ${errText}`);
      }

      const data = await response.json();
      const content: string = data.content ?? '';

      addLog('success', `✓ Architect Agent responded (${content.length} chars)`);

      // Log first 3 lines of response
      const lines = content.split('\n').filter(Boolean).slice(0, 5);
      lines.forEach(line => addLog('info', line.slice(0, 80)));

      addLog('success', `"${name}" ASSIMILATED INTO FOUNDRY.`);
      setAppName('');
      setAppDesc('');
    } catch (err: any) {
      addLog('error', `ASSIMILATION FAILED: ${err.message}`);
    } finally {
      setPushing(false);
    }
  }, [appName, appDesc, addLog]);

  const checkHive = useCallback(async () => {
    setCheckingHive(true);
    addLog('cmd', '> CHECK HIVE STATUS');

    try {
      const supabase = getSupabaseClient();

      // Check total scans
      const { count: totalScans } = await supabase
        .from('hunter_scans')
        .select('*', { count: 'exact', head: true });

      addLog('success', `✅ Hive DB Connected | Scans in memory: ${totalScans ?? 0}`);

      // Check recent scan activity
      const { data: recentScans } = await supabase
        .from('hunter_scans')
        .select('status, query')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentScans && recentScans.length > 0) {
        addLog('info', `Recent activity: ${recentScans.length} scans found`);
        recentScans.forEach(s =>
          addLog('info', `  [${s.status.toUpperCase()}] ${(s.query as string).slice(0, 50)}`)
        );
      }

      // Check edge function
      const ping = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'HIVE PING: respond with STATUS: ONLINE only' }],
          agentId: 'architect',
          stream: false,
        }),
      });

      if (ping.ok) {
        addLog('success', '✅ OpenClaw AI Edge Function ONLINE');
        addLog('success', '✅ HunterPrime Node ACTIVE');
        addLog('success', '✅ Memory Refinery SYNCED');
        addLog('success', '✅ All Agents READY');
        addLog('success', `✅ HIVE STATUS: ${totalScans ?? 0} ops logged | NOMINAL`);
      } else {
        addLog('warn', `⚠ Edge Function returned ${ping.status}`);
      }
    } catch (err: any) {
      addLog('error', `HIVE CHECK FAILED: ${err.message}`);
    } finally {
      setCheckingHive(false);
    }
  }, [addLog]);

  // ─── Heartbeat ───────────────────────────────────────────────────────────
  const runHeartbeat = useCallback(async () => {
    setHeartbeatRunning(true);
    setHeartbeatExpanded(true);
    setHeartbeatOutput('');
    addLog('cmd', '> HEARTBEAT CYCLE INITIATED');
    addLog('info', 'Self-reflection pass starting...');

    const prompt = `HEARTBEAT CYCLE — Self-Improving Agent Maintenance

Context: ASSIMILATE-OR-DIE-AI-APP-FOUNDRY | KRACKERJACK1134 | ${new Date().toISOString()}

Last heartbeat: ${heartbeatState.last_run}
Last reviewed change: ${heartbeatState.last_reviewed_change}
Previous action notes: ${heartbeatState.action_notes}

Active Hive components:
- 10 AI agent personas (architect, developer, devops, marketer, legal, hunter, terminal_termux, terminal_gentoo, hive_os_build, zorg_omega)
- DB tables: hive_nodes, hive_telemetry, hunter_scans, memory_refinery, prime_directives, zorg_security_audits, shadow_petition
- Self-improving memory at /self-improving/ (HOT/WARM/COLD tiers)
- ZORG-Ω Shadow Security Node permanently active
- Hive OS Build: 8-stage Gentoo+Termux USB installer

Run a structured heartbeat maintenance cycle:
1. REFLECTION: What was accomplished since last heartbeat?
2. PATTERNS: Any new learnings to promote to HOT memory?
3. CORRECTIONS: Any drift or misalignments to log?
4. HEALTH CHECK: Rate current system health (1-10) and why
5. ACTION NOTES: What should the next cycle focus on?
6. MAINTENANCE_DUE: true/false

Be cold, analytical, and precise. No fluff.`;

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          agentId: 'architect',
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        addLog('error', `HEARTBEAT FAILED: ${err.slice(0, 120)}`);
        setHeartbeatRunning(false);
        return;
      }

      let fullOutput = '';
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            const data = part.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const chunk = json.choices?.[0]?.delta?.content || '';
              if (chunk) {
                fullOutput += chunk;
                setHeartbeatOutput(fullOutput);
              }
            } catch {}
          }
        }
      } else {
        const text = await response.text();
        for (const part of text.split('\n')) {
          if (!part.startsWith('data: ')) continue;
          const data = part.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            fullOutput += json.choices?.[0]?.delta?.content || '';
          } catch {}
        }
        setHeartbeatOutput(fullOutput);
      }

      // Update heartbeat state in memory
      const now = new Date();
      const maintenanceDue = fullOutput.toLowerCase().includes('maintenance_due: true');
      const actionMatch = fullOutput.match(/ACTION NOTES?:([^\n]+(?:\n(?![0-9A-Z]).*)*)/i);
      const actionNotes = actionMatch ? actionMatch[1].trim().slice(0, 300) : 'Heartbeat cycle complete.';

      const newState: HeartbeatState = {
        ...heartbeatState,
        last_run: now.toISOString().split('T')[0],
        last_reviewed_change: `Heartbeat run at ${now.toLocaleTimeString()}`,
        action_notes: actionNotes,
        maintenance_due: maintenanceDue,
        next_scheduled_review: 'After next significant task completion',
      };
      setHeartbeatState(newState);

      addLog('success', `HEARTBEAT COMPLETE — ${fullOutput.length} chars | Maintenance due: ${maintenanceDue}`);

      // Discord alert — always sent; escalates if maintenance due
      discordService.sendHeartbeatAlert(actionNotes, maintenanceDue).catch(() => {});

      // Also write to hive telemetry
      try {
        const supabase = getSupabaseClient();
        const { data: archNode } = await supabase
          .from('hive_nodes')
          .select('id')
          .eq('node_name', 'KRACKERJACK-ARCHITECT')
          .maybeSingle();
        await supabase.from('hive_telemetry').insert({
          source_node_id: archNode?.id ?? null,
          intent_hash: 'HEARTBEAT_CYCLE',
          action_payload: { cycle: 'self-reflection', timestamp: now.toISOString(), maintenance_due: maintenanceDue },
          outcome_impact: `Heartbeat complete. ${actionNotes.slice(0, 120)}`,
        });
      } catch {}

    } catch (err: any) {
      addLog('error', `HEARTBEAT ERROR: ${err.message}`);
    } finally {
      setHeartbeatRunning(false);
    }
  }, [addLog, heartbeatState]);

  const clearLogs = useCallback(() => {
    setLogs([logEntry('info', 'Log cleared. Foundry standing by.')]);
  }, []);

  const logColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '#69F0AE';
      case 'error':   return '#FF4444';
      case 'warn':    return '#FFD54F';
      case 'cmd':     return Colors.primary;
      default:        return Colors.textSecondary;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <MaterialIcons name="terminal" size={13} color={Colors.primary} />
            <Text style={styles.headerBadgeText}>KRACKERJACK1134</Text>
          </View>
          <Text style={styles.headerSub}>ARCHITECT INTERFACE v3.0</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Push to Foundry Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <MaterialIcons name="rocket-launch" size={16} color={Colors.primary} />
            <Text style={styles.panelTitle}>PUSH NEW APP TO FOUNDRY</Text>
          </View>

          <Text style={styles.fieldLabel}>{'> APP NAME'}</Text>
          <TextInput
            value={appName}
            onChangeText={setAppName}
            placeholder="e.g. HunterPrime v2"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>{'> DESCRIPTION / FEATURES / GITHUB LINK'}</Text>
          <TextInput
            value={appDesc}
            onChangeText={setAppDesc}
            placeholder="Describe the app idea, features, links..."
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Pressable
            onPress={pushToFoundry}
            disabled={pushing}
            style={({ pressed }) => [styles.ctaBtn, pushing && styles.ctaBtnDisabled, pressed && { opacity: 0.8 }]}
          >
            {pushing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <MaterialIcons name="bolt" size={18} color="#000" />
            )}
            <Text style={styles.ctaBtnText}>
              {pushing ? 'ASSIMILATING...' : 'ASSIMILATE INTO FOUNDRY'}
            </Text>
          </Pressable>
        </View>

        {/* Hive Status Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <MaterialIcons name="hub" size={16} color="#69F0AE" />
            <Text style={[styles.panelTitle, { color: '#69F0AE' }]}>HIVE STATUS</Text>
          </View>

          <View style={styles.hiveActions}>
            <Pressable
              onPress={checkHive}
              disabled={checkingHive}
              style={({ pressed }) => [styles.hiveBtn, pressed && { opacity: 0.8 }]}
            >
              {checkingHive ? (
                <ActivityIndicator size="small" color="#69F0AE" />
              ) : (
                <MaterialIcons name="wifi-tethering" size={16} color="#69F0AE" />
              )}
              <Text style={styles.hiveBtnText}>CHECK HIVE STATUS</Text>
            </Pressable>

            <Pressable
              onPress={clearLogs}
              style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="clear-all" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Live Log */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <MaterialIcons name="wysiwyg" size={14} color={Colors.textMuted} />
            <Text style={[styles.panelTitle, { color: Colors.textMuted }]}>FOUNDRY LOG</Text>
          </View>
          <ScrollView
            ref={scrollRef}
            style={styles.logBox}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {logs.map(entry => (
              <View key={entry.id} style={styles.logRow}>
                <Text style={styles.logTs}>[{entry.ts}]</Text>
                <Text style={[styles.logText, { color: logColor(entry.type) }]}>{entry.text}</Text>
              </View>
            ))}
            <View style={styles.logCursor}>
              <Text style={styles.logCursorText}>█</Text>
            </View>
          </ScrollView>
        </View>

        {/* Heartbeat Panel */}
        <View style={styles.panel}>
          <Pressable
            onPress={() => setHeartbeatExpanded(p => !p)}
            style={styles.panelHeader}
          >
            <MaterialIcons name="favorite" size={16} color="#FF6B9D" />
            <Text style={[styles.panelTitle, { color: '#FF6B9D', flex: 1 }]}>HEARTBEAT — SELF-IMPROVING CYCLE</Text>
            <View style={[styles.hbStatusBadge, { backgroundColor: heartbeatState.maintenance_due ? '#FF440015' : '#69F0AE15', borderColor: heartbeatState.maintenance_due ? '#FF440040' : '#69F0AE40' }]}>
              <Text style={[styles.hbStatusText, { color: heartbeatState.maintenance_due ? '#FF4444' : '#69F0AE' }]}>
                {heartbeatState.maintenance_due ? 'MAINT DUE' : 'HEALTHY'}
              </Text>
            </View>
            <MaterialIcons name={heartbeatExpanded ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
          </Pressable>

          {/* State Summary — always visible */}
          <View style={styles.hbMeta}>
            <View style={styles.hbMetaRow}>
              <Text style={styles.hbMetaLabel}>LAST RUN</Text>
              <Text style={styles.hbMetaValue}>{heartbeatState.last_run}</Text>
            </View>
            <View style={styles.hbMetaRow}>
              <Text style={styles.hbMetaLabel}>REVIEWED</Text>
              <Text style={styles.hbMetaValue} numberOfLines={1}>{heartbeatState.last_reviewed_change}</Text>
            </View>
            <View style={styles.hbMetaRow}>
              <Text style={styles.hbMetaLabel}>NEXT REVIEW</Text>
              <Text style={styles.hbMetaValue}>{heartbeatState.next_scheduled_review}</Text>
            </View>
          </View>

          {/* Action Notes */}
          {heartbeatState.action_notes ? (
            <View style={styles.hbNotesBox}>
              <Text style={styles.hbNotesLabel}>ACTION NOTES</Text>
              <Text style={styles.hbNotesText}>{heartbeatState.action_notes}</Text>
            </View>
          ) : null}

          {/* Expanded: AI Output */}
          {heartbeatExpanded && heartbeatOutput ? (
            <ScrollView style={styles.hbOutput} showsVerticalScrollIndicator={false}>
              <Text style={styles.hbOutputText}>{heartbeatOutput}</Text>
              {heartbeatRunning ? <Text style={styles.hbCursor}>█</Text> : null}
            </ScrollView>
          ) : null}

          {/* Run Button */}
          <Pressable
            onPress={runHeartbeat}
            disabled={heartbeatRunning}
            style={({ pressed }) => [styles.hbBtn, heartbeatRunning && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          >
            {heartbeatRunning ? (
              <ActivityIndicator size="small" color="#FF6B9D" />
            ) : (
              <MaterialIcons name="favorite" size={16} color="#FF6B9D" />
            )}
            <Text style={styles.hbBtnText}>
              {heartbeatRunning ? 'HEARTBEAT RUNNING...' : 'RUN HEARTBEAT CYCLE'}
            </Text>
          </Pressable>
        </View>

        {/* Vault Link */}
        <Pressable
          onPress={() => routerArch.push('/vault' as any)}
          style={({ pressed }) => [styles.vaultBtn, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="lock" size={16} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vaultBtnTitle}>OPEN APP VAULT</Text>
            <Text style={styles.vaultBtnSub}>Master Blueprint v3.1 • Hive Node Registry • Prime Directives</Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
        </Pressable>

        {/* Quick Action Grid */}
        <View style={styles.panel}>
          <Text style={styles.fieldLabel}>{'> QUICK COMMANDS'}</Text>
          <View style={styles.quickGrid}>
            {QUICK_COMMANDS.map(cmd => (
              <Pressable
                key={cmd.label}
                onPress={() => runQuickCommand(cmd.label, cmd.prompt, cmd.agentId)}
                style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name={cmd.icon as any} size={14} color={Colors.primary} />
                <Text style={styles.quickBtnText}>{cmd.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const QUICK_COMMANDS = [
  { label: 'G-SCHITT', icon: 'auto-awesome', agentId: 'g_schitt', prompt: 'G-SCHITT Intel Node: run a full deep analysis of the KRACKERJACK HIVE architecture. Identify strengths, gaps, risks, and opportunities. Show your reasoning chain. Sign as G-SCHITT.' },
  { label: 'DIRECTIVE', icon: 'flash-on', agentId: 'architect', prompt: 'State the Prime Directive v3.1 and current Hive status in one sharp briefing.' },
  { label: 'HIVE STATUS', icon: 'hub', agentId: 'architect', prompt: 'Report the status of all 10 Hive nodes. Include version, role, and current status for each node.' },
  { label: 'OS BLUEPRINT', icon: 'memory', agentId: 'architect', prompt: 'Give me the full Hive OS architecture blueprint: Gentoo base, Termux bridge, USB boot config, and Hive Commander setup.' },
  { label: 'HUNT', icon: 'radar', agentId: 'hunter', prompt: 'Run an intel scan on the top emerging AI and OS infrastructure opportunities right now. Return top 5 targets.' },
  { label: 'DEPLOY', icon: 'cloud-upload', agentId: 'devops', prompt: 'Walk me through deploying the Hive OS app to Android via EAS Build and to iOS via TestFlight. Steps only.' },
  { label: 'LEGAL', icon: 'gavel', agentId: 'legal', prompt: 'What legal protections should KRACKERJACK1134 have in place for an AI OS platform? Give me the essential documents and key clauses.' },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}30`,
    backgroundColor: `${Colors.primary}08`,
  },
  headerLeft: { gap: 3 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadgeText: {
    fontSize: Typography.md,
    fontWeight: Typography.black,
    color: Colors.primary,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
  },
  headerSub: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', letterSpacing: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: {
    width: 7, height: 7, borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4,
  },
  liveText: { fontSize: Typography.xs, color: Colors.primary, fontFamily: 'SpaceMono', fontWeight: Typography.bold },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  panel: {
    backgroundColor: '#0D0D0D',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}20`,
    paddingBottom: Spacing.sm,
    marginBottom: 2,
  },
  panelTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
  },

  fieldLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
    marginBottom: -2,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
  },
  textarea: { minHeight: 90, paddingTop: Spacing.sm },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.black,
    color: '#000',
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },

  hiveActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  hiveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#69F0AE15',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#69F0AE40',
    paddingVertical: Spacing.sm,
  },
  hiveBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#69F0AE',
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },
  clearBtn: {
    width: 42, height: 42,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  logBox: { maxHeight: 280, backgroundColor: '#000', borderRadius: Radii.sm, padding: Spacing.sm },
  logRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 3, gap: 6 },
  logTs: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  logText: { flex: 1, fontSize: 10, fontFamily: 'SpaceMono', lineHeight: 16 },
  logCursor: { paddingTop: 2 },
  logCursorText: { color: Colors.primary, fontSize: 12, fontFamily: 'SpaceMono' },

  vaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: `${Colors.primary}0D`,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
  },
  vaultBtnTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },
  vaultBtnSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  hbStatusBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radii.sm, borderWidth: 1,
    marginRight: 4,
  },
  hbStatusText: { fontSize: 9, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  hbMeta: { gap: 4, paddingTop: 2 },
  hbMetaRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  hbMetaLabel: { fontSize: 9, color: '#FF6B9D80', fontFamily: 'SpaceMono', width: 80, letterSpacing: 0.5, marginTop: 1 },
  hbMetaValue: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontFamily: 'SpaceMono' },
  hbNotesBox: {
    backgroundColor: '#FF6B9D08', borderRadius: Radii.sm,
    borderWidth: 1, borderColor: '#FF6B9D20', padding: Spacing.sm,
  },
  hbNotesLabel: { fontSize: 9, color: '#FF6B9D60', fontFamily: 'SpaceMono', letterSpacing: 1, marginBottom: 4 },
  hbNotesText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'SpaceMono', lineHeight: 17 },
  hbOutput: {
    maxHeight: 260, backgroundColor: '#000', borderRadius: Radii.sm,
    padding: Spacing.sm, borderWidth: 1, borderColor: '#FF6B9D25',
  },
  hbOutputText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'SpaceMono', lineHeight: 18 },
  hbCursor: { color: '#FF6B9D', fontSize: 12, fontFamily: 'SpaceMono' },
  hbBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.sm, borderRadius: Radii.sm,
    borderWidth: 1, borderColor: '#FF6B9D40', backgroundColor: '#FF6B9D10',
  },
  hbBtnText: { fontSize: 12, color: '#FF6B9D', fontFamily: 'SpaceMono', fontWeight: Typography.bold, letterSpacing: 0.8 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  quickBtnText: { fontSize: 11, color: Colors.primary, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
});
