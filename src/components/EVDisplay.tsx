import { evToSceneDescription, evToLux } from '../lib/exposure';

interface Props {
  ev: number;
  lux: number;
  evOffset: number;
  onEvOffsetChange: (offset: number) => void;
  isManual: boolean;
  manualEv: number;
  onManualEvChange: (ev: number) => void;
}

export function EVDisplay({
  ev,
  lux,
  evOffset,
  onEvOffsetChange,
  isManual,
  manualEv,
  onManualEvChange,
}: Props) {
  const displayEv = isManual ? manualEv : ev;
  const displayLux = isManual ? evToLux(manualEv) : lux;
  const scene = evToSceneDescription(displayEv);

  return (
    <div className="text-center py-4">
      {/* EV Number */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-white/40 text-xs tracking-widest uppercase">
          EV
        </span>
        <span className="text-6xl font-light tabular-nums tracking-tight text-white">
          {displayEv.toFixed(1)}
        </span>
      </div>

      {/* Lux reading */}
      <div className="text-white/40 text-sm mt-1 tabular-nums">
        {displayLux < 1
          ? `${displayLux.toFixed(3)} lux`
          : displayLux < 100
            ? `${displayLux.toFixed(1)} lux`
            : `${Math.round(displayLux).toLocaleString()} lux`}
      </div>

      {/* Scene description */}
      <div className="text-white/60 text-sm mt-1">{scene}</div>

      {/* EV compensation / manual slider */}
      {isManual ? (
        <div className="mt-4 px-4">
          <label className="text-[10px] tracking-widest uppercase text-white/40 block mb-2">
            Manual EV
          </label>
          <input
            type="range"
            min={-6}
            max={20}
            step={0.5}
            value={manualEv}
            onChange={(e) => onManualEvChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>-6</span>
            <span>20</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 px-4">
          <label className="text-[10px] tracking-widest uppercase text-white/40 block mb-2">
            EV Compensation: {evOffset > 0 ? '+' : ''}
            {evOffset.toFixed(1)}
          </label>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.5}
            value={evOffset}
            onChange={(e) => onEvOffsetChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>-3</span>
            <span>0</span>
            <span>+3</span>
          </div>
        </div>
      )}
    </div>
  );
}
