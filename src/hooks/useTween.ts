"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 숫자를 부드럽게 따라가게 한다 — 게임 HUD의 체력바처럼 값이 "뚝" 바뀌지 않고 감속하며 도착한다.
 * 1Hz 텔레메트리 사이를 메워서 게이지가 살아 있는 느낌을 준다.
 * from 을 주면 처음 마운트될 때 그 값에서 출발한다(카운트업).
 */
export function useTween(target: number, ms = 450, from?: number) {
  const [v, setV] = useState(from ?? target);
  const cur = useRef(from ?? target);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { cur.current = target; setV(target); return; }
    const start = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3); // ease-out cubic
      cur.current = start + (target - start) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return v;
}
