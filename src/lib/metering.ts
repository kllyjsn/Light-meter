export type MeteringMode = 'matrix' | 'center' | 'spot';

export interface MeterReading {
  ev100: number;
  lux: number;
  rawLuminance: number;
  timestamp: number;
  meteringMode: MeteringMode;
  source: 'camera-imagecapture' | 'camera-pixel' | 'ambient-sensor' | 'manual';
}

/**
 * Attempt to use the ImageCapture API to read actual camera exposure settings.
 * This gives us the most accurate EV reading by back-calculating from the
 * camera's auto-exposure parameters.
 */
export async function readImageCaptureSettings(
  track: MediaStreamTrack,
): Promise<{ exposureTime: number; iso: number; aperture: number } | null> {
  try {
    if (!('ImageCapture' in window)) return null;
    const ic = new ImageCapture(track);
    const settings = track.getSettings();

    const exposureTime =
      (settings as Record<string, unknown>).exposureTime as number | undefined;
    const iso =
      (settings as Record<string, unknown>).iso as number | undefined;

    // Phone cameras typically have a fixed aperture
    const fNumber = 1.8; // typical phone rear camera

    if (exposureTime && iso) {
      return { exposureTime, iso, aperture: fNumber };
    }

    // Try getPhotoSettings as fallback
    try {
      const photoSettings = await ic.getPhotoSettings();
      const pExposure = (photoSettings as Record<string, unknown>)
        .exposureTime as number | undefined;
      const pIso = (photoSettings as Record<string, unknown>).iso as
        | number
        | undefined;
      if (pExposure && pIso) {
        return { exposureTime: pExposure, iso: pIso, aperture: fNumber };
      }
    } catch {
      // getPhotoSettings not supported
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Back-calculate scene EV100 from camera exposure metadata.
 *
 * This is the standard metering equation used by all camera light meters:
 *   EV = log2(N² / t)
 *   EV100 = EV − log2(ISO / 100)
 *
 * The camera's auto-exposure already chose settings to properly expose
 * the scene, so the metadata alone determines scene EV. No pixel-brightness
 * correction is applied — that would just add auto-exposure noise.
 */
export function backCalculateEV(
  exposureTime: number,
  iso: number,
  aperture: number,
): number {
  const ev = Math.log2((aperture * aperture) / exposureTime);
  return ev - Math.log2(iso / 100);
}

/**
 * Analyze a video frame and return average luminance (0–1).
 * Uses perceptual luminance weights and metering-mode spatial weighting.
 * Samples every 4th pixel for performance.
 */
export function analyzeFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  mode: MeteringMode,
): number {
  const w = canvas.width;
  const h = canvas.height;

  ctx.drawImage(video, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  let totalWeight = 0;
  let totalLum = 0;

  // Sample every 4th pixel (stride of 16 bytes)
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Linearize sRGB
    const rLin = srgbToLinear(r / 255);
    const gLin = srgbToLinear(g / 255);
    const bLin = srgbToLinear(b / 255);
    const lum = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;

    const pixIdx = i / 4;
    const px = pixIdx % w;
    const py = Math.floor(pixIdx / w);
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxR;

    let weight: number;
    switch (mode) {
      case 'spot':
        weight = dist < 0.12 ? 1 : 0;
        break;
      case 'center':
        weight = Math.exp(-3 * dist * dist); // gaussian falloff
        break;
      case 'matrix':
      default:
        weight = 1;
        break;
    }

    totalWeight += weight;
    totalLum += lum * weight;
  }

  return totalWeight > 0 ? totalLum / totalWeight : 0;
}

/**
 * Compute histogram from frame data (256 bins).
 */
export function computeHistogram(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
): number[] {
  const w = canvas.width;
  const h = canvas.height;
  ctx.drawImage(video, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const hist = new Array<number>(256).fill(0);

  for (let i = 0; i < data.length; i += 16) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[lum]++;
  }

  // Normalize
  const max = Math.max(...hist);
  if (max > 0) {
    for (let i = 0; i < 256; i++) hist[i] /= max;
  }
  return hist;
}

/**
 * Pixel-only EV estimation (fallback when ImageCapture is unavailable).
 *
 * Phone cameras auto-expose to keep frames near mid-gray (~0.18 linear),
 * so pixel brightness is a compressed proxy for scene EV. This is inherently
 * approximate — use the EV compensation slider to calibrate against a known
 * reference (e.g. Sunny 16 chart).
 *
 * Base EV 7 sits between typical indoor (5–8) and outdoor (10–15).
 * Gain of 2.5 expands the compressed range to roughly EV 3–12.
 */
export function pixelOnlyEV(linearBrightness: number): number {
  const baseEv = 7;
  const gain = 2.5;
  const adjust = Math.log2(Math.max(linearBrightness, 0.0001) / 0.18);
  return baseEv + gain * adjust;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getMeteringRegion(
  mode: MeteringMode,
): { radiusPct: number; label: string } {
  switch (mode) {
    case 'spot':
      return { radiusPct: 12, label: 'Spot' };
    case 'center':
      return { radiusPct: 50, label: 'Center-Weighted' };
    case 'matrix':
      return { radiusPct: 100, label: 'Multi' };
  }
}
