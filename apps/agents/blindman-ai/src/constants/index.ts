export const APP_NAME = 'BLINDMAN AI';

export const STORAGE_KEYS = {
  PLACES: 'blindman_places',
  ROUTES: 'blindman_routes',
  SETTINGS: 'blindman_settings',
  ONBOARDED: 'blindman_onboarded',
};

export const DEFAULT_SETTINGS = {
  voiceSpeed: 1.1,
  voicePitch: 0.9,
  voiceVolume: 1.0,
  language: 'en-US',
  aggressiveMode: true,
  compassEnabled: true,
  offlineTTS: true,
};

export const COMMAND_PATTERNS = {
  SAVE_PLACE: [
    /save (?:this )?(?:place|spot|location)(?: as (.+))?/i,
    /lock (?:this )?(?:spot|place|location)(?: as (.+))?/i,
    /mark (?:this )?(?:place|spot)(?: as (.+))?/i,
    /set (?:this )?(?:as |to )?(?:my )?(.+)/i,
  ],
  NAVIGATE_TO: [
    /(?:guide|take|haul|navigate|go|get) (?:me )?to (.+)/i,
    /(?:navigate|head) to (.+)/i,
    /run me to (.+)/i,
    /blast me to (.+)/i,
  ],
  WHERE_AM_I: [
    /where (?:am i|the fuck am i|the hell am i)/i,
    /what(?:'s| is) my (?:location|position)/i,
    /locate (?:me|myself)/i,
  ],
  START_ROUTE: [
    /start (?:logging|recording) (?:route|path)(?: to (.+))?/i,
    /record (?:route|path)(?: to (.+))?/i,
    /log (?:route|path)(?: to (.+))?/i,
  ],
  STOP_ROUTE: [
    /stop (?:logging|recording)(?: route| path)?/i,
    /finish (?:route|path)/i,
    /end (?:route|path) recording/i,
  ],
  LIST_PLACES: [
    /list (?:my )?(?:spots|places|locations)/i,
    /(?:show|read|tell me) (?:my )?(?:spots|places|locations)/i,
    /what (?:spots|places) do i have/i,
  ],
  LIST_ROUTES: [
    /list (?:my )?routes/i,
    /(?:show|read) (?:my )?routes/i,
    /what routes do i have/i,
  ],
  STOP_NAVIGATION: [
    /stop (?:navigation|navigating|guiding)/i,
    /cancel (?:navigation|this bullshit|route)/i,
    /abort (?:navigation|mission)/i,
  ],
  PAUSE_NAVIGATION: [
    /pause (?:navigation|guiding)/i,
    /hold (?:on|up)/i,
  ],
  RESUME_NAVIGATION: [
    /resume (?:navigation|guiding)/i,
    /continue (?:navigation|guiding)/i,
  ],
  DESCRIBE_SCENE: [
    /describe (?:the )?scene/i,
    /what(?:'s| is) (?:around|near|ahead)/i,
    /scan (?:for )?(?:landmarks|surroundings)/i,
  ],
  EMERGENCY: [
    /emergency/i,
    /evac/i,
    /nearest (?:safe )?(?:spot|place|zone)/i,
    /get me (?:safe|home|out)/i,
  ],
  HOME: [
    /(?:take|guide|haul) me home/i,
    /run me home/i,
    /go home/i,
  ],
  SETTINGS: [
    /(?:open|change|adjust) settings/i,
    /settings/i,
    /preferences/i,
  ],
  HELP: [
    /help/i,
    /commands/i,
    /what can (?:you|i) (?:do|say)/i,
    /cheat sheet/i,
  ],
  EXPORT: [
    /export (?:my )?(?:memories|data|places|routes)/i,
    /backup (?:my )?(?:data|memories)/i,
  ],
  WEATHER: [
    /weather/i,
    /what(?:'s| is) the weather/i,
  ],
  VOICE_NOTE: [
    /add (?:a )?voice note/i,
    /record (?:a )?note/i,
    /describe (?:this )?(?:spot|place|location)/i,
  ],
  MARK_LANDMARK: [
    /mark landmark(?: as (.+))?/i,
    /tag landmark(?: as (.+))?/i,
    /set landmark(?: as (.+))?/i,
    /landmark (.+)/i,
  ],
  CACHE_MAP: [
    /cache (?:the )?map/i,
    /download (?:the )?map/i,
    /save (?:the )?map offline/i,
    /offline map/i,
  ],
};

export const NAVIGATION_THRESHOLDS = {
  ARRIVAL_DISTANCE: 15, // meters
  DEVIATION_DISTANCE: 30, // meters off route
  OBSTACLE_WARNING_DISTANCE: 2, // meters (camera-based)
  NEXT_POINT_DISTANCE: 10, // meters to advance to next point
};

export const DIRECTIONS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
