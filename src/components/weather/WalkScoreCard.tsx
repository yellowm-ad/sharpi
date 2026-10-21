"use client";

import { useEffect, useState } from "react";
import { Thermometer, Flame, Droplets, Umbrella, Lightbulb, TriangleAlert } from "lucide-react";
import { useTween } from "@/hooks/useTween";
import { calcWalkScore, type WalkScoreResult, type WeatherInput } from "@/lib/weather/walk-score";

/** 시연 장소 — 덕진공원 (전북대 인근) */
export const DEOKJIN = { lat: 35.8486, lng: 127.1229 };

const GRADE_COLOR: Record<WalkScoreResult["grade"], string> = {
  best: "var(--color-level-0)",
  good: "var(--color-sherpy-400)",
  caution: "var(--color-level-1)",
  avoid: "var(--color-level-3)",
};

/** 기상청 키가 없을 때 쓰는 시연용 입력 — 10월 중순 전주 저녁 근사 */
function demoInput(): WeatherInput {
  const hour = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
  return { tempC: 17, humidity: 58, windMs: 1.8, popPercent: 10, skyCode: 3, uvIndex: 3, hour };
}

/** S06 홈 상단 — 오늘의 산책적합도 (PRD F-5) */
export default function WalkScoreCard() {
  const [data, setData] = useState<{ raw: WeatherInput; walkScore: WalkScoreResult; demo: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/weather?lat=${DEOKJIN.lat}&lng=${DEOKJIN.lng}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        setData({ raw: j.raw, walkScore: j.walkScore, demo: false });
      })
      .catch(() => {
        // API 실패해도 앱은 계속 동작 — 시연용 값으로 채우고 표기한다
        const raw = demoInput();
        setData({ raw, walkScore: calcWalkScore(raw), demo: true });
      });
  }, []);

  if (!data) {
    return <section className="skeleton h-56 rounded-3xl" aria-label="날씨 불러오는 중" />;
  }

  const { raw, walkScore: w } = data;
  const color = GRADE_COLOR[w.grade];
  const danger = w.surfaceRisk === "danger";

  return (
    <>
      {danger && (
        <div className="animate-drop mb-3 flex items-start gap-2 rounded-2xl bg-level-3 p-3 text-sm text-white">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p>지면 추정 {w.surfaceTempC.toFixed(0)}℃ — 발바닥 화상 위험. 해가 진 뒤에 나가세요.</p>
        </div>
      )}

      <section className="animate-fade relative overflow-hidden rounded-3xl bg-gradient-to-br from-sherpy-600 to-sherpy-700 p-5 text-white shadow-lg shadow-sherpy-600/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-sherpy-100">오늘의 산책 · 덕진공원</p>
            <p className="mt-1 text-xl font-bold">{w.label}</p>
          </div>
          <ScoreRing score={w.score} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Item icon={<Thermometer size={15} />} text={`기온 ${raw.tempC}℃${Math.abs(w.feelsLikeC - raw.tempC) >= 1 ? ` (체감 ${w.feelsLikeC.toFixed(0)}℃)` : ""}`} />
          <Item icon={<Flame size={15} />} text={`지면 추정 ${w.surfaceTempC.toFixed(0)}℃ ${w.surfaceRisk === "safe" ? "안전" : w.surfaceRisk === "warn" ? "주의" : "위험"}`} />
          <Item icon={<Droplets size={15} />} text={`습도 ${raw.humidity}% · 바람 ${raw.windMs}m/s`} />
          <Item icon={<Umbrella size={15} />} text={`강수확률 ${raw.popPercent}%`} />
        </div>

        <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-white/12 p-3 text-sm">
          <Lightbulb size={15} className="mt-0.5 shrink-0" style={{ color }} />
          {w.advice}
        </p>
        <p className="mt-2 text-[10px] text-sherpy-100/80">
          {data.demo ? "시연용 날씨 · 기상청 API 키 등록 후 실측값으로 바뀝니다 · " : ""}
          자체 설계 지표 · 지면온도는 추정치
        </p>
      </section>
    </>
  );
}

/** 점수 고리 — 0에서 차오르며 숫자도 함께 올라간다(카운트업) */
function ScoreRing({ score }: { score: number }) {
  const v = useTween(score, 1100, 0);
  return (
    <div className="animate-pop relative flex h-20 w-20 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(255 255 255 / .2)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(v / 100) * 97.4} 97.4`} />
      </svg>
      <div className="text-center leading-none">
        <span className="tabular text-2xl font-bold">{Math.round(v)}</span>
        <span className="block text-[10px] text-sherpy-100">점</span>
      </div>
    </div>
  );
}

function Item({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sherpy-50">
      <span className="opacity-80">{icon}</span>
      <span className="tabular truncate">{text}</span>
    </p>
  );
}
