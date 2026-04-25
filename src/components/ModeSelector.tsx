import type { MeteringMode } from '../lib/metering';

export type ExposureMode = 'P' | 'A' | 'S' | 'M';

interface Props {
  exposureMode: ExposureMode;
  onExposureModeChange: (mode: ExposureMode) => void;
  meteringMode: MeteringMode;
  onMeteringModeChange: (mode: MeteringMode) => void;
}

const EXPOSURE_MODES: { value: ExposureMode; label: string; desc: string }[] = [
  { value: 'P', label: 'P', desc: 'Program' },
  { value: 'A', label: 'A', desc: 'Aperture' },
  { value: 'S', label: 'S', desc: 'Shutter' },
  { value: 'M', label: 'M', desc: 'Manual' },
];

const METERING_MODES: { value: MeteringMode; icon: string; desc: string }[] = [
  { value: 'matrix', icon: '⊞', desc: 'Multi' },
  { value: 'center', icon: '◎', desc: 'Center' },
  { value: 'spot', icon: '◉', desc: 'Spot' },
];

export function ModeSelector({
  exposureMode,
  onExposureModeChange,
  meteringMode,
  onMeteringModeChange,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      {/* Exposure mode */}
      <div className="flex gap-1">
        {EXPOSURE_MODES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => onExposureModeChange(value)}
            className={`relative w-11 h-11 rounded-xl text-sm font-bold transition-all ${
              exposureMode === value
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
            }`}
            title={desc}
          >
            {label}
            {exposureMode === value && (
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-amber-400/70 font-normal tracking-wider">
                {desc}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Metering mode */}
      <div className="flex gap-1">
        {METERING_MODES.map(({ value, icon, desc }) => (
          <button
            key={value}
            onClick={() => onMeteringModeChange(value)}
            className={`relative w-11 h-11 rounded-xl text-lg transition-all ${
              meteringMode === value
                ? 'bg-white/15 text-white shadow-inner'
                : 'bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/40'
            }`}
            title={desc}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
