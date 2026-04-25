import { useMemo, useState, useEffect } from 'react';
import {
  solveAperturePriority,
  solveShutterPriority,
  solveProgram,
  checkExposure,
  generateCombinations,
  suggestFilmSimulations,
  SUNNY_16_TABLE,
} from '../lib/exposure';
import {
  APERTURES,
  SHUTTER_SPEEDS,
  ISO_VALUES,
  formatShutter,
  formatAperture,
  calculateDoF,
  type Aperture,
  type ISOValue,
} from '../lib/x100v';
import { DialSelector } from './DialSelector';
import type { ExposureMode } from './ModeSelector';
import type { MeterReading } from '../lib/metering';

type Tab = 'settings' | 'info' | 'history';

interface Props {
  ev: number;
  exposureMode: ExposureMode;
  readings: MeterReading[];
  onClearReadings: () => void;
}

export function SettingsPanel({
  ev,
  exposureMode,
  readings,
  onClearReadings,
}: Props) {
  const [selectedAperture, setSelectedAperture] = useState<Aperture>(5.6);
  const [selectedShutter, setSelectedShutter] = useState<number>(1 / 125);
  const [selectedISO, setSelectedISO] = useState<ISOValue>(200);
  const [useND, setUseND] = useState(false);
  const [focusDistance, setFocusDistance] = useState(3);
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  const result = useMemo(() => {
    switch (exposureMode) {
      case 'A':
        return solveAperturePriority(ev, selectedAperture, useND);
      case 'S':
        return solveShutterPriority(ev, selectedShutter, useND);
      case 'P':
        return solveProgram(ev);
      case 'M':
        return {
          aperture: selectedAperture,
          shutterSpeed: selectedShutter,
          iso: selectedISO,
          needsND: useND,
          needsElectronicShutter: selectedShutter < 1 / 4000,
        };
    }
  }, [ev, exposureMode, selectedAperture, selectedShutter, selectedISO, useND]);

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
      ? checkExposure(ev, selectedAperture, selectedShutter, selectedISO, useND)
      : 0;

  const filmSim = useMemo(() => suggestFilmSimulations(ev), [ev]);
  const combos = useMemo(() => generateCombinations(ev, 8), [ev]);
  const dof = useMemo(
    () => calculateDoF(result.aperture, focusDistance),
    [result.aperture, focusDistance],
  );

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 px-4">
        {(['settings', 'info', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            {tab === 'settings'
              ? 'Exposure'
              : tab === 'info'
                ? 'Tools'
                : `History${readings.length > 0 ? ` (${readings.length})` : ''}`}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-3">
          {/* Manual exposure indicator */}
          {exposureMode === 'M' && (
            <div className="px-4">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2 font-medium">
                  Exposure Balance
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-white/5 rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/20 left-1/2"
                      style={{ transform: 'translateX(-50%)' }}
                    />
                    <div
                      className={`absolute top-0 bottom-0 w-3 rounded-full transition-all duration-300 ${
                        Math.abs(manualDelta) < 0.5
                          ? 'bg-green-400 shadow-green-400/30 shadow-lg'
                          : Math.abs(manualDelta) < 1.5
                            ? 'bg-amber-400 shadow-amber-400/30 shadow-lg'
                            : 'bg-red-400 shadow-red-400/30 shadow-lg'
                      }`}
                      style={{
                        left: `${Math.min(Math.max(50 + manualDelta * 8, 3), 97)}%`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>
                  <span
                    className={`text-sm tabular-nums font-mono font-semibold min-w-[60px] text-right ${
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

          {/* ND Filter toggle */}
          <div className="px-4">
            <button
              onClick={() => setUseND(!useND)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                useND
                  ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                  : 'bg-white/[0.03] border border-white/5 text-white/40 hover:bg-white/[0.05]'
              }`}
            >
              <span className="font-medium">Built-in ND Filter</span>
              <span className="text-xs font-mono">
                {useND ? 'ON (3 stops)' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Flags */}
          {(result.needsND || result.needsElectronicShutter) && (
            <div className="px-4 flex gap-2">
              {result.needsND && (
                <span className="text-[10px] px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium tracking-wider">
                  ND REQUIRED
                </span>
              )}
              {result.needsElectronicShutter && (
                <span className="text-[10px] px-2 py-1 rounded-md bg-blue-400/10 text-blue-400 border border-blue-400/20 font-medium tracking-wider">
                  E-SHUTTER
                </span>
              )}
            </div>
          )}

          {/* Settings dials */}
          <div className="space-y-2.5 px-2">
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

          {/* Film simulation */}
          <div className="px-4">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2 font-medium">
                Suggested Film Simulation
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-white text-sm font-semibold">
                    {filmSim.primary}
                  </div>
                  <div className="text-white/30 text-xs mt-0.5">
                    Alt: {filmSim.alt}
                  </div>
                </div>
              </div>
              <div className="text-white/20 text-[11px] mt-1.5 leading-snug">
                {filmSim.reason}
              </div>
            </div>
          </div>

          {/* Alternative combinations */}
          <div className="px-4 pb-6">
            <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2 font-medium">
              Equivalent Exposures
            </div>
            <div className="grid grid-cols-1 gap-1">
              {combos.map((c, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between text-[13px] font-mono border border-white/[0.03]"
                >
                  <span className="text-white/60 tabular-nums w-16">
                    {formatAperture(c.aperture)}
                  </span>
                  <span className="text-white/60 tabular-nums w-16 text-center">
                    {formatShutter(c.shutterSpeed)}
                  </span>
                  <span className="text-white/40 tabular-nums w-16 text-right">
                    ISO {c.iso}
                  </span>
                  {c.needsND && (
                    <span className="text-amber-400/60 text-[9px] ml-2">
                      ND
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-4 px-4 pb-6">
          {/* Depth of Field */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
            <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-3 font-medium">
              Depth of Field — {formatAperture(result.aperture)} at{' '}
              {focusDistance}m
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-white/60 text-lg font-light tabular-nums">
                  {dof.near.toFixed(2)}m
                </div>
                <div className="text-white/25 text-[9px] uppercase tracking-wider">
                  Near
                </div>
              </div>
              <div className="text-center">
                <div className="text-amber-400 text-lg font-light tabular-nums">
                  {dof.total === Infinity
                    ? '∞'
                    : `${dof.total.toFixed(2)}m`}
                </div>
                <div className="text-white/25 text-[9px] uppercase tracking-wider">
                  Total DoF
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-lg font-light tabular-nums">
                  {dof.far === Infinity ? '∞' : `${dof.far.toFixed(2)}m`}
                </div>
                <div className="text-white/25 text-[9px] uppercase tracking-wider">
                  Far
                </div>
              </div>
            </div>
            <div className="text-white/20 text-[10px] mb-2">
              Hyperfocal: {dof.hyperfocal.toFixed(1)}m
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30">
                  Focus distance
                </span>
                <span className="text-xs text-white/40 font-mono">
                  {focusDistance}m
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={30}
                step={0.1}
                value={focusDistance}
                onChange={(e) =>
                  setFocusDistance(parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Sunny 16 Reference */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
            <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-3 font-medium">
              Sunny 16 Reference
            </div>
            <div className="space-y-1">
              {SUNNY_16_TABLE.map((row) => (
                <div
                  key={row.condition}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] ${
                    Math.abs(ev - row.ev) < 1
                      ? 'bg-amber-400/10 border border-amber-400/20'
                      : ''
                  }`}
                >
                  <span
                    className={
                      Math.abs(ev - row.ev) < 1
                        ? 'text-amber-400 font-medium'
                        : 'text-white/40'
                    }
                  >
                    {row.condition}
                  </span>
                  <div className="flex gap-3">
                    <span className="text-white/25 font-mono text-[11px]">
                      EV {row.ev}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        Math.abs(ev - row.ev) < 1
                          ? 'text-amber-400'
                          : 'text-white/30'
                      }`}
                    >
                      {row.rule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Info */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
            <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-3 font-medium">
              X100V Specs
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-white/30">Lens</span>
                <span className="text-white/60 font-mono">
                  23mm f/2 R WR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">35mm equiv</span>
                <span className="text-white/60 font-mono">35mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Sensor</span>
                <span className="text-white/60 font-mono">
                  APS-C X-Trans IV
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Mech. shutter</span>
                <span className="text-white/60 font-mono">
                  1/4000 – 30s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Elec. shutter</span>
                <span className="text-white/60 font-mono">
                  1/32000 – 30s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Built-in ND</span>
                <span className="text-white/60 font-mono">3 stops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">ISO range</span>
                <span className="text-white/60 font-mono">
                  160 – 12800
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="px-4 pb-6">
          {readings.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-sm">
              <p>No saved readings yet</p>
              <p className="text-xs mt-1">Tap SAVE to record a reading</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <button
                  onClick={onClearReadings}
                  className="text-[10px] text-white/30 hover:text-white/50 transition-colors uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {readings.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] rounded-lg px-3 py-2.5 flex items-center justify-between border border-white/[0.03]"
                  >
                    <div>
                      <div className="text-white/70 text-sm font-mono tabular-nums">
                        EV {r.ev100.toFixed(1)}
                      </div>
                      <div className="text-white/25 text-[10px]">
                        {r.lux < 100
                          ? `${r.lux.toFixed(1)} lux`
                          : `${Math.round(r.lux).toLocaleString()} lux`}{' '}
                        · {r.meteringMode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/20 text-[10px] font-mono">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-white/15 text-[9px] uppercase">
                        {r.source.replace('camera-', '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
