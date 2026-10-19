"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ROUTES, type DemoRoute } from "@/lib/demo/data";
import { useUser, type SessionUser } from "@/lib/session";

/**
 * 내 코스 — 로그인한 사용자가 직접 그린 코스 (PRD F-4).
 * 서버(/api/routes)에 계정별로 저장하고, 지도·코스 상세·셰르피 전송에서 공개 코스와 똑같이 꺼내 쓴다.
 * DB 없는 시연 배포에서는 브라우저에 계정별로 보관한다.
 * 내 코스 id 는 1001부터라 앱 내장 코스(12·15·18)와 겹치지 않는다.
 */
export type NewRoute = Omit<DemoRoute, "id" | "author" | "likeCount" | "taught" | "keyframes" | "difficulty">;

const listeners = new Set<() => void>();
const EMPTY: DemoRoute[] = [];
let owner: string | null = null;
let list: DemoRoute[] = EMPTY;
let demo = false;

const localKey = (u: string) => `sherpy.routes.${u}`;

function emit(next: DemoRoute[]) {
  list = next;
  if (demo && owner) {
    try { localStorage.setItem(localKey(owner), JSON.stringify(next)); } catch { /* 무시 */ }
  }
  listeners.forEach((fn) => fn());
}

async function load(user: SessionUser | null) {
  const name = user?.username ?? null;
  if (name === owner) return;
  owner = name;
  if (!name) return emit(EMPTY);
  const r = await fetch("/api/routes/mine", { cache: "no-store" }).catch(() => null);
  if (owner !== name) return; // 그 사이 계정이 바뀜
  if (r?.ok) {
    demo = false;
    emit((await r.json()).routes);
  } else {
    demo = r?.status === 503;
    try { emit(JSON.parse(localStorage.getItem(localKey(name)) ?? "[]")); } catch { emit(EMPTY); }
  }
}

/** 현재 로그인 사용자의 코스 목록 (게스트면 빈 목록) */
export function useMyRoutes() {
  const user = useUser();
  useEffect(() => { load(user); }, [user]);
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => list,
    () => EMPTY,
  );
}

const difficultyOf = (m: number): DemoRoute["difficulty"] => (m > 2500 ? "어려움" : m > 1200 ? "보통" : "쉬움");

/** 저장 — 실패하면 오류 문구를 던진다 */
export async function saveMyRoute(user: SessionUser, r: NewRoute & { distanceM: number }): Promise<DemoRoute> {
  if (!demo) {
    const res = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: r.name, description: r.description, isPublic: r.isPublic, points: r.points, pois: r.pois }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { emit([j.route, ...list]); return j.route; }
    if (res.status !== 503) throw new Error(j.error ?? "저장에 실패했어요");
    demo = true;
  }
  const route: DemoRoute = {
    ...r, id: Math.max(1000, ...list.map((x) => x.id)) + 1,
    author: user.nickname, likeCount: 0, taught: false, keyframes: 0, difficulty: difficultyOf(r.distanceM),
  };
  emit([route, ...list]);
  return route;
}

export async function deleteMyRoute(id: number) {
  if (!demo) await fetch(`/api/routes/${id}`, { method: "DELETE" });
  emit(list.filter((r) => r.id !== id));
}

/** 티칭이 끝난 내 코스에 키프레임 수를 기록 — 이후 자동주행 가능 (PRD F-4 수용기준) */
export async function markTaught(id: number, keyframes: number) {
  emit(list.map((r) => (r.id === id ? { ...r, taught: true, keyframes } : r)));
  if (!demo) {
    await fetch(`/api/routes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taught: true, keyframes }),
    }).catch(() => {});
  }
}

/** 내장 코스 + 지금 불러온 내 코스에서 찾는다 */
export function findRoute(id: number | null | undefined): DemoRoute | undefined {
  if (id == null) return undefined;
  return ROUTES.find((r) => r.id === id) ?? list.find((r) => r.id === id);
}
