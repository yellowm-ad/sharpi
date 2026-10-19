import { SAFETY_LABEL, SAFETY_COLOR, FAULT_LABEL } from "@/lib/robot/types";

/**
 * 안전등급 배지 L0~L3.
 * 접근성: 색상만으로 구분하지 않고 텍스트를 함께 쓴다. (PRD §12)
 */
export default function SafetyBadge({
  level, faults = [],
}: { level: number; faults?: string[] }) {
  const lv = Math.max(0, Math.min(3, level));
  return (
    <div className="flex flex-col gap-1">
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
        style={{ background: SAFETY_COLOR[lv] }}
      >
        L{lv} · {SAFETY_LABEL[lv]}
      </span>
      {faults.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-[var(--color-level-2)]">
          {faults.map((f) => (
            <li key={f}>⚠ {f} — {FAULT_LABEL[f] ?? "알 수 없는 고장"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
