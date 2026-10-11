export interface SoulPillar {
  id: string;
  pillar_name: string;
  content: string;
  updated_at: string;
}

export interface CoreMemory {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface HiveSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  size: number;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  bio: string | null;
}

export interface GitHubSearchResult {
  id: number;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
  owner: { login: string; avatar_url: string };
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'ascii';
  content: string;
}

export interface VaultToken {
  id: string;
  category: 'github' | 'bot' | 'webhook' | 'ai' | 'app' | 'other';
  label: string;
  token_type: 'api_key' | 'token' | 'webhook' | 'client_id' | 'client_secret' | 'app_id' | 'access_token' | 'public_key' | 'bearer' | 'other';
  value: string;
  meta: Record<string, string>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScriptForgeEntry {
  id: string;
  title: string;
  target_os: string;
  language: string;
  prompt: string;
  script: string;
  created_at: string;
}

export interface DeviceInfo {
  os: string;
  platform: string;
  browser: string;
  cores: number;
  memory: number | null;
  screenW: number;
  screenH: number;
  connection: string;
  battery: string;
  batteryLevel: number;
  batteryCharging: boolean;
  touchPoints: number;
  language: string;
  online: boolean;
  userAgent: string;
  timezone: string;
  vendor: string;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  storageUsed?: number;
  storageTotal?: number;
  orientation?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'wifi' | 'bluetooth' | 'usb';
  status: 'connected' | 'pairing' | 'disconnected';
  address?: string;
  platform?: string;
  connectedAt: string;
}

export interface BotMessage {
  id: string;
  platform: 'telegram' | 'discord';
  tokenLabel: string;
  chatId: string;
  message: string;
  status: 'sent' | 'error' | 'pending';
  timestamp: string;
  response?: string;
}

export type NavTab = 'foundry' | 'hunter' | 'chat' | 'dna' | 'analytics' | 'search' | 'terminal' | 'config' | 'forge' | 'device' | 'bot';
export type HiveAgent = 'krackerjack' | 'hunterprime' | 'counsel' | 'grok';
