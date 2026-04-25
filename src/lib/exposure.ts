import {
  APERTURES,
  SHUTTER_SPEEDS,
  ISO_VALUES,
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
}

/** Given EV₁₀₀ and a preferred aperture, find the best shutter + ISO combo. */
export function solveAperturePriority(
  ev100: number,
  preferredAperture: Aperture,
): ExposureTriangle {
  const av = 2 * Math.log2(preferredAperture);

  for (const iso of ISO_VALUES) {
    const sv = Math.log2(iso / 100);
    const tv = ev100 + sv - av;
    const t = Math.pow(2, -tv);

    const closest = findClosestShutter(t);
    if (closest !== null) {
      return { aperture: preferredAperture, shutterSpeed: closest, iso };
    }
  }

  // Fallback: max ISO, longest shutter
  return {
    aperture: preferredAperture,
    shutterSpeed: SHUTTER_SPEEDS[SHUTTER_SPEEDS.length - 1],
    iso: ISO_VALUES[ISO_VALUES.length - 1],
  };
}

/** Given EV₁₀₀ and a preferred shutter speed, find the best aperture + ISO. */
export function solveShutterPriority(
  ev100: number,
  preferredShutter: number,
): ExposureTriangle {
  const tv = -Math.log2(preferredShutter);

  for (const iso of ISO_VALUES) {
    const sv = Math.log2(iso / 100);
    const av = ev100 + sv - tv;
    const n = Math.pow(2, av / 2);

    const closest = findClosestAperture(n);
    if (closest !== null) {
      return { aperture: closest, shutterSpeed: preferredShutter, iso };
    }
  }

  return {
    aperture: APERTURES[APERTURES.length - 1],
    shutterSpeed: preferredShutter,
    iso: ISO_VALUES[ISO_VALUES.length - 1],
  };
}

/** Program mode: pick a balanced combination. */
export function solveProgram(ev100: number): ExposureTriangle {
  let best: ExposureTriangle | null = null;
  let bestScore = Infinity;

  for (const aperture of APERTURES) {
    for (const iso of ISO_VALUES) {
      const av = 2 * Math.log2(aperture);
      const sv = Math.log2(iso / 100);
      const tv = ev100 + sv - av;
      const t = Math.pow(2, -tv);
      const closest = findClosestShutter(t);
      if (closest === null) continue;

      // Score: prefer low ISO, middle apertures, reasonable shutter speeds
      const isoScore = Math.log2(iso / 100) * 2;
      const aptScore = Math.abs(Math.log2(aperture / 5.6));
      const shutScore = Math.abs(Math.log2(closest) + 7); // prefer ~1/125
      const score = isoScore + aptScore + shutScore * 0.5;

      if (score < bestScore) {
        bestScore = score;
        best = { aperture, shutterSpeed: closest, iso };
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
): number {
  const cameraEv = 2 * Math.log2(aperture) + Math.log2(1 / shutterSpeed);
  const requiredEv = ev100 + Math.log2(iso / 100);
  return cameraEv - requiredEv;
}

/** Generate multiple exposure combos for a given EV. */
export function generateCombinations(
  ev100: number,
  count = 8,
): ExposureTriangle[] {
  const results: ExposureTriangle[] = [];

  for (const aperture of APERTURES) {
    for (const iso of ISO_VALUES) {
      const av = 2 * Math.log2(aperture);
      const sv = Math.log2(iso / 100);
      const tv = ev100 + sv - av;
      const t = Math.pow(2, -tv);
      const closest = findClosestShutter(t);
      if (closest === null) continue;

      results.push({ aperture, shutterSpeed: closest, iso });
    }
  }

  // Sort by ISO (prefer low), then by aperture
  results.sort((a, b) => a.iso - b.iso || a.aperture - b.aperture);
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
  if (ev <= -4) return 'Milky Way, starlight';
  if (ev <= -2) return 'Deep twilight, stars';
  if (ev <= 0) return 'Night landscape';
  if (ev <= 2) return 'Dim interior, candles';
  if (ev <= 4) return 'Indoor, low light';
  if (ev <= 6) return 'Home interior';
  if (ev <= 8) return 'Bright interior, stage';
  if (ev <= 10) return 'Overcast, shade';
  if (ev <= 12) return 'Cloudy, open shade';
  if (ev <= 14) return 'Bright daylight';
  if (ev <= 16) return 'Full sun, harsh light';
  return 'Extremely bright';
}

export function suggestFilmSim(ev: number): string {
  if (ev <= 4) return 'Classic Chrome';
  if (ev <= 8) return 'Pro Neg. Std';
  if (ev <= 12) return 'Classic Neg.';
  if (ev <= 14) return 'Provia/Standard';
  return 'Velvia/Vivid';
}
