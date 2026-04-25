import { useEffect, useRef, useState, useCallback } from 'react';

type FacingMode = 'environment' | 'user';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ctxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  isActive: boolean;
  error: string | null;
  start: (overrideFacing?: FacingMode) => Promise<void>;
  stop: () => void;
  facingMode: FacingMode;
  toggleCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(
    async (overrideFacing?: FacingMode) => {
      const facing = overrideFacing ?? facingMode;
      try {
        setError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (canvasRef.current) {
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
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
    },
    [facingMode],
  );

  const toggleCamera = useCallback(() => {
    const wasActive = isActive;
    stop();
    const newFacing: FacingMode =
      facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (wasActive) {
      setTimeout(() => start(newFacing), 100);
    }
  }, [stop, start, isActive, facingMode]);

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
    streamRef,
    isActive,
    error,
    start,
    stop,
    facingMode,
    toggleCamera,
  };
}
