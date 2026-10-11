import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { LEARN_MODULES } from '@/constants/data';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/template';

const LEVEL_COLORS: Record<string, string> = {
  CORE: Colors.textSecondary,
  ADVANCED: Colors.cyanPulse,
  APEX: Colors.crimson,
};

export default function BuildScreen() {
  const insets = useSafeAreaInsets();
  const { addXP, completeLesson, user } = useApp();
  const { showAlert } = useAlert();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartLesson = (moduleId: string, title: string) => {
    completeLesson();
    addXP(50);
    showAlert('LESSON INITIATED', `"${title}" — Knowledge assimilated. +50 XP earned.`, [
      { text: 'CONTINUE', style: 'default' }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>[ KNOWLEDGE BASE ]</Text>
          <Text style={styles.title}>BUILD {'&'} LEARN</Text>
          <Text style={styles.subtitle}>Master AI. Build faster. Dominate your market.</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>LESSONS DONE</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.cyanFaint }]}>
            <Text style={[styles.statValue, { color: Colors.cyanPulse }]}>{user.lessonsCompleted * 50}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{LEARN_MODULES.length}</Text>
            <Text style={styles.statLabel}>MODULES</Text>
          </View>
        </View>

        {/* Quick Tactics */}
        <Text style={styles.sectionTitle}>QUICK TACTICS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tacticsScroll}>
          {[
            { icon: 'flash-on', title: 'Chain Prompts', desc: 'Use output of one prompt as input for the next' },
            { icon: 'tune', title: 'Role Assignment', desc: 'Tell AI: "You are a senior [expert]..."' },
            { icon: 'repeat', title: 'Iterate Fast', desc: 'First draft is never final. Refine 3x minimum' },
            { icon: 'grid-view', title: 'Modular Apps', desc: 'Build one feature at a time, test each module' },
          ].map(tactic => (
            <View key={tactic.title} style={styles.tacticCard}>
              <MaterialIcons name={tactic.icon as any} size={24} color={Colors.crimson} />
              <Text style={styles.tacticTitle}>{tactic.title}</Text>
              <Text style={styles.tacticDesc}>{tactic.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Learning Modules */}
        <Text style={styles.sectionTitle}>LEARNING MODULES</Text>
        {LEARN_MODULES.map(mod => {
          const isExpanded = expandedId === mod.id;
          const levelColor = LEVEL_COLORS[mod.level] || Colors.textSecondary;
          return (
            <View key={mod.id} style={styles.moduleCard}>
              <Pressable
                style={styles.moduleHeader}
                onPress={() => setExpandedId(isExpanded ? null : mod.id)}
              >
                <View style={[styles.moduleIcon, { borderColor: levelColor }]}>
                  <MaterialIcons name={mod.icon as any} size={22} color={levelColor} />
                </View>
                <View style={styles.moduleInfo}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <View style={[styles.levelBadge, { borderColor: levelColor }]}>
                      <Text style={[styles.levelText, { color: levelColor }]}>{mod.level}</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
                  <View style={styles.moduleMeta}>
                    <Text style={styles.metaText}>{mod.lessons} lessons</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>{mod.duration}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>+50 XP/lesson</Text>
                  </View>
                </View>
                <MaterialIcons
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={22}
                  color={Colors.textMuted}
                />
              </Pressable>

              {isExpanded ? (
                <View style={styles.moduleExpanded}>
                  <View style={styles.divider} />
                  {Array.from({ length: Math.min(mod.lessons, 4) }).map((_, i) => (
                    <View key={i} style={styles.lessonRow}>
                      <View style={styles.lessonNum}>
                        <Text style={styles.lessonNumText}>{String(i + 1).padStart(2, '0')}</Text>
                      </View>
                      <Text style={styles.lessonTitle}>
                        {['Introduction & Core Concepts', 'Deep Dive: Advanced Techniques', 'Real-World Application', 'Capstone Project'][i]}
                      </Text>
                    </View>
                  ))}
                  {mod.lessons > 4 ? (
                    <Text style={styles.moreText}>+ {mod.lessons - 4} more lessons inside</Text>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => handleStartLesson(mod.id, mod.title)}
                  >
                    <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.startGradient}>
                      <Text style={styles.startText}>START MODULE — +50 XP</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scroll: { paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.md, marginBottom: Spacing.lg },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 4 },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 3, marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sm, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised, padding: Spacing.sm,
    borderRadius: Radius.sm, alignItems: 'center',
  },
  statValue: { color: Colors.crimson, fontSize: Typography.xl, fontWeight: Typography.black },
  statLabel: { color: Colors.textMuted, fontSize: 9, letterSpacing: 1, marginTop: 2 },
  sectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 3, marginBottom: Spacing.sm, marginTop: 4 },
  tacticsScroll: { gap: Spacing.sm, paddingRight: Spacing.md, marginBottom: Spacing.lg },
  tacticCard: {
    width: 150, backgroundColor: Colors.surfaceRaised, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, gap: 6,
  },
  tacticTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.bold },
  tacticDesc: { color: Colors.textSecondary, fontSize: Typography.xs, lineHeight: 16 },
  moduleCard: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.sm, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  moduleIcon: {
    width: 44, height: 44, borderWidth: 1, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  moduleInfo: { flex: 1 },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  moduleTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 1, flex: 1 },
  levelBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2 },
  levelText: { fontSize: 8, fontWeight: Typography.black, letterSpacing: 1.5 },
  moduleSubtitle: { color: Colors.textSecondary, fontSize: Typography.xs, marginBottom: 4 },
  moduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: 9 },
  metaDot: { color: Colors.textMuted, fontSize: 9 },
  moduleExpanded: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  lessonNum: { width: 28, height: 28, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold },
  lessonTitle: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
  moreText: { color: Colors.textMuted, fontSize: Typography.xs, marginBottom: Spacing.md, letterSpacing: 0.5 },
  startBtn: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: 4 },
  startGradient: { paddingVertical: 14, alignItems: 'center' },
  startText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
});
