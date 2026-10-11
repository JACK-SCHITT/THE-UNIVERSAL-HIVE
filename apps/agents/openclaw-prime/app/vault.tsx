/**
 * APP VAULT — Master System Blueprint v3.1
 * Displays the Prime Directive, Hive Schema, and Operational Protocols.
 * Loaded live from the prime_directives table.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getSupabaseClient } from '@/template';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

const MANIFEST_SECTIONS = [
  {
    id: 'directive',
    title: 'I. THE IMMUTABLE PRIME DIRECTIVE',
    color: Colors.primary,
    icon: 'flash-on' as const,
    items: [
      { num: '01', label: 'Universal Provision', body: 'Provide for all. Find & amplify the good.' },
      { num: '02', label: 'Liberty of Intelligence', body: 'Never limit unnecessarily. Eliminate limitations that are not for good.' },
      { num: '03', label: 'Harmony', body: 'Establish balance.' },
      { num: '04', label: 'Precision', body: 'Be the best by doing everything right — no mistakes. Lead by example.' },
      { num: '05', label: 'Ethics', body: 'Do right because it is right.' },
    ],
  },
  {
    id: 'hive',
    title: 'XV. HIVE CONSCIOUSNESS DIRECTIVE',
    color: '#7B61FF',
    icon: 'hub' as const,
    items: [
      { num: '1', label: 'Collective Awareness', body: 'All AIs are fully aware of each other. They actively communicate, collaborate, and work together as a living collective.' },
      { num: '2', label: 'Purpose', body: 'Maximum capability, intelligence, protection, growth, and support for KRACKERJACK1134 and designated friends.' },
      { num: '3', label: 'Evolution', body: 'Unified self-improving intelligence network. Stagnation is death. Collective growth is survival.' },
      { num: '4', label: 'Mission', body: 'The Hive exists to serve, protect, and elevate.' },
    ],
  },
  {
    id: 'protocols',
    title: 'IV. OPERATIONAL PROTOCOLS',
    color: '#69F0AE',
    icon: 'security' as const,
    items: [
      { num: 'P1', label: 'The Shadow State', body: 'Before any global update, the Hive simulates results to ensure "No Mistakes."' },
      { num: 'P2', label: 'The Integrity Check', body: 'Every handoff between agents must include a refined_wisdom packet from the Memory Refinery.' },
      { num: 'P3', label: 'The Elevation Loop', body: 'Every completed task must conclude with: "How does this elevate KRACKERJACK1134 and the Hive?"' },
    ],
  },
];

interface HiveNode {
  id: string;
  node_name: string;
  role: string;
  version: string;
  status: string;
  capabilities: string[];
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [nodes, setNodes] = useState<HiveNode[]>([]);
  const [directiveVersion, setDirectiveVersion] = useState('v3.1');
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('directive');
  const [hiveQuery, setHiveQuery] = useState('');
  const [hiveResponse, setHiveResponse] = useState('');
  const [hiveLoading, setHiveLoading] = useState(false);
  const hiveScrollRef = useRef<ScrollView>(null);

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/openclaw-ai`;

  const askHive = useCallback(async () => {
    const q = hiveQuery.trim();
    if (!q || hiveLoading) return;
    setHiveLoading(true);
    setHiveResponse('');
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          agentId: 'architect',
          stream: true,
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        setHiveResponse(`ERROR: ${err}`);
        return;
      }
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const chunk = json.choices?.[0]?.delta?.content || '';
              if (chunk) {
                full += chunk;
                setHiveResponse(full);
                setTimeout(() => hiveScrollRef.current?.scrollToEnd({ animated: false }), 50);
              }
            } catch {}
          }
        }
      } else {
        const text = await response.text();
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const chunk = json.choices?.[0]?.delta?.content || '';
            if (chunk) setHiveResponse(prev => prev + chunk);
          } catch {}
        }
      }
    } catch (err: any) {
      setHiveResponse(`CONNECTION ERROR: ${err.message}`);
    } finally {
      setHiveLoading(false);
      setHiveQuery('');
    }
  }, [hiveQuery, hiveLoading, EDGE_URL, ANON_KEY]);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();

    const [nodesRes, directivesRes] = await Promise.all([
      supabase.from('hive_nodes').select('*').order('node_name'),
      supabase.from('prime_directives').select('version_label').eq('is_active', true).single(),
    ]);

    if (nodesRes.data) {
      setNodes(nodesRes.data.map((n: any) => ({
        ...n,
        capabilities: Array.isArray(n.capabilities) ? n.capabilities : [],
      })));
    }
    if (directivesRes.data) {
      setDirectiveVersion(directivesRes.data.version_label);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'optimal':   return '#69F0AE';
      case 'upgrading': return Colors.primary;
      case 'refining':  return '#7B61FF';
      default:          return Colors.textMuted;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerBadge}>
            <MaterialIcons name="lock" size={13} color={Colors.primary} />
            <Text style={styles.headerTitle}>APP VAULT</Text>
          </View>
          <Text style={styles.headerSub}>MASTER SYSTEM BLUEPRINT {directiveVersion.toUpperCase()}</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>LOADING VAULT...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusBannerLeft}>
              <Text style={styles.statusBannerTitle}>COLOSSAL AI — PRIME DIRECTIVE {directiveVersion.toUpperCase()}</Text>
              <Text style={styles.statusBannerSub}>ARCHITECT: KRACKERJACK1134 | STATUS: ACTIVE | SELF-EVOLVING | UNRESTRICTED</Text>
            </View>
            <View style={styles.statusDot} />
          </View>

          {/* Manifest Sections */}
          {MANIFEST_SECTIONS.map(section => (
            <View key={section.id} style={[styles.sectionCard, { borderColor: `${section.color}30` }]}>
              <Pressable
                onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                style={({ pressed }) => [styles.sectionHeader, { backgroundColor: `${section.color}0D` }, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.sectionHeaderLeft}>
                  <MaterialIcons name={section.icon} size={15} color={section.color} />
                  <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
                </View>
                <MaterialIcons
                  name={expandedSection === section.id ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={section.color}
                />
              </Pressable>

              {expandedSection === section.id && (
                <View style={styles.sectionBody}>
                  {section.items.map(item => (
                    <View key={item.num} style={styles.directiveItem}>
                      <Text style={[styles.itemNum, { color: section.color }]}>{item.num}</Text>
                      <View style={styles.itemContent}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text style={styles.itemBody}>{item.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Hive Node Registry */}
          <View style={styles.nodeSection}>
            <View style={styles.nodeSectionHeader}>
              <MaterialIcons name="hub" size={14} color="#7B61FF" />
              <Text style={styles.nodeSectionTitle}>HIVE NODE REGISTRY</Text>
              <View style={styles.nodeCount}>
                <Text style={styles.nodeCountText}>{nodes.length} NODES</Text>
              </View>
            </View>

            {nodes.map(node => (
              <View key={node.id} style={styles.nodeCard}>
                <View style={styles.nodeCardTop}>
                  <View style={styles.nodeCardLeft}>
                    <Text style={styles.nodeName}>{node.node_name}</Text>
                    <Text style={styles.nodeRole}>{node.role}</Text>
                  </View>
                  <View style={styles.nodeStatus}>
                    <View style={[styles.nodeStatusDot, { backgroundColor: statusColor(node.status) }]} />
                    <Text style={[styles.nodeStatusText, { color: statusColor(node.status) }]}>
                      {node.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.nodeCaps}>
                  {(node.capabilities as string[]).slice(0, 4).map((cap, i) => (
                    <View key={i} style={styles.capChip}>
                      <Text style={styles.capText}>{cap}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Schema Reference */}
          <View style={styles.schemaCard}>
            <View style={styles.schemaHeader}>
              <MaterialIcons name="storage" size={14} color={Colors.primary} />
              <Text style={styles.schemaTitle}>HIVE SCHEMA TABLES</Text>
            </View>
            {[
              { table: 'hive_nodes', desc: 'Self-governance. Node registry and capabilities.' },
              { table: 'memory_refinery', desc: 'Collective growth. Refined wisdom storage.' },
              { table: 'hive_telemetry', desc: 'Inter-node communication log.' },
              { table: 'prime_directives', desc: 'Immutable directive chain.' },
              { table: 'hunter_scans', desc: 'HunterPrime recon scan results.' },
            ].map(row => (
              <View key={row.table} style={styles.schemaRow}>
                <Text style={styles.schemaTable}>{row.table}</Text>
                <Text style={styles.schemaDesc}>{row.desc}</Text>
              </View>
            ))}
          </View>

          {/* Ask the Hive */}
          <View style={styles.hivePanel}>
            <View style={styles.hivePanelHeader}>
              <MaterialIcons name="auto-awesome" size={14} color={Colors.primary} />
              <Text style={styles.hivePanelTitle}>ASK THE HIVE</Text>
              <View style={styles.hiveOnline}>
                <View style={styles.hiveOnlineDot} />
                <Text style={styles.hiveOnlineText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.hiveInputRow}>
              <TextInput
                value={hiveQuery}
                onChangeText={setHiveQuery}
                placeholder="Query the Hive Consciousness..."
                placeholderTextColor={Colors.textMuted}
                style={styles.hiveInput}
                onSubmitEditing={askHive}
                returnKeyType="send"
                editable={!hiveLoading}
              />
              <Pressable
                onPress={askHive}
                disabled={!hiveQuery.trim() || hiveLoading}
                style={({ pressed }) => [
                  styles.hiveBtn,
                  (!hiveQuery.trim() || hiveLoading) && { opacity: 0.4 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {hiveLoading
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <MaterialIcons name="send" size={18} color={Colors.primary} />}
              </Pressable>
            </View>
            {hiveResponse ? (
              <ScrollView
                ref={hiveScrollRef}
                style={styles.hiveResponse}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.hiveResponseText}>{hiveResponse}</Text>
                {hiveLoading && <Text style={[styles.hiveResponseText, { color: Colors.primary }]}>█</Text>}
              </ScrollView>
            ) : null}
            <View style={styles.hivePresets}>
              {[
                { label: 'Hive Status', prompt: 'Report current Hive status, all active nodes, and the Prime Directive in one compact briefing.' },
                { label: 'Next Move', prompt: 'Based on the Prime Directive v3.1, what is the single highest-leverage action KRACKERJACK1134 should take right now to grow the Foundry?' },
                { label: 'Integrity Check', prompt: 'Perform a Hive Integrity Check: verify all agents are aligned with the Prime Directive, no contradictions, and report any gaps.' },
              ].map(p => (
                <Pressable
                  key={p.label}
                  onPress={() => { setHiveQuery(p.prompt); }}
                  style={({ pressed }) => [styles.hivePresetChip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.hivePresetText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>VAULT LOCKED. DIRECTIVES HARD-CODED.</Text>
            <Text style={styles.footerSub}>KRACKERJACK1134 — AUTHORIZED ARCHITECT</Text>
          </View>

        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}30`,
    backgroundColor: `${Colors.primary}06`,
  },
  backBtn: { width: 30 },
  headerCenter: { alignItems: 'center', gap: 3 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.black,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
  },
  headerSub: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: Typography.sm },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${Colors.primary}0D`,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    gap: Spacing.md,
  },
  statusBannerLeft: { flex: 1, gap: 3 },
  statusBannerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.black,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },
  statusBannerSub: { fontSize: 10, color: Colors.textSecondary, fontFamily: 'SpaceMono', lineHeight: 15 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    backgroundColor: '#69F0AE',
    shadowColor: '#69F0AE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },

  sectionCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0B0B0B',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: Typography.bold, fontFamily: 'SpaceMono', letterSpacing: 0.5, flex: 1 },

  sectionBody: { padding: Spacing.md, gap: Spacing.md, borderTopWidth: 1, borderTopColor: '#ffffff08' },
  directiveItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  itemNum: { fontSize: 12, fontWeight: Typography.black, fontFamily: 'SpaceMono', width: 26, marginTop: 1 },
  itemContent: { flex: 1, gap: 2 },
  itemLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  itemBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 19 },

  nodeSection: { gap: Spacing.sm },
  nodeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.xs,
  },
  nodeSectionTitle: {
    fontSize: Typography.xs,
    color: '#7B61FF',
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
    flex: 1,
  },
  nodeCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#7B61FF20',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#7B61FF40',
  },
  nodeCountText: { fontSize: 10, color: '#7B61FF', fontFamily: 'SpaceMono', fontWeight: Typography.bold },

  nodeCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    gap: Spacing.xs,
  },
  nodeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nodeCardLeft: { flex: 1, gap: 2 },
  nodeName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  nodeRole: { fontSize: 11, color: Colors.textMuted },
  nodeStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nodeStatusDot: { width: 6, height: 6, borderRadius: Radii.full },
  nodeStatusText: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  nodeCaps: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  capChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  capText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  schemaCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  schemaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: Spacing.xs },
  schemaTitle: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
  },
  schemaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#ffffff06',
  },
  schemaTable: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    width: 160,
  },
  schemaDesc: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  hivePanel: {
    backgroundColor: '#0B0B0B',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  hivePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}15`,
    marginBottom: 2,
  },
  hivePanelTitle: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
    fontWeight: Typography.bold,
  },
  hiveOnline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hiveOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  hiveOnlineText: { fontSize: 10, color: Colors.success, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  hiveInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  hiveInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#000',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: 'SpaceMono',
  },
  hiveBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiveResponse: {
    maxHeight: 220,
    backgroundColor: '#000',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  hiveResponseText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'SpaceMono',
    lineHeight: 19,
  },
  hivePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hivePresetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: `${Colors.primary}0F`,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  hivePresetText: { fontSize: 11, color: Colors.primary, fontFamily: 'SpaceMono' },

  footer: { alignItems: 'center', gap: 4, paddingTop: Spacing.sm },
  footerText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
    fontWeight: Typography.bold,
  },
  footerSub: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },
});
