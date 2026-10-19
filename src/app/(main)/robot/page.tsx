"use client";

import { useRobotStream, sendCommand } from "@/hooks/useRobotStream";
import TensionGauge from "@/components/robot/TensionGauge";
import LeashBar from "@/components/robot/LeashBar";
import SafetyBadge from "@/components/robot/SafetyBadge";
import EstopButton from "@/components/robot/EstopButton";
import { useState } from "react";

/** S10 — 셰르피 실시간 대시보드 (PRD F-1) */
export default function RobotDashboard() {
  // TODO(M1): 로그인 사용자의 로봇 id를 세션에서 가져올 것
  const robotId = 1;
  const { latest, state } = useRobotStream(robotId);
  const [busy, setBusy] = useState(false);

  const offline = state === "offline";

  const cmd = async (type: string) => {
    setBusy(true);
    try { await sendCommand(robotId, type); } finally { setBusy(false); }
  };

  const startFollow = async () => {
    if (!confirm("자동주행을 시작합니다.\n주변에 사람·차량이 없는지 확인하셨나요?")) return;
    await cmd("START_FOLLOW");
  };

  const CONN = {
    connecting: { t: "연결 중", c: "text-muted" },
    online:     { t: "온라인",  c: "text-[var(--color-level-0)]" },
    stale:      { t: "지연",    c: "text-[var(--color-level-1)]" },
    offline:    { t: "연결 끊김", c: "text-[var(--color-level-3)]" },
  }[state];

  return (
    <div className="px-4 py-5">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">셰르피</h1>
          <p className={`text-xs ${CONN.c}`}>● {CONN.t}</p>
        </div>
        <SafetyBadge level={latest?.safetyLevel ?? 0} faults={latest?.faults ?? []} />
      </header>

      {offline && (
        <p className="mb-4 rounded-xl bg-[var(--color-level-3)]/10 p-3 text-sm text-[var(--color-level-3)]">
          로봇과 연결되지 않았습니다. 제어 기능을 사용할 수 없습니다.
        </p>
      )}

      <section className="rounded-2xl border border-line bg-surface p-4">
        <TensionGauge value={latest?.tensionN ?? null} />
      </section>

      <section className="mt-3 rounded-2xl border border-line bg-surface p-4">
        <LeashBar value={latest?.leashLenM ?? null} />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="속도" value={latest?.speedCmd != null ? `${latest.speedCmd.toFixed(2)} m/s` : "—"} />
        <Stat label="조향" value={latest?.steerCmd != null ? latest.steerCmd.toFixed(2) : "—"} />
        <Stat label="매칭 신뢰도" value={latest?.matchQuality != null ? latest.matchQuality.toFixed(2) : "—"} />
        <Stat label="배터리" value={latest?.batteryV != null ? `${latest.batteryV.toFixed(1)} V` : "측정 없음"} />
      </section>

      {latest?.kfTotal ? (
        <section className="mt-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex justify-between text-sm">
            <span className="text-body">경로 진행</span>
            <span className="tabular">{latest.kfIndex ?? 0} / {latest.kfTotal}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-sherpy-600 transition-[width]"
                 style={{ width: `${((latest.kfIndex ?? 0) / latest.kfTotal) * 100}%` }} />
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid grid-cols-2 gap-2">
        <Btn onClick={() => cmd("START_TEACH")} disabled={offline || busy}>티칭 시작</Btn>
        <Btn onClick={() => cmd("STOP_TEACH")}  disabled={offline || busy}>티칭 종료</Btn>
        <Btn onClick={startFollow} disabled={offline || busy} primary>자동주행 시작</Btn>
        <Btn onClick={() => cmd("PAUSE")} disabled={offline || busy}>일시정지</Btn>
      </section>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        원격 정지는 보조 수단입니다.<br />
        긴급 상황에서는 로봇 본체의 물리 정지 버튼을 사용하세요.
      </p>

      <EstopButton robotId={robotId} disabled={offline} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Btn({ children, onClick, disabled, primary }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={[
        "touch rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40",
        primary ? "bg-sherpy-600 text-white" : "border border-line bg-surface text-body",
      ].join(" ")}>
      {children}
    </button>
  );
}
