interface ProgressRingProps {
  /** 0–100 */
  value: number;
  /** Stroke colour of the filled arc (any CSS colour) */
  color: string;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
}

export default function ProgressRing({ value, color, size = 44, stroke = 6, label }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEECE4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink">
          {label}
        </span>
      )}
    </div>
  );
}
