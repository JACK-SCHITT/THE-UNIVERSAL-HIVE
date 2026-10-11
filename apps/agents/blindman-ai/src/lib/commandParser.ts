import { COMMAND_PATTERNS } from '@/constants';
import { SOUL_VOICE } from '@/lib/soul';

export type CommandType =
  | 'SAVE_PLACE'
  | 'NAVIGATE_TO'
  | 'WHERE_AM_I'
  | 'START_ROUTE'
  | 'STOP_ROUTE'
  | 'LIST_PLACES'
  | 'LIST_ROUTES'
  | 'STOP_NAVIGATION'
  | 'PAUSE_NAVIGATION'
  | 'RESUME_NAVIGATION'
  | 'DESCRIBE_SCENE'
  | 'EMERGENCY'
  | 'HOME'
  | 'SETTINGS'
  | 'HELP'
  | 'EXPORT'
  | 'WEATHER'
  | 'VOICE_NOTE'
  | 'MARK_LANDMARK'
  | 'CACHE_MAP'
  | 'UNKNOWN';

export interface ParsedCommand {
  type: CommandType;
  rawText: string;
  param?: string;
}

export function parseCommand(text: string): ParsedCommand {
  const normalized = text.toLowerCase().trim();

  for (const [cmdType, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        const param = match[1]?.trim();
        return {
          type: cmdType as CommandType,
          rawText: text,
          param,
        };
      }
    }
  }

  return { type: 'UNKNOWN', rawText: text };
}

export function getHelpText(aggressive: boolean): string {
  const motd = SOUL_VOICE.helpMotd();
  if (aggressive) {
    return `${motd}
    Your command arsenal, soldier:
    Say "save place as my spot name" — lock a location.
    Say "guide me to my spot name" — move out.
    Say "where the fuck am I" — get your position.
    Say "start logging route to place name" — record a path.
    Say "stop logging" — save the recorded route.
    Say "list my spots" — hear your saved locations.
    Say "list routes" — saved routes.
    Say "describe the scene" — scan surroundings.
    Say "emergency" — nearest safe zone fast.
    Say "export my memories" — backup your data.
    Say "stop navigation" — cancel a route.
    Say "pause" or "resume navigation".
    Say "settings" — adjust preferences.
    ${SOUL_VOICE.RIDE_OR_DIE}`;
  }
  return `${motd}
  Available commands:
  Save place as name.
  Guide me to name.
  Where am I.
  Start logging route to name.
  Stop logging.
  List my spots.
  List routes.
  Describe the scene.
  Emergency.
  Export my memories.
  Stop, pause, or resume navigation.
  Settings.`;
}

export function getSceneDescription(position: { lat: number; lng: number } | null, aggressive: boolean): string {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 20;
  const timeDesc = isDay ? 'daytime' : 'nighttime';
  const timeHint = hour >= 20 ? 'night conditions — watch for poor lighting' : hour < 6 ? 'pre-dawn — minimal foot traffic' : 'good visibility window';

  if (aggressive) {
    const descs = [
      `Scene scan: ${timeDesc} — ${timeHint}. Urban environment, concrete underfoot. Traffic noise to your left, open space ahead. GPS confirms street level. Watch the curb edges — they're sneaky little shits. ${SOUL_VOICE.BASE_AWARENESS}`,
      `Scanning your zone. ${timeDesc.toUpperCase()}, ${timeHint}. Footsteps and vehicle noise nearby. Standard city sidewalk. No major obstacles flagged in immediate zone. Keep that cane swinging.`,
      `You're at street level, ${timeDesc}. ${timeHint}. Engine noise suggests a road nearby. Wind from the east, light. Stay sharp — curbs and doorways are the usual traps.`,
    ];
    return descs[Math.floor(Math.random() * descs.length)];
  }

  return `It is ${timeDesc} — ${timeHint}. You appear to be in an urban area. Traffic noise is nearby. Ground appears to be a sidewalk. Please use your cane to check for obstacles ahead.`;
}
