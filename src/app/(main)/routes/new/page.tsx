"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Trash2, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RouteMap from "@/components/map/RouteMap";
import { DEOKJIN } from "@/components/weather/WalkScoreCard";
import { POI_LABEL, routeLength, type PoiType } from "@/lib/demo/data";
import { saveMyRoute } from "@/lib/my-routes";
import { useLoginGate } from "@/components/ui/LoginGate";

/** S09 코스 만들기 (DIY) — 지도를 탭해서 경유점을 찍는다 (PRD F-4) */
export default function NewRoute() {
  const router = useRouter();
  const { user, guard, gate } = useLoginGate();
  const [desc, setDesc] = useState("");
  const [points, setPoints] = useState<[number, number][]>([]);
  const [pois, setPois] = useState<{ type: PoiType; lat: number; lng: number }[]>([]);
  const [poiMode, setPoiMode] = useState<PoiType | null>(null);
  const [name, setName] = useState("");
  const [isPublic, setPublic] = useState(true);
  const [saved, setSaved] = useState(false);

  // 초안 보관 — 저장하려다 로그인하러 다녀와도 그리던 코스가 남아 있게
  const DRAFT = "sherpy.routeDraft";
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) ?? "null");
      if (d) { setPoints(d.points ?? []); setPois(d.pois ?? []); setName(d.name ?? ""); setDesc(d.desc ?? ""); setPublic(d.isPublic ?? true); }
    } catch { /* 초안 없음 */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored || saved) return;
    try { sessionStorage.setItem(DRAFT, JSON.stringify({ points, pois, name, desc, isPublic })); } catch { /* 무시 */ }
  }, [restored, saved, points, pois, name, desc, isPublic]);

  const dist = routeLength(points);
  const difficulty = dist > 2500 ? "어려움" : dist > 1200 ? "보통" : "쉬움";
  const canSave = points.length >= 2 && name.trim().length > 0;

  const onClick = (lat: number, lng: number) => {
    if (poiMode) { setPois((p) => [...p, { type: poiMode, lat, lng }]); setPoiMode(null); }
    else setPoints((p) => [...p, [lat, lng]]);
  };

  const lines = useMemo(() => [{ id: "new", points, color: "#2563EB", weight: 6 }], [points]);
  const markers = useMemo(() => [
    ...points.map((p, i) => ({ lat: p[0], lng: p[1], label: `경유점 ${i + 1}`, kind: "point" as const })),
    ...pois.map((p) => ({ lat: p.lat, lng: p.lng, label: POI_LABEL[p.type] })),
  ], [points, pois]);

  const [saveErr, setSaveErr] = useState<string | null>(null);
  const save = async () => {
    if (!user || saved) return;
    setSaveErr(null);
    try {
      const r = await saveMyRoute(user, {
        name: name.trim(),
        description: desc.trim() || "내가 그린 코스",
        isPublic,
        points,
        pois: pois.map((p) => ({ ...p, label: POI_LABEL[p.type] })),
        distanceM: dist,
      });
      setSaved(true);
      try { sessionStorage.removeItem(DRAFT); } catch { /* 무시 */ }
      setTimeout(() => router.push(`/routes/${r.id}`), 700);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "저장에 실패했어요");
    }
  };

  return (
    <div>
      <PageHeader title="코스 만들기" back />
      <div className="relative">
        <RouteMap center={[DEOKJIN.lat, DEOKJIN.lng]} level={4} lines={lines} markers={markers} onMapClick={onClick} className="h-[46dvh]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
          <p className="mx-auto w-fit rounded-full bg-ink/80 px-3 py-1.5 text-xs text-white">
            {poiMode ? `지도를 탭해 '${POI_LABEL[poiMode]}' 위치를 찍으세요` : "지도를 탭해 경유점을 이어 그리세요"}
          </p>
        </div>
        <div className="absolute right-3 bottom-3 z-10 flex gap-2">
          <button onClick={() => setPoints((p) => p.slice(0, -1))} aria-label="되돌리기" className="touch flex items-center justify-center rounded-full bg-surface shadow-md"><Undo2 size={18} /></button>
          <button onClick={() => { setPoints([]); setPois([]); }} aria-label="전체 지우기" className="touch flex items-center justify-center rounded-full bg-surface text-level-3 shadow-md"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Box label="거리" value={`${(dist / 1000).toFixed(2)}km`} />
          <Box label="예상 시간" value={`${Math.round(dist / 60)}분`} />
          <Box label="난이도" value={points.length >= 2 ? difficulty : "—"} />
        </div>

        <p className="mt-4 mb-2 text-sm font-bold">편의시설 추가</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(POI_LABEL) as PoiType[]).map((t) => (
            <button key={t} onClick={() => setPoiMode(poiMode === t ? null : t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${poiMode === t ? "border-sherpy-600 bg-sherpy-600 text-white" : "border-line bg-surface text-body"}`}>
              {POI_LABEL[t]}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-bold" htmlFor="rname">코스 이름</label>
        <input id="rname" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="예) 덕진공원 연못 반바퀴"
               className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-sherpy-600" />

        <input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={60} placeholder="한 줄 메모 (선택) — 예) 해 진 뒤 추천"
               className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-sherpy-600" />

        <label className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          공개 코스로 공유
          <input type="checkbox" checked={isPublic} onChange={(e) => setPublic(e.target.checked)} className="h-5 w-5 accent-sherpy-600" />
        </label>

        <button onClick={() => guard("코스를 저장하려면", save)} disabled={!canSave || saved}
                className="touch mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white disabled:opacity-40">
          {saved ? <><Check size={18} /> 내 코스에 저장했어요</> : user ? "내 코스에 저장" : "로그인하고 저장"}
        </button>
        {saveErr && <p role="alert" className="mt-2 text-center text-xs text-level-3">{saveErr}</p>}
        {points.length < 2 && <p className="mt-2 text-center text-xs text-muted">경유점을 2개 이상 찍으면 저장할 수 있어요</p>}
        {!user && points.length >= 2 && <p className="mt-2 text-center text-xs text-muted">그린 코스는 로그인 후에도 그대로 남아 있어요</p>}
      </div>
      {gate}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="tabular font-bold">{value}</p>
    </div>
  );
}
