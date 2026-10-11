import type { User, Conversation, Project, AppSettings, GeminiModel } from '@/types';

const USERS_KEY = 'tg_users';
const CURRENT_USER_KEY = 'tg_current_user';
const CONVERSATIONS_KEY = 'tg_conversations';
const PROJECTS_KEY = 'tg_projects';
const SETTINGS_KEY = 'tg_settings';

// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  rootKey: '',
  appName: 'TeamGemini',
  maxTeamSize: 20,
  allowSelfRegister: false,
  requireApiKey: false,
  defaultModel: 'gemini-2.5-flash',
  maintenanceMode: false,
};

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  name: 'Admin',
  email: 'admin@teamgemini.local',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date().toISOString(),
  preferences: {
    defaultModel: 'gemini-2.5-pro',
    theme: 'midnight',
    fontSize: 'md',
    codeTheme: 'dracula',
  },
};

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initStorage() {
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
  }
  if (!localStorage.getItem(CONVERSATIONS_KEY)) {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PROJECTS_KEY)) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

export function deleteUser(id: string) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function login(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    updateUser(user.id, { lastActive: new Date().toISOString() });
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  return getUserById(id) || null;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export function getConversations(): Conversation[] {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getUserConversations(userId: string): Conversation[] {
  return getConversations().filter(c => c.userId === userId);
}

export function getProjectConversations(projectId: string): Conversation[] {
  return getConversations().filter(c => c.projectId === projectId && c.isShared);
}

export function saveConversations(convs: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export function createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Conversation {
  const convs = getConversations();
  const newConv: Conversation = {
    ...conv,
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveConversations([...convs, newConv]);
  return newConv;
}

export function updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
  const convs = getConversations();
  const idx = convs.findIndex(c => c.id === id);
  if (idx === -1) return null;
  convs[idx] = { ...convs[idx], ...updates, updatedAt: new Date().toISOString() };
  saveConversations(convs);
  return convs[idx];
}

export function deleteConversation(id: string) {
  saveConversations(getConversations().filter(c => c.id !== id));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getUserProjects(userId: string): Project[] {
  return getProjects().filter(p => p.members.includes(userId));
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  saveProjects([...projects, newProject]);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string) {
  saveProjects(getProjects().filter(p => p.id !== id));
}

// ─── API Key Helpers ──────────────────────────────────────────────────────────

export function getEffectiveApiKey(userId: string): string {
  const user = getUserById(userId);
  if (user?.apiKey) return user.apiKey;
  const settings = getSettings();
  return settings.rootKey || '';
}

export function getDefaultModel(userId: string): GeminiModel {
  const user = getUserById(userId);
  return user?.preferences?.defaultModel || 'gemini-2.5-flash';
}
