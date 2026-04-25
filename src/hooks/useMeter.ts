import { useRef, useState, useCallback, useEffect } from 'react';
import {
  analyzeFrame,
  computeHistogram,
  readImageCaptureSettings,
  backCalculateEV,
  pixelOnlyEV,
  type MeteringMode,
  type MeterReading,
} from '../lib/metering';
import { evToLux } from '../lib/exposure';

interface UseMeterReturn {
  ev: number;
  lux: number;
  luminance: number;
  histogram: number[];
  meteringMode: MeteringMode;
  setMeteringMode: (mode: MeteringMode) => void;
  evOffset: number;
  setEvOffset: (offset: number) => void;
  isRunning: boolean;
  isLocked: boolean;
  toggleLock: () => void;
  source: MeterReading['source'];
  readings: MeterReading[];
  clearReadings: () => void;
  saveReading: (overrideEv?: number) => void;
  startMetering: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    stream: MediaStream | null,
  ) => void;
  stopMetering: () => void;
}

const SMOOTHING_FACTOR = 0.12;
const MAX_READINGS = 50;

export function useMeter(): UseMeterReturn {
  const [ev, setEv] = useState(10);
  // lux is derived from adjustedEv via evToLux() in the return
  const [luminance, setLuminance] = useState(0);
  const [histogram, setHistogram] = useState<number[]>([]);
  const [meteringMode, setMeteringMode] = useState<MeteringMode>('center');
  const [evOffset, setEvOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [source, setSource] = useState<MeterReading['source']>('camera-pixel');
  const [readings, setReadings] = useState<MeterReading[]>([]);

  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const smoothEv = useRef(10);
  const frameCount = useRef(0);
  const lockedRef = useRef(false);
  const modeRef = useRef<MeteringMode>(meteringMode);

  // Keep ref in sync
  useEffect(() => {
    modeRef.current = meteringMode;
  }, [meteringMode]);
  useEffect(() => {
    lockedRef.current = isLocked;
  }, [isLocked]);

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => !prev);
  }, []);

  const saveReading = useCallback(
    (overrideEv?: number) => {
      const evValue = overrideEv ?? ev + evOffset;
      const reading: MeterReading = {
        ev100: evValue,
        lux: evToLux(evValue),
        rawLuminance: luminance,
        timestamp: Date.now(),
        meteringMode,
        source: overrideEv !== undefined ? 'manual' : source,
      };
      setReadings((prev) => [reading, ...prev].slice(0, MAX_READINGS));
    },
    [ev, evOffset, luminance, meteringMode, source],
  );

  const clearReadings = useCallback(() => {
    setReadings([]);
  }, []);

  const startMetering = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement,
      stream: MediaStream | null,
    ) => {
      runningRef.current = true;
      setIsRunning(true);
      let lastImageCaptureCheck = 0;
      let cachedCameraSettings: {
        exposureTime: number;
        iso: number;
        aperture: number;
      } | null = null;

      const tick = async () => {
        if (!runningRef.current) return;

        if (lockedRef.current) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const rawLum = analyzeFrame(canvas, ctx, video, modeRef.current);

        // Try ImageCapture API every 30 frames (~1 second)
        const now = frameCount.current++;
        if (stream && now - lastImageCaptureCheck > 30) {
          lastImageCaptureCheck = now;
          const track = stream.getVideoTracks()[0];
          if (track) {
            const settings = await readImageCaptureSettings(track);
            if (!runningRef.current) return;
            if (settings) {
              cachedCameraSettings = settings;
              setSource('camera-imagecapture');
            }
          }
        }

        let rawEv: number;
        if (cachedCameraSettings) {
          rawEv = backCalculateEV(
            cachedCameraSettings.exposureTime,
            cachedCameraSettings.iso,
            cachedCameraSettings.aperture,
            rawLum,
          );
        } else {
          rawEv = pixelOnlyEV(rawLum);
          setSource('camera-pixel');
        }

        // Exponential smoothing
        smoothEv.current += (rawEv - smoothEv.current) * SMOOTHING_FACTOR;

        setLuminance(rawLum);
        setEv(smoothEv.current);

        // Update histogram every 10 frames
        if (now % 10 === 0) {
          const hist = computeHistogram(canvas, ctx, video);
          setHistogram(hist);
        }

        if (runningRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const stopMetering = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const adjustedEv = ev + evOffset;

  return {
    ev: adjustedEv,
    lux: evToLux(adjustedEv),
    luminance,
    histogram,
    meteringMode,
    setMeteringMode,
    evOffset,
    setEvOffset,
    isRunning,
    isLocked,
    toggleLock,
    source,
    readings,
    clearReadings,
    saveReading,
    startMetering,
    stopMetering,
  };
}
