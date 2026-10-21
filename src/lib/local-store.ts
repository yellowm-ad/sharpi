"use client";

import { useSyncExternalStore } from "react";

/**
 * 브라우저(localStorage)에 보관하는 작은 값 저장소.
 * 서버 저장 API(TODO(M1): /api/dogs, /api/walks)가 생기기 전까지 이 기기에서만 유지된다.
 * 같은 키를 쓰는 화면끼리는 즉시 동기화되고, 다른 탭에서 바뀐 값도 storage 이벤트로 따라온다.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T | undefined;

  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };

  const set = (next: T) => {
    cache = next;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* 사생활 보호 모드 등 — 이번 세션에만 유지 */ }
    listeners.forEach((fn) => fn());
  };

  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => { if (e.key === key) { cache = undefined; fn(); } };
    addEventListener("storage", onStorage);
    return () => { listeners.delete(fn); removeEventListener("storage", onStorage); };
  };

  const use = () => useSyncExternalStore(subscribe, read, () => fallback);
  return { use, get: read, set };
}
