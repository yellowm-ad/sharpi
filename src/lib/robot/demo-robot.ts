"use client";

import { THRESHOLDS } from "@/lib/robot/types";
import { ROUTES } from "@/lib/demo/data";
import { findRoute } from "@/lib/my-routes";
import type { TelemetryRow } from "@/hooks/useRobotStream";

/**
 * 시연용 가상 셰르피 — 브라우저 안에서 1Hz 텔레메트리를 만들고 명령을 ack한다.
 *
 * DB(Neon)가 없을 때(/api/health → db:false) 대시보드를 살아 움직이게 하려는 용도다.
 * scripts/mock-robot.ts 와 같은 동작을 흉내 내지만 서버를 거치지 않는다.
 * 실로봇·DB가 붙으면 useRobotStream 이 자동으로 SSE 경로를 쓴다.
 */

export type CommandStatus = "pending" | "sent" | "acked" | "expired";
export interface CommandLog {
  id: number;
  type: string;
  status: CommandStatus;
  issuedAt: number;
  ackedAt?: number;
}

type Listener = () => void;

class DemoRobot {
  latest: TelemetryRow | null = null;
  commands: CommandLog[] = [];
  routeId: number | null = 12;
  speedLimit = 1.2;

  private mode: TelemetryRow["mode"] = "idle";
  private paused = false;
  private kfIndex = 0;
  private kfTotal = 0;
  private pullLeft = 0;   // 당김 이벤트 남은 초
  private pullPeak = 0;
  private dipLeft = 0;    // 매칭 신뢰도 저하 남은 초
  private seq = 0;
  private cmdSeq = 0;
  private tension = 1;
  private silentUntil = 0; // 연결 끊김 시뮬레이션 — 이 시각까지 텔레메트리를 보내지 않는다
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    if (!this.timer) {
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** 명령 수신 — pending → sent → acked 를 실제 왕복처럼 지연을 두고 흉내 낸다 */
  command(type: string, payload: Record<string, unknown> = {}) {
    const log: CommandLog = { id: ++this.cmdSeq, type, status: "pending", issuedAt: Date.now() };
    this.commands = [log, ...this.commands].slice(0, 8);
    this.emit();

    const sentDelay = type === "ESTOP" ? 150 : 300 + Math.random() * 400;
    setTimeout(() => {
      this.patch(log.id, { status: "sent" });
      setTimeout(() => {
        this.apply(type, payload);
        this.patch(log.id, { status: "acked", ackedAt: Date.now() });
      }, 250 + Math.random() * 300);
    }, sentDelay);

    return log;
  }

  /**
   * 시연 리허설용 이벤트 주입 (어드민)
   *  pull       강아지가 확 당김 → L2 경고, 자동 감속
   *  overload   견인 한계(40N) 초과 → L3
   *  dip        경로 매칭 신뢰도 저하 → F4
   *  disconnect 10초간 텔레메트리 중단 → 앱이 지연/연결 끊김으로 전환
   */
  inject(kind: "pull" | "overload" | "dip" | "disconnect") {
    if (kind === "pull") { this.pullLeft = 7; this.pullPeak = 34; } // 리허설용은 눈에 띄게 길게
    if (kind === "overload") { this.pullLeft = 6; this.pullPeak = 44; }
    if (kind === "dip") this.dipLeft = 6;
    if (kind === "disconnect") this.silentUntil = Date.now() + 10_000;
  }

  private patch(id: number, p: Partial<CommandLog>) {
    this.commands = this.commands.map((c) => (c.id === id ? { ...c, ...p } : c));
    this.emit();
  }

  private apply(type: string, payload: Record<string, unknown>) {
    switch (type) {
      case "ESTOP":
        this.mode = "estop";
        this.paused = false;
        break;
      case "START_TEACH":
        this.mode = "teach";
        this.kfIndex = 0;
        this.kfTotal = 0;
        break;
      case "STOP_TEACH":
        this.mode = "idle";
        break;
      case "START_FOLLOW": {
        const r = findRoute(this.routeId) ?? ROUTES[0];
        this.mode = "follow";
        this.paused = false;
        this.kfIndex = 0;
        this.kfTotal = r.keyframes || 120;
        break;
      }
      case "PAUSE":
        this.paused = true;
        break;
      case "RESUME":
        this.paused = false;
        if (this.mode === "estop") this.mode = "idle";
        break;
      case "SET_ROUTE":
        this.routeId = Number(payload.route_id) || this.routeId;
        break;
      case "SET_SPEED_LIMIT":
        this.speedLimit = Number(payload.limit) || this.speedLimit;
        break;
    }
    this.tick();
  }

  private tick() {
    if (Date.now() < this.silentUntil) return;
    const moving = (this.mode === "follow" || this.mode === "teach") && !this.paused;
    const noise = (s: number) => (Math.random() - 0.5) * 2 * s;

    // 장력: 주행 중 6N 근처, 가끔 강아지가 확 당긴다 (PRD §4-2 시나리오 5)
    let target = moving ? 6 + noise(2) : 1 + noise(0.6);
    if (moving && this.pullLeft === 0 && Math.random() < 0.05) {
      this.pullLeft = 4;
      this.pullPeak = 28 + Math.random() * 10;
    }
    if (this.pullLeft > 0) {
      target = this.pullPeak * (this.pullLeft >= 3 ? 1 : 0.6);
      this.pullLeft--;
    }
    this.tension += (target - this.tension) * 0.7;
    const tension = Math.max(0, this.tension);

    // 매칭 신뢰도 — 자동주행 중 가끔 떨어진다 (F4)
    if (this.mode === "follow" && moving && this.dipLeft === 0 && Math.random() < 0.025) this.dipLeft = 3;
    const match = this.mode === "follow"
      ? (this.dipLeft > 0 ? 0.42 + noise(0.04) : 0.8 + noise(0.06))
      : this.mode === "teach" ? 0.9 + noise(0.04) : null;
    if (this.dipLeft > 0) this.dipLeft--;

    // 장력이 크면 로봇이 스스로 감속한다 (leash.py)
    let speed = 0;
    if (moving) {
      const base = this.mode === "teach" ? 0.6 : Math.min(this.speedLimit, 0.95);
      const cut = tension >= THRESHOLDS.F_HARD ? 0.35 : tension >= THRESHOLDS.F_SOFT ? 0.75 : 1;
      speed = Math.max(0, base * cut + noise(0.05));
    }

    const faults: string[] = [];
    if (match != null && match < THRESHOLDS.KF_MIN_QUALITY) faults.push("F4");

    let level = 0;
    if (this.mode === "estop" || tension >= THRESHOLDS.F_ESTOP) level = 3;
    else if (tension >= THRESHOLDS.F_HARD) level = 2;
    else if (tension >= THRESHOLDS.F_SOFT || faults.length) level = 1;

    if (moving) {
      if (this.mode === "teach") { this.kfIndex++; this.kfTotal = this.kfIndex; }
      else if (this.mode === "follow") {
        this.kfIndex = Math.min(this.kfTotal, this.kfIndex + 1);
        if (this.kfIndex >= this.kfTotal) this.mode = "idle";
      }
    }

    // 위치 — 보호자 폰 GPS를 대신해 코스 위를 따라 움직인다 (PRD §7-5)
    const r = findRoute(this.routeId) ?? ROUTES[0];
    const prog = this.kfTotal ? this.kfIndex / this.kfTotal : 0;
    const segF = prog * (r.points.length - 1);
    const i = Math.min(r.points.length - 2, Math.floor(segF));
    const f = segF - i;
    const lat = r.points[i][0] + (r.points[i + 1][0] - r.points[i][0]) * f;
    const lng = r.points[i][1] + (r.points[i + 1][1] - r.points[i][1]) * f;

    this.latest = {
      id: ++this.seq,
      robotId: 1,
      ts: new Date().toISOString(),
      mode: this.mode,
      safetyLevel: level,
      faults,
      tensionN: tension,
      leashLenM: Math.min(THRESHOLDS.L_MAX, 1.2 + tension * 0.09 + (moving ? 0.6 : 0) + noise(0.05)),
      speedCmd: speed,
      steerCmd: moving ? Math.max(-1, Math.min(1, Math.sin(Date.now() / 4000) * 0.4 + noise(0.1))) : 0,
      lat, lng,
      gpsSrc: "phone",
      routeId: this.routeId,
      kfIndex: this.mode === "idle" && !this.kfTotal ? null : this.kfIndex,
      kfTotal: this.kfTotal || null,
      matchQuality: match,
      batteryV: null,
    };
    this.emit();
  }
}

type InjectKind = Parameters<DemoRobot["inject"]>[0];

let instance: DemoRobot | null = null;
let channel: BroadcastChannel | null = null;

export function demoRobot() {
  if (!instance) {
    instance = new DemoRobot();
    // 같은 브라우저의 다른 탭(어드민 ↔ 앱)에서 보낸 리허설 이벤트를 받는다
    try {
      channel = new BroadcastChannel("sherpy-demo");
      channel.onmessage = (e) => instance?.inject(e.data as InjectKind);
    } catch { /* 지원 안 하는 브라우저 — 이 탭에만 적용 */ }
  }
  return instance;
}

/** 리허설 이벤트 주입 — 이 탭과 같은 브라우저의 다른 탭에 열린 앱 모두에 적용 */
export function broadcastInject(kind: InjectKind) {
  demoRobot().inject(kind);
  channel?.postMessage(kind);
}
