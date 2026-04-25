export type MeteringMode = 'matrix' | 'center' | 'spot';

/**
 * Analyze a video frame and return average luminance (0–1).
 * Applies weighting based on metering mode.
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

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // sRGB luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxR;

    let weight = 1;
    if (mode === 'center') {
      weight = Math.max(0, 1 - dist * 1.5);
    } else if (mode === 'spot') {
      weight = dist < 0.15 ? 1 : 0;
    }

    totalWeight += weight;
    totalLum += lum * weight;
  }

  return totalWeight > 0 ? totalLum / totalWeight / 255 : 0;
}

/**
 * Convert normalized luminance (0–1) from camera to approximate lux.
 * This is a rough estimate since phone cameras auto-expose.
 * The mapping uses a gamma-corrected model with calibration.
 */
export function luminanceToLux(normalizedLum: number): number {
  // Reverse gamma correction (sRGB)
  const linear =
    normalizedLum <= 0.04045
      ? normalizedLum / 12.92
      : Math.pow((normalizedLum + 0.055) / 1.055, 2.4);

  // Map linear brightness to lux range.
  // Due to auto-exposure, mid-gray (~0.18 linear) maps to ~250-400 lux (typical indoor).
  // We use a logarithmic scale centered on the assumption that
  // the camera tries to expose for 18% gray.
  // This is a heuristic — real calibration would need device-specific data.
  const baseEv = 8; // assume camera targets EV ~8 at mid-gray
  const evAdjust = Math.log2(Math.max(linear, 0.001) / 0.18);
  const ev = baseEv + evAdjust;
  return 2.5 * Math.pow(2, ev);
}

/**
 * Get metering region info for UI overlay.
 */
export function getMeteringRegion(
  mode: MeteringMode,
): { radiusPct: number; label: string } {
  switch (mode) {
    case 'spot':
      return { radiusPct: 15, label: 'Spot' };
    case 'center':
      return { radiusPct: 50, label: 'Center' };
    case 'matrix':
      return { radiusPct: 100, label: 'Matrix' };
  }
}
