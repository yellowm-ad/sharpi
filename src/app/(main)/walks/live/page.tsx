"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Square, Video } from "lucide-react";
import Link from "next/link";
import RouteMap from "@/components/map/RouteMap";
import SafetyBadge from "@/components/robot/SafetyBadge";
import EstopButton from "@/components/robot/EstopButton";
import Sheet from "@/components/ui/Sheet";
import { useRobotStream } from "@/hooks/useRobotStream";
import { THRESHOLDS } from "@/lib/robot/types";
import { routeById, distM, ROUTES } from "@/lib/demo/data";

/** S12 산책 중 화면 — 텔레메트리로 거리·당김을 자동 집계 (PRD F-6) */
export default function LiveWalk() {
  const router = useRouter();
  const { latest, state } = useRobotStream(1);
  const [elapsed, setElapsed] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const agg = useRef({ dist: 0, pulls: 0, maxT: 0, last: null as [number, number] | null, pulling: false });
  const [trail, setTrail] = useState<[number, number][]>([]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!latest) return;
    const a = agg.current;
    if (latest.lat != null && latest.lng != null) {
      const p: [number, number] = [latest.lat, latest.lng];
      if (a.last) a.dist += distM(a.last, p);
      a.last = p;
      setTrail((tr) => (tr.length && tr[tr.length - 1][0] === p[0] && tr[tr.length - 1][1] === p[1] ? tr : [...tr, p]));
    }
    const t = latest.tensionN ?? 0;
    a.maxT = Math.max(a.maxT, t);
    // 당김 횟수 — F_HARD를 넘어설 때마다 1회
    if (t >= THRESHOLDS.F_HARD && !a.pulling) { a.pulls++; a.pulling = true; }
    if (t < THRESHOLDS.F_HARD) a.pulling = false;
  }, [latest]);

  const route = routeById(latest?.routeId ?? 12) ?? ROUTES[0];
  const lines = useMemo(() => [
    { id: "plan", points: route.points, color: "#93C5FD", weight: 5, dashed: true },
    { id: "trail", points: trail, color: "#06B6D4", weight: 6 },
  ], [route, trail]);
  const markers = useMemo(() => latest?.lat != null ? [{ lat: latest.lat, lng: latest.lng!, label: "셰르피", kind: "robot" as const }] : [], [latest?.lat, latest?.lng]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const a = agg.current;

  return (
    <div>
      <div className="relative">
        <RouteMap center={route.points[0]} lines={lines} markers={markers} fitTo={route.points} className="h-[52dvh]" />
        <div className="absolute top-3 right-3 z-10"><SafetyBadge level={latest?.safetyLevel ?? 0} compact /></div>
        <Link href="/robot/camera" className="absolute top-3 left-3 z-10 flex h-10 items-center gap-1 rounded-full bg-ink/80 px-3 text-xs text-white">
          <Video size={14} /> 카메라
        </Link>
      </div>

      <div className="-mt-5 relative z-10 rounded-t-3xl bg-surface px-4 pt-5">
        <p className="text-center text-xs text-muted">{route.name} · {state === "online" ? "기록 중" : "연결 확인 중"}</p>
        <p className="tabular mt-1 text-center text-5xl font-bold">{mm}:{ss}</p>
        <div className="mt-4 grid grid-cols-3 text-center">
          <M v={`${(a.dist / 1000).toFixed(2)}`} u="km" l="거리" />
          <M v={latest?.tensionN?.toFixed(1) ?? "—"} u="N" l="장력" />
          <M v={`${a.pulls}`} u="회" l="당김" />
        </div>
        <button onClick={() => setEndOpen(true)}
                className="touch mt-6 mb-28 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-semibold text-white">
          <Square size={16} /> 산책 종료
        </button>
      </div>

      <EstopButton robotId={1} disabled={state === "offline"} />

      <Sheet open={endOpen} title="산책을 마칠까요?" confirmLabel="종료" onClose={() => setEndOpen(false)}
             onConfirm={() => router.push("/walks/104")}>
        <span className="tabular">{mm}:{ss} · {(a.dist / 1000).toFixed(2)}km · 최대 장력 {a.maxT.toFixed(1)}N · 당김 {a.pulls}회</span>
        <br />리포트가 자동으로 저장됩니다.
      </Sheet>
    </div>
  );
}

function M({ v, u, l }: { v: string; u: string; l: string }) {
  return (
    <div>
      <p className="tabular text-2xl font-bold">{v}<span className="ml-0.5 text-xs font-normal text-muted">{u}</span></p>
      <p className="text-[11px] text-muted">{l}</p>
    </div>
  );
}
