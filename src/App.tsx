import { useState, useCallback, useEffect, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { useMeter } from './hooks/useMeter';
import { Viewfinder } from './components/Viewfinder';
import { EVDisplay } from './components/EVDisplay';
import { ModeSelector, type ExposureMode } from './components/ModeSelector';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const camera = useCamera();
  const meter = useMeter();
  const [exposureMode, setExposureMode] = useState<ExposureMode>('A');
  const [isManualEv, setIsManualEv] = useState(false);
  const [manualEv, setManualEv] = useState(10);
  const meteringRef = useRef(false);

  const handleStart = useCallback(async () => {
    await camera.start();
    setIsManualEv(false);
  }, [camera]);

  // Start metering when camera becomes active
  useEffect(() => {
    if (
      camera.isActive &&
      camera.canvasRef.current &&
      camera.ctxRef.current &&
      camera.videoRef.current &&
      !meteringRef.current
    ) {
      meteringRef.current = true;
      meter.startMetering(
        camera.canvasRef.current,
        camera.ctxRef.current,
        camera.videoRef.current,
      );
    }
    if (!camera.isActive && meteringRef.current) {
      meteringRef.current = false;
      meter.stopMetering();
    }
  }, [camera.isActive, camera.canvasRef, camera.ctxRef, camera.videoRef, meter]);

  const displayEv = isManualEv ? manualEv : meter.ev;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h1 className="text-sm font-semibold tracking-wide">
            X100V LIGHT METER
          </h1>
        </div>
        <div className="flex gap-2">
          {camera.isActive && (
            <button
              onClick={camera.toggleCamera}
              className="text-white/40 hover:text-white/70 transition-colors p-1"
              title="Switch camera"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
                />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsManualEv(!isManualEv)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isManualEv
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {isManualEv ? 'MANUAL' : 'AUTO'}
          </button>
        </div>
      </header>

      {/* Viewfinder */}
      <div className="px-4 pt-3">
        <div
          onClick={!camera.isActive ? handleStart : undefined}
          className={!camera.isActive ? 'cursor-pointer' : ''}
        >
          <Viewfinder
            videoRef={camera.videoRef}
            meteringMode={meter.meteringMode}
            isActive={camera.isActive}
          />
        </div>
        {camera.error && (
          <div className="text-red-400 text-xs text-center mt-2">
            {camera.error}
          </div>
        )}
      </div>

      {/* Hidden canvas for analysis */}
      <canvas ref={camera.canvasRef} className="hidden" />

      {/* EV Display */}
      <EVDisplay
        ev={meter.ev}
        lux={meter.lux}
        evOffset={meter.evOffset}
        onEvOffsetChange={meter.setEvOffset}
        isManual={isManualEv}
        manualEv={manualEv}
        onManualEvChange={setManualEv}
      />

      {/* Mode selectors */}
      <div className="px-4 pb-3">
        <ModeSelector
          exposureMode={exposureMode}
          onExposureModeChange={setExposureMode}
          meteringMode={meter.meteringMode}
          onMeteringModeChange={meter.setMeteringMode}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-4" />

      {/* Settings */}
      <div className="flex-1 overflow-y-auto pt-3">
        <SettingsPanel ev={displayEv} exposureMode={exposureMode} />
      </div>

      {/* Footer */}
      <footer className="text-center py-3 text-[10px] text-white/20 border-t border-white/5">
        Fujifilm X100V · 23mm f/2 R WR · APS-C
      </footer>
    </div>
  );
}

export default App;
