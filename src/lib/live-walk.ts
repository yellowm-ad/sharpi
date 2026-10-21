"use client";

import { createLocalStore } from "@/lib/local-store";

/**
 * 진행 중인 산책 (S12) — 매 텔레메트리마다 저장해 두고, 화면을 떠났다 돌아오거나
 * 새로고침·모바일 브라우저가 탭을 정리해도 이어서 기록한다.
 * 너무 오래된 기록(STALE_MS)은 끝내지 못한 산책으로 보고 버린다.
 */
export interface LiveWalkState {
  startedAt: number;
  updatedAt: number;
  dist: number; pulls: number; maxT: number; sumT: number; n: number; maxV: number;
  last: [number, number] | null;
  pulling: boolean;
  level: number;
  warnings: { at: string; level: number; reason: string }[];
  trail: [number, number][];
}

const STALE_MS = 3 * 3600_000;
const store = createLocalStore<LiveWalkState | null>("sherpy.liveWalk", null);

export const newLiveWalk = (): LiveWalkState => ({
  startedAt: Date.now(), updatedAt: Date.now(),
  dist: 0, pulls: 0, maxT: 0, sumT: 0, n: 0, maxV: 0, last: null, pulling: false, level: 0, warnings: [], trail: [],
});

const fresh = (w: LiveWalkState | null) => (w && Date.now() - w.updatedAt < STALE_MS ? w : null);

/** 이어서 기록할 산책이 있으면 돌려준다 */
export const getLiveWalk = () => fresh(store.get());
export const saveLiveWalk = (w: LiveWalkState) => store.set({ ...w, updatedAt: Date.now() });
export const clearLiveWalk = () => store.set(null);

/** 홈·기록 화면의 "산책 이어하기" 표시용 */
export function useLiveWalk() {
  return fresh(store.use());
}
