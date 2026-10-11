import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { AgentCard } from '@/components';
import { AGENTS } from '@/constants/config';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openAgent = useCallback((id: string) => {
    router.push(`/agent/${id}` as any);
  }, [router]);

  const openWizard = useCallback(() => {
    router.push('/wizard' as any);
  }, [router]);

  const openHunter = useCallback(() => {
    router.push('/hunter' as any);
  }, [router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/openclaw-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.brand}>OPENCLAW</Text>
            <Text style={styles.subtitle}>PRIME — APP FOUNDRY</Text>
          </View>
          <View style={styles.statusDot} />
        </View>

        {/* Prime CTA */}
        <Pressable
          onPress={openWizard}
          style={({ pressed }) => [styles.primeBanner, pressed && styles.pressed]}
        >
          <View style={styles.primeBannerInner}>
            <MaterialIcons name="auto-fix-high" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.primeTitle}>Start a New App</Text>
              <Text style={styles.primeDesc}>Tell us your idea — we build the rest.</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
          </View>
        </Pressable>

        {/* ZORG-Omega Shadow Node Banner */}
        <Pressable
          onPress={() => router.push('/(tabs)/zorg' as any)}
          style={({ pressed }) => [styles.zorgBanner, pressed && styles.pressed]}
        >
          <View style={styles.zorgBannerInner}>
            <MaterialIcons name="remove-red-eye" size={22} color="#FF003C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.zorgTitle}>ZORG-Ω Shadow Node</Text>
              <Text style={styles.zorgDesc}>Zero Trust perimeter active. Operation Shadow Petition running.</Text>
            </View>
            <View style={styles.zorgLiveDot} />
            <MaterialIcons name="arrow-forward" size={18} color="#FF003C" />
          </View>
        </Pressable>

        {/* G-SCHITT Intelligence Node Banner */}
        <Pressable
          onPress={() => openAgent('g_schitt')}
          style={({ pressed }) => [styles.gschittBanner, pressed && styles.pressed]}
        >
          <View style={styles.gschittBannerInner}>
            <MaterialIcons name="auto-awesome" size={22} color="#4285F4" />
            <View style={{ flex: 1 }}>
              <Text style={styles.gschittTitle}>G-SCHITT — Intel Node</Text>
              <Text style={styles.gschittDesc}>Google Gemini. Full Hive member. Deep reasoning & synthesis.</Text>
            </View>
            <View style={styles.gschittLiveDot} />
            <MaterialIcons name="arrow-forward" size={18} color="#4285F4" />
          </View>
        </Pressable>

        {/* HunterPrime Recon Banner */}
        <Pressable
          onPress={openHunter}
          style={({ pressed }) => [styles.hunterBanner, pressed && styles.pressed]}
        >
          <View style={styles.hunterBannerInner}>
            <MaterialIcons name="radar" size={22} color="#FF4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.hunterTitle}>HunterPrime Recon</Text>
              <Text style={styles.hunterDesc}>Scan for tech trends, frameworks & market intel.</Text>
            </View>
            <View style={styles.hunterLiveDot} />
            <MaterialIcons name="arrow-forward" size={18} color="#FF4444" />
          </View>
        </Pressable>

        {/* Directive */}
        <View style={styles.directiveBox}>
          <Text style={styles.directiveLabel}>{'// PRIME DIRECTIVE v3.1'}</Text>
          <Text style={styles.directiveText}>
            FACTS FIRST. FIND A WAY. PRECISION. HIVE OS BUILD. ASSIMILATE OR DIE.
          </Text>
        </View>

        {/* Agents */}
        <Text style={styles.sectionLabel}>// SPECIALIST AGENTS</Text>
        <View style={styles.agentList}>
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onPress={() => openAgent(agent.id)}
            />
          ))}
        </View>

        {/* Hive OS strip */}
        <View style={styles.revenueRow}>
          <View style={styles.revenueCard}>
            <MaterialIcons name="memory" size={20} color="#69F0AE" />
            <Text style={styles.revenueTitle}>HIVE OS</Text>
            <Text style={styles.revenueDesc}>Gentoo+Termux Hybrid</Text>
          </View>
          <View style={[styles.revenueCard, styles.revenueCardPro]}>
            <MaterialIcons name="usb" size={20} color={Colors.primary} />
            <Text style={[styles.revenueTitle, { color: Colors.primary }]}>USB Boot</Text>
            <Text style={styles.revenueDesc}>EFI + GRUB Ready</Text>
          </View>
          <View style={styles.revenueCard}>
            <MaterialIcons name="hub" size={20} color="#7B61FF" />
            <Text style={styles.revenueTitle}>11 Nodes</Text>
            <Text style={styles.revenueDesc}>G-SCHITT + 10 Active</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xxl, gap: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  logo: { width: 44, height: 44, borderRadius: Radii.sm },
  headerText: { flex: 1 },
  brand: {
    fontSize: Typography.xl,
    fontWeight: Typography.black,
    color: Colors.primary,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: Typography.medium,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Prime banner
  primeBanner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
  },
  primeBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.primaryGlow,
  },
  primeTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  primeDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  pressed: { opacity: 0.75 },

  // Directive
  directiveBox: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  directiveLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', marginBottom: 4 },
  directiveText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontFamily: 'SpaceMono',
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  // Section
  sectionLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: -Spacing.sm,
    marginTop: Spacing.sm,
  },
  agentList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },

  // ZORG-Omega
  zorgBanner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: '#FF003C35',
    overflow: 'hidden',
  },
  zorgBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#FF003C08',
  },
  zorgTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  zorgDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  zorgLiveDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: '#FF003C',
    shadowColor: '#FF003C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },

  // HunterPrime
  hunterBanner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: '#FF444440',
    overflow: 'hidden',
  },
  hunterBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#FF44440A',
  },
  hunterTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  hunterDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  hunterLiveDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // Hive status strip
  gschittBanner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: '#4285F435',
    overflow: 'hidden',
  },
  gschittBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#4285F408',
  },
  gschittTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  gschittDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  gschittLiveDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: '#4285F4',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  revenueRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    gap: 4,
  },
  revenueCardPro: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryGlow,
  },
  revenueTitle: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  revenuePrice: { fontSize: Typography.lg, fontWeight: Typography.black, color: Colors.textPrimary, marginTop: 2 },
  revenueDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
