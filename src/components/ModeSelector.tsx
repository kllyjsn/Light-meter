import type { MeteringMode } from '../lib/metering';

export type ExposureMode = 'P' | 'A' | 'S' | 'M';

interface Props {
  exposureMode: ExposureMode;
  onExposureModeChange: (mode: ExposureMode) => void;
  meteringMode: MeteringMode;
  onMeteringModeChange: (mode: MeteringMode) => void;
}

const EXPOSURE_MODES: { value: ExposureMode; label: string }[] = [
  { value: 'P', label: 'P' },
  { value: 'A', label: 'A' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
];

const METERING_MODES: { value: MeteringMode; icon: string }[] = [
  { value: 'matrix', icon: '⊞' },
  { value: 'center', icon: '◎' },
  { value: 'spot', icon: '◉' },
];

export function ModeSelector({
  exposureMode,
  onExposureModeChange,
  meteringMode,
  onMeteringModeChange,
}: Props) {
  return (
    <div className="flex items-center justify-between px-2">
      {/* Exposure mode */}
      <div className="flex gap-1">
        {EXPOSURE_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onExposureModeChange(value)}
            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
              exposureMode === value
                ? 'bg-amber-400 text-black'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Metering mode */}
      <div className="flex gap-1">
        {METERING_MODES.map(({ value, icon }) => (
          <button
            key={value}
            onClick={() => onMeteringModeChange(value)}
            className={`w-10 h-10 rounded-lg text-lg transition-all ${
              meteringMode === value
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/30 hover:bg-white/10'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
