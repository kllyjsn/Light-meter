import { useMemo, useState, useEffect } from 'react';
import {
  solveAperturePriority,
  solveShutterPriority,
  solveProgram,
  checkExposure,
  generateCombinations,
  suggestFilmSim,
} from '../lib/exposure';
import {
  APERTURES,
  SHUTTER_SPEEDS,
  ISO_VALUES,
  formatShutter,
  formatAperture,
  type Aperture,
  type ISOValue,
} from '../lib/x100v';
import { DialSelector } from './DialSelector';
import type { ExposureMode } from './ModeSelector';

interface Props {
  ev: number;
  exposureMode: ExposureMode;
}

export function SettingsPanel({ ev, exposureMode }: Props) {
  const [selectedAperture, setSelectedAperture] = useState<Aperture>(5.6);
  const [selectedShutter, setSelectedShutter] = useState<number>(1 / 125);
  const [selectedISO, setSelectedISO] = useState<ISOValue>(200);

  const result = useMemo(() => {
    switch (exposureMode) {
      case 'A':
        return solveAperturePriority(ev, selectedAperture);
      case 'S':
        return solveShutterPriority(ev, selectedShutter);
      case 'P':
        return solveProgram(ev);
      case 'M':
        return {
          aperture: selectedAperture,
          shutterSpeed: selectedShutter,
          iso: selectedISO,
        };
    }
  }, [ev, exposureMode, selectedAperture, selectedShutter, selectedISO]);

  // Sync selections with solved values
  useEffect(() => {
    if (exposureMode === 'A') {
      setSelectedShutter(result.shutterSpeed);
      setSelectedISO(result.iso as ISOValue);
    } else if (exposureMode === 'S') {
      setSelectedAperture(result.aperture as Aperture);
      setSelectedISO(result.iso as ISOValue);
    } else if (exposureMode === 'P') {
      setSelectedAperture(result.aperture as Aperture);
      setSelectedShutter(result.shutterSpeed);
      setSelectedISO(result.iso as ISOValue);
    }
  }, [result, exposureMode]);

  const manualDelta =
    exposureMode === 'M'
      ? checkExposure(ev, selectedAperture, selectedShutter, selectedISO)
      : 0;

  const filmSim = suggestFilmSim(ev);
  const combos = useMemo(() => generateCombinations(ev, 6), [ev]);

  return (
    <div className="space-y-4">
      {/* Manual exposure indicator */}
      {exposureMode === 'M' && (
        <div className="px-4">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2">
              Exposure
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 left-1/2"
                  style={{ transform: 'translateX(-50%)' }}
                />
                <div
                  className={`absolute top-0 bottom-0 w-3 rounded-full ${
                    Math.abs(manualDelta) < 0.5
                      ? 'bg-green-400'
                      : Math.abs(manualDelta) < 1.5
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  }`}
                  style={{
                    left: `${Math.min(Math.max(50 + manualDelta * 10, 5), 95)}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
              <span
                className={`text-sm tabular-nums font-mono ${
                  Math.abs(manualDelta) < 0.5
                    ? 'text-green-400'
                    : Math.abs(manualDelta) < 1.5
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {manualDelta > 0 ? '+' : ''}
                {manualDelta.toFixed(1)} EV
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Settings dials */}
      <div className="space-y-3 px-2">
        <DialSelector
          label="Aperture"
          values={APERTURES}
          selected={selectedAperture}
          onChange={setSelectedAperture}
          format={formatAperture}
          disabled={exposureMode === 'S' || exposureMode === 'P'}
        />

        <DialSelector
          label="Shutter Speed"
          values={SHUTTER_SPEEDS}
          selected={selectedShutter as (typeof SHUTTER_SPEEDS)[number]}
          onChange={(v) => setSelectedShutter(v)}
          format={formatShutter}
          disabled={exposureMode === 'A' || exposureMode === 'P'}
        />

        <DialSelector
          label="ISO"
          values={ISO_VALUES}
          selected={selectedISO}
          onChange={setSelectedISO}
          format={(v) => `${v}`}
          disabled={exposureMode !== 'M'}
        />
      </div>

      {/* Film simulation suggestion */}
      <div className="px-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[10px] tracking-widest uppercase text-white/40 mb-1">
            Suggested Film Simulation
          </div>
          <div className="text-white text-sm font-medium">{filmSim}</div>
        </div>
      </div>

      {/* Alternative combinations */}
      <div className="px-4 pb-6">
        <div className="text-[10px] tracking-widest uppercase text-white/40 mb-3">
          Alternative Combinations
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {combos.map((c, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
            >
              <span className="text-white/70 tabular-nums">
                {formatAperture(c.aperture)}
              </span>
              <span className="text-white/70 tabular-nums">
                {formatShutter(c.shutterSpeed)}
              </span>
              <span className="text-white/50 tabular-nums">
                ISO {c.iso}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
