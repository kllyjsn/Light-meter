import { useRef, useEffect } from 'react';

interface Props<T extends number> {
  label: string;
  values: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
  disabled?: boolean;
}

export function DialSelector<T extends number>({
  label,
  values,
  selected,
  onChange,
  format,
  disabled = false,
}: Props<T>) {
  const selectedIdx = values.indexOf(selected);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (scrollRef.current && selectedIdx >= 0) {
      const container = scrollRef.current;
      const buttons = container.querySelectorAll('button');
      const btn = buttons[selectedIdx];
      if (btn) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const scrollLeft =
          btn.offsetLeft - containerRect.width / 2 + btnRect.width / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedIdx]);

  return (
    <div
      className={`transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/30 font-medium">
          {label}
        </span>
        {selectedIdx >= 0 && (
          <span className="text-xs text-amber-400 tabular-nums font-mono font-medium">
            {format(selected)}
          </span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide px-1"
      >
        {values.map((v, i) => (
          <button
            key={i}
            onClick={() => onChange(v)}
            className={`flex-shrink-0 snap-center px-3 py-2 rounded-lg text-[13px] tabular-nums font-mono transition-all ${
              i === selectedIdx
                ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/15'
                : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60 active:bg-white/10'
            }`}
          >
            {format(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
