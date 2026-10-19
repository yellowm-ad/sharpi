"use client";

import { THRESHOLDS } from "@/lib/robot/types";

const MAX = 50; // N — 게이지 상한

/** 반원 게이지. 임계선 3개(F_SOFT 8 / F_HARD 30 / F_ESTOP 40)를 눈금으로 표시 */
export default function TensionGauge({ value }: { value: number | null }) {
  const v = value ?? 0;
  const ratio = Math.max(0, Math.min(1, v / MAX));

  // 반원 경로: r=80, 중심(100,100), 180°(왼쪽) → 0°(오른쪽)
  const R = 80;
  const LEN = Math.PI * R;

  const color =
    v >= THRESHOLDS.F_ESTOP ? "var(--color-level-3)"
    : v >= THRESHOLDS.F_HARD ? "var(--color-level-2)"
    : v >= THRESHOLDS.F_SOFT ? "var(--color-level-1)"
    : "var(--color-level-0)";

  const tickAngle = (n: number) => Math.PI * (1 - n / MAX);
  const tick = (n: number) => {
    const a = tickAngle(n);
    return {
      x1: 100 + (R - 10) * Math.cos(a), y1: 100 - (R - 10) * Math.sin(a),
      x2: 100 + (R + 8) * Math.cos(a),  y2: 100 - (R + 8) * Math.sin(a),
    };
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[260px]" role="img" aria-label={`장력 ${v.toFixed(1)}뉴턴`}>
        <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none"
              stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none"
              stroke={color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${LEN * ratio} ${LEN}`}
              style={{ transition: "stroke-dasharray .3s ease, stroke .3s ease" }} />

        {[THRESHOLDS.F_SOFT, THRESHOLDS.F_HARD, THRESHOLDS.F_ESTOP].map((n) => {
          const t = tick(n);
          return <line key={n} {...t} stroke="var(--color-muted)" strokeWidth="2" />;
        })}

        <text x="100" y="86" textAnchor="middle"
              className="tabular fill-[var(--color-ink)] text-[30px] font-bold">
          {v.toFixed(1)}
        </text>
        <text x="100" y="105" textAnchor="middle" className="fill-[var(--color-muted)] text-[12px]">
          N
        </text>
      </svg>
      <p className="mt-1 text-xs text-muted">견인 장력 · 상한 {MAX}N</p>
    </div>
  );
}
