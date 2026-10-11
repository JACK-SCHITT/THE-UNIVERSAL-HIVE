import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useAuth, useAlert, getSupabaseClient } from '@/template';
import { useApp } from '@/contexts/AppContext';
import { RANKS } from '@/constants/data';

const ARCHITECT_EMAIL = 'krackerjack1134@gmail.com';
const TEACHER_EMAIL = 'jackschitt1134@gmail.com';

interface ProfileData {
  username: string;
  handle: string;
  email: string;
  xp: number;
  access_tier: string;
  tools_explored: string[];
  chat_messages_sent: number;
  apps_submitted: number;
  lessons_completed: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { showAlert } = useAlert();
  const { user: appUser, currentRank } = useApp();
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isArchitect = authUser?.email === ARCHITECT_EMAIL;
  const isTeacher = authUser?.email === TEACHER_EMAIL;

  const loadProfile = useCallback(async () => {
    if (!authUser) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, handle, email, xp, access_tier, tools_explored, chat_messages_sent, apps_submitted, lessons_completed')
        .eq('id', authUser.id)
        .single();
      if (!error && data) setProfile(data as ProfileData);
    } catch (e) {
      console.log('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await logout();
    if (error) {
      showAlert('ERROR', error, [{ text: 'OK', style: 'cancel' }]);
      setLoggingOut(false);
    } else {
      router.replace('/');
    }
  };

  const handleVerifyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      showAlert('INVALID', 'Enter a valid access code.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    setVerifyingCode(true);
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .single();

      if (error || !data) {
        showAlert('CODE REJECTED', 'This code is invalid, expired, or already used. Contact the Architect.', [{ text: 'ACKNOWLEDGE', style: 'cancel' }]);
        setVerifyingCode(false);
        return;
      }

      // Mark code as used
      await supabase
        .from('access_codes')
        .update({ is_used: true, used_by: authUser?.id, used_at: new Date().toISOString() })
        .eq('id', data.id);

      // Update user access tier
      await supabase
        .from('user_profiles')
        .update({ access_tier: data.role_granted })
        .eq('id', authUser?.id);

      showAlert('ACCESS GRANTED', `Code verified. You have been elevated to ${data.role_granted} tier. The Foundry recognizes you.`, [
        { text: 'ACKNOWLEDGED', style: 'default', onPress: () => { setShowCodeEntry(false); setCodeInput(''); loadProfile(); } }
      ]);
    } catch (e) {
      showAlert('ERROR', 'Verification failed. Try again.', [{ text: 'OK', style: 'cancel' }]);
    } finally {
      setVerifyingCode(false);
    }
  };

  const tierColor = (tier: string) => {
    if (tier === 'ARCHITECT') return Colors.crimson;
    if (tier === 'TEACHER') return Colors.cyanPulse;
    if (tier === 'VERIFIED') return '#8B5CF6';
    return Colors.textMuted;
  };

  const tierIcon = (tier: string): any => {
    if (tier === 'ARCHITECT') return 'admin-panel-settings';
    if (tier === 'TEACHER') return 'school';
    if (tier === 'VERIFIED') return 'verified';
    return 'person';
  };

  if (!authUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestWrap}>
          <MaterialIcons name="lock" size={48} color={Colors.textMuted} />
          <Text style={styles.guestTitle}>NOT AUTHENTICATED</Text>
          <Text style={styles.guestSub}>Login to access your profile and unlock tier verification.</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/login')}>
            <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.loginBtnGradient}>
              <Text style={styles.loginBtnText}>LOGIN / REGISTER</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.crimson} size="large" />
        <Text style={styles.loadingText}>LOADING IDENTITY...</Text>
      </View>
    );
  }

  const xp = profile?.xp ?? appUser.xp;
  const rank = RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) ?? RANKS[0];
  const nextRank = RANKS.find(r => r.level === rank.level + 1);
  const progress = nextRank ? (xp - rank.minXP) / (nextRank.minXP - rank.minXP) : 1;
  const accessTier = isArchitect ? 'ARCHITECT' : isTeacher ? 'TEACHER' : (profile?.access_tier ?? 'STANDARD');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>[ IDENTITY FILE ]</Text>
          <Text style={styles.title}>PROFILE</Text>
        </View>

        {/* Identity Card */}
        <LinearGradient colors={['#1a0000', '#0d0d0d']} style={styles.idCard}>
          <View style={styles.idCardTop}>
            <Image
              source={require('@/assets/images/assimilation_badge.png')}
              style={styles.avatar}
              contentFit="contain"
              transition={200}
            />
            <View style={styles.idInfo}>
              <Text style={styles.idName}>{profile?.username ?? authUser.email?.split('@')[0].toUpperCase()}</Text>
              <Text style={styles.idHandle}>{profile?.handle ?? '@UNKNOWN'}</Text>
              <Text style={styles.idEmail}>{authUser.email}</Text>
              <View style={[styles.tierBadge, { borderColor: tierColor(accessTier) }]}>
                <MaterialIcons name={tierIcon(accessTier)} size={12} color={tierColor(accessTier)} />
                <Text style={[styles.tierBadgeText, { color: tierColor(accessTier) }]}>{accessTier}</Text>
              </View>
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpLabelRow}>
              <Text style={[styles.xpRankLabel, { color: rank.color }]}>{rank.title}</Text>
              {nextRank ? <Text style={styles.xpRankLabel}>{nextRank.title}</Text> : null}
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.min(1, progress) * 100}%` as any }]}>
                <LinearGradient colors={[Colors.crimson, Colors.emberGlow]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              </View>
            </View>
            <View style={styles.xpNumbers}>
              <View style={styles.xpRow}>
                <MaterialIcons name="bolt" size={14} color={Colors.crimson} />
                <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
              </View>
              {nextRank ? <Text style={styles.xpToNext}>{Math.max(0, nextRank.minXP - xp).toLocaleString()} to {nextRank.title}</Text> : <Text style={styles.xpToNext}>MAXIMUM RANK</Text>}
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <Text style={styles.sectionTitle}>ASSIMILATION STATS</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'TOOLS', value: profile?.tools_explored?.length ?? 0, icon: 'bolt', color: Colors.crimson },
            { label: 'MSGS', value: profile?.chat_messages_sent ?? 0, icon: 'psychology', color: Colors.cyanPulse },
            { label: 'APPS', value: profile?.apps_submitted ?? 0, icon: 'rocket-launch', color: Colors.warning },
            { label: 'LESSONS', value: profile?.lessons_completed ?? 0, icon: 'school', color: Colors.success },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <MaterialIcons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Access Code Verification */}
        {accessTier === 'STANDARD' ? (
          <View style={styles.codeSection}>
            <Pressable style={styles.codeSectionToggle} onPress={() => setShowCodeEntry(v => !v)}>
              <MaterialIcons name="vpn-key" size={16} color={Colors.emberGlow} />
              <Text style={styles.codeSectionTitle}>REDEEM ACCESS CODE</Text>
              <MaterialIcons name={showCodeEntry ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
            </Pressable>
            {showCodeEntry ? (
              <View style={styles.codeForm}>
                <Text style={styles.codeHint}>Enter the one-time code provided directly by the Architect (KRACKERJACK1134)</Text>
                <TextInput
                  style={styles.codeInput}
                  value={codeInput}
                  onChangeText={v => setCodeInput(v.toUpperCase())}
                  placeholder="ENTER CODE"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={16}
                />
                <Pressable
                  style={({ pressed }) => [styles.codeBtn, pressed && { opacity: 0.85 }, verifyingCode && { opacity: 0.6 }]}
                  onPress={handleVerifyCode}
                  disabled={verifyingCode}
                >
                  <LinearGradient colors={[Colors.emberGlow, '#8B4500']} style={styles.codeBtnGradient}>
                    {verifyingCode ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.codeBtnText}>VERIFY CODE</Text>}
                  </LinearGradient>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Architect Dashboard Button */}
        {isArchitect ? (
          <Pressable
            style={({ pressed }) => [styles.architectBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/architect')}
          >
            <LinearGradient colors={['#1a0000', '#2a0000']} style={styles.architectBtnInner}>
              <MaterialIcons name="admin-panel-settings" size={22} color={Colors.crimson} />
              <View style={{ flex: 1 }}>
                <Text style={styles.architectBtnTitle}>ARCHITECT DASHBOARD</Text>
                <Text style={styles.architectBtnSub}>Manage users, generate access codes, view all activity</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Navigation Shortcuts */}
        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
        {[
          { label: 'PRIME DIRECTIVE', icon: 'shield', route: '/prime-directive', color: Colors.crimson },
          { label: 'RANK & MISSIONS', icon: 'military-tech', route: '/(tabs)/progress', color: Colors.warning },
        ].map(item => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.8 }]}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialIcons name={item.icon as any} size={18} color={item.color} />
            <Text style={[styles.navRowText, { color: item.color }]}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color={Colors.crimson} size="small" />
            : <>
                <MaterialIcons name="logout" size={18} color={Colors.crimson} />
                <Text style={styles.logoutText}>LOGOUT</Text>
              </>
          }
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.md, marginBottom: Spacing.lg },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 2 },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 3 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2, marginTop: 8 },

  // Guest
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  guestTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 2, textAlign: 'center' },
  guestSub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: Typography.sm * 1.6 },
  loginBtn: { borderRadius: Radius.sm, overflow: 'hidden', width: '100%', marginTop: Spacing.md },
  loginBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },

  // ID Card
  idCard: { borderWidth: 1, borderColor: Colors.borderGlow, borderRadius: Radius.sm, padding: Spacing.lg, marginBottom: Spacing.lg },
  idCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: Radius.sm },
  idInfo: { flex: 1, gap: 3 },
  idName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 2 },
  idHandle: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1 },
  idEmail: { color: Colors.textSecondary, fontSize: Typography.xs },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, alignSelf: 'flex-start', marginTop: 4,
  },
  tierBadgeText: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 2 },
  xpSection: {},
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpRankLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.bold, letterSpacing: 1.5 },
  xpTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpValue: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black },
  xpToNext: { color: Colors.textMuted, fontSize: Typography.xs },

  // Stats
  sectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 3, marginBottom: Spacing.sm, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    width: '47%', backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.black },
  statLabel: { color: Colors.textMuted, fontSize: 8, letterSpacing: 1.5, textAlign: 'center' },

  // Code section
  codeSection: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: '#2a1a00',
    borderRadius: Radius.sm, marginBottom: Spacing.lg, overflow: 'hidden',
  },
  codeSectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md },
  codeSectionTitle: { flex: 1, color: Colors.emberGlow, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 1.5 },
  codeForm: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  codeHint: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: Typography.xs * 1.6 },
  codeInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 4, textAlign: 'center',
  },
  codeBtn: { borderRadius: Radius.sm, overflow: 'hidden' },
  codeBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  codeBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },

  // Architect
  architectBtn: { borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderGlow, marginBottom: Spacing.lg },
  architectBtnInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  architectBtnTitle: { color: Colors.crimson, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  architectBtnSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },

  // Nav
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  navRowText: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 1 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingVertical: 16, marginTop: Spacing.sm,
  },
  logoutText: { color: Colors.crimson, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },
});
