import { useRef, useState, useCallback, useEffect } from 'react';
import { analyzeFrame, luminanceToLux, type MeteringMode } from '../lib/metering';
import { luxToEV } from '../lib/exposure';

interface UseMeterReturn {
  ev: number;
  lux: number;
  luminance: number;
  meteringMode: MeteringMode;
  setMeteringMode: (mode: MeteringMode) => void;
  evOffset: number;
  setEvOffset: (offset: number) => void;
  isRunning: boolean;
  startMetering: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
  ) => void;
  stopMetering: () => void;
}

export function useMeter(): UseMeterReturn {
  const [ev, setEv] = useState(10);
  const [lux, setLux] = useState(0);
  const [luminance, setLuminance] = useState(0);
  const [meteringMode, setMeteringMode] = useState<MeteringMode>('center');
  const [evOffset, setEvOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef<number>(0);
  const smoothEv = useRef(10);

  const startMetering = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement,
    ) => {
      setIsRunning(true);

      const tick = () => {
        const rawLum = analyzeFrame(canvas, ctx, video, meteringMode);
        const rawLux = luminanceToLux(rawLum);
        const rawEv = luxToEV(rawLux);

        // Exponential smoothing
        smoothEv.current += (rawEv - smoothEv.current) * 0.15;

        setLuminance(rawLum);
        setLux(rawLux);
        setEv(smoothEv.current);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [meteringMode],
  );

  const stopMetering = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const adjustedEv = ev + evOffset;

  return {
    ev: adjustedEv,
    lux,
    luminance,
    meteringMode,
    setMeteringMode,
    evOffset,
    setEvOffset,
    isRunning,
    startMetering,
    stopMetering,
  };
}
