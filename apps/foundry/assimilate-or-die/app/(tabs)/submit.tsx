import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { APP_SUBMISSIONS, AppSubmission } from '@/constants/data';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/template';

const CATEGORIES = ['Finance', 'Health', 'Legal', 'Productivity', 'Education', 'Entertainment', 'Social', 'Tools'];

export default function SubmitScreen() {
  const insets = useSafeAreaInsets();
  const { addXP, completeMission } = useApp();
  const { showAlert } = useAlert();

  const [tab, setTab] = useState<'browse' | 'submit'>('browse');
  const [submissions, setSubmissions] = useState<AppSubmission[]>(APP_SUBMISSIONS);
  const [form, setForm] = useState({ name: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);

  const statusColor = (s: AppSubmission['status']) => {
    if (s === 'live') return Colors.success;
    if (s === 'pending') return Colors.warning;
    return Colors.danger;
  };

  const handleVote = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s));
    addXP(5);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.description.trim() || !form.category) {
      showAlert('INCOMPLETE', 'Fill all fields before submitting.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newApp: AppSubmission = {
        id: Date.now().toString(),
        name: form.name.toUpperCase(),
        builder: '@you',
        description: form.description,
        category: form.category,
        votes: 0,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setSubmissions(prev => [newApp, ...prev]);
      setForm({ name: '', description: '', category: '' });
      setSubmitting(false);
      completeMission('3');
      addXP(300);
      setTab('browse');
      showAlert('APP SUBMITTED', 'Your app is pending review. +300 XP earned. Welcome to the Foundry.', [
        { text: 'VIEW IT', style: 'default' }
      ]);
    }, 1500);
  };

  const renderApp = ({ item }: { item: AppSubmission }) => (
    <View style={styles.appCard}>
      <View style={styles.appCardTop}>
        <View style={styles.appMeta}>
          <Text style={styles.appName}>{item.name}</Text>
          <Text style={styles.appBuilder}>{item.builder} · {item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.appDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.appFooter}>
        <Text style={styles.appDate}>{item.createdAt}</Text>
        <Pressable
          style={({ pressed }) => [styles.voteBtn, pressed && { opacity: 0.8 }]}
          onPress={() => handleVote(item.id)}
        >
          <MaterialIcons name="thumb-up" size={14} color={Colors.crimson} />
          <Text style={styles.voteCount}>{item.votes}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>[ APP FOUNDRY ]</Text>
          <Text style={styles.title}>SUBMIT {'&'} DISCOVER</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['browse', 'submit'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'browse' ? 'BROWSE APPS' : 'SUBMIT APP'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'browse' ? (
        <FlatList
          data={submissions}
          keyExtractor={item => item.id}
          renderItem={renderApp}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.leaderboardHeader}>
              <MaterialIcons name="emoji-events" size={16} color={Colors.warning} />
              <Text style={styles.leaderboardText}>TOP SUBMISSIONS — VOTE TO RANK</Text>
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Text style={styles.formLabel}>APP NAME</Text>
          <TextInput
            style={styles.formInput}
            value={form.name}
            onChangeText={v => setForm(p => ({ ...p, name: v }))}
            placeholder="e.g. NEURALTRADER PRO"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
          />

          <Text style={styles.formLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.formInput, styles.formTextarea]}
            value={form.description}
            onChangeText={v => setForm(p => ({ ...p, description: v }))}
            placeholder="What does your app do? Who does it help? How does it dominate?"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.formLabel}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={[styles.catChip, form.category === cat && styles.catChipActive]}
                onPress={() => setForm(p => ({ ...p, category: cat }))}
              >
                <Text style={[styles.catChipText, form.category === cat && styles.catChipTextActive]}>
                  {cat.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.xpPreview}>
            <MaterialIcons name="bolt" size={20} color={Colors.crimson} />
            <Text style={styles.xpPreviewText}>Submit earns +300 XP and unlocks the BUILDER INITIATE mission</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.submitGradient}>
              <Text style={styles.submitText}>{submitting ? 'SUBMITTING...' : 'LAUNCH TO FOUNDRY'}</Text>
            </LinearGradient>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 2 },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 3 },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: 'hidden' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.surface },
  tabBtnActive: { backgroundColor: Colors.crimson },
  tabText: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.bold, letterSpacing: 2 },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  leaderboardText: { color: Colors.warning, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5 },
  appCard: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  appCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.xs },
  appMeta: { flex: 1 },
  appName: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 1, marginBottom: 2 },
  appBuilder: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 0.5 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  statusText: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 1.5 },
  appDesc: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.5, marginBottom: Spacing.sm },
  appFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appDate: { color: Colors.textMuted, fontSize: Typography.xs },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm },
  voteCount: { color: Colors.crimson, fontSize: Typography.sm, fontWeight: Typography.bold },
  form: { paddingHorizontal: Spacing.md },
  formLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 6, marginTop: Spacing.md },
  formInput: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: Typography.sm,
  },
  formTextarea: { height: 100, paddingTop: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.sm, backgroundColor: Colors.surface,
  },
  catChipActive: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  catChipText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1 },
  catChipTextActive: { color: Colors.crimson },
  xpPreview: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: Spacing.lg,
    backgroundColor: '#1a0000', borderWidth: 1, borderColor: Colors.bloodRed,
    borderRadius: Radius.sm, padding: Spacing.md,
  },
  xpPreviewText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.5 },
  submitBtn: { marginTop: Spacing.lg, borderRadius: Radius.sm, overflow: 'hidden' },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },
});
