import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { AI_TOOLS } from '@/constants/data';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/template';

const TIER_DETAILS: Record<string, { color: string; gradient: string[] }> = {
  APEX: { color: Colors.crimson, gradient: ['#1a0000', '#0d0d0d'] },
  ADVANCED: { color: Colors.cyanPulse, gradient: ['#001a1a', '#0d0d0d'] },
  CORE: { color: Colors.textSecondary, gradient: ['#111', '#0d0d0d'] },
};

export default function ToolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markToolExplored, addXP, user } = useApp();
  const { showAlert } = useAlert();

  const tool = AI_TOOLS.find(t => t.id === id);
  if (!tool) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>TOOL NOT FOUND</Text>
      </View>
    );
  }

  const tierStyle = TIER_DETAILS[tool.tier];
  const alreadyExplored = user.toolsExplored.includes(tool.id);

  const handleLaunch = () => {
    if (!alreadyExplored) {
      markToolExplored(tool.id);
      addXP(25);
      showAlert('TOOL ACTIVATED', `${tool.name} assimilated into your arsenal. +25 XP earned.`, [
        { text: 'DOMINATE', style: 'default' }
      ]);
    } else {
      showAlert('ALREADY ASSIMILATED', `${tool.name} is already in your arsenal.`, [
        { text: 'OK', style: 'cancel' }
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        <Text style={styles.backText}>FOUNDRY</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient colors={tierStyle.gradient} style={styles.hero}>
          <View style={[styles.tierBadge, { borderColor: tierStyle.color }]}>
            <Text style={[styles.tierText, { color: tierStyle.color }]}>{tool.tier} TIER</Text>
          </View>
          {tool.isNew ? (
            <View style={styles.newBadge}><Text style={styles.newText}>NEW</Text></View>
          ) : null}
          <Text style={[styles.toolName, { color: tool.tier === 'APEX' ? Colors.crimson : Colors.textPrimary }]}>
            {tool.name}
          </Text>
          <Text style={styles.category}>{tool.category}</Text>

          {/* Power Meter */}
          <View style={styles.powerSection}>
            <Text style={styles.powerLabel}>POWER RATING</Text>
            <View style={styles.powerTrack}>
              <View style={[styles.powerFill, { width: `${tool.power}%` as any }]}>
                <LinearGradient
                  colors={tool.tier === 'APEX' ? [Colors.crimson, Colors.emberGlow] : [tierStyle.color, '#007a7a']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            <Text style={[styles.powerValue, { color: tierStyle.color }]}>{tool.power}/100</Text>
          </View>
        </LinearGradient>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
          <Text style={styles.desc}>{tool.description}</Text>
          <Text style={styles.desc}>
            {tool.name} is a {tool.tier.toLowerCase()}-tier AI tool in the Foundry arsenal. Deploy it to gain an unfair advantage in {tool.category.toLowerCase()}, eliminate manual bottlenecks, and force your output to a level that makes competition irrelevant.
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAPABILITIES</Text>
          <View style={styles.tagGrid}>
            {tool.tags.map(tag => (
              <View key={tag} style={[styles.tag, { borderColor: tierStyle.color }]}>
                <MaterialIcons name="check" size={12} color={tierStyle.color} />
                <Text style={[styles.tagText, { color: tierStyle.color }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Use Cases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW TO DEPLOY</Text>
          {[
            `Use ${tool.name} as the first step in your AI workflow to set the foundation.`,
            `Chain the output of ${tool.name} into your next tool for compounding results.`,
            `Iterate on ${tool.name}'s output at least 3 times — first draft is never final.`,
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipNum, { borderColor: tierStyle.color }]}>
                <Text style={[styles.tipNumText, { color: tierStyle.color }]}>{i + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* XP Info */}
        <View style={[styles.xpBanner, { borderColor: alreadyExplored ? Colors.success : Colors.border }]}>
          <MaterialIcons
            name={alreadyExplored ? 'check-circle' : 'bolt'}
            size={20}
            color={alreadyExplored ? Colors.success : Colors.crimson}
          />
          <Text style={styles.xpBannerText}>
            {alreadyExplored ? 'TOOL ALREADY ASSIMILATED' : 'Activate this tool to earn +25 XP and add it to your arsenal'}
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={handleLaunch}
        >
          <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.ctaGradient}>
            <MaterialIcons name="bolt" size={20} color="#fff" />
            <Text style={styles.ctaText}>{alreadyExplored ? 'ALREADY ASSIMILATED' : 'ACTIVATE TOOL — +25 XP'}</Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  notFound: { color: Colors.crimson, fontSize: Typography.lg, textAlign: 'center', marginTop: 100, letterSpacing: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backText: { color: Colors.textSecondary, fontSize: Typography.sm, letterSpacing: 1 },
  scroll: { paddingHorizontal: Spacing.md },
  hero: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  tierBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', borderRadius: 2, marginBottom: Spacing.sm },
  tierText: { fontSize: 10, fontWeight: Typography.black, letterSpacing: 2 },
  newBadge: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, backgroundColor: Colors.crimson, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  newText: { color: '#fff', fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  toolName: { fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 3, marginBottom: 4, textShadowColor: Colors.crimson, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  category: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2, marginBottom: Spacing.lg },
  powerSection: {},
  powerLabel: { color: Colors.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  powerTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  powerFill: { height: 8, borderRadius: 4, overflow: 'hidden' },
  powerValue: { fontSize: Typography.sm, fontWeight: Typography.black, textAlign: 'right' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 3, marginBottom: Spacing.sm },
  desc: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.7, marginBottom: Spacing.sm },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  tagText: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipNum: { width: 28, height: 28, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipNumText: { fontSize: Typography.xs, fontWeight: Typography.black },
  tipText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.6 },
  xpBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.md,
    backgroundColor: '#0d0d0d', marginBottom: Spacing.md,
  },
  xpBannerText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.5 },
  cta: { borderRadius: Radius.sm, overflow: 'hidden', marginBottom: Spacing.sm },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  ctaText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },
});
