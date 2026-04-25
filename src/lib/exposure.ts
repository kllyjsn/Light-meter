import {
  APERTURES,
  SHUTTER_SPEEDS,
  ISO_VALUES,
  ND_FILTER_STOPS,
  type Aperture,
} from './x100v';

/** Convert illuminance (lux) to EV at ISO 100. */
export function luxToEV(lux: number): number {
  if (lux <= 0) return -6;
  return Math.log2(lux / 2.5);
}

/** Convert EV at ISO 100 to approximate lux. */
export function evToLux(ev: number): number {
  return 2.5 * Math.pow(2, ev);
}

export interface ExposureTriangle {
  aperture: number;
  shutterSpeed: number;
  iso: number;
  needsND?: boolean;
  needsElectronicShutter?: boolean;
  slowShutter?: boolean;
}

// Minimum handheld-safe shutter for 35mm equiv focal length (1/60s for 35mm)
const HANDHELD_MIN_SHUTTER = 1 / 60;

/** Given EV₁₀₀ and a preferred aperture, find the best shutter + ISO combo. */
export function solveAperturePriority(
  ev100: number,
  preferredAperture: Aperture,
  useND = false,
): ExposureTriangle {
  const effectiveEv = useND ? ev100 - ND_FILTER_STOPS : ev100;
  const av = 2 * Math.log2(preferredAperture);

  // First pass: prefer handheld-safe shutter speeds (>= 1/60s)
  for (const iso of ISO_VALUES) {
    const sv = Math.log2(iso / 100);
    const tv = effectiveEv + sv - av;
    const t = Math.pow(2, -tv);
    const closest = findClosestShutter(t);
    if (closest !== null && closest <= HANDHELD_MIN_SHUTTER) {
      return {
        aperture: preferredAperture,
        shutterSpeed: closest,
        iso,
        needsND: useND,
        needsElectronicShutter: closest < 1 / 4000,
      };
    }
  }

  // Second pass: allow slow shutters if no handheld-safe combo exists
  for (const iso of ISO_VALUES) {
    const sv = Math.log2(iso / 100);
    const tv = effectiveEv + sv - av;
    const t = Math.pow(2, -tv);
    const closest = findClosestShutter(t);
    if (closest !== null) {
      return {
        aperture: preferredAperture,
        shutterSpeed: closest,
        iso,
        needsND: useND,
        needsElectronicShutter: closest < 1 / 4000,
        slowShutter: closest > HANDHELD_MIN_SHUTTER,
      };
    }
  }

  // If no valid combo found without ND, try with ND
  if (!useND && ev100 > 14) {
    return solveAperturePriority(ev100, preferredAperture, true);
  }

  return {
    aperture: preferredAperture,
    shutterSpeed: SHUTTER_SPEEDS[SHUTTER_SPEEDS.length - 1],
    iso: ISO_VALUES[ISO_VALUES.length - 1],
    needsND: useND,
  };
}

/** Given EV₁₀₀ and a preferred shutter speed, find the best aperture + ISO. */
export function solveShutterPriority(
  ev100: number,
  preferredShutter: number,
  useND = false,
): ExposureTriangle {
  const effectiveEv = useND ? ev100 - ND_FILTER_STOPS : ev100;
  const tv = -Math.log2(preferredShutter);

  for (const iso of ISO_VALUES) {
    const sv = Math.log2(iso / 100);
    const av = effectiveEv + sv - tv;
    const n = Math.pow(2, av / 2);

    const closest = findClosestAperture(n);
    if (closest !== null) {
      return {
        aperture: closest,
        shutterSpeed: preferredShutter,
        iso,
        needsND: useND,
        needsElectronicShutter: preferredShutter < 1 / 4000,
      };
    }
  }

  if (!useND && ev100 > 14) {
    return solveShutterPriority(ev100, preferredShutter, true);
  }

  return {
    aperture: APERTURES[APERTURES.length - 1],
    shutterSpeed: preferredShutter,
    iso: ISO_VALUES[ISO_VALUES.length - 1],
    needsND: useND,
  };
}

/** Program mode: pick a balanced combination optimized for sharpness. */
export function solveProgram(ev100: number): ExposureTriangle {
  let best: ExposureTriangle | null = null;
  let bestScore = Infinity;

  for (const useND of [false, true]) {
    const effectiveEv = useND ? ev100 - ND_FILTER_STOPS : ev100;

    for (const aperture of APERTURES) {
      for (const iso of ISO_VALUES) {
        const av = 2 * Math.log2(aperture);
        const sv = Math.log2(iso / 100);
        const tv = effectiveEv + sv - av;
        const t = Math.pow(2, -tv);
        const closest = findClosestShutter(t);
        if (closest === null) continue;

        // Score: prefer low ISO, sharpest apertures (f/5.6-f/8), safe handheld shutter
        const isoScore = Math.log2(iso / 100) * 3;
        const sharpness = Math.abs(Math.log2(aperture / 5.6)); // f/5.6 is sharpest
        const handhold = closest > HANDHELD_MIN_SHUTTER ? 10 : 0; // heavy penalty for slow shutter
        const ndPenalty = useND ? 0.5 : 0;
        const score = isoScore + sharpness + handhold + ndPenalty;

        if (score < bestScore) {
          bestScore = score;
          best = {
            aperture,
            shutterSpeed: closest,
            iso,
            needsND: useND,
            needsElectronicShutter: closest < 1 / 4000,
          };
        }
      }
    }
  }

  return best ?? { aperture: 8, shutterSpeed: 1 / 125, iso: 200 };
}

/** Check exposure correctness for manual mode. Returns stops over/under. */
export function checkExposure(
  ev100: number,
  aperture: number,
  shutterSpeed: number,
  iso: number,
  useND = false,
): number {
  const effectiveEv = useND ? ev100 - ND_FILTER_STOPS : ev100;
  const cameraEv = 2 * Math.log2(aperture) + Math.log2(1 / shutterSpeed);
  const requiredEv = effectiveEv + Math.log2(iso / 100);
  return requiredEv - cameraEv;
}

/** Generate multiple exposure combos for a given EV, sorted by quality. */
export function generateCombinations(
  ev100: number,
  count = 12,
): ExposureTriangle[] {
  const results: ExposureTriangle[] = [];

  for (const useND of [false, true]) {
    const effectiveEv = useND ? ev100 - ND_FILTER_STOPS : ev100;

    for (const aperture of APERTURES) {
      for (const iso of ISO_VALUES) {
        const av = 2 * Math.log2(aperture);
        const sv = Math.log2(iso / 100);
        const tv = effectiveEv + sv - av;
        const t = Math.pow(2, -tv);
        const closest = findClosestShutter(t);
        if (closest === null) continue;

        results.push({
          aperture,
          shutterSpeed: closest,
          iso,
          needsND: useND,
          needsElectronicShutter: closest < 1 / 4000,
        });
      }
    }
  }

  // Sort: prefer no-ND, low ISO, then sharp apertures
  results.sort((a, b) => {
    if (a.needsND !== b.needsND) return a.needsND ? 1 : -1;
    if (a.iso !== b.iso) return a.iso - b.iso;
    const aSharp = Math.abs(Math.log2(a.aperture / 5.6));
    const bSharp = Math.abs(Math.log2(b.aperture / 5.6));
    return aSharp - bSharp;
  });

  return results.slice(0, count);
}

function findClosestShutter(target: number): number | null {
  let closest: number | null = null;
  let minDiff = Infinity;
  for (const s of SHUTTER_SPEEDS) {
    const diff = Math.abs(Math.log2(s) - Math.log2(target));
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return minDiff <= 0.5 ? closest : null;
}

function findClosestAperture(target: number): Aperture | null {
  let closest: Aperture | null = null;
  let minDiff = Infinity;
  for (const a of APERTURES) {
    const diff = Math.abs(Math.log2(a) - Math.log2(target));
    if (diff < minDiff) {
      minDiff = diff;
      closest = a;
    }
  }
  return minDiff <= 0.5 ? closest : null;
}

export function evToSceneDescription(ev: number): string {
  if (ev <= -4) return 'Milky Way, deep starlight';
  if (ev <= -2) return 'Starlight, aurora';
  if (ev <= 0) return 'Full moon landscape';
  if (ev <= 2) return 'Dim street, moonlight';
  if (ev <= 4) return 'Candlelight, dark interior';
  if (ev <= 5) return 'Indoor, tungsten lamp';
  if (ev <= 6) return 'Home interior';
  if (ev <= 7) return 'Moderately lit room';
  if (ev <= 8) return 'Office, bright interior';
  if (ev <= 9) return 'Bright window light';
  if (ev <= 10) return 'Shade, heavy overcast';
  if (ev <= 11) return 'Open shade, light overcast';
  if (ev <= 12) return 'Cloudy bright';
  if (ev <= 13) return 'Hazy sun, soft shadow';
  if (ev <= 14) return 'Bright sun, distinct shadow';
  if (ev <= 15) return 'Bright sun on light sand/snow';
  if (ev <= 16) return 'Harsh direct sun';
  return 'Extremely bright';
}

/** Sunny 16 reference table */
export const SUNNY_16_TABLE = [
  { condition: 'Snow/Sand', ev: 16, rule: 'f/22 or f/16 + ND' },
  { condition: 'Bright Sun', ev: 15, rule: 'f/16' },
  { condition: 'Hazy Sun', ev: 14, rule: 'f/11' },
  { condition: 'Cloudy Bright', ev: 13, rule: 'f/8' },
  { condition: 'Overcast', ev: 12, rule: 'f/5.6' },
  { condition: 'Heavy Overcast', ev: 11, rule: 'f/4' },
  { condition: 'Open Shade', ev: 10, rule: 'f/2.8' },
  { condition: 'Deep Shade', ev: 9, rule: 'f/2' },
] as const;

export function suggestFilmSimulations(ev: number): {
  primary: string;
  alt: string;
  reason: string;
} {
  if (ev <= 4) {
    return {
      primary: 'Eterna',
      alt: 'Classic Chrome',
      reason: 'Low noise handling, gentle tonal rolloff in shadows',
    };
  }
  if (ev <= 7) {
    return {
      primary: 'Classic Chrome',
      alt: 'Pro Neg. Std',
      reason: 'Great tungsten/warm light rendering, muted but rich',
    };
  }
  if (ev <= 10) {
    return {
      primary: 'Classic Neg.',
      alt: 'Astia/Soft',
      reason: 'Beautiful in flat light, adds character without over-processing',
    };
  }
  if (ev <= 13) {
    return {
      primary: 'Provia/Standard',
      alt: 'Classic Chrome',
      reason: 'Natural rendition for even lighting, reliable colors',
    };
  }
  return {
    primary: 'Velvia/Vivid',
    alt: 'Classic Neg.',
    reason: 'Punchy colors in bright light, deep blues and greens',
  };
}
