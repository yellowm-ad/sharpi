import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { WALKS, DOG, routeById } from "@/lib/demo/data";

/** S13 산책 기록 목록 (PRD F-6) */
export default function WalksPage() {
  const total = WALKS.reduce((s, w) => s + w.distanceM, 0);
  const pullsRecent = WALKS.slice(0, 2).reduce((s, w) => s + w.pullCount, 0);
  const pullsOld = WALKS.slice(2, 4).reduce((s, w) => s + w.pullCount, 0);
  const max = Math.max(...WALKS.map((w) => w.pullCount));

  return (
    <div>
      <PageHeader title="산책 기록" back />
      <div className="px-4 pt-4">
        <Link href="/walks/live" className="touch flex items-center justify-center gap-2 rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white">
          <Play size={18} /> 산책 시작
        </Link>

        <section className="card mt-3 p-4">
          <p className="text-sm font-semibold">{DOG.name}의 당김 추이</p>
          <p className="mt-0.5 text-xs text-muted">장력 30N 이상 당긴 횟수 · 셰르피만 잴 수 있는 기록</p>
          <div className="mt-4 flex h-24 items-end justify-around gap-3">
            {[...WALKS].reverse().map((w) => (
              <div key={w.id} className="flex flex-1 flex-col items-center gap-1">
                <span className="tabular text-[11px] font-semibold">{w.pullCount}</span>
                <div className="w-full rounded-t-md bg-sherpy-400" style={{ height: `${(w.pullCount / max) * 64 + 4}px` }} />
                <span className="text-[10px] text-muted">{new Date(w.startedAt).getMonth() + 1}/{new Date(w.startedAt).getDate()}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-sherpy-700">
            최근 2회 당김 {pullsRecent}회 · 이전 2회 {pullsOld}회 — {Math.round((1 - pullsRecent / pullsOld) * 100)}% 줄었어요
          </p>
        </section>

        <p className="mt-5 mb-2 text-sm font-bold">전체 {WALKS.length}회 · {(total / 1000).toFixed(1)}km</p>
        <ul className="space-y-2 pb-6">
          {WALKS.map((w) => {
            const d = new Date(w.startedAt);
            return (
              <li key={w.id}>
                <Link href={`/walks/${w.id}`} className="card flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-sherpy-50 text-sherpy-700">
                    <span className="text-[10px]">{d.getMonth() + 1}월</span>
                    <span className="text-lg leading-none font-bold">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{routeById(w.routeId)?.name}</p>
                    <p className="tabular text-xs text-muted">
                      {(w.distanceM / 1000).toFixed(2)}km · {Math.round(w.durationS / 60)}분 · 최대 {w.maxTensionN}N · 당김 {w.pullCount}
                    </p>
                  </div>
                  {w.warnings.length > 0 && <span className="rounded-full bg-level-2/10 px-2 py-0.5 text-[10px] font-semibold text-level-2">경고 {w.warnings.length}</span>}
                  <ChevronRight size={18} className="text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
