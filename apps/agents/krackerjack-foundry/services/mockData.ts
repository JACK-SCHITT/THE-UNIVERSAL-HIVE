// KRACKERJACK FOUNDRY — Mock Data Service

export interface Repo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  status: 'assimilated' | 'pending' | 'scanning' | 'target';
  stars: number;
  language: string;
  lastUpdated: string;
  hiveStrength: number; // 0-100
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  message: string;
}

export const MOCK_REPOS: Repo[] = [
  {
    id: '1',
    name: 'FreqBoardSleuth',
    fullName: 'JACK-SCHITT/FreqBoardSleuth',
    description: 'Frequency pattern analysis and hunting board',
    status: 'assimilated',
    stars: 12,
    language: 'Python',
    lastUpdated: '2 days ago',
    hiveStrength: 92,
  },
  {
    id: '2',
    name: 'HunterPrime',
    fullName: 'JACK-SCHITT/HunterPrime',
    description: 'Primary target acquisition and tracking system',
    status: 'assimilated',
    stars: 7,
    language: 'TypeScript',
    lastUpdated: '5 hours ago',
    hiveStrength: 88,
  },
  {
    id: '3',
    name: 'GROKSCHITT',
    fullName: 'JACK-SCHITT/GROKSCHITT',
    description: 'Deep pattern grokking and neural analysis',
    status: 'assimilated',
    stars: 4,
    language: 'JavaScript',
    lastUpdated: '1 day ago',
    hiveStrength: 76,
  },
  {
    id: '4',
    name: 'BlindmanNavigator',
    fullName: 'JACK-SCHITT/BlindmanNavigator',
    description: 'AI navigation for the visually impaired — least traveled path',
    status: 'assimilated',
    stars: 31,
    language: 'TypeScript',
    lastUpdated: '3 days ago',
    hiveStrength: 95,
  },
  {
    id: '5',
    name: 'SpamHunter-X',
    fullName: 'JACK-SCHITT/SpamHunter-X',
    description: 'Automated spam detection and elimination protocol',
    status: 'pending',
    stars: 2,
    language: 'Python',
    lastUpdated: '1 week ago',
    hiveStrength: 0,
  },
  {
    id: '6',
    name: 'MemoriesOfBetterDays',
    fullName: 'JACK-SCHITT/MemoriesOfBetterDays',
    description: 'Music archive and memory vault — AI-curated',
    status: 'target',
    stars: 19,
    language: 'JavaScript',
    lastUpdated: '2 weeks ago',
    hiveStrength: 0,
  },
];

export const INITIAL_LOG: LogEntry[] = [
  {
    id: 'l1',
    timestamp: '00:00:01',
    type: 'info',
    message: 'KRACKERJACK FOUNDRY HIVE initialized.',
  },
  {
    id: 'l2',
    timestamp: '00:00:02',
    type: 'success',
    message: 'HunterPrime agent online. Scanning grid...',
  },
  {
    id: 'l3',
    timestamp: '00:00:03',
    type: 'success',
    message: '4 repos already assimilated into the Hive.',
  },
  {
    id: 'l4',
    timestamp: '00:00:04',
    type: 'warning',
    message: '2 targets identified for assimilation.',
  },
];

export function generateLogId(): string {
  return `l${Date.now()}`;
}

export function getTimestamp(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
