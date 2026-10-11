import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const supabase = getSupabaseClient();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !handle.trim()) {
      showAlert('INCOMPLETE', 'Enter your name and handle to proceed.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: name.trim().toUpperCase(),
          handle: cleanHandle.toUpperCase(),
          profile_complete: true,
          xp: 50,
        })
        .eq('id', user.id);

      if (error) throw error;

      showAlert('IDENTITY FORGED', `Welcome, ${name.trim().toUpperCase()}. Your assimilation begins now. +50 XP`, [
        { text: 'ENTER THE FOUNDRY', style: 'default', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (err: any) {
      showAlert('SYSTEM ERROR', err.message || 'Failed to save profile.', [{ text: 'RETRY', style: 'cancel' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>[ IDENTITY PROTOCOL ]</Text>
          <Text style={styles.title}>FORGE YOUR{'\n'}IDENTITY</Text>
          <Text style={styles.subtitle}>
            Name yourself. The Foundry remembers all who enter.
          </Text>
        </View>

        <View style={styles.badgePreview}>
          <View style={styles.badgeIcon}>
            <MaterialIcons name="military-tech" size={32} color={Colors.crimson} />
          </View>
          <View>
            <Text style={styles.badgeName}>{name.trim().toUpperCase() || 'YOUR NAME'}</Text>
            <Text style={styles.badgeHandle}>{handle.trim() ? (handle.trim().startsWith('@') ? handle.trim().toUpperCase() : '@' + handle.trim().toUpperCase()) : '@YOUR_HANDLE'}</Text>
            <Text style={styles.badgeRank}>LV.1 INITIATE · 50 XP</Text>
          </View>
        </View>

        <Text style={styles.label}>DISPLAY NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. SHADOW EXECUTOR"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
          maxLength={30}
        />
        <Text style={styles.hint}>This is how the Foundry will address you</Text>

        <Text style={styles.label}>HANDLE</Text>
        <View style={styles.handleWrap}>
          <Text style={styles.handleAt}>@</Text>
          <TextInput
            style={styles.handleInput}
            value={handle.startsWith('@') ? handle.slice(1) : handle}
            onChangeText={v => setHandle(v)}
            placeholder="your_handle"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            maxLength={20}
          />
        </View>
        <Text style={styles.hint}>Your unique identifier in the Foundry</Text>

        <View style={styles.xpBonus}>
          <MaterialIcons name="bolt" size={18} color={Colors.crimson} />
          <Text style={styles.xpBonusText}>+50 XP granted for completing your identity profile</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.ctaGradient}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>FORGE IDENTITY</Text>
            }
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>SKIP FOR NOW</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scroll: { paddingHorizontal: Spacing.lg },
  header: { paddingTop: Spacing.xl, marginBottom: Spacing.xl },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 6 },
  title: { color: Colors.textPrimary, fontSize: 38, fontWeight: Typography.black, letterSpacing: 3, marginBottom: 8, lineHeight: 42 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.6 },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: Colors.bloodRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 2 },
  badgeHandle: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1, marginTop: 2 },
  badgeRank: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1, marginTop: 4 },
  label: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 6, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  hint: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
  handleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
  },
  handleAt: { color: Colors.crimson, fontSize: Typography.lg, fontWeight: Typography.black, marginRight: 4 },
  handleInput: { flex: 1, paddingVertical: 14, color: Colors.textPrimary, fontSize: Typography.base },
  xpBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: Colors.bloodRed,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  xpBonusText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm },
  cta: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.md },
  ctaGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2, textDecorationLine: 'underline' },
});
