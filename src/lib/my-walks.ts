"use client";

import { WALKS, type DemoWalk } from "@/lib/demo/data";
import { createLocalStore } from "@/lib/local-store";

/**
 * 내가 기록한 산책 (PRD F-6) — 산책 중 화면(S12)이 끝날 때 저장한다.
 * 서버 저장(TODO(M1): POST /api/walks) 전까지는 이 기기에만 남는다. 시연용 기록 뒤에 최신순으로 붙는다.
 */
const store = createLocalStore<DemoWalk[]>("sherpy.walks", []);
const EMPTY: DemoWalk[] = [];

export function useWalks(): DemoWalk[] {
  const mine = store.use();
  return mine.length ? [...mine, ...WALKS] : WALKS;
}

export function saveWalk(w: Omit<DemoWalk, "id">): DemoWalk {
  const list = store.get() ?? EMPTY;
  const walk = { ...w, id: Math.max(1000, ...list.map((x) => x.id)) + 1 };
  store.set([walk, ...list].slice(0, 50));
  return walk;
}

/** id 가 1000보다 크면 이 기기에서 기록한 산책 */
export const isLocalWalk = (id: number) => id > 1000;

/** 최근 2회 대비 그 이전 2회 당김 변화율(%) — 음수면 줄어듦. 비교할 기록이 모자라면 null */
export function pullTrend(walks: DemoWalk[]) {
  if (walks.length < 4) return null;
  const recent = walks[0].pullCount + walks[1].pullCount;
  const before = walks[2].pullCount + walks[3].pullCount;
  if (before === 0) return null;
  return { recent, before, pct: Math.round((recent / before - 1) * 100) };
}
