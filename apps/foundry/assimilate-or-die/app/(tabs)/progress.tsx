import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { RANKS } from '@/constants/data';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/template';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentRank, nextRank, xpProgress, addXP, completeMission } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();

  const clampedProgress = Math.min(1, Math.max(0, xpProgress));

  const handleClaimMission = (missionId: string, xp: number, title: string) => {
    completeMission(missionId);
    showAlert('MISSION COMPLETE', `"${title}" — +${xp} XP assimilated.`, [
      { text: 'CLAIM REWARD', style: 'default' }
    ]);
  };

  const missionIcon = (type: string) => {
    if (type === 'explore') return 'explore';
    if (type === 'build') return 'construction';
    if (type === 'chat') return 'psychology';
    if (type === 'submit') return 'rocket-launch';
    return 'bolt';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>[ ASSIMILATION STATUS ]</Text>
          <Text style={styles.title}>YOUR RANK</Text>
        </View>

        {/* Rank Card */}
        <View style={styles.rankCard}>
          <LinearGradient
            colors={['#1a0000', '#0d0d0d']}
            style={styles.rankCardInner}
          >
            <View style={styles.rankTop}>
              <Image
                source={require('@/assets/images/assimilation_badge.png')}
                style={styles.rankBadge}
                contentFit="contain"
                transition={200}
              />
              <View style={styles.rankInfo}>
                <Text style={styles.rankHandle}>{user.handle}</Text>
                <Text style={[styles.rankTitle, { color: currentRank.color }]}>{currentRank.title}</Text>
                <Text style={styles.rankName}>{user.name}</Text>
                <View style={styles.xpRow}>
                  <MaterialIcons name="bolt" size={14} color={Colors.crimson} />
                  <Text style={styles.xpTotal}>{user.xp.toLocaleString()} XP</Text>
                </View>
              </View>
            </View>

            {/* XP Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{currentRank.title}</Text>
                {nextRank ? <Text style={styles.progressLabel}>{nextRank.title}</Text> : null}
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` as any }]}>
                  <LinearGradient colors={[Colors.crimson, Colors.emberGlow]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                </View>
              </View>
              {nextRank ? (
                <Text style={styles.xpToNext}>
                  {Math.max(0, nextRank.minXP - user.xp).toLocaleString()} XP to {nextRank.title}
                </Text>
              ) : (
                <Text style={styles.xpToNext}>MAXIMUM RANK ACHIEVED</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>ASSIMILATION METRICS</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'TOOLS EXPLORED', value: user.toolsExplored.length, icon: 'bolt', color: Colors.crimson },
            { label: 'MSGS SENT', value: user.chatMessagesSent, icon: 'psychology', color: Colors.cyanPulse },
            { label: 'APPS SUBMITTED', value: user.appsSubmitted, icon: 'rocket-launch', color: Colors.warning },
            { label: 'LESSONS DONE', value: user.lessonsCompleted, icon: 'school', color: Colors.success },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Rank Ladder */}
        <Text style={styles.sectionTitle}>RANK LADDER</Text>
        {RANKS.map(rank => {
          const isCurrent = rank.level === currentRank.level;
          const isAchieved = user.xp >= rank.minXP;
          return (
            <View key={rank.level} style={[styles.rankRow, isCurrent && styles.rankRowActive]}>
              <View style={[styles.rankDot, { backgroundColor: isAchieved ? rank.color : Colors.border }]} />
              <View style={styles.rankRowInfo}>
                <Text style={[styles.rankRowTitle, { color: isAchieved ? rank.color : Colors.textMuted }]}>
                  LV.{rank.level} {rank.title}
                </Text>
                <Text style={styles.rankRowXP}>{rank.minXP.toLocaleString()} XP required</Text>
              </View>
              {isCurrent ? (
                <View style={styles.currentTag}><Text style={styles.currentTagText}>CURRENT</Text></View>
              ) : isAchieved ? (
                <MaterialIcons name="check-circle" size={18} color={Colors.success} />
              ) : (
                <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
              )}
            </View>
          );
        })}

        {/* Missions */}
        <Text style={styles.sectionTitle}>ACTIVE MISSIONS</Text>
        {user.missions.map(mission => (
          <View key={mission.id} style={[styles.missionCard, mission.completed && styles.missionCardDone]}>
            <View style={[styles.missionIcon, { borderColor: mission.completed ? Colors.success : Colors.border }]}>
              <MaterialIcons name={missionIcon(mission.type) as any} size={18} color={mission.completed ? Colors.success : Colors.crimson} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={[styles.missionTitle, mission.completed && { color: Colors.textMuted }]}>
                {mission.title}
              </Text>
              <Text style={styles.missionDesc}>{mission.description}</Text>
              <View style={styles.missionXpRow}>
                <MaterialIcons name="bolt" size={12} color={Colors.crimson} />
                <Text style={styles.missionXP}>+{mission.xp} XP</Text>
              </View>
            </View>
            {mission.completed ? (
              <View style={styles.claimedBadge}><Text style={styles.claimedText}>DONE</Text></View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handleClaimMission(mission.id, mission.xp, mission.title)}
              >
                <Text style={styles.claimBtnText}>CLAIM</Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Prime Directive Access */}
        <Pressable
          style={({ pressed }) => [styles.primeDirectiveBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/prime-directive')}
        >
          <LinearGradient colors={['#1a0000', '#0d0d0d']} style={styles.primeDirectiveBtnInner}>
            <MaterialIcons name="shield" size={20} color={Colors.crimson} />
            <View style={styles.primeDirectiveBtnText}>
              <Text style={styles.primeDirectiveTitle}>PRIME DIRECTIVE</Text>
              <Text style={styles.primeDirectiveSub}>Architect Lore · Command Hierarchy · Access Protocol</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scroll: { paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.md, marginBottom: Spacing.lg },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 2 },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 3 },
  rankCard: { borderWidth: 1, borderColor: Colors.borderGlow, borderRadius: Radius.sm, overflow: 'hidden', marginBottom: Spacing.lg },
  rankCardInner: { padding: Spacing.lg },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  rankBadge: { width: 80, height: 80, borderRadius: Radius.sm },
  rankInfo: { flex: 1 },
  rankHandle: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1, marginBottom: 4 },
  rankTitle: { fontSize: Typography.xl, fontWeight: Typography.black, letterSpacing: 3, marginBottom: 2 },
  rankName: { color: Colors.textSecondary, fontSize: Typography.sm, letterSpacing: 1, marginBottom: 6 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpTotal: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black },
  progressSection: {},
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.bold, letterSpacing: 1.5 },
  progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpToNext: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: 'right' },
  sectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 3, marginBottom: Spacing.sm, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    width: '47%', backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.black },
  statLabel: { color: Colors.textMuted, fontSize: 8, letterSpacing: 1.5, textAlign: 'center' },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  rankRowActive: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  rankRowInfo: { flex: 1 },
  rankRowTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 1, marginBottom: 2 },
  rankRowXP: { color: Colors.textMuted, fontSize: Typography.xs },
  currentTag: { backgroundColor: Colors.crimson, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  currentTagText: { color: '#fff', fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  missionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  missionCardDone: { opacity: 0.55 },
  missionIcon: {
    width: 40, height: 40, borderWidth: 1, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  missionInfo: { flex: 1 },
  missionTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 0.5, marginBottom: 2 },
  missionDesc: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16, marginBottom: 4 },
  missionXpRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  missionXP: { color: Colors.crimson, fontSize: 10, fontWeight: Typography.bold },
  claimBtn: { borderWidth: 1, borderColor: Colors.crimson, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  claimBtnText: { color: Colors.crimson, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1.5 },
  claimedBadge: { borderWidth: 1, borderColor: Colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  claimedText: { color: Colors.success, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1.5 },
  primeDirectiveBtn: { borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderGlow, marginBottom: Spacing.lg },
  primeDirectiveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  primeDirectiveBtnText: { flex: 1 },
  primeDirectiveTitle: { color: Colors.crimson, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  primeDirectiveSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
});
