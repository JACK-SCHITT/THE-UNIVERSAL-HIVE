import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

function TabIcon({ name, color }: { name: any; color: string }) {
  return (
    <View style={styles.iconWrap}>
      <MaterialIcons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.select({ ios: insets.bottom + 64, android: insets.bottom + 64, default: 72 }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
          paddingHorizontal: 4,
          backgroundColor: '#080808',
          borderTopWidth: 1,
          borderTopColor: '#1e1e1e',
        },
        tabBarActiveTintColor: Colors.crimson,
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '700',
          letterSpacing: 1,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'FOUNDRY',
          tabBarIcon: ({ color }) => <TabIcon name="bolt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'COMMAND',
          tabBarIcon: ({ color }) => <TabIcon name="psychology" color={color} />,
        }}
      />
      <Tabs.Screen
        name="build"
        options={{
          title: 'BUILD',
          tabBarIcon: ({ color }) => <TabIcon name="construction" color={color} />,
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{
          title: 'SUBMIT',
          tabBarIcon: ({ color }) => <TabIcon name="rocket-launch" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'RANK',
          tabBarIcon: ({ color }) => <TabIcon name="military-tech" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="hive"
        options={{
          title: 'HIVE',
          tabBarIcon: ({ color }) => <TabIcon name="hub" color={color} />,
          tabBarActiveTintColor: '#00F5FF',
        }}
      />
            <Tabs.Screen
          name="projects"
          options={{
            title: 'PROJECTS',
            tabBarIcon: ({ color }) => <TabIcon name="folder-open" color={color} />,
          }}
        />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
