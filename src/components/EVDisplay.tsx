import { evToSceneDescription, evToLux } from '../lib/exposure';

interface Props {
  ev: number;
  lux: number;
  evOffset: number;
  onEvOffsetChange: (offset: number) => void;
  isManual: boolean;
  manualEv: number;
  onManualEvChange: (ev: number) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onSaveReading: () => void;
}

export function EVDisplay({
  ev,
  lux,
  evOffset,
  onEvOffsetChange,
  isManual,
  manualEv,
  onManualEvChange,
  isLocked,
  onToggleLock,
  onSaveReading,
}: Props) {
  const displayEv = isManual ? manualEv : ev;
  const displayLux = isManual ? evToLux(manualEv) : lux;
  const scene = evToSceneDescription(displayEv);

  // EV gauge: -6 to 20 range
  const evMin = -6;
  const evMax = 20;
  const evPct = ((displayEv - evMin) / (evMax - evMin)) * 100;

  return (
    <div className="py-4 px-4">
      {/* EV Gauge */}
      <div className="relative h-8 mb-4">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-white/5 overflow-hidden">
          {/* Gradient fill */}
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(Math.max(evPct, 0), 100)}%`,
              background:
                'linear-gradient(90deg, #3b82f6 0%, #22c55e 30%, #eab308 60%, #f97316 80%, #ef4444 100%)',
            }}
          />
        </div>

        {/* Tick marks */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-px">
          {Array.from({ length: 27 }, (_, i) => i - 6).map((tick) => (
            <div
              key={tick}
              className={`w-px ${tick % 5 === 0 ? 'h-3 bg-white/20' : 'h-1.5 bg-white/8'}`}
            />
          ))}
        </div>

        {/* Needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ left: `${Math.min(Math.max(evPct, 2), 98)}%` }}
        >
          <div className="w-3 h-3 bg-amber-400 rotate-45 rounded-sm shadow-lg shadow-amber-400/30" />
        </div>

        {/* Labels */}
        <div className="absolute -bottom-4 left-0 right-0 flex justify-between">
          <span className="text-[8px] text-white/20">-6</span>
          <span className="text-[8px] text-white/20">0</span>
          <span className="text-[8px] text-white/20">8</span>
          <span className="text-[8px] text-white/20">16</span>
          <span className="text-[8px] text-white/20">20</span>
        </div>
      </div>

      {/* EV Number + Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onToggleLock}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
            isLocked
              ? 'bg-amber-400 text-black'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          {isLocked ? 'AE-L' : 'LOCK'}
        </button>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium">
              EV
            </span>
            <span className="text-5xl font-extralight tabular-nums tracking-tight text-white leading-none">
              {displayEv.toFixed(1)}
            </span>
          </div>
          <div className="text-white/30 text-xs mt-1 tabular-nums font-mono">
            {displayLux < 1
              ? `${displayLux.toFixed(3)} lux`
              : displayLux < 100
                ? `${displayLux.toFixed(1)} lux`
                : `${Math.round(displayLux).toLocaleString()} lux`}
          </div>
          <div className="text-amber-400/60 text-[11px] mt-0.5 font-medium">
            {scene}
          </div>
        </div>

        <button
          onClick={onSaveReading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider bg-white/5 text-white/40 hover:bg-white/10 transition-all"
        >
          SAVE
        </button>
      </div>

      {/* EV compensation / manual slider */}
      <div className="mt-5">
        {isManual ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.15em] uppercase text-white/30 font-medium">
                Manual EV
              </span>
              <span className="text-xs text-white/40 tabular-nums font-mono">
                {manualEv.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={20}
              step={0.3}
              value={manualEv}
              onChange={(e) => onManualEvChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.15em] uppercase text-white/30 font-medium">
                EV Comp
              </span>
              <span className="text-xs text-white/40 tabular-nums font-mono">
                {evOffset > 0 ? '+' : ''}
                {evOffset.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.3}
              value={evOffset}
              onChange={(e) => onEvOffsetChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
