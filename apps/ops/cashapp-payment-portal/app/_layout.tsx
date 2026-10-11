import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="history" options={{ headerShown: true, title: 'Donation History' }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: true, title: 'Leaderboard' }} />
          <Stack.Screen name="reports" options={{ headerShown: true, title: 'Impact Reports' }} />
          <Stack.Screen name="subscribe" options={{ headerShown: true, title: 'Recurring Donations' }} />
          <Stack.Screen
            name="success"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Thank You',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
