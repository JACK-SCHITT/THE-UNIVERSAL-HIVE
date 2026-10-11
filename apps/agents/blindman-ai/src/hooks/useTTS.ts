import { useCallback, useRef } from 'react';
import { getSettings } from '@/lib/storage';

interface TTSQueue {
  text: string;
  priority: boolean;
  resolve: () => void;
}

export function useTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<TTSQueue[]>([]);
  const speakingRef = useRef(false);
  const voicesCachedRef = useRef<SpeechSynthesisVoice[]>([]);

  // Pre-cache voices immediately (browsers lazy-load them)
  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (voicesCachedRef.current.length > 0) return voicesCachedRef.current;
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) voicesCachedRef.current = v;
    return v;
  }, []);

  // Warm the voice cache on first call
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (window.speechSynthesis.onvoiceschanged === null) {
      window.speechSynthesis.onvoiceschanged = () => {
        voicesCachedRef.current = window.speechSynthesis.getVoices();
      };
    }
  }

  const _speak = useCallback((text: string): Promise<void> => {
    return new Promise<void>(resolve => {
      if (!('speechSynthesis' in window)) { resolve(); return; }

      const settings = getSettings();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.voiceSpeed;
      utterance.pitch = settings.voicePitch;
      utterance.volume = settings.voiceVolume;
      utterance.lang = settings.language;

      // Use cached voices — no blocking getVoices() call
      const voices = getVoices();
      const lang0 = settings.language.split('-')[0];

      // Prefer local/offline voice → faster, no network round-trip
      const localVoice =
        voices.find(v => v.localService && v.lang === settings.language) ||
        voices.find(v => v.localService && v.lang.startsWith(lang0));

      // Fallback: any matching language voice
      const anyVoice = localVoice ||
        voices.find(v => v.lang === settings.language) ||
        voices.find(v => v.lang.startsWith(lang0));

      if (anyVoice) utterance.voice = anyVoice;

      utteranceRef.current = utterance;
      speakingRef.current = true;

      utterance.onend = () => { speakingRef.current = false; resolve(); _drainQueue(); };
      utterance.onerror = () => { speakingRef.current = false; resolve(); _drainQueue(); };

      window.speechSynthesis.speak(utterance);
    });
  }, [getVoices]);

  const _drainQueue = useCallback(() => {
    if (speakingRef.current || queueRef.current.length === 0) return;
    const next = queueRef.current.shift()!;
    _speak(next.text).then(next.resolve);
  }, [_speak]);

  const speak = useCallback((text: string, priority = false): Promise<void> => {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    if (priority) {
      // Immediate cancel — don't wait for onend
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      // Clear queue — priority message jumps the line
      queueRef.current.forEach(q => q.resolve());
      queueRef.current = [];

      // Small yield to let cancel() flush (browser requirement)
      return new Promise<void>(resolve => {
        setTimeout(() => _speak(text).then(resolve), 50);
      });
    }

    // Non-priority: enqueue
    return new Promise<void>(resolve => {
      queueRef.current.push({ text, priority: false, resolve });
      _drainQueue();
    });
  }, [_speak, _drainQueue]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    queueRef.current.forEach(q => q.resolve());
    queueRef.current = [];
  }, []);

  const isSpeaking = useCallback(() => {
    return speakingRef.current || window.speechSynthesis.speaking;
  }, []);

  return { speak, stopSpeaking, isSpeaking };
}
