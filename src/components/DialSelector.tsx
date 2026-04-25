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

  return (
    <div className={`${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="text-[10px] tracking-widest uppercase text-white/40 mb-2 text-center">
        {label}
      </div>
      <div className="relative">
        <div className="flex gap-1 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-2">
          {values.map((v, i) => (
            <button
              key={i}
              onClick={() => onChange(v)}
              className={`flex-shrink-0 snap-center px-3 py-2 rounded-lg text-sm tabular-nums transition-all ${
                i === selectedIdx
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {format(v)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
