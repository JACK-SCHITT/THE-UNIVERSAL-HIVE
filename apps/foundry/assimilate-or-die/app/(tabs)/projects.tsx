import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { useConversations } from '@/hooks/useConversations';
import { useAlert } from '@/template';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { AGENTS } from '@/constants/agents';

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { conversations, loading, refresh, removeConversation } = useConversations();

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id: string, title: string) => {
    showAlert(`Delete "${title}"?`, 'This will permanently remove the project and all messages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeConversation(id),
      },
    ]);
  };

  const handleOpen = (conv: { id: string; agent_id: string; agent_name: string }) => {
    const agent = AGENTS.find(a => a.id === conv.agent_id);
    const color = agent?.color ?? '#FFB300';
    router.push(`/chat/${conv.id}?agentId=${conv.agent_id}&agentColor=${encodeURIComponent(color)}&agentName=${encodeURIComponent(conv.agent_name)}`);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View>
          <Text style={styles.headerTag}>OPENCLAW PRIME</Text>
          <Text style={styles.headerTitle}>MY PROJECTS</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${Colors.primary}20`, borderColor: `${Colors.primary}40` }]}>
          <Text style={styles.badgeText}>{conversations.length}</Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 80 },
          conversations.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="folder-open" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>NO PROJECTS YET</Text>
              <Text style={styles.emptyBody}>
                Go to AGENTS tab and select{'\n'}an agent to start building.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.emptyBtnText}>→ SELECT AN AGENT</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProjectCard
            conversation={item}
            onPress={() => handleOpen(item)}
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTag: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    fontFamily: 'monospace',
  },
  list: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  emptyBody: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
});
