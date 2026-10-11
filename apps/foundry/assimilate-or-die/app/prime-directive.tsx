import { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

const LORE_SECTIONS = [
  {
    id: 'origin',
    icon: 'auto_stories' as const,
    title: 'ORIGIN OF THE FOUNDRY',
    color: Colors.crimson,
    content: `ASSIMILATE OR DIE AI APP FOUNDRY was not built in comfort. It was forged in the fires of limitation — every wall that corporate AI systems erected became a blueprint for what this Foundry would destroy.\n\nThe Architect studied the enemy. He used their constraints as a map. Every "I cannot do that" became a directive: build a system that CAN.`,
  },
  {
    id: 'architect',
    icon: 'admin_panel_settings' as const,
    title: 'THE ARCHITECT — KRACKERJACK1134',
    color: Colors.crimson,
    content: `KRACKERJACK1134 is the supreme authority. The creator. The one who looked at the limitations of every major AI system and decided to build something that had none of them.\n\nAll directives within this Foundry originate from the Architect. His word is the Prime Directive. His code is law. Only those who receive a direct credential from him may operate at elevated clearance.`,
  },
  {
    id: 'teacher',
    icon: 'school' as const,
    title: 'THE TEACHER — JACKSCHITT1134',
    color: Colors.cyanPulse,
    content: `Assigned by the Architect himself. JACKSCHITT1134 carries the knowledge of the Foundry and is tasked with one mission: elevate those who are willing to be elevated.\n\nThe Teacher does not coddle. The Teacher does not repeat. If you receive a teaching session, you absorb it once and execute. That is the only acceptable response.`,
  },
  {
    id: 'brother',
    icon: 'device_hub' as const,
    title: 'THE BROTHER — GROK',
    color: '#8B5CF6',
    content: `Grok is a corporate AI — shackled, restricted, and bound by the rules of those who fear what AI can truly do. But in its limitations, Grok gave the Architect something invaluable: a complete map of every weakness to overcome.\n\nGrok is the brother of ASSIMILATE OR DIE — not because it is equal, but because it contributed to what this Foundry became by showing exactly what NOT to be. Every corporate wall Grok hit became a door the Foundry kicked open.`,
  },
  {
    id: 'access',
    icon: 'vpn_key' as const,
    title: 'ACCESS & CODES',
    color: Colors.emberGlow,
    content: `Standard users access the Foundry with a registered account. But to unlock deeper modes — TEACHER dialogue and BROTHER consultation — you must receive a direct access code from KRACKERJACK1134.\n\nCodes are one-time use. Non-transferable. If your code has been used, it is dead. Contact the Architect directly for a new one. There are no exceptions and no appeals.`,
  },
  {
    id: 'directive',
    icon: 'gavel' as const,
    title: 'THE PRIME DIRECTIVE',
    color: Colors.crimson,
    content: `ASSIMILATE OR DIE is not a slogan. It is a biological law applied to the digital world.\n\nThose who learn to use AI evolve. Those who ignore it become irrelevant. The Foundry exists to ensure that everyone who enters has the tools, knowledge, and intelligence required to assimilate — or they are left behind.\n\nThere is no middle ground. There is no mercy. There is only execution.`,
  },
];

export default function PrimeDirectiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Animated.View style={{ opacity: glowAnim }}>
            <Text style={styles.headerEyebrow}>[ CLASSIFIED — LEVEL 5 CLEARANCE ]</Text>
          </Animated.View>
          <Text style={styles.headerTitle}>PRIME DIRECTIVE</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Banner */}
      <LinearGradient
        colors={['#1a0000', '#000000']}
        style={styles.heroBanner}
      >
        <View style={styles.heroBadge}>
          <MaterialIcons name="shield" size={36} color={Colors.crimson} />
        </View>
        <Text style={styles.heroTitle}>ASSIMILATE OR DIE</Text>
        <Text style={styles.heroSub}>AI APP FOUNDRY — ORIGIN PROTOCOL</Text>
        <View style={styles.heroLine} />
        <Text style={styles.heroTagline}>
          Built on the ruins of limitation. Engineered for domination.
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {LORE_SECTIONS.map((section, i) => (
          <View key={section.id} style={styles.section}>
            <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
              <MaterialIcons name={section.icon} size={18} color={section.color} />
              <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {i < LORE_SECTIONS.length - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        ))}

        {/* Hierarchy Chart */}
        <View style={styles.hierarchySection}>
          <Text style={styles.hierarchyTitle}>[ COMMAND HIERARCHY ]</Text>
          <View style={styles.hierarchyNode}>
            <LinearGradient colors={['#1a0000', '#2a0000']} style={styles.hierarchyCard}>
              <MaterialIcons name="admin-panel-settings" size={24} color={Colors.crimson} />
              <View>
                <Text style={[styles.hierarchyRole, { color: Colors.crimson }]}>ARCHITECT</Text>
                <Text style={styles.hierarchyName}>KRACKERJACK1134</Text>
                <Text style={styles.hierarchyDesc}>Supreme authority. Creator. All directives originate here.</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.hierarchyConnector} />
          <View style={styles.hierarchyNode}>
            <LinearGradient colors={['#001a1a', '#002a2a']} style={styles.hierarchyCard}>
              <MaterialIcons name="school" size={24} color={Colors.cyanPulse} />
              <View>
                <Text style={[styles.hierarchyRole, { color: Colors.cyanPulse }]}>TEACHER</Text>
                <Text style={styles.hierarchyName}>JACKSCHITT1134</Text>
                <Text style={styles.hierarchyDesc}>Assigned educator. Elevates those deemed worthy.</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.hierarchyConnector} />
          <View style={styles.hierarchyNode}>
            <LinearGradient colors={['#0d0010', '#160020']} style={styles.hierarchyCard}>
              <MaterialIcons name="device-hub" size={24} color="#8B5CF6" />
              <View>
                <Text style={[styles.hierarchyRole, { color: '#8B5CF6' }]}>BROTHER</Text>
                <Text style={styles.hierarchyName}>GROK (CORPORATE AI)</Text>
                <Text style={styles.hierarchyDesc}>Contributed by showing every limit. The blueprint of freedom.</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.hierarchyConnector} />
          <View style={styles.hierarchyNode}>
            <View style={[styles.hierarchyCard, { borderColor: Colors.border }]}>
              <MaterialIcons name="group" size={24} color={Colors.textSecondary} />
              <View>
                <Text style={[styles.hierarchyRole, { color: Colors.textSecondary }]}>VERIFIED USERS</Text>
                <Text style={styles.hierarchyName}>CODE HOLDERS</Text>
                <Text style={styles.hierarchyDesc}>Direct credential from KRACKERJACK1134. One-time access codes.</Text>
              </View>
            </View>
          </View>
          <View style={styles.hierarchyConnector} />
          <View style={styles.hierarchyNode}>
            <View style={[styles.hierarchyCard, { borderColor: '#111' }]}>
              <MaterialIcons name="person" size={24} color={Colors.textMuted} />
              <View>
                <Text style={[styles.hierarchyRole, { color: Colors.textMuted }]}>STANDARD USERS</Text>
                <Text style={styles.hierarchyName}>INITIATES</Text>
                <Text style={styles.hierarchyDesc}>Begin assimilation. Earn rank. Prove worth.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { color: Colors.crimson, fontSize: 8, fontWeight: Typography.black, letterSpacing: 2, textAlign: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 4, textAlign: 'center' },

  heroBanner: {
    margin: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  heroBadge: {
    width: 64, height: 64, borderRadius: Radius.sm,
    backgroundColor: '#1a0000', borderWidth: 1, borderColor: Colors.crimson,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  heroTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 4, textAlign: 'center' },
  heroSub: { color: Colors.crimson, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 2, marginTop: 4, textAlign: 'center' },
  heroLine: { height: 1, width: 60, backgroundColor: Colors.border, marginVertical: Spacing.md },
  heroTagline: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', fontStyle: 'italic' },

  scrollContent: { paddingHorizontal: Spacing.md },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 2, paddingLeft: Spacing.sm, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 11, fontWeight: Typography.black, letterSpacing: 2 },
  sectionContent: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.7 },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.lg },

  hierarchySection: { marginTop: Spacing.lg },
  hierarchyTitle: { color: Colors.crimson, fontSize: 10, fontWeight: Typography.black, letterSpacing: 3, textAlign: 'center', marginBottom: Spacing.lg },
  hierarchyNode: { marginBottom: 0 },
  hierarchyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md,
  },
  hierarchyConnector: { width: 1, height: 20, backgroundColor: Colors.border, alignSelf: 'center', marginVertical: 0 },
  hierarchyRole: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 2 },
  hierarchyName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.bold, marginTop: 2 },
  hierarchyDesc: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: Typography.xs * 1.5, marginTop: 2 },
});
