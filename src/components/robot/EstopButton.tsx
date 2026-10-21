"use client";

import { useEffect, useRef, useState } from "react";
import { sendCommand } from "@/hooks/useRobotStream";

const HOLD_MS = 1000;
const R = 44; // 진행 고리 반지름 (viewBox 100)
const C = 2 * Math.PI * R;

/**
 * 비상정지 플로팅 버튼.
 *
 * ⚠️ 안전 정책 (PRD §6 F-2)
 * 원격 정지는 보조 수단이다. 명령이 네트워크를 경유하므로 약 1초의 지연과
 * 단절 가능성이 있다. 1차 안전장치는 로봇의 물리 E-stop 버튼이며,
 * 이 문구를 UI에도 노출한다.
 *
 * 오작동 방지를 위해 1초 길게 누르기로 발동한다.
 * 누르는 동안 고리가 차오르고(게임의 "길게 눌러 확정" 패턴), 손을 떼면 고리가 빠르게 되감긴다.
 * 키보드(Space/Enter 길게)로도 발동할 수 있다.
 */
export default function EstopButton({ robotId, disabled }: { robotId: number; disabled?: boolean }) {
  const [holding, setHolding] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (reset.current) clearTimeout(reset.current);
  }, []);

  const start = () => {
    if (disabled || holding || status === "sending") return;
    setHolding(true);
    navigator.vibrate?.(15);
    timer.current = setTimeout(fire, HOLD_MS);
  };

  const cancel = () => {
    setHolding(false);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  const fire = async () => {
    timer.current = null;
    setHolding(false);
    setStatus("sending");
    try {
      await sendCommand(robotId, "ESTOP");
      navigator.vibrate?.([80, 40, 80]);
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
    if (reset.current) clearTimeout(reset.current);
    reset.current = setTimeout(() => setStatus("idle"), 4000);
  };

  const isKey = (e: React.KeyboardEvent) => e.key === " " || e.key === "Enter";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-[480px] flex-col items-end gap-2 px-4 [&>*]:pointer-events-auto">
      {status === "fail" && (
        <p role="alert" className="animate-drop max-w-[200px] rounded-lg bg-level-3 px-3 py-2 text-xs text-white">
          전송 실패 — 로봇의 물리 정지 버튼을 사용하세요
        </p>
      )}
      {status === "ok" && (
        <p role="status" className="animate-drop rounded-lg bg-level-0 px-3 py-2 text-xs text-white">
          정지 명령 전송됨
        </p>
      )}
      <button
        onPointerDown={(e) => {
          // 손가락이 버튼 밖으로 살짝 밀려도 계속 누르는 것으로 본다. 캡처 실패는 무시 — 정지 발동이 우선
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 무시 */ }
          start();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onPointerLeave={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => { if (isKey(e) && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (isKey(e)) cancel(); }}
        onBlur={cancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || status === "sending"}
        aria-label="비상 정지 (1초간 길게 누르기)"
        style={{ transition: holding ? `scale ${HOLD_MS}ms linear` : "scale .35s var(--ease-spring)" }}
        className={[
          "touch relative h-20 w-20 touch-none select-none whitespace-pre-line rounded-full bg-level-3 text-sm font-bold leading-tight text-white shadow-lg shadow-level-3/40 ring-4 ring-white",
          "disabled:opacity-40",
          holding ? "scale-90" : "",
          status === "ok" ? "animate-hit" : "",
        ].join(" ")}
      >
        {/* 차오르는 고리 — 1초 동안 선형으로, 떼면 0.2초 만에 되감김 */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-4 -rotate-90 overflow-visible" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-level-3)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={C}
                  style={{
                    strokeDashoffset: holding ? 0 : C,
                    transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : "stroke-dashoffset .2s ease-out",
                  }} />
        </svg>
        <span className="relative">{status === "sending" ? "전송 중" : holding ? "계속\n누르세요" : "긴급\n정지"}</span>
      </button>
      <p className="max-w-[120px] rounded bg-surface/80 px-1 text-right text-[10px] leading-tight text-muted">
        1초 길게 누르기<br />보조 수단입니다
      </p>
    </div>
  );
}
