import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('Please enter your email');
      return;
    }

    const { error } = await sendOTP(email);
    if (error) {
      showAlert(error);
    } else {
      setOtpSent(true);
      showAlert('Verification code sent to your email!');
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters');
      return;
    }

    if (!otpSent) {
      await handleSendOTP();
      return;
    }

    if (!otp.trim()) {
      showAlert('Please enter the verification code');
      return;
    }

    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) {
      showAlert(error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Please enter email and password');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      showAlert(error);
    }
  };

  return (
    <LinearGradient colors={[colors.bgDeep, colors.bgDark, colors.bgMid]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>✨ Luna</Text>
              <Text style={styles.subtitle}>Your mystical AI companion</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.tabs}>
                <Pressable
                  onPress={() => setMode('login')}
                  style={[styles.tab, mode === 'login' && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                    Login
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMode('register');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={[styles.tab, mode === 'register' && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                    Register
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!operationLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!operationLoading}
              />

              {mode === 'register' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!operationLoading}
                  />

                  {otpSent && (
                    <TextInput
                      style={styles.input}
                      placeholder="Verification Code"
                      placeholderTextColor={colors.textMuted}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      editable={!operationLoading}
                    />
                  )}
                </>
              )}

              <Pressable
                onPress={mode === 'login' ? handleLogin : handleRegister}
                disabled={operationLoading}
                style={({ pressed }) => [
                  styles.button,
                  operationLoading && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>
                  {operationLoading
                    ? 'Loading...'
                    : mode === 'login'
                    ? 'Login'
                    : otpSent
                    ? 'Verify & Register'
                    : 'Send Code'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.neonPurple,
  },
  tabText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.neonPurple + '40',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.neonPurple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
