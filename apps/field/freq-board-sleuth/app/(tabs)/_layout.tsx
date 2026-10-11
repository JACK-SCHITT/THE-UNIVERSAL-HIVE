// Tab navigation layout
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { theme } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 60,
      android: insets.bottom + 60,
      default: 70,
    }),
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 8,
    }),
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textDim,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: theme.fonts.mono,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'FREQ',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="graphic-eq" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: 'BOARD',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="developer-board" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mods"
        options={{
          title: 'MODS',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="build-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="codes"
        options={{
          title: 'DECODE',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
