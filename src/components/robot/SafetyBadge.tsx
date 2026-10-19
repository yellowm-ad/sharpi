import { ShieldCheck, ShieldAlert, OctagonX, TriangleAlert } from "lucide-react";
import { SAFETY_LABEL, SAFETY_COLOR, FAULT_LABEL } from "@/lib/robot/types";

const ICON = [ShieldCheck, ShieldAlert, TriangleAlert, OctagonX];

/**
 * 안전등급 배지 L0~L3.
 * 접근성: 색상만으로 구분하지 않고 아이콘·텍스트를 함께 쓴다. (PRD §12)
 */
export default function SafetyBadge({
  level, faults = [], compact,
}: { level: number; faults?: string[]; compact?: boolean }) {
  const lv = Math.max(0, Math.min(3, level));
  const Icon = ICON[lv];
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full font-semibold text-white transition-colors ${compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm"}`}
        style={{ background: SAFETY_COLOR[lv] }}
      >
        <Icon size={compact ? 12 : 15} />
        L{lv} · {SAFETY_LABEL[lv]}
      </span>
      {!compact && faults.length > 0 && (
        <ul className="space-y-0.5 text-right text-xs text-level-2">
          {faults.map((f) => (
            <li key={f}>⚠ {f} — {FAULT_LABEL[f] ?? "알 수 없는 고장"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
