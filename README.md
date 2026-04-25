# X100V Light Meter

A mobile-first web app light meter tailored for the Fujifilm X100V. Uses your phone's camera to measure ambient light, calculate exposure values, and suggest aperture/shutter/ISO combinations specific to the X100V's fixed 23mm f/2 lens.

## Features

- **Camera-based metering** — Uses rear camera to estimate scene brightness
- **EV calculation** — Real-time exposure value from lux estimation
- **X100V settings** — Aperture (f/2–f/16), shutter (1/32000–30s), ISO (160–12800)
- **Exposure modes** — Program (P), Aperture Priority (A), Shutter Priority (S), Manual (M)
- **Metering modes** — Matrix, Center-weighted, Spot
- **EV compensation** — ±3 stops fine-tuning
- **Manual EV** — Direct EV input without camera
- **Film simulation suggestions** — Based on scene lighting
- **Alternative combos** — Multiple valid exposure triangles per reading

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4

## Usage

1. Open on your phone (works best with rear camera)
2. Grant camera permission
3. Point at your scene
4. Choose exposure mode (A/S/P/M)
5. Dial in your preferred settings
6. Transfer settings to your X100V

## Notes

Camera-based light metering is approximate due to phone auto-exposure compensation. Use the EV compensation slider to calibrate against a known reference, or use Manual EV mode for precise input.
