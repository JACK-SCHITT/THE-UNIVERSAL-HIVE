import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat } from '@/hooks/useChat';
import { useCharacter } from '@/hooks/useCharacter';
import { useMemory } from '@/hooks/useMemory';
import { shareService } from '@/services/shareService';
import { useAlert } from '@/template';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

const INTEGRATIONS = [
  {
    id: 'share',
    name: 'Share App Link',
    description: 'Share this companion app with friends',
    icon: 'share',
    color: '#3b82f6',
    action: 'share_app',
  },
  {
    id: 'twitter',
    name: 'Share on X (Twitter)',
    description: 'Post about your AI companion experience',
    icon: 'chat',
    color: '#1DA1F2',
    action: 'twitter',
  },
  {
    id: 'clipboard',
    name: 'Copy Chat Link',
    description: 'Copy a deep link to this conversation',
    icon: 'link',
    color: '#10b981',
    action: 'copy_link',
  },
  {
    id: 'export_json',
    name: 'Export as JSON',
    description: 'Machine-readable chat data for integrations',
    icon: 'data-object',
    color: '#f59e0b',
    action: 'export_json',
  },
  {
    id: 'export_txt',
    name: 'Export as Text',
    description: 'Plain text transcript of your conversation',
    icon: 'description',
    color: '#a855f7',
    action: 'export_txt',
  },
];

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    personal: '#a855f7',
    preference: '#3b82f6',
    event: '#f59e0b',
    emotion: '#ec4899',
    general: '#10b981',
  };
  return map[category] || '#6b7280';
}

export default function SettingsScreen() {
  const { messages } = useChat();
  const { currentCharacter } = useCharacter();
  const { memories, deleteMemory, loading: memoriesLoading } = useMemory();
  const { showAlert } = useAlert();

  const handleAction = async (action: string) => {
    if (!currentCharacter) return;

    if (action === 'export_txt') {
      const result = await shareService.exportChatAsText(messages, currentCharacter.name);
      if (!result.success) showAlert(result.error || 'Export failed');
    }

    if (action === 'export_json') {
      const json = JSON.stringify(
        messages.map(m => ({
          sender: m.sender,
          text: m.message_text,
          time: m.created_at,
          image: m.image_url,
        })),
        null,
        2
      );
      const result = await shareService.shareText(json);
      if (!result.success) showAlert(result.error || 'Share failed');
    }

    if (action === 'share_app') {
      const text = `I have been chatting with ${currentCharacter.name}, an AI companion. Check it out!`;
      const result = await shareService.shareText(text);
      if (!result.success) showAlert(result.error || 'Share failed');
    }

    if (action === 'twitter') {
      const tweet = encodeURIComponent(
        `Just had an amazing conversation with ${currentCharacter.name} on my AI companion app! ✨ #AICompanion #Luna`
      );
      const url = `https://twitter.com/intent/tweet?text=${tweet}`;
      Linking.openURL(url);
    }

    if (action === 'copy_link') {
      const deepLink = `mycompanion://chat/${currentCharacter.id}`;
      const result = await shareService.shareText(deepLink);
      if (!result.success) showAlert(result.error || 'Copy failed');
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#12121a']} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Integrations</Text>
            <Text style={styles.subtitle}>Connect & share your companion</Text>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{messages.length}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {messages.filter(m => m.image_url).length}
              </Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {messages.filter(m => m.sender === 'ai').length}
              </Text>
              <Text style={styles.statLabel}>AI Replies</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Export & Share</Text>

          {INTEGRATIONS.map(item => (
            <Pressable
              key={item.id}
              onPress={() => handleAction(item.action)}
              style={({ pressed }) => [styles.integrationCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.integrationIcon, { backgroundColor: item.color + '20' }]}>
                <MaterialIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>{item.name}</Text>
                <Text style={styles.integrationDesc}>{item.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
          ))}

          {/* Deep Linking Info */}
          <Text style={styles.sectionTitle}>Deep Linking</Text>
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={20} color={colors.neonBlue} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>App URL Scheme</Text>
              <Text style={styles.infoBody}>
                {'mycompanion://chat/<characterId>\n'}Use this scheme to deep-link into specific character chats from other apps.
              </Text>
            </View>
          </View>

          {/* AI Memory Viewer */}
          <Text style={styles.sectionTitle}>AI Memory</Text>
          <View style={styles.memoryHeader}>
            <MaterialIcons name="psychology" size={16} color={colors.neonBlue} />
            <Text style={styles.memorySubtitle}>
              {memories.length > 0
                ? `${memories.length} facts remembered about you`
                : 'No memories yet — start chatting!'}
            </Text>
          </View>
          {memoriesLoading ? (
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Loading memories...</Text>
            </View>
          ) : (
            memories.map(mem => (
              <View key={mem.id} style={styles.memoryCard}>
                <View style={styles.memoryCardLeft}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(mem.category) + '25' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(mem.category) }]}>
                      {mem.category}
                    </Text>
                  </View>
                  <View style={styles.memoryBody}>
                    <Text style={styles.memoryKey}>{mem.memory_key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.memoryValue}>{mem.memory_value}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => deleteMemory(mem.id)}
                  style={({ pressed }) => [styles.deleteMemoryBtn, pressed && { opacity: 0.5 }]}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ))
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { ...typography.h2, color: colors.neonPurple },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.bgMid },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonPurple + '15',
    gap: spacing.md,
  },
  cardPressed: { opacity: 0.75 },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  integrationInfo: { flex: 1 },
  integrationName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  integrationDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.neonBlue + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonBlue + '30',
  },
  infoText: { flex: 1 },
  infoTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  infoBody: { ...typography.caption, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  memorySubtitle: { ...typography.caption, color: colors.textSecondary },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: 8,
    padding: spacing.md,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neonPurple + '15',
    gap: spacing.sm,
  },
  memoryCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  memoryBody: { flex: 1 },
  memoryKey: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  memoryValue: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  deleteMemoryBtn: { padding: 4 },
});
