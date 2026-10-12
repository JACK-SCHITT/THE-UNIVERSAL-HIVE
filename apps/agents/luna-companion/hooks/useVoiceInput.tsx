import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || (typeof location!=="undefined"?location.origin:"")) || '';

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Microphone permission denied');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('🎤 Recording started');
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      setIsRecording(false);
      setIsTranscribing(true);
      console.log('🛑 Stopping recording');

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setIsTranscribing(false);
        return null;
      }

      // Get auth session
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsTranscribing(false);
        return null;
      }

      // Read audio file as base64
      let audioBase64 = '';
      if (Platform.OS !== 'web') {
        const { FileSystem } = await import('expo-file-system');
        audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Send to Edge Function for transcription
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transcribe',
          audioBase64,
          audioFormat: 'mp4',
        }),
      });

      if (!response.ok) {
        console.error('Transcription failed:', response.status);
        setIsTranscribing(false);
        return null;
      }

      const result = await response.json();
      setIsTranscribing(false);
      console.log('📝 Transcription:', result.text);
      return result.text || null;
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsTranscribing(false);
      return null;
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // ignore
      }
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsTranscribing(false);
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
