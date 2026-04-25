import { type MeteringMode, getMeteringRegion } from '../lib/metering';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  meteringMode: MeteringMode;
  isActive: boolean;
  isLocked: boolean;
  histogram: number[];
  source: string;
}

export function Viewfinder({
  videoRef,
  meteringMode,
  isActive,
  isLocked,
  histogram,
  source,
}: Props) {
  const region = getMeteringRegion(meteringMode);

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
          <div className="text-center text-white/40">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">Tap to start metering</p>
            <p className="text-xs mt-1 text-white/25">
              Uses rear camera to measure light
            </p>
          </div>
        </div>
      )}

      {/* Metering overlay */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Metering region indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {meteringMode === 'spot' && (
              <div
                className="border-2 border-amber-400/60 rounded-full animate-pulse"
                style={{ width: '60px', height: '60px' }}
              />
            )}
            {meteringMode === 'center' && (
              <div className="border border-white/20 rounded-full w-36 h-36" />
            )}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-px bg-amber-400/60" />
              <div className="w-px h-6 bg-amber-400/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-white/30" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-white/30" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-white/30" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-white/30" />

          {/* Top bar: mode + source */}
          <div className="absolute top-2.5 left-0 right-0 flex justify-between items-center px-10">
            <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] tracking-[0.15em] uppercase text-white/60 font-medium">
              {region.label}
            </span>
            <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] tracking-[0.15em] uppercase text-white/40">
              {source === 'camera-imagecapture' ? 'ImageCapture' : 'Pixel'}
            </span>
          </div>

          {/* Lock indicator */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-amber-400/90 text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
                AE-L
              </div>
            </div>
          )}

          {/* Mini histogram overlay */}
          {histogram.length > 0 && (
            <div className="absolute bottom-2.5 right-2.5 w-24 h-12 bg-black/60 backdrop-blur-sm rounded-lg p-1.5 flex items-end gap-px">
              {histogram
                .filter((_, i) => i % 4 === 0)
                .map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/50 rounded-t-sm min-h-px"
                    style={{ height: `${v * 100}%` }}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
