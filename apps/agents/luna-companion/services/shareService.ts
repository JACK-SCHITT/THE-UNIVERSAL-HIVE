import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { ChatMessage } from './chatService';

export const shareService = {
  async exportChatAsText(
    messages: ChatMessage[],
    characterName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const header = `=== Chat with ${characterName} ===\nExported on ${new Date().toLocaleDateString()}\n${'='.repeat(40)}\n\n`;

      const body = messages
        .map(msg => {
          const time = new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const who = msg.sender === 'user' ? 'You' : characterName;
          const imageNote = msg.image_url ? '\n[Image attached]' : '';
          return `[${time}] ${who}:\n${msg.message_text}${imageNote}`;
        })
        .join('\n\n');

      const content = header + body;

      if (Platform.OS === 'web') {
        // Web: create download link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${characterName.toLowerCase()}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
      }

      // Mobile: write file and share
      const fileUri = `${FileSystem.documentDirectory}chat-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: `Share chat with ${characterName}`,
        });
        return { success: true };
      }

      return { success: false, error: 'Sharing not available on this device' };
    } catch (err: any) {
      console.error('Export error:', err);
      return { success: false, error: err.message };
    }
  },

  async shareText(text: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ text });
          return { success: true };
        }
        await navigator.clipboard.writeText(text);
        return { success: true };
      }

      const fileUri = `${FileSystem.cacheDirectory}share-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, text);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return { success: false, error: 'Sharing not available' };

      await Sharing.shareAsync(fileUri, { mimeType: 'text/plain' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
