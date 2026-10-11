import { AlertProvider, AuthProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="tool/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="prime-directive" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="architect" options={{ headerShown: false, animation: 'slide_from_right' }} />
            </Stack>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
