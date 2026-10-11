export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  apiKey?: string;
  githubToken?: string;
  avatar?: string;
  createdAt: string;
  lastActive?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultModel: GeminiModel;
  theme: 'dark' | 'darker' | 'midnight';
  fontSize: 'sm' | 'md' | 'lg';
  codeTheme: string;
  systemPrompt?: string;
}

export type GeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: GeminiModel;
  attachments?: Attachment[];
  codeBlocks?: CodeBlock[];
}

export interface Attachment {
  type: 'file' | 'image' | 'code' | 'github';
  name: string;
  content: string;
  language?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  projectId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  model: GeminiModel;
  systemPrompt?: string;
  tags?: string[];
  isShared?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  githubRepo?: string;
  integrations: Integration[];
  sharedConversations: string[];
  systemPrompt?: string;
  tags?: string[];
}

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

export type IntegrationType =
  | 'github'
  | 'gitlab'
  | 'jira'
  | 'slack'
  | 'discord'
  | 'webhook'
  | 'rest_api'
  | 'database'
  | 'docker'
  | 'kubernetes'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'vercel'
  | 'netlify'
  | 'custom';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: string;
  url: string;
  body: string;
  additions: number;
  deletions: number;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  createdAt: string;
  url: string;
  labels: string[];
  body: string;
}

export interface AppSettings {
  rootKey: string;
  appName: string;
  maxTeamSize: number;
  allowSelfRegister: boolean;
  requireApiKey: boolean;
  defaultModel: GeminiModel;
  maintenanceMode: boolean;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
