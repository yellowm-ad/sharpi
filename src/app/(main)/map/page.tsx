"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Users, Heart, Lock, LogIn } from "lucide-react";
import RouteMap from "@/components/map/RouteMap";
import { DEOKJIN } from "@/components/weather/WalkScoreCard";
import { ROUTES, CROWD, CROWD_LABEL, routeLength, routeDurationMin, type DemoRoute } from "@/lib/demo/data";
import { useMyRoutes } from "@/lib/my-routes";
import { useUser } from "@/lib/session";

const ROUTE_COLORS = ["#2563EB", "#06B6D4", "#1D4ED8"];
const CROWD_COLOR = ["", "#16A34A", "#CA8A04", "#DC2626"];

/** S07 지도 — 코스 탐색(추천 / 내 코스) + 혼잡도(명목상) (PRD F-4, F-9) */
export default function MapPage() {
  const user = useUser();
  const mine = useMyRoutes();
  const [tab, setTab] = useState<"pub" | "mine">("pub");
  const [picked, setPicked] = useState<number | null>(null);
  const [showCrowd, setShowCrowd] = useState(false);

  const list: DemoRoute[] = tab === "pub" ? ROUTES : mine;
  const selected = list.some((r) => r.id === picked) ? picked : list[0]?.id ?? null;

  const lines = useMemo(
    () => list.map((r, i) => ({
      id: r.id, points: r.points,
      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
      weight: r.id === selected ? 7 : 4,
      dashed: r.id !== selected,
    })),
    [list, selected],
  );
  const markers = useMemo(
    () => list.map((r) => ({ lat: r.points[0][0], lng: r.points[0][1], label: r.name })),
    [list],
  );
  const circles = useMemo(
    () => (showCrowd ? CROWD.map((c) => ({ lat: c.lat, lng: c.lng, radius: 180, color: CROWD_COLOR[c.level], label: `${c.name} · ${CROWD_LABEL[c.level]}` })) : []),
    [showCrowd],
  );
  const sel = list.find((r) => r.id === selected);
  const fitTo = useMemo(() => (tab === "mine" && sel ? sel.points : undefined), [tab, sel]);

  return (
    <div className="relative">
      <RouteMap center={[DEOKJIN.lat, DEOKJIN.lng]} level={5} lines={lines} markers={markers} circles={circles} fitTo={fitTo}
                className="h-[calc(100dvh-4.5rem)]" />

      {/* 상단 컨트롤 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3">
        <div className="pointer-events-auto flex flex-1 rounded-2xl bg-surface/95 p-1 shadow-md backdrop-blur">
          {([["pub", "추천 코스"], ["mine", `내 코스${user ? ` ${mine.length}` : ""}`]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
                    className={`touch flex-1 rounded-xl text-sm font-semibold transition ${tab === k ? "bg-sherpy-600 text-white" : "text-body"}`}>
              {label}
            </button>
          ))}
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
        {tab === "mine" && !user ? (
          <Empty icon={<Lock size={20} />} title="로그인하면 내가 짠 코스를 저장하고 꺼내 쓸 수 있어요"
                 action={<Link href="/login?next=/map" className="flex items-center justify-center gap-1.5 rounded-xl bg-sherpy-600 py-2.5 text-sm font-semibold text-white"><LogIn size={16} />로그인</Link>} />
        ) : tab === "mine" && mine.length === 0 ? (
          <Empty icon={<Plus size={20} />} title="아직 저장한 코스가 없어요"
                 action={<Link href="/routes/new" className="block rounded-xl bg-sherpy-600 py-2.5 text-center text-sm font-semibold text-white">첫 코스 그리기</Link>} />
        ) : (
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {list.map((r) => (
              <div key={r.id} role="button" tabIndex={0} onClick={() => setPicked(r.id)}
                   className={`card w-[78%] shrink-0 snap-center p-4 text-left shadow-lg transition ${r.id === selected ? "border-sherpy-600 ring-2 ring-sherpy-600/20" : ""}`}>
                <div className="flex items-center gap-1.5">
                  {tab === "mine" && <span className="rounded-full bg-sherpy-600 px-2 py-0.5 text-[11px] font-semibold text-white">내 코스</span>}
                  <span className="rounded-full bg-sherpy-50 px-2 py-0.5 text-[11px] font-semibold text-sherpy-700">{r.difficulty}</span>
                  {r.taught && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">자동주행 가능</span>}
                  <span className="ml-auto flex items-center gap-0.5 text-xs text-muted"><Heart size={12} />{r.likeCount}</span>
                </div>
                <p className="mt-2 truncate font-bold">{r.name}</p>
                <p className="tabular text-xs text-muted">{(routeLength(r.points) / 1000).toFixed(2)}km · 약 {routeDurationMin(r.points)}분 · by {r.author}</p>
                <Link href={`/routes/${r.id}`} className="mt-3 block rounded-xl bg-sherpy-600 py-2 text-center text-sm font-semibold text-white">
                  코스 보기
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/routes/new" aria-label="코스 만들기"
            className="absolute top-20 left-3 z-10 flex h-11 items-center gap-1 rounded-full bg-sherpy-600 px-4 text-sm font-semibold text-white shadow-lg">
        <Plus size={16} /> 코스 만들기
      </Link>
    </div>
  );
}

function Empty({ icon, title, action }: { icon: React.ReactNode; title: string; action: React.ReactNode }) {
  return (
    <div className="card mx-4 p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sherpy-50 text-sherpy-600">{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="mt-3">{action}</div>
    </div>
  );
}
