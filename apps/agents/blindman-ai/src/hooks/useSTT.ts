import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings } from '@/lib/storage';

interface STTOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSTT(options: STTOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micPermission, setMicPermission] = useState<PermissionState | 'unknown'>('unknown');

  // Keep options in a ref so callbacks are always fresh without re-creating startListening
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; }, [options]);

  // Non-blocking permission state check on mount (display only — no getUserMedia call)
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then(status => {
        setMicPermission(status.state);
        // Watch for future permission changes (e.g. user unblocks in settings)
        status.onchange = () => setMicPermission(status.state);
      })
      .catch(() => { /* browser doesn't support this query — ignore */ });
  }, []);

  const startListening = useCallback(() => {
    // 1. HTTPS check (mic & SpeechRecognition both require secure context)
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost'
    ) {
      optionsRef.current.onError?.(
        'Microphone requires HTTPS. Use the published app URL — not the preview link.'
      );
      return;
    }

    // 2. Browser support check
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      optionsRef.current.onError?.(
        'Speech recognition not supported. Use Chrome or Edge on Android / desktop.'
      );
      return;
    }

    // 3. Abort any active session first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const settings = getSettings();
    const recognition = new SpeechRecognition() as SpeechRecognition;

    // ── KEY: let SpeechRecognition own the mic — no getUserMedia conflict ──
    recognition.continuous = false;   // one phrase per tap (Android-safe)
    recognition.interimResults = true;
    recognition.lang = settings.language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermission('granted');
      optionsRef.current.onStart?.();
      console.log('[STT] Listening — lang:', settings.language);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }

      if (interim) {
        setInterimText(interim);
        optionsRef.current.onResult(interim, false);
      }
      if (final) {
        console.log('[STT] Final:', final);
        setInterimText('');
        optionsRef.current.onResult(final.trim(), true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      console.log('[STT] Session ended');
      optionsRef.current.onEnd?.();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setInterimText('');
      console.warn('[STT] Error:', event.error);

      // These are non-fatal — treat as normal end
      if (event.error === 'no-speech' || event.error === 'aborted') {
        optionsRef.current.onEnd?.();
        return;
      }

      let msg: string;
      switch (event.error) {
        case 'not-allowed':
          msg = 'Microphone blocked. Tap the lock icon in the browser address bar → allow microphone → try again.';
          setMicPermission('denied');
          break;
        case 'audio-capture':
          msg = 'No microphone detected. Check that a mic is connected and not in use by another app.';
          break;
        case 'network':
          msg = 'Network error with speech service. Check your internet connection.';
          break;
        case 'service-not-allowed':
          msg = 'Speech service blocked by browser. Try Chrome on Android or desktop.';
          break;
        case 'language-not-supported':
          msg = `Language "${settings.language}" not supported. Switch to English in Settings.`;
          break;
        default:
          msg = `Mic error: ${event.error}. Try tapping the button again.`;
      }

      optionsRef.current.onError?.(msg);
      optionsRef.current.onEnd?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      console.error('[STT] start() threw:', err);
      // InvalidStateError = already started — abort and retry once
      if (err?.name === 'InvalidStateError') {
        try { recognition.abort(); } catch { /* ignore */ }
        setTimeout(() => {
          try { recognition.start(); } catch { /* give up */ }
        }, 200);
      } else {
        optionsRef.current.onError?.(`Could not start mic: ${err?.message ?? String(err)}`);
        setIsListening(false);
      }
    }
  }, []);   // stable — options read via ref, no deps needed

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  return { isListening, interimText, micPermission, startListening, stopListening };
}
