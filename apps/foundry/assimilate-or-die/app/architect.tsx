import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useAuth, useAlert, getSupabaseClient } from '@/template';

const ARCHITECT_EMAIL = 'krackerjack1134@gmail.com';

interface AccessCode {
  id: string;
  code: string;
  role_granted: string;
  label: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

interface UserRecord {
  id: string;
  username: string;
  handle: string;
  email: string;
  xp: number;
  access_tier: string;
  chat_messages_sent: number;
  apps_submitted: number;
}

type Tab = 'users' | 'codes' | 'stats';

const ROLES = ['VERIFIED', 'TEACHER', 'BROTHER'];

export default function ArchitectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();
  const supabase = getSupabaseClient();

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [newCodeRole, setNewCodeRole] = useState('VERIFIED');
  const [generating, setGenerating] = useState(false);

  // Guard: Only Architect can access
  if (authUser?.email !== ARCHITECT_EMAIL) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.denied}>
          <MaterialIcons name="block" size={64} color={Colors.crimson} />
          <Text style={styles.deniedTitle}>ACCESS DENIED</Text>
          <Text style={styles.deniedSub}>This area is restricted to the Architect only.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>RETREAT</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, codesRes] = await Promise.all([
        supabase.from('user_profiles')
          .select('id, username, handle, email, xp, access_tier, chat_messages_sent, apps_submitted')
          .order('xp', { ascending: false })
          .limit(50),
        supabase.from('access_codes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (!usersRes.error && usersRes.data) setUsers(usersRes.data as UserRecord[]);
      if (!codesRes.error && codesRes.data) setCodes(codesRes.data as AccessCode[]);
    } catch (e) {
      console.log('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      const { error } = await supabase.from('access_codes').insert({
        code,
        role_granted: newCodeRole,
        label: newCodeLabel.trim() || 'Unnamed',
        created_by: authUser?.id,
      });

      if (error) throw error;

      showAlert('CODE GENERATED', `Code: ${code}\nRole: ${newCodeRole}\nLabel: ${newCodeLabel || 'Unnamed'}\n\nDeliver this to the recipient directly.`, [
        { text: 'COPY & CLOSE', style: 'default', onPress: () => { setNewCodeLabel(''); loadData(); } }
      ]);
    } catch (e: any) {
      showAlert('ERROR', e.message || 'Failed to generate code.', [{ text: 'OK', style: 'cancel' }]);
    } finally {
      setGenerating(false);
    }
  };

  const revokeCode = async (id: string) => {
    showAlert('REVOKE CODE', 'This will permanently invalidate this code.', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'REVOKE', style: 'destructive', onPress: async () => {
          await supabase.from('access_codes').update({ is_used: true }).eq('id', id);
          loadData();
        }
      }
    ]);
  };

  const tierColor = (tier: string) => {
    if (tier === 'ARCHITECT') return Colors.crimson;
    if (tier === 'TEACHER') return Colors.cyanPulse;
    if (tier === 'VERIFIED' || tier === 'BROTHER') return '#8B5CF6';
    return Colors.textMuted;
  };

  const totalXP = users.reduce((s, u) => s + (u.xp || 0), 0);
  const usedCodes = codes.filter(c => c.is_used).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEye}>[ ARCHITECT ONLY ]</Text>
          <Text style={styles.headerTitle}>COMMAND DASHBOARD</Text>
        </View>
        <Pressable onPress={loadData}>
          <MaterialIcons name="refresh" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Stats Banner */}
      <LinearGradient colors={['#1a0000', '#0a0000']} style={styles.statsBanner}>
        {[
          { label: 'TOTAL USERS', value: users.length },
          { label: 'TOTAL XP', value: totalXP.toLocaleString() },
          { label: 'CODES ISSUED', value: codes.length },
          { label: 'CODES USED', value: usedCodes },
        ].map(s => (
          <View key={s.label} style={styles.bannerStat}>
            <Text style={styles.bannerStatValue}>{s.value}</Text>
            <Text style={styles.bannerStatLabel}>{s.label}</Text>
          </View>
        ))}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['users', 'codes', 'stats'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.crimson} size="large" />
          <Text style={styles.loadingText}>LOADING FOUNDRY DATA...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* USERS TAB */}
          {activeTab === 'users' ? (
            <>
              <Text style={styles.sectionTitle}>{users.length} REGISTERED OPERATIVES</Text>
              {users.map(u => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userLeft}>
                    <MaterialIcons name="person" size={20} color={tierColor(u.access_tier)} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.username || u.email}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <View style={styles.userMeta}>
                        <View style={[styles.userTierPill, { borderColor: tierColor(u.access_tier) }]}>
                          <Text style={[styles.userTierText, { color: tierColor(u.access_tier) }]}>{u.access_tier}</Text>
                        </View>
                        <View style={styles.userXpRow}>
                          <MaterialIcons name="bolt" size={10} color={Colors.crimson} />
                          <Text style={styles.userXp}>{(u.xp || 0).toLocaleString()} XP</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userStats}>
                    <Text style={styles.userStatItem}>💬 {u.chat_messages_sent ?? 0}</Text>
                    <Text style={styles.userStatItem}>🚀 {u.apps_submitted ?? 0}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {/* CODES TAB */}
          {activeTab === 'codes' ? (
            <>
              {/* Code Generator */}
              <View style={styles.codeGenerator}>
                <Text style={styles.sectionTitle}>GENERATE NEW CODE</Text>
                <Text style={styles.label}>LABEL (WHO IS THIS FOR?)</Text>
                <TextInput
                  style={styles.input}
                  value={newCodeLabel}
                  onChangeText={setNewCodeLabel}
                  placeholder="e.g. User123"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.label}>ROLE TO GRANT</Text>
                <View style={styles.roleRow}>
                  {ROLES.map(role => (
                    <Pressable
                      key={role}
                      style={[styles.roleChip, newCodeRole === role && { backgroundColor: Colors.crimson, borderColor: Colors.crimson }]}
                      onPress={() => setNewCodeRole(role)}
                    >
                      <Text style={[styles.roleChipText, newCodeRole === role && { color: '#fff' }]}>{role}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.85 }, generating && { opacity: 0.6 }]}
                  onPress={generateCode}
                  disabled={generating}
                >
                  <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.generateBtnGradient}>
                    {generating ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <MaterialIcons name="vpn-key" size={16} color="#fff" />
                        <Text style={styles.generateBtnText}>GENERATE CODE</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Code List */}
              <Text style={styles.sectionTitle}>ISSUED CODES ({codes.length})</Text>
              {codes.map(c => (
                <View key={c.id} style={[styles.codeRow, c.is_used && { opacity: 0.5 }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.codeTop}>
                      <Text style={[styles.codeValue, c.is_used && { color: Colors.textMuted }]}>{c.code}</Text>
                      <View style={[styles.codePill, { borderColor: c.is_used ? Colors.textMuted : Colors.success }]}>
                        <Text style={[styles.codePillText, { color: c.is_used ? Colors.textMuted : Colors.success }]}>
                          {c.is_used ? 'USED' : 'ACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.codeMeta}>{c.label} · {c.role_granted} · {new Date(c.created_at).toLocaleDateString()}</Text>
                    {c.is_used && c.used_at ? <Text style={styles.codeMeta}>Used: {new Date(c.used_at).toLocaleDateString()}</Text> : null}
                  </View>
                  {!c.is_used ? (
                    <Pressable onPress={() => revokeCode(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="cancel" size={18} color={Colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}

          {/* STATS TAB */}
          {activeTab === 'stats' ? (
            <>
              <Text style={styles.sectionTitle}>FOUNDRY INTELLIGENCE</Text>
              <View style={styles.statsCard}>
                {[
                  { label: 'Total Operatives', value: users.length },
                  { label: 'Total XP Generated', value: totalXP.toLocaleString() },
                  { label: 'Avg XP per User', value: users.length ? Math.round(totalXP / users.length).toLocaleString() : '0' },
                  { label: 'Codes Issued', value: codes.length },
                  { label: 'Codes Redeemed', value: usedCodes },
                  { label: 'Redemption Rate', value: codes.length ? `${Math.round((usedCodes / codes.length) * 100)}%` : '0%' },
                  { label: 'Verified Users', value: users.filter(u => u.access_tier !== 'STANDARD').length },
                  { label: 'Total Chat Msgs', value: users.reduce((s, u) => s + (u.chat_messages_sent ?? 0), 0).toLocaleString() },
                  { label: 'Total Apps Built', value: users.reduce((s, u) => s + (u.apps_submitted ?? 0), 0).toLocaleString() },
                ].map(s => (
                  <View key={s.label} style={styles.statsRow}>
                    <Text style={styles.statsRowLabel}>{s.label}</Text>
                    <Text style={styles.statsRowValue}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingHorizontal: Spacing.md },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerCenter: { alignItems: 'center' },
  headerEye: { color: Colors.crimson, fontSize: 8, fontWeight: Typography.black, letterSpacing: 2 },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 2 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  deniedTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 4 },
  deniedSub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },
  backBtn: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.sm, marginTop: Spacing.md },
  backBtnText: { color: Colors.textMuted, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2 },

  statsBanner: {
    flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGlow,
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatValue: { color: Colors.crimson, fontSize: Typography.md, fontWeight: Typography.black },
  bannerStatLabel: { color: Colors.textMuted, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 2 },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.crimson },
  tabText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 2 },
  tabTextActive: { color: Colors.crimson },

  sectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 3, marginBottom: Spacing.sm, marginTop: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 6, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: Typography.base,
  },

  // Users
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  userLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  userName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.bold },
  userEmail: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  userTierPill: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  userTierText: { fontSize: 8, fontWeight: Typography.black, letterSpacing: 1 },
  userXpRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  userXp: { color: Colors.textMuted, fontSize: 10 },
  userStats: { alignItems: 'flex-end', gap: 2 },
  userStatItem: { color: Colors.textMuted, fontSize: 10 },

  // Codes
  codeGenerator: { backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.borderGlow, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  roleChip: {
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.pill, backgroundColor: Colors.surface,
  },
  roleChipText: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.bold, letterSpacing: 1 },
  generateBtn: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.sm },
  generateBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  generateBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  codeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  codeTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  codeValue: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 3, fontFamily: 'monospace' },
  codePill: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  codePillText: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  codeMeta: { color: Colors.textMuted, fontSize: 10 },

  // Stats
  statsCard: { backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: 'hidden' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statsRowLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
  statsRowValue: { color: Colors.crimson, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 1 },
});
