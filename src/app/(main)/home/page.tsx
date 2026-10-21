"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, ChevronRight, Route, Footprints, Store, Users } from "lucide-react";
import WalkScoreCard from "@/components/weather/WalkScoreCard";
import SafetyBadge from "@/components/robot/SafetyBadge";
import { useRobotStream } from "@/hooks/useRobotStream";
import { useUser } from "@/lib/session";
import { useMyRoutes } from "@/lib/my-routes";
import { ROUTES, routeLength, routeDurationMin } from "@/lib/demo/data";
import { useDog } from "@/lib/dog";
import { useWalks, pullTrend } from "@/lib/my-walks";
import { josa } from "@/lib/format";

const MODE_LABEL = { idle: "대기 중", teach: "티칭 중", follow: "자동주행 중", estop: "정지됨" } as const;

/** S06 홈 — Walk Score 카드 + 로봇 상태 요약 (PRD F-5) */
export default function HomePage() {
  const { latest, state } = useRobotStream(1);
  const user = useUser();
  const mine = useMyRoutes();
  const dog = useDog();
  const walks = useWalks();
  // 최근 7일 기록만 집계 — 렌더 중 Date.now() 대신 마운트 시각을 써서 하이드레이션 값이 흔들리지 않게
  const [now] = useState(() => Date.now());
  const week = walks.filter((w) => now - Date.parse(w.startedAt) < 7 * 86_400_000);
  const trend = pullTrend(walks);
  const pullsThis = week.reduce((s, w) => s + w.pullCount, 0);

  return (
    <div className="stagger px-4 pt-5">
      <header className="mb-4 flex items-center justify-between" style={{ "--i": 0 } as React.CSSProperties}>
        <div>
          <p className="text-sm text-muted">{user ? `${user.nickname}님, ${josa(dog.name, "와", "과")} 함께` : "반가워요, 둘러보세요"}</p>
          <h1 className="text-xl font-bold">오늘도 강아지를 자유롭게</h1>
        </div>
        {user ? (
          <Link href="/my" className="flex h-11 w-11 items-center justify-center rounded-full bg-sherpy-100 text-2xl">🐶</Link>
        ) : (
          <Link href="/login?next=/home" className="touch flex items-center rounded-full border border-sherpy-400 px-4 text-sm font-semibold text-sherpy-600">로그인</Link>
        )}
      </header>

      <div style={{ "--i": 1 } as React.CSSProperties}><WalkScoreCard /></div>

      {/* 셰르피 상태 요약 */}
      <Link href="/robot" className="press card mt-3 flex items-center gap-3 p-4" style={{ "--i": 2 } as React.CSSProperties}>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-sherpy-50 text-sherpy-600">
          <Bot size={22} />
          {/* 실시간 연결 표시 — 살아 있는 점이 퍼져 나간다 */}
          <span className={`absolute -top-0.5 -right-0.5 ${state === "online" ? "text-level-0" : state === "offline" ? "text-level-3" : "text-level-1"}`}>
            <span className="live-dot ring-2 ring-surface" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">셰르피 · {latest ? MODE_LABEL[latest.mode] : "연결 중"}</p>
          <p className="tabular text-xs text-muted">
            {state === "online" && latest
              ? `장력 ${latest.tensionN?.toFixed(1)}N · 줄 ${latest.leashLenM?.toFixed(1)}m · ${latest.speedCmd?.toFixed(2)}m/s`
              : state === "offline" ? "연결 끊김" : "상태 확인 중…"}
          </p>
        </div>
        {latest && <SafetyBadge level={latest.safetyLevel} compact />}
        <ChevronRight size={18} className="text-muted" />
      </Link>

      {/* 빠른 메뉴 */}
      <section className="mt-3 grid grid-cols-4 gap-2" style={{ "--i": 3 } as React.CSSProperties}>
        <Quick href="/map" icon={<Route size={20} />} label="코스" />
        <Quick href="/walks" icon={<Footprints size={20} />} label="산책기록" />
        <Quick href="/community" icon={<Users size={20} />} label="커뮤니티" />
        <Quick href="/market" icon={<Store size={20} />} label="마켓" />
      </section>

      {/* 이번 주 리포트 — 당김 횟수는 셰르피만 낼 수 있는 데이터 (PRD F-6) */}
      <section className="card mt-3 p-4" style={{ "--i": 4 } as React.CSSProperties}>
        <div className="flex items-center justify-between">
          <p className="font-semibold">최근 7일 · {dog.name}</p>
          <Link href="/walks" className="text-xs text-sherpy-600">전체 기록</Link>
        </div>
        <div className="mt-3 grid grid-cols-3 text-center">
          <Metric value={`${(week.reduce((s, w) => s + w.distanceM, 0) / 1000).toFixed(1)}km`} label="걸은 거리" />
          <Metric value={`${week.length}회`} label="산책" />
          <Metric value={`${pullsThis}회`} label="당김" />
        </div>
        <p className="mt-3 rounded-xl bg-sherpy-50 px-3 py-2 text-xs text-sherpy-700">
          {trend == null ? "산책을 몇 번 더 기록하면 당김 변화를 알려드릴게요."
            : trend.pct < 0 ? <>최근 산책에서 당김이 <b className="tabular">{-trend.pct}%</b> 줄었어요. 리드줄 훈련이 효과를 보고 있어요.</>
            : trend.pct === 0 ? "당김 횟수가 지난번과 같아요. 꾸준함이 중요해요."
            : <>최근 산책에서 당김이 <b className="tabular">{trend.pct}%</b> 늘었어요. 출발 전 충분히 냄새 맡게 해 주세요.</>}
        </p>
      </section>

      {/* 추천 코스 */}
      <section className="mt-5" style={{ "--i": 5 } as React.CSSProperties}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">{mine.length ? "내 코스 · 추천 코스" : "덕진공원 근처 추천 코스"}</h2>
          <Link href="/map" className="text-xs text-sherpy-600">지도에서 보기</Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {[...mine, ...ROUTES].map((r) => (
            <Link key={r.id} href={`/routes/${r.id}`} className="press card w-56 shrink-0 p-4">
              <div className="flex items-center gap-1.5">
                {r.id > 1000 && <span className="rounded-full bg-sherpy-600 px-2 py-0.5 text-[11px] font-semibold text-white">내 코스</span>}
                <span className="rounded-full bg-sherpy-50 px-2 py-0.5 text-[11px] font-semibold text-sherpy-700">{r.difficulty}</span>
                {r.taught && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">자동주행 가능</span>}
              </div>
              <p className="mt-2 truncate font-semibold">{r.name}</p>
              <p className="tabular mt-0.5 text-xs text-muted">
                {(routeLength(r.points) / 1000).toFixed(1)}km · 약 {routeDurationMin(r.points)}분 · ♥ {r.likeCount}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <div className="h-6" />
    </div>
  );
}

function Quick({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="press card touch flex flex-col items-center gap-1 py-3 text-xs text-body">
      <span className="text-sherpy-600">{icon}</span>
      {label}
    </Link>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
