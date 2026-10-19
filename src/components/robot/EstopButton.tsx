"use client";

import { useRef, useState } from "react";
import { sendCommand } from "@/hooks/useRobotStream";

/**
 * 비상정지 플로팅 버튼.
 *
 * ⚠️ 안전 정책 (PRD §6 F-2)
 * 원격 정지는 보조 수단이다. 명령이 네트워크를 경유하므로 약 1초의 지연과
 * 단절 가능성이 있다. 1차 안전장치는 로봇의 물리 E-stop 버튼이며,
 * 이 문구를 UI에도 노출한다.
 *
 * 오작동 방지를 위해 1초 길게 누르기로 발동한다.
 */
export default function EstopButton({ robotId, disabled }: { robotId: number; disabled?: boolean }) {
  const [holding, setHolding] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (disabled) return;
    setHolding(true);
    timer.current = setTimeout(fire, 1000);
  };

  const cancel = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const fire = async () => {
    setHolding(false);
    setStatus("sending");
    try {
      await sendCommand(robotId, "ESTOP");
      navigator.vibrate?.([80, 40, 80]);
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-[480px] flex-col items-end gap-2 px-4 [&>*]:pointer-events-auto">
      {status === "fail" && (
        <p className="max-w-[200px] rounded-lg bg-level-3 px-3 py-2 text-xs text-white">
          전송 실패 — 로봇의 물리 정지 버튼을 사용하세요
        </p>
      )}
      {status === "ok" && (
        <p className="rounded-lg bg-[var(--color-level-0)] px-3 py-2 text-xs text-white">
          정지 명령 전송됨
        </p>
      )}
      <button
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || status === "sending"}
        aria-label="비상 정지 (1초간 길게 누르기)"
        className={[
          "touch relative h-20 w-20 select-none whitespace-pre-line rounded-full text-sm font-bold leading-tight text-white shadow-lg shadow-level-3/40 ring-4 ring-white transition",
          "disabled:opacity-40",
          holding ? "scale-95 bg-level-3" : "bg-level-3",
        ].join(" ")}
      >
        {holding ? "누르는 중…" : "긴급\n정지"}
        {holding && (
          <span className="absolute inset-0 animate-ping rounded-full bg-level-3 opacity-60" />
        )}
      </button>
      <p className="max-w-[120px] rounded bg-surface/80 px-1 text-right text-[10px] leading-tight text-muted">
        1초 길게 누르기<br />보조 수단입니다
      </p>
    </div>
  );
}
