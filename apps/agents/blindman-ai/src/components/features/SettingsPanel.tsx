import { useCallback, useEffect, useState } from 'react';
import { AppSettings } from '@/types';
import { saveSettings } from '@/lib/storage';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
  onCacheMap?: () => Promise<void>;
  isCachingMap?: boolean;
  getCacheSize?: () => Promise<number>;
  onClearCache?: () => Promise<void>;
}

export function SettingsPanel({ settings, onUpdate, onClose, onCacheMap, isCachingMap, getCacheSize, onClearCache }: SettingsPanelProps) {
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [clearingCache, setClearingCache] = useState(false);

  const update = (partial: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...partial };
    onUpdate(newSettings);
    saveSettings(newSettings);
  };

  useEffect(() => {
    getCacheSize?.().then(size => setCacheSize(size));
  }, [getCacheSize, isCachingMap]);

  const handleClearCache = useCallback(async () => {
    setClearingCache(true);
    await onClearCache?.();
    setCacheSize(0);
    setClearingCache(false);
  }, [onClearCache]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-yellow-400 font-black text-xl uppercase tracking-widest">⚙ SETTINGS</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-2xl font-bold w-12 h-12 flex items-center justify-center rounded"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* Aggressive Mode */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-black uppercase tracking-wide">SAVAGE MODE</span>
            <button
              onClick={() => update({ aggressiveMode: !settings.aggressiveMode })}
              className={`w-16 h-8 rounded-full transition-colors relative ${settings.aggressiveMode ? 'bg-yellow-400' : 'bg-zinc-700'}`}
              aria-label={`Savage mode ${settings.aggressiveMode ? 'on' : 'off'}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-black transition-transform ${settings.aggressiveMode ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-zinc-400 text-sm font-mono">
            {settings.aggressiveMode ? 'ON — No-bullshit gritty responses (GROKSCHITT mode)' : 'OFF — Polite mode'}
          </p>
        </div>

        {/* Voice Speed */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-black uppercase tracking-wide">VOICE SPEED</span>
            <span className="text-yellow-400 font-mono font-bold">{settings.voiceSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range" min="0.5" max="2.0" step="0.1"
            value={settings.voiceSpeed}
            onChange={e => update({ voiceSpeed: parseFloat(e.target.value) })}
            className="w-full accent-yellow-400"
            aria-label="Voice speed"
          />
          <div className="flex justify-between text-zinc-500 text-xs font-mono mt-1">
            <span>SLOW (0.5x)</span><span>FAST (2.0x)</span>
          </div>
        </div>

        {/* Voice Pitch */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-black uppercase tracking-wide">VOICE PITCH</span>
            <span className="text-yellow-400 font-mono font-bold">{settings.voicePitch.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0.1" max="2.0" step="0.1"
            value={settings.voicePitch}
            onChange={e => update({ voicePitch: parseFloat(e.target.value) })}
            className="w-full accent-yellow-400"
            aria-label="Voice pitch"
          />
          <div className="flex justify-between text-zinc-500 text-xs font-mono mt-1">
            <span>DEEP</span><span>HIGH</span>
          </div>
        </div>

        {/* Volume */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-black uppercase tracking-wide">VOLUME</span>
            <span className="text-yellow-400 font-mono font-bold">{Math.round(settings.voiceVolume * 100)}%</span>
          </div>
          <input
            type="range" min="0.1" max="1.0" step="0.05"
            value={settings.voiceVolume}
            onChange={e => update({ voiceVolume: parseFloat(e.target.value) })}
            className="w-full accent-yellow-400"
            aria-label="Volume"
          />
        </div>

        {/* Language */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <span className="text-white font-black uppercase tracking-wide block mb-3">LANGUAGE</span>
          <select
            value={settings.language}
            onChange={e => update({ language: e.target.value })}
            className="w-full bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-3 font-mono text-base focus:outline-none focus:border-yellow-400"
            aria-label="Language selection"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="ja-JP">Japanese</option>
            <option value="zh-CN">Chinese (Simplified)</option>
          </select>
        </div>

        {/* Offline Map Cache */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-black uppercase tracking-wide">OFFLINE MAP CACHE</span>
            {cacheSize !== null && (
              <span className="text-zinc-400 font-mono text-xs">{cacheSize} tiles</span>
            )}
          </div>
          <p className="text-zinc-500 text-xs font-mono mb-4">
            Cache OSM map tiles around all saved places for offline use.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCacheMap}
              disabled={isCachingMap}
              className="bg-zinc-800 border border-yellow-600 text-yellow-400 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isCachingMap ? (
                <>
                  <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  CACHING…
                </>
              ) : '⬇ CACHE NOW'}
            </button>
            <button
              onClick={handleClearCache}
              disabled={clearingCache || !cacheSize}
              className="bg-zinc-800 border border-red-700 text-red-400 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform disabled:opacity-40"
            >
              {clearingCache ? 'CLEARING…' : '🗑 CLEAR'}
            </button>
          </div>
        </div>

        {/* AI Scene Vision info */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <span className="text-white font-black uppercase tracking-wide block mb-2">AI SCENE VISION</span>
          <p className="text-zinc-500 text-xs font-mono">
            Powered by Gemini 3 Flash via OnSpace AI.{'\n'}
            Say "describe the scene" or "what's ahead" to scan surroundings with camera.{'\n'}
            Grant camera permission when prompted.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400 text-xs font-mono">ACTIVE — camera + AI ready</span>
          </div>
        </div>

        {/* Landmark Voice Tags info */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <span className="text-white font-black uppercase tracking-wide block mb-2">LANDMARK VOICE TAGS</span>
          <p className="text-zinc-500 text-xs font-mono">
            While recording a route, say "mark landmark as coffee shop" to pin a spoken label at your GPS position. Labels are announced when you pass them during navigation.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={onClose}
          className="w-full bg-yellow-400 text-black font-black text-lg py-4 rounded-lg uppercase tracking-widest active:scale-95 transition-transform"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
}
