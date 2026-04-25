/** Fujifilm X100V constants */

export const APERTURES = [2, 2.8, 4, 5.6, 8, 11, 16] as const;
export type Aperture = (typeof APERTURES)[number];

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

export const FILM_SIMULATIONS = [
  'Provia/Standard',
  'Velvia/Vivid',
  'Astia/Soft',
  'Classic Chrome',
  'Pro Neg. Hi',
  'Pro Neg. Std',
  'Classic Neg.',
  'Eterna',
  'Eterna Bleach Bypass',
  'Acros',
  'Acros+Ye',
  'Acros+R',
  'Acros+G',
  'Sepia',
] as const;

export function formatShutter(t: number): string {
  if (t >= 1) return `${t}"`;
  const denom = Math.round(1 / t);
  return `1/${denom}`;
}

export function formatAperture(f: number): string {
  return Number.isInteger(f) ? `f/${f}` : `f/${f.toFixed(1)}`;
}

export const FOCAL_LENGTH = 23; // mm (35mm equiv: 35mm)
export const SENSOR = 'APS-C (23.5 × 15.6 mm)';
export const LENS = 'Fujinon 23mm f/2 R WR';
