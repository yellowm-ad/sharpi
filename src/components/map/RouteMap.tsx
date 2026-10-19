"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { kakao: any }
}

export interface MapLine { id: number | string; points: [number, number][]; color: string; weight?: number; dashed?: boolean }
export interface MapMarker { lat: number; lng: number; label: string; kind?: "poi" | "robot" | "point" }
export interface MapCircle { lat: number; lng: number; radius: number; color: string; label?: string }

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
let loader: Promise<any> | null = null;

/** 카카오맵 SDK를 한 번만 로드한다 (autoload=false → kakao.maps.load) */
function loadKakao(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    if (!KEY) return reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 미설정"));
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
    s.async = true;
    s.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    s.onerror = () => { loader = null; reject(new Error("카카오맵 SDK 로드 실패")); };
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * 카카오맵 래퍼 — 코스 그리기 / 궤적 표시 공용 (PRD §10-3 RouteMap)
 * 색은 CSS 토큰을 읽어서 넘긴다. 카카오맵은 CSS 변수를 이해하지 못한다.
 */
export default function RouteMap({
  center, level = 4, lines = [], markers = [], circles = [], fitTo, onMapClick, className = "h-64",
}: {
  center: [number, number];
  level?: number;
  lines?: MapLine[];
  markers?: MapMarker[];
  circles?: MapCircle[];
  fitTo?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const drawn = useRef<any[]>([]);
  const clickRef = useRef(onMapClick);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  clickRef.current = onMapClick;

  useEffect(() => {
    let alive = true;
    loadKakao()
      .then((kakao) => {
        if (!alive || !el.current) return;
        map.current = new kakao.maps.Map(el.current, {
          center: new kakao.maps.LatLng(center[0], center[1]),
          level,
        });
        kakao.maps.event.addListener(map.current, "click", (e: any) => {
          clickRef.current?.(e.latLng.getLat(), e.latLng.getLng());
        });
        setReady(true);
      })
      .catch((e) => alive && setErr(String(e.message ?? e)));
    return () => { alive = false; };
    // 지도는 한 번만 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오버레이 다시 그리기
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !map.current || !kakao) return;
    drawn.current.forEach((o) => o.setMap(null));
    drawn.current = [];
    const LL = (lat: number, lng: number) => new kakao.maps.LatLng(lat, lng);

    for (const c of circles) {
      drawn.current.push(new kakao.maps.Circle({
        map: map.current, center: LL(c.lat, c.lng), radius: c.radius,
        strokeWeight: 1, strokeColor: c.color, strokeOpacity: 0.6,
        fillColor: c.color, fillOpacity: 0.22,
      }));
      if (c.label) drawn.current.push(new kakao.maps.CustomOverlay({
        map: map.current, position: LL(c.lat, c.lng), yAnchor: 0.5,
        content: `<div style="font:600 11px Pretendard,sans-serif;color:${c.color};background:#fff;padding:2px 8px;border-radius:99px;border:1px solid ${c.color}">${c.label}</div>`,
      }));
    }

    for (const l of lines) {
      if (l.points.length < 2) continue;
      drawn.current.push(new kakao.maps.Polyline({
        map: map.current, path: l.points.map((p) => LL(p[0], p[1])),
        strokeWeight: l.weight ?? 5, strokeColor: l.color, strokeOpacity: 0.9,
        strokeStyle: l.dashed ? "shortdash" : "solid",
      }));
    }

    for (const m of markers) {
      const style =
        m.kind === "robot"
          ? "width:18px;height:18px;border-radius:99px;background:#06B6D4;border:3px solid #fff;box-shadow:0 0 0 6px rgba(6,182,212,.3)"
          : m.kind === "point"
          ? "width:12px;height:12px;border-radius:99px;background:#2563EB;border:2px solid #fff"
          : "font:600 11px Pretendard,sans-serif;background:#fff;color:#1D4ED8;padding:3px 8px;border-radius:99px;border:1px solid #DBEAFE;box-shadow:0 1px 3px rgba(0,0,0,.12);white-space:nowrap";
      drawn.current.push(new kakao.maps.CustomOverlay({
        map: map.current, position: LL(m.lat, m.lng), yAnchor: m.kind === "poi" || !m.kind ? 1.3 : 0.5,
        content: m.kind === "robot" || m.kind === "point" ? `<div title="${m.label}" style="${style}"></div>` : `<div style="${style}">${m.label}</div>`,
      }));
    }

    if (fitTo && fitTo.length > 1) {
      const b = new kakao.maps.LatLngBounds();
      fitTo.forEach((p) => b.extend(LL(p[0], p[1])));
      map.current.setBounds(b, 40, 40, 40, 40);
    }
  }, [ready, lines, markers, circles, fitTo]);

  if (err) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-2 bg-sherpy-50 px-6 text-center`}>
        <MapPinOff className="text-sherpy-400" />
        <p className="text-sm font-semibold text-body">지도를 불러오지 못했습니다</p>
        <p className="text-xs text-muted">
          카카오 개발자 콘솔에서 이 주소({typeof location !== "undefined" ? location.origin : ""})를
          JavaScript SDK 도메인에 등록했는지 확인하세요.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-sherpy-50`}>
      <div ref={el} className="absolute inset-0" />
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">지도 불러오는 중…</div>}
    </div>
  );
}
