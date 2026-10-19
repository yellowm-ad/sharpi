"use client";

import { useEffect, useRef, useState } from "react";

export interface TelemetryRow {
  id: number;
  robotId: number;
  ts: string;
  mode: "idle" | "teach" | "follow" | "estop";
  safetyLevel: number;
  faults: string[];
  tensionN: number | null;
  leashLenM: number | null;
  speedCmd: number | null;
  steerCmd: number | null;
  lat: number | null;
  lng: number | null;
  gpsSrc: "phone" | "robot" | null;
  routeId: number | null;
  kfIndex: number | null;
  kfTotal: number | null;
  matchQuality: number | null;
  batteryV: number | null;
}

export type ConnState = "connecting" | "online" | "stale" | "offline";

/**
 * 로봇 텔레메트리 SSE 구독.
 *
 * Vercel 함수 실행시간 제한(Hobby 300초) 때문에 스트림이 주기적으로 끊긴다.
 * EventSource가 자동 재연결하고 Last-Event-ID로 유실분을 이어받는다.
 * 3초 이상 수신이 없으면 stale, 10초면 offline으로 본다. (PRD F-1 수용기준)
 */
export function useRobotStream(robotId: number | null) {
  const [latest, setLatest] = useState<TelemetryRow | null>(null);
  const [state, setState] = useState<ConnState>("connecting");
  const lastRecvRef = useRef<number>(Date.now());

  useEffect(() => {
    if (robotId == null) return;

    const es = new EventSource(`/api/robots/${robotId}/stream`);

    es.addEventListener("telemetry", (e) => {
      try {
        const row = JSON.parse((e as MessageEvent).data) as TelemetryRow;
        setLatest(row);
        lastRecvRef.current = Date.now();
        setState("online");
      } catch {
        /* 파싱 실패는 무시하고 다음 프레임을 기다린다 */
      }
    });

    es.onerror = () => {
      // EventSource는 스스로 재연결한다. 상태만 낮춰 표시.
      setState((s) => (s === "online" ? "stale" : s));
    };

    const watchdog = setInterval(() => {
      const gap = Date.now() - lastRecvRef.current;
      if (gap > 10_000) setState("offline");
      else if (gap > 3_000) setState("stale");
    }, 1000);

    return () => {
      clearInterval(watchdog);
      es.close();
    };
  }, [robotId]);

  return { latest, state, lastSeenMsAgo: Date.now() - lastRecvRef.current };
}

/** 명령 발신 헬퍼 */
export async function sendCommand(robotId: number, type: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(`/api/robots/${robotId}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) throw new Error(`명령 전송 실패 (${res.status})`);
  return res.json();
}
