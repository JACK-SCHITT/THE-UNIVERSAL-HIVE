import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PressableScale } from '../ui/PressableScale';
import { explainFile } from '../../services/explainService';
import { ExplainResult, ExplainSection } from '../../services/types';

interface Props {
  content: string;
  fileType: string;
  filename: string;
}

const SectionCard = memo(function SectionCard({ section, idx }: { section: ExplainSection; idx: number }) {
  const [expanded, setExpanded] = useState(idx < 2);
  const rotation = useSharedValue(idx < 2 ? 180 : 0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = useCallback(() => {
    setExpanded(prev => {
      rotation.value = withSpring(prev ? 0 : 180, { damping: 12 });
      return !prev;
    });
  }, []);

  return (
    <GlassCard style={styles.sectionCard} padding={0}>
      <Pressable style={styles.sectionHeader} onPress={toggle}>
        <MaterialIcons name={section.icon as any} size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Animated.View style={animStyle}>
          <MaterialIcons name="expand-more" size={20} color={Colors.textSecondary} />
        </Animated.View>
      </Pressable>
      {expanded && (
        <View style={styles.sectionBody}>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      )}
    </GlassCard>
  );
});

function ComplexityBadge({ level }: { level: string }) {
  const color = level === 'Simple' ? Colors.success : level === 'Moderate' ? Colors.warning : Colors.error;
  return (
    <View style={[styles.badge, { borderColor: `${color}66`, backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{level}</Text>
    </View>
  );
}

export const ExplainPanel = memo(function ExplainPanel({ content, fileType, filename }: Props) {
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = useCallback(() => {
    if (result) { setVisible(true); return; }
    setLoading(true);
    setVisible(true);
    setTimeout(() => {
      try {
        const res = explainFile(content, fileType, filename);
        setResult(res);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [content, fileType, filename, result]);

  return (
    <>
      <PressableScale onPress={handleExplain} style={styles.trigger}>
        <View style={styles.triggerInner}>
          <MaterialIcons name="auto-awesome" size={18} color={Colors.background} />
          <Text style={styles.triggerText}>Explain in English</Text>
        </View>
      </PressableScale>

      {visible && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <MaterialIcons name="auto-awesome" size={20} color={Colors.primary} />
              <Text style={styles.panelTitle}>Human-Readable Explanation</Text>
            </View>
            <Pressable onPress={() => setVisible(false)} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Analyzing file...</Text>
            </View>
          ) : result ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Summary */}
              <GlassCard style={styles.summaryCard} elevated>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>{result.summary}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{result.language}</Text>
                    <Text style={styles.statLabel}>Language</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{result.linesOfCode.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Lines</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <ComplexityBadge level={result.complexity} />
                    <Text style={styles.statLabel}>Complexity</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Sections */}
              <Text style={styles.sectionsLabel}>Detailed Breakdown</Text>
              {result.sections.map((sec, idx) => (
                <SectionCard key={idx} section={sec} idx={idx} />
              ))}

              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          ) : (
            <Text style={styles.errorText}>Could not analyze this file.</Text>
          )}
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  trigger: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  triggerText: {
    color: Colors.background,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  panel: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 80,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
  },
  summaryCard: {
    margin: Spacing.md,
  },
  summaryRow: {
    marginBottom: Spacing.md,
  },
  summaryText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.surfaceBorder,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  sectionsLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  sectionBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
  },
  sectionContent: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.base,
    padding: Spacing.lg,
  },
});
