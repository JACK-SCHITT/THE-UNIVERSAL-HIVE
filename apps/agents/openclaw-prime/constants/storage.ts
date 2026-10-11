// Storage keys and local persistence helpers
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EntryFlow } from './config';

const KEYS = {
  ENTRY_FLOW: 'openclaw_entry_flow',
  CHAT_HISTORY: 'openclaw_chat_',
  APP_IDEAS: 'openclaw_app_ideas',
  ONBOARDING_DONE: 'openclaw_onboarding_done',
};

export const Storage = {
  async getEntryFlow(): Promise<EntryFlow> {
    try {
      const val = await AsyncStorage.getItem(KEYS.ENTRY_FLOW);
      return (val as EntryFlow) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  },

  async setEntryFlow(flow: EntryFlow): Promise<void> {
    await AsyncStorage.setItem(KEYS.ENTRY_FLOW, flow);
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.CHAT_HISTORY + sessionId);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveChatHistory(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const last40 = messages.slice(-40);
    await AsyncStorage.setItem(KEYS.CHAT_HISTORY + sessionId, JSON.stringify(last40));
  },

  async clearChatHistory(sessionId: string): Promise<void> {
    await AsyncStorage.removeItem(KEYS.CHAT_HISTORY + sessionId);
  },

  async isOnboardingDone(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return val === 'true';
  },

  async setOnboardingDone(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
  },
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentId?: string;
}
