import { AlertProvider, AuthProvider } from '@/template';
import { CharacterProvider } from '@/contexts/CharacterContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AlertProvider>
      <AuthProvider>
        <ThemeProvider>
          <CharacterProvider>
            <SafeAreaProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </SafeAreaProvider>
          </CharacterProvider>
        </ThemeProvider>
      </AuthProvider>
    </AlertProvider>
  );
}
