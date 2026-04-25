/** Fujifilm X100V constants and utilities */

export const APERTURES = [2, 2.8, 4, 5.6, 8, 11, 16] as const;
export type Aperture = (typeof APERTURES)[number];

// Full shutter speed range including electronic shutter
export const SHUTTER_SPEEDS = [
  1 / 32000, 1 / 16000, 1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000,
  1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8,
  1 / 4, 1 / 2, 1, 2, 4, 8, 15, 30,
] as const;

export const ISO_VALUES = [
  160, 200, 250, 320, 400, 500, 640, 800,
  1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000,
  6400, 8000, 10000, 12800,
] as const;
export type ISOValue = (typeof ISO_VALUES)[number];

// Extended ISO (available with DR mode restrictions)
export const ISO_EXTENDED = [80, ...ISO_VALUES, 25600, 51200] as const;

export const ND_FILTER_STOPS = 3; // built-in 3-stop ND filter

export const FILM_SIMULATIONS = [
  { name: 'Provia/Standard', character: 'Balanced, natural colors', best: 'All-purpose' },
  { name: 'Velvia/Vivid', character: 'High saturation, deep colors', best: 'Landscapes, nature' },
  { name: 'Astia/Soft', character: 'Soft tones, gentle skin', best: 'Portraits, fashion' },
  { name: 'Classic Chrome', character: 'Muted, documentary feel', best: 'Street, editorial' },
  { name: 'Pro Neg. Hi', character: 'Slightly enhanced contrast', best: 'Studio portraits' },
  { name: 'Pro Neg. Std', character: 'Smooth tonal range', best: 'Portraits, events' },
  { name: 'Classic Neg.', character: 'Vintage negative film look', best: 'Street, travel, casual' },
  { name: 'Eterna', character: 'Cinema-grade flat profile', best: 'Video, low light' },
  { name: 'Eterna Bleach Bypass', character: 'Desaturated, high contrast', best: 'Moody, dramatic' },
  { name: 'Acros', character: 'Rich B&W with fine grain', best: 'B&W street, architecture' },
  { name: 'Acros+Ye', character: 'B&W with warm contrast', best: 'B&W portraits' },
  { name: 'Acros+R', character: 'B&W with dramatic skies', best: 'B&W landscapes' },
  { name: 'Acros+G', character: 'B&W with smooth greens', best: 'B&W nature' },
] as const;

export function formatShutter(t: number): string {
  if (t >= 1) return `${t}"`;
  const denom = Math.round(1 / t);
  return `1/${denom}`;
}

export function formatAperture(f: number): string {
  return Number.isInteger(f) ? `f/${f}` : `f/${f.toFixed(1)}`;
}

// Depth of field calculator for the X100V's 23mm lens
const CIRCLE_OF_CONFUSION = 0.015; // mm, APS-C standard

export function calculateDoF(
  aperture: number,
  focusDistanceM: number,
): { near: number; far: number; total: number; hyperfocal: number } {
  const f = 23; // focal length in mm
  const d = focusDistanceM * 1000; // convert to mm
  const c = CIRCLE_OF_CONFUSION;

  const H = (f * f) / (aperture * c) + f; // hyperfocal distance
  const near = (d * (H - f)) / (H + d - 2 * f);
  const far = d >= H ? Infinity : (d * (H - f)) / (H - d);
  const total = far === Infinity ? Infinity : far - near;

  return {
    near: near / 1000,
    far: far === Infinity ? Infinity : far / 1000,
    total: total === Infinity ? Infinity : total / 1000,
    hyperfocal: H / 1000,
  };
}

export const FOCAL_LENGTH = 23;
export const FOCAL_LENGTH_EQUIV = 35;
export const SENSOR = 'APS-C (23.5 × 15.6 mm)';
export const LENS = 'Fujinon 23mm f/2 R WR';
export const MAX_MECHANICAL_SHUTTER = 1 / 4000;
export const MAX_ELECTRONIC_SHUTTER = 1 / 32000;
