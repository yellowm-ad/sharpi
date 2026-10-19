"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Users, Heart } from "lucide-react";
import RouteMap from "@/components/map/RouteMap";
import { DEOKJIN } from "@/components/weather/WalkScoreCard";
import { ROUTES, CROWD, CROWD_LABEL, routeLength, routeDurationMin } from "@/lib/demo/data";

const ROUTE_COLORS = ["#2563EB", "#06B6D4", "#1D4ED8"];
const CROWD_COLOR = ["", "#16A34A", "#CA8A04", "#DC2626"];

/** S07 지도 — 코스 탐색 + 혼잡도(명목상) (PRD F-4, F-9) */
export default function MapPage() {
  const [selected, setSelected] = useState<number>(ROUTES[0].id);
  const [showCrowd, setShowCrowd] = useState(false);

  const lines = useMemo(
    () => ROUTES.map((r, i) => ({
      id: r.id, points: r.points,
      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
      weight: r.id === selected ? 7 : 4,
      dashed: r.id !== selected,
    })),
    [selected],
  );
  const markers = useMemo(
    () => ROUTES.map((r) => ({ lat: r.points[0][0], lng: r.points[0][1], label: r.name })),
    [],
  );
  const circles = useMemo(
    () => (showCrowd ? CROWD.map((c) => ({ lat: c.lat, lng: c.lng, radius: 180, color: CROWD_COLOR[c.level], label: `${c.name} · ${CROWD_LABEL[c.level]}` })) : []),
    [showCrowd],
  );

  return (
    <div className="relative">
      <RouteMap center={[DEOKJIN.lat, DEOKJIN.lng]} level={5} lines={lines} markers={markers} circles={circles}
                className="h-[calc(100dvh-4.5rem)]" />

      {/* 상단 컨트롤 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3">
        <div className="pointer-events-auto flex-1 rounded-2xl bg-surface/95 px-4 py-2.5 shadow-md backdrop-blur">
          <p className="text-sm font-bold">덕진공원 · 전북대 일대</p>
          <p className="text-[11px] text-muted">코스 {ROUTES.length}개</p>
        </div>
        <button onClick={() => setShowCrowd((v) => !v)}
                className={`touch pointer-events-auto flex items-center gap-1 rounded-2xl px-3 text-xs font-semibold shadow-md ${showCrowd ? "bg-sherpy-600 text-white" : "bg-surface text-body"}`}>
          <Users size={15} /> 혼잡도
        </button>
      </div>

      {showCrowd && (
        <div className="animate-fade absolute top-20 right-3 z-10 rounded-xl bg-surface/95 p-2.5 text-[11px] shadow-md">
          {[1, 2, 3].map((l) => (
            <p key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CROWD_COLOR[l] }} />{CROWD_LABEL[l]}</p>
          ))}
          <p className="mt-1 text-muted">시연용 데이터</p>
        </div>
      )}

      {/* 하단 코스 카드 */}
      <div className="absolute inset-x-0 bottom-3 z-10">
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {ROUTES.map((r) => (
            <div key={r.id} role="button" tabIndex={0} onClick={() => setSelected(r.id)}
                    className={`card w-[78%] shrink-0 snap-center p-4 text-left shadow-lg transition ${r.id === selected ? "border-sherpy-600 ring-2 ring-sherpy-600/20" : ""}`}>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-sherpy-50 px-2 py-0.5 text-[11px] font-semibold text-sherpy-700">{r.difficulty}</span>
                {r.taught && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">자동주행 가능</span>}
                <span className="ml-auto flex items-center gap-0.5 text-xs text-muted"><Heart size={12} />{r.likeCount}</span>
              </div>
              <p className="mt-2 font-bold">{r.name}</p>
              <p className="tabular text-xs text-muted">{(routeLength(r.points) / 1000).toFixed(2)}km · 약 {routeDurationMin(r.points)}분 · by {r.author}</p>
              <Link href={`/routes/${r.id}`} className="mt-3 block rounded-xl bg-sherpy-600 py-2 text-center text-sm font-semibold text-white">
                코스 보기
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Link href="/routes/new" aria-label="코스 만들기"
            className="absolute top-20 left-3 z-10 flex h-11 items-center gap-1 rounded-full bg-sherpy-600 px-4 text-sm font-semibold text-white shadow-lg">
        <Plus size={16} /> 코스 만들기
      </Link>
    </div>
  );
}
