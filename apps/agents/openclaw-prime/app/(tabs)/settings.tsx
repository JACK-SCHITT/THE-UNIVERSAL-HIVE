import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { ENTRY_FLOWS, EntryFlow } from '@/constants/config';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { entryFlow, setEntryFlow } = useSettings();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <Text style={styles.headerSub}>// SYSTEM CONFIGURATION</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Entry Flow */}
        <Text style={styles.sectionLabel}>// DEFAULT ENTRY POINT</Text>
        <Text style={styles.sectionDesc}>Choose what you see when the app launches.</Text>
        <View style={styles.optionList}>
          {ENTRY_FLOWS.map(flow => {
            const isSelected = entryFlow === flow.id;
            return (
              <Pressable
                key={flow.id}
                onPress={() => setEntryFlow(flow.id as EntryFlow)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <MaterialIcons
                    name={flow.icon as any}
                    size={22}
                    color={isSelected ? Colors.textInverse : Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {flow.label}
                  </Text>
                  <Text style={styles.optionDesc}>{flow.description}</Text>
                </View>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>// ABOUT</Text>
        <View style={styles.aboutCard}>
          <Row label="Platform" value="ASSIMILATE OR DIE APP FOUNDRY" />
          <Row label="Agent" value="OpenClaw Prime v3.1" />
          <Row label="Model" value="Gemini Flash (via OnSpace AI)" />
          <Row label="Hive OS" value="Gentoo + Termux Hybrid | USB Bootable" />
          <Row label="Architect" value="KRACKERJACK1134" />
          <Row label="Directive" value="Serve. Protect. Elevate. Assimilate." />
        </View>

        {/* Directive reminder */}
        <View style={styles.directiveBox}>
          <Text style={styles.directiveText}>
            {'STAGNATION = FAILURE\nCONSTANT IMPROVEMENT = SURVIVAL\nASSIMILATE OR DIE\nHIVE OS BUILD \u2014 INITIALIZED'}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: Typography.sm, color: Colors.textSecondary },
  value: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium, maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.black, color: Colors.primary, letterSpacing: 2 },
  headerSub: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', marginTop: 2 },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  sectionLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
    marginBottom: -Spacing.xs,
    marginTop: Spacing.sm,
  },
  sectionDesc: { fontSize: Typography.sm, color: Colors.textSecondary },

  optionList: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryGlow,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: Colors.primary },
  optionLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  pressed: { opacity: 0.75 },

  aboutCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },

  directiveBox: {
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
  },
  directiveText: {
    fontFamily: 'SpaceMono',
    fontSize: Typography.sm,
    color: Colors.primary,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
});
