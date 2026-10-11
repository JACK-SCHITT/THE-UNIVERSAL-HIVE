import { useCallback, useRef, useState } from 'react';

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsActive(true);
      return true;
    } catch (err) {
      console.error('[Camera] Failed to start:', err);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  /** Capture a single frame from the active camera stream as base64 JPEG. */
  const captureFrame = useCallback((): string | null => {
    const stream = streamRef.current;
    if (!stream) return null;

    const track = stream.getVideoTracks()[0];
    if (!track) return null;

    // Use ImageCapture API if available (faster, no DOM element needed)
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    // We need a video element to draw from
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    // Capture synchronously from a short-lived video element
    // Note: frame may be blank if video hasn't loaded — caller should use captureFrameAsync
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.srcObject = null;

    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  /** Async frame capture — waits for first video frame to render. */
  const captureFrameAsync = useCallback((): Promise<string | null> => {
    return new Promise(resolve => {
      const stream = streamRef.current;
      if (!stream) { resolve(null); return; }

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      video.oncanplay = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0);
        video.srcObject = null;
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      video.onerror = () => { video.srcObject = null; resolve(null); };
      setTimeout(() => { video.srcObject = null; resolve(null); }, 5000);
    });
  }, []);

  return { isActive, startCamera, stopCamera, captureFrame, captureFrameAsync, videoRef };
}
