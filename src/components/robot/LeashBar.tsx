"use client";

import { THRESHOLDS } from "@/lib/robot/types";
import { useTween } from "@/hooks/useTween";

/** 줄 길이 바. AS5600 회전각에서 환산된 값(m) */
export default function LeashBar({ value }: { value: number | null }) {
  const v = useTween(value ?? 0, 600);
  const pct = Math.max(0, Math.min(100, (v / THRESHOLDS.L_MAX) * 100));

  const color =
    v >= THRESHOLDS.L_HARD ? "var(--color-level-2)"
    : v >= THRESHOLDS.L_SOFT ? "var(--color-level-1)"
    : "var(--color-level-0)";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-body">줄 길이</span>
        <span className="tabular text-lg font-semibold">{v.toFixed(2)} m</span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[background-color] duration-300"
             style={{ width: `${pct}%`, background: color }} />
        {[THRESHOLDS.L_SOFT, THRESHOLDS.L_HARD].map((m) => (
          <span key={m} className="absolute top-0 h-full w-px bg-white/80"
                style={{ left: `${(m / THRESHOLDS.L_MAX) * 100}%` }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>0</span><span>{THRESHOLDS.L_MAX} m</span>
      </div>
    </div>
  );
}
