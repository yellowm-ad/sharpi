"use client";

import { useEffect, useRef } from "react";

/**
 * 시연용 1인칭 화면 — 카메라 모듈 확보 전(PRD §2-3) 화면 구성을 보여주기 위한 캔버스 애니메이션.
 * 공원 산책로를 따라가는 느낌만 낸다. 실제 영상이 아님을 화면에 표기한다.
 */
export default function DemoCamera({ speed = 0.8, steer = 0 }: { speed?: number; steer?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ speed, steer });
  live.current = { speed, steer };

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0, z = 0, sway = 0;

    const draw = () => {
      const w = (c.width = c.clientWidth * devicePixelRatio);
      const h = (c.height = c.clientHeight * devicePixelRatio);
      const hz = h * 0.42;
      z += live.current.speed * 0.02;
      sway += (live.current.steer * w * 0.12 - sway) * 0.05;
      const vx = w / 2 - sway;

      // 하늘 (저녁)
      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, "#1e3a5f"); sky.addColorStop(1, "#d9a37a");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);

      // 연못 쪽 수면
      ctx.fillStyle = "#3b5d6e"; ctx.fillRect(0, hz, w, h * 0.05);

      // 잔디
      const grass = ctx.createLinearGradient(0, hz, 0, h);
      grass.addColorStop(0, "#3f5e3a"); grass.addColorStop(1, "#24391f");
      ctx.fillStyle = grass; ctx.fillRect(0, hz, w, h - hz);

      // 산책로 (원근)
      ctx.fillStyle = "#8b7d6b";
      ctx.beginPath();
      ctx.moveTo(vx - w * 0.02, hz); ctx.lineTo(vx + w * 0.02, hz);
      ctx.lineTo(w * 0.85, h); ctx.lineTo(w * 0.15, h); ctx.closePath(); ctx.fill();

      // 보도블록 줄눈
      ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2 * devicePixelRatio;
      for (let i = 0; i < 14; i++) {
        const t = ((i / 14 + z) % 1);
        const p = t * t;
        const y = hz + (h - hz) * p;
        const half = (w * 0.02) + (w * 0.35 - w * 0.02) * p;
        const cx = vx + (w / 2 - vx) * p;
        ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
      }

      // 나무
      for (let i = 0; i < 8; i++) {
        const t = ((i / 8 + z * 0.9) % 1);
        const p = t * t;
        const side = i % 2 ? 1 : -1;
        const x = vx + side * (w * 0.05 + w * 0.6 * p);
        const y = hz + (h - hz) * p;
        const s = 6 + 140 * p;
        ctx.fillStyle = "#4a3426"; ctx.fillRect(x - s * 0.06, y - s * 1.1, s * 0.12, s * 1.1);
        ctx.fillStyle = i % 3 ? "#2f5530" : "#3a6b39";
        ctx.beginPath(); ctx.arc(x, y - s * 1.25, s * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      // 리드줄 끝 강아지 실루엣
      const bob = Math.sin(Date.now() / 120) * 3 * devicePixelRatio;
      const dx = w / 2 + Math.sin(Date.now() / 1700) * w * 0.05;
      const dy = h * 0.62 + bob;
      ctx.fillStyle = "#e8c48a";
      ctx.beginPath(); ctx.ellipse(dx, dy, w * 0.06, w * 0.035, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(dx, dy - w * 0.045, w * 0.032, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#60A5FA"; ctx.lineWidth = 2.5 * devicePixelRatio;
      ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.quadraticCurveTo(w / 2, h * 0.8, dx, dy - w * 0.02); ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-label="시연용 1인칭 화면" />;
}
