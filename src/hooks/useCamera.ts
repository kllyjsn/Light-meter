import { useEffect, useRef, useState, useCallback } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ctxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  facingMode: 'environment' | 'user';
  toggleCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment',
  );

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (canvasRef.current) {
        canvasRef.current.width = 160;
        canvasRef.current.height = 120;
        ctxRef.current = canvasRef.current.getContext('2d', {
          willReadFrequently: true,
        });
      }

      setIsActive(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Camera access denied';
      setError(msg);
      setIsActive(false);
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    stop();
    setFacingMode((prev) =>
      prev === 'environment' ? 'user' : 'environment',
    );
  }, [stop]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (isActive || error === null) {
      // Only auto-start if we were previously active or on initial mount
    }
  }, [facingMode, isActive, error]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    ctxRef,
    isActive,
    error,
    start,
    stop,
    facingMode,
    toggleCamera,
  };
}
