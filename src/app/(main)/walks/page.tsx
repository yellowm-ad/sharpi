"use client";

import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { routeById } from "@/lib/demo/data";
import { useDog } from "@/lib/dog";
import { findRoute } from "@/lib/my-routes";
import { useWalks, pullTrend, isLocalWalk } from "@/lib/my-walks";
import { useLiveWalk } from "@/lib/live-walk";

/** S13 산책 기록 목록 (PRD F-6) */
export default function WalksPage() {
  const dog = useDog();
  const walks = useWalks();
  const live = useLiveWalk();
  const total = walks.reduce((s, w) => s + w.distanceM, 0);
  const trend = pullTrend(walks);
  const chart = walks.slice(0, 8).reverse(); // 최근 8회, 왼쪽이 오래된 것
  const max = Math.max(1, ...chart.map((w) => w.pullCount));

  return (
    <div>
      <PageHeader title="산책 기록" back />
      <div className="px-4 pt-4">
        <Link href="/walks/live" className="press touch flex items-center justify-center gap-2 rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white shadow-lg shadow-sherpy-600/20">
          <Play size={18} /> {live ? "기록 중인 산책으로 돌아가기" : "산책 시작"}
        </Link>

        <section className="card mt-3 p-4">
          <p className="text-sm font-semibold">{dog.name}의 당김 추이</p>
          <p className="mt-0.5 text-xs text-muted">장력 30N 이상 당긴 횟수 · 셰르피만 잴 수 있는 기록</p>
          <div className="mt-4 flex h-24 items-end justify-around gap-3">
            {chart.map((w, i) => {
              const d = new Date(w.startedAt);
              return (
                <div key={w.id} className="flex flex-1 flex-col items-center gap-1">
                  <span className="tabular text-[11px] font-semibold">{w.pullCount}</span>
                  {/* 막대가 아래에서 차례로 자라 오른다 */}
                  <div className={`w-full origin-bottom rounded-t-md ${isLocalWalk(w.id) ? "bg-sherpy-600" : "bg-sherpy-400"}`}
                       style={{ height: `${(w.pullCount / max) * 64 + 4}px`, animation: `grow-y .6s var(--ease-out) ${i * 60}ms both` }} />
                  <span className="text-[10px] text-muted">{d.getMonth() + 1}/{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          {trend && (
            <p className="mt-3 text-xs text-sherpy-700">
              최근 2회 당김 {trend.recent}회 · 이전 2회 {trend.before}회 —{" "}
              {trend.pct < 0 ? `${-trend.pct}% 줄었어요` : trend.pct > 0 ? `${trend.pct}% 늘었어요` : "같아요"}
            </p>
          )}
        </section>

        <p className="mt-5 mb-2 text-sm font-bold">전체 {walks.length}회 · {(total / 1000).toFixed(1)}km</p>
        <ul className="space-y-2 pb-6">
          {walks.map((w) => {
            const d = new Date(w.startedAt);
            return (
              <li key={w.id}>
                <Link href={`/walks/${w.id}`} className="press card flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-sherpy-50 text-sherpy-700">
                    <span className="text-[10px]">{d.getMonth() + 1}월</span>
                    <span className="text-lg leading-none font-bold">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-semibold">
                      {isLocalWalk(w.id) && <span className="rounded-full bg-sherpy-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">내 기록</span>}
                      <span className="truncate">{(routeById(w.routeId) ?? findRoute(w.routeId))?.name ?? "자유 산책"}</span>
                    </p>
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
