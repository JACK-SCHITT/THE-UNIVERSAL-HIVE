import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FileProvider } from '../contexts/FileContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FileProvider>
        <StatusBar style="light" backgroundColor="#080810" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080810' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </FileProvider>
    </SafeAreaProvider>
  );
}
