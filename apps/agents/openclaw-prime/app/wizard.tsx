import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { GlowButton } from '@/components';
import { AGENTS } from '@/constants/config';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

const STEPS = [
  {
    id: 'idea',
    question: 'What does your app DO?',
    hint: 'One sentence. No fluff. Who does it help and what problem does it kill?',
    placeholder: 'e.g. Subscription platform for dog trainers to sell video courses',
    multiline: true,
  },
  {
    id: 'target',
    question: 'Who is your target user?',
    hint: 'Be specific. The tighter the niche, the faster the growth.',
    placeholder: 'e.g. Freelance dog trainers with 100-500 clients',
    multiline: false,
  },
  {
    id: 'revenue',
    question: 'How does it make money?',
    hint: 'Subscription, one-time, marketplace cut, ads, or mix?',
    placeholder: 'e.g. $29/month subscription for trainers',
    multiline: false,
  },
  {
    id: 'timeline',
    question: 'When do you need to launch?',
    hint: 'Real deadline creates real focus.',
    placeholder: 'e.g. 30 days, 3 months, ASAP',
    multiline: false,
  },
];

export default function WizardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const isDone = step >= STEPS.length;

  const currentStep = STEPS[step];

  const handleNext = () => {
    if (!current.trim()) return;
    setAnswers(prev => ({ ...prev, [currentStep.id]: current.trim() }));
    setCurrent('');
    setStep(s => s + 1);
  };

  const buildInitialMessage = () => {
    return `ASSIMILATE THIS APP IDEA:

What it does: ${answers.idea}
Target user: ${answers.target}
Revenue model: ${answers.revenue}
Launch timeline: ${answers.timeline}

Analyze this completely. Give me a concrete action plan — architecture, MVP scope, and first 3 steps.`;
  };

  const handleLaunch = () => {
    if (!selectedAgent) return;
    const initMsg = encodeURIComponent(buildInitialMessage());
    router.replace(`/agent/${selectedAgent}?init=${initMsg}` as any);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>APP IDEA WIZARD</Text>
        <Text style={styles.stepCount}>
          {isDone ? 'DONE' : `${step + 1} / ${STEPS.length}`}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(((isDone ? STEPS.length : step) / STEPS.length) * 100, 100)}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isDone ? (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>{'// STEP ' + (step + 1)}</Text>
            <Text style={styles.question}>{currentStep.question}</Text>
            <Text style={styles.hint}>{currentStep.hint}</Text>

            <TextInput
              value={current}
              onChangeText={setCurrent}
              placeholder={currentStep.placeholder}
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, currentStep.multiline && styles.inputMulti]}
              multiline={currentStep.multiline}
              numberOfLines={currentStep.multiline ? 4 : 1}
              autoFocus
            />

            <GlowButton
              label={step < STEPS.length - 1 ? 'NEXT →' : 'DONE →'}
              onPress={handleNext}
              disabled={!current.trim()}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            />

            {step > 0 && (
              <Pressable onPress={() => { setStep(s => s - 1); setCurrent(answers[STEPS[step - 1].id] || ''); }} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Back</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <Text style={styles.stepLabel}>{'// BLUEPRINT READY'}</Text>
            <Text style={styles.question}>OPENCLAW PRIME has your specs.</Text>
            <Text style={styles.hint}>Select which agent to engage first:</Text>

            {/* Summary */}
            <View style={styles.summaryCard}>
              {STEPS.map(s => (
                <View key={s.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{s.id.toUpperCase()}</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>{answers[s.id]}</Text>
                </View>
              ))}
            </View>

            {/* Agent picker */}
            <Text style={styles.sectionLabel}>{'// CHOOSE FIRST AGENT'}</Text>
            <View style={styles.agentGrid}>
              {AGENTS.map(agent => {
                const isSel = selectedAgent === agent.id;
                return (
                  <Pressable
                    key={agent.id}
                    onPress={() => setSelectedAgent(agent.id)}
                    style={({ pressed }) => [
                      styles.agentPick,
                      isSel && { borderColor: agent.color, backgroundColor: agent.color + '18' },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <MaterialIcons name={agent.icon as any} size={20} color={isSel ? agent.color : Colors.textMuted} />
                    <Text style={[styles.agentPickName, isSel && { color: agent.color }]}>{agent.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <GlowButton
              label="ENGAGE AGENT →"
              onPress={handleLaunch}
              disabled={!selectedAgent}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}
      </ScrollView>
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
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 2 },
  stepCount: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.bold },

  progressTrack: { height: 2, backgroundColor: Colors.border },
  progressFill: { height: 2, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },

  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  stepContainer: { gap: Spacing.md },
  stepLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  question: { fontSize: Typography.xxl, fontWeight: Typography.black, color: Colors.textPrimary, lineHeight: 36 },
  hint: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 },

  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 52,
  },
  inputMulti: { minHeight: 110, textAlignVertical: 'top' },

  backLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  backLinkText: { fontSize: Typography.sm, color: Colors.textMuted },

  summaryContainer: { gap: Spacing.md },
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', marginBottom: 2 },
  summaryValue: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 18 },

  sectionLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', letterSpacing: 1, marginTop: Spacing.sm },

  agentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  agentPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  agentPickName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary },
});
