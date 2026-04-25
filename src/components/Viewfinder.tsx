import { type MeteringMode, getMeteringRegion } from '../lib/metering';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  meteringMode: MeteringMode;
  isActive: boolean;
}

export function Viewfinder({ videoRef, meteringMode, isActive }: Props) {
  const region = getMeteringRegion(meteringMode);

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/40">
            <svg
              className="w-16 h-16 mx-auto mb-3 opacity-40"
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
            <p className="text-sm">Tap to start metering</p>
          </div>
        </div>
      )}

      {/* Metering overlay */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {meteringMode === 'spot' && (
              <div
                className="border-2 border-white/60 rounded-full"
                style={{
                  width: `${region.radiusPct * 2}%`,
                  minWidth: '60px',
                  minHeight: '60px',
                  aspectRatio: '1',
                }}
              />
            )}
            {meteringMode === 'center' && (
              <div className="border border-white/30 rounded-full w-32 h-32" />
            )}
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/80 rounded-full" />
          </div>

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/40" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/40" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/40" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white/40" />

          {/* Mode label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase text-white/70">
            {region.label}
          </div>
        </div>
      )}
    </div>
  );
}
