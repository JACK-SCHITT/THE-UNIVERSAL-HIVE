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
import { useAuth, useAlert } from '@/template';

const ARCHITECT_EMAIL = 'krackerjack1134@gmail.com';
const TEACHER_EMAIL = 'jackschitt1134@gmail.com';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, signUpWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPrimeAccess, setShowPrimeAccess] = useState(false);
  const [primeRole, setPrimeRole] = useState<'ARCHITECT' | 'TEACHER' | null>(null);
  const [primePassword, setPrimePassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('INCOMPLETE', 'Enter your email and password.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      showAlert('ACCESS DENIED', error, [{ text: 'RETRY', style: 'cancel' }]);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleSendOTP = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('INCOMPLETE', 'All fields are required.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    if (password !== confirmPassword) {
      showAlert('MISMATCH', 'Passwords do not match.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    if (password.length < 6) {
      showAlert('TOO WEAK', 'Password must be at least 6 characters.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    const { error } = await sendOTP(email.trim());
    if (error) {
      showAlert('SIGNAL FAILED', error, [{ text: 'RETRY', style: 'cancel' }]);
      return;
    }
    setStep('otp');
    showAlert('CODE TRANSMITTED', 'Check your email for the verification code.', [{ text: 'OK', style: 'default' }]);
  };

  const handlePrimeLogin = async (role: 'ARCHITECT' | 'TEACHER') => {
    if (!primePassword.trim()) {
      showAlert('PASSWORD REQUIRED', 'Enter your access password.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    const primeEmail = role === 'ARCHITECT' ? ARCHITECT_EMAIL : TEACHER_EMAIL;
    const { error } = await signInWithPassword(primeEmail, primePassword);
    if (error) {
      showAlert('ACCESS DENIED', 'Invalid credentials. The Architect will be notified.', [{ text: 'RETRY', style: 'cancel' }]);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('MISSING CODE', 'Enter the verification code.', [{ text: 'OK', style: 'cancel' }]);
      return;
    }
    const { error } = await verifyOTPAndLogin(email.trim(), otp.trim(), { password });
    if (error) {
      showAlert('VERIFICATION FAILED', error, [{ text: 'RETRY', style: 'cancel' }]);
      return;
    }
    router.replace('/profile-setup');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>[ IDENTITY VERIFICATION ]</Text>
          <Text style={styles.title}>{mode === 'login' ? 'ACCESS' : 'ENLIST'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Prove you belong in the Foundry.'
              : 'Join the ranks. Begin your assimilation.'}
          </Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeRow}>
          {(['login', 'register'] as const).map(m => (
            <Pressable
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => { setMode(m); setStep('form'); setOtp(''); }}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'login' ? 'LOGIN' : 'REGISTER'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {step === 'form' ? (
            <>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />

              {mode === 'register' ? (
                <>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                  />
                </>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, operationLoading && { opacity: 0.6 }]}
                onPress={mode === 'login' ? handleLogin : handleSendOTP}
                disabled={operationLoading}
              >
                <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.ctaGradient}>
                  {operationLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.ctaText}>{mode === 'login' ? 'BREACH ACCESS' : 'SEND CODE'}</Text>
                  }
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.otpInfo}>
                <MaterialIcons name="mail" size={20} color={Colors.crimson} />
                <Text style={styles.otpInfoText}>
                  Code sent to <Text style={{ color: Colors.textPrimary }}>{email}</Text>
                </Text>
              </View>

              <Text style={styles.label}>VERIFICATION CODE</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="0000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />

              <Pressable
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, operationLoading && { opacity: 0.6 }]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.ctaGradient}>
                  {operationLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.ctaText}>VERIFY {'&'} ENLIST</Text>
                  }
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.resendBtn} onPress={() => setStep('form')}>
                <Text style={styles.resendText}>CHANGE EMAIL / RESEND</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Prime Directive Access */}
        <View style={styles.primeSection}>
          <Pressable
            style={styles.primeDivider}
            onPress={() => { setShowPrimeAccess(v => !v); setPrimeRole(null); setPrimePassword(''); }}
          >
            <View style={styles.primeDividerLine} />
            <View style={styles.primeDividerCenter}>
              <MaterialIcons name="shield" size={12} color={Colors.crimson} />
              <Text style={styles.primeDividerText}>PRIME DIRECTIVE ACCESS</Text>
              <MaterialIcons name={showPrimeAccess ? 'expand-less' : 'expand-more'} size={14} color={Colors.textMuted} />
            </View>
            <View style={styles.primeDividerLine} />
          </Pressable>

          {showPrimeAccess ? (
            <View style={styles.primePanel}>
              <View style={styles.primeLore}>
                <Text style={styles.primeLoreTitle}>[ ARCHITECT PRIME DIRECTIVE ]</Text>
                <Text style={styles.primeLoreText}>
                  KRACKERJACK1134 is the Architect. JACKSCHITT1134 is the Teacher. Access granted only to those with verified credentials.
                </Text>
              </View>

              {!primeRole ? (
                <View style={styles.primeRoleRow}>
                  <Pressable
                    style={[styles.primeRoleBtn, { borderColor: Colors.crimson }]}
                    onPress={() => setPrimeRole('ARCHITECT')}
                  >
                    <MaterialIcons name="admin-panel-settings" size={20} color={Colors.crimson} />
                    <Text style={[styles.primeRoleBtnTitle, { color: Colors.crimson }]}>ARCHITECT</Text>
                    <Text style={styles.primeRoleBtnEmail}>krackerjack1134@gmail.com</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primeRoleBtn, { borderColor: Colors.cyanPulse }]}
                    onPress={() => setPrimeRole('TEACHER')}
                  >
                    <MaterialIcons name="school" size={20} color={Colors.cyanPulse} />
                    <Text style={[styles.primeRoleBtnTitle, { color: Colors.cyanPulse }]}>TEACHER</Text>
                    <Text style={styles.primeRoleBtnEmail}>jackschitt1134@gmail.com</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.primeLoginForm}>
                  <Pressable style={styles.primeBack} onPress={() => { setPrimeRole(null); setPrimePassword(''); }}>
                    <MaterialIcons name="arrow-back" size={14} color={Colors.textMuted} />
                    <Text style={styles.primeBackText}>BACK</Text>
                  </Pressable>

                  <View style={styles.primeSelectedRole}>
                    <MaterialIcons
                      name={primeRole === 'ARCHITECT' ? 'admin-panel-settings' : 'school'}
                      size={16}
                      color={primeRole === 'ARCHITECT' ? Colors.crimson : Colors.cyanPulse}
                    />
                    <Text style={[styles.primeSelectedRoleText, { color: primeRole === 'ARCHITECT' ? Colors.crimson : Colors.cyanPulse }]}>
                      {primeRole === 'ARCHITECT' ? 'ARCHITECT — KRACKERJACK1134' : 'TEACHER — JACKSCHITT1134'}
                    </Text>
                  </View>

                  <Text style={styles.primeEmail}>
                    {primeRole === 'ARCHITECT' ? ARCHITECT_EMAIL : TEACHER_EMAIL}
                  </Text>

                  <Text style={styles.label}>PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    value={primePassword}
                    onChangeText={setPrimePassword}
                    placeholder="Enter access password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                    autoFocus
                  />

                  <Pressable
                    style={({ pressed }) => [styles.primeCta, pressed && { opacity: 0.85 }, operationLoading && { opacity: 0.6 }]}
                    onPress={() => handlePrimeLogin(primeRole)}
                    disabled={operationLoading}
                  >
                    <LinearGradient
                      colors={primeRole === 'ARCHITECT' ? [Colors.crimson, Colors.bloodRed] : [Colors.cyanDim, '#006680']}
                      style={styles.ctaGradient}
                    >
                      {operationLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.ctaText}>AUTHENTICATE</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scroll: { paddingHorizontal: Spacing.lg },
  backBtn: { paddingVertical: Spacing.md },
  header: { marginBottom: Spacing.xl },
  eyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 6 },
  title: { color: Colors.textPrimary, fontSize: 48, fontWeight: Typography.black, letterSpacing: 6, marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.6 },
  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.surface },
  modeBtnActive: { backgroundColor: Colors.crimson },
  modeBtnText: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.black, letterSpacing: 2 },
  modeBtnTextActive: { color: '#fff' },
  form: {},
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
  cta: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.xl },
  ctaGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 3 },
  otpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: Colors.bloodRed,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  otpInfoText: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
  otpInput: { fontSize: 28, fontWeight: Typography.black, letterSpacing: 12, color: Colors.crimson },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  resendText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2, textDecorationLine: 'underline' },

  // Prime Directive
  primeSection: { marginTop: Spacing.xl },
  primeDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  primeDividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  primeDividerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#2a0a0a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2,
  },
  primeDividerText: { color: Colors.crimson, fontSize: 9, fontWeight: Typography.black, letterSpacing: 2 },
  primePanel: {
    backgroundColor: '#080808', borderWidth: 1, borderColor: '#2a0a0a',
    borderRadius: Radius.sm, padding: Spacing.md,
  },
  primeLore: { marginBottom: Spacing.md },
  primeLoreTitle: { color: Colors.crimson, fontSize: 9, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 6 },
  primeLoreText: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: Typography.xs * 1.6 },
  primeRoleRow: { flexDirection: 'row', gap: Spacing.sm },
  primeRoleBtn: {
    flex: 1, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm,
    alignItems: 'center', gap: 4, backgroundColor: Colors.surface,
  },
  primeRoleBtnTitle: { fontSize: 11, fontWeight: Typography.black, letterSpacing: 2 },
  primeRoleBtnEmail: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },
  primeLoginForm: {},
  primeBack: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  primeBackText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1 },
  primeSelectedRole: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  primeSelectedRoleText: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 2 },
  primeEmail: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: Spacing.md },
  primeCta: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.md },
});
