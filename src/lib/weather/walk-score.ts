/**
 * 산책적합도(Walk Score) — 사람 기준 날씨를 "반려견 기준"으로 환산한다.
 *
 * ⚠️ 주의 (PRD §17)
 * 수의학적 근거가 확실한 것은 지면 52℃ 이상에서 발바닥 화상 위험("손등 7초 규칙")뿐이다.
 * 미세먼지(PM2.5)는 2026-10-19 범위에서 제외했다.
 * 나머지 감점 배분은 팀이 설계한 자체 지표이며 검증된 공식이 아니다.
 * 지면온도 추정 계수 k = 25℃ 역시 일반적으로 인용되는 값으로, 전주 지역
 * 노면 실측으로 보정이 필요하다. 발표 시 "자체 설계 지표"로 밝힐 것.
 *
 * [알려진 한계] 현재 식은 계절(태양 고도)을 반영하지 않는다. 같은 "맑은 낮"이라도
 * 6월과 11월의 일사량이 다른데 똑같이 k=25를 적용하므로, 선선한 계절에는
 * 지면온도를 과대평가한다. 실측 후 k를 월별 또는 태양고도 함수로 바꿀 것.
 */

export interface WeatherInput {
  tempC: number;        // 기온
  humidity: number;     // 상대습도 %
  windMs: number;       // 풍속 m/s
  popPercent: number;   // 강수확률 %
  skyCode: 1 | 3 | 4;   // 1 맑음 / 3 구름많음 / 4 흐림
  uvIndex?: number | null;
  hour: number;         // KST 0~23
}

export interface WalkScoreResult {
  score: number;              // 0~100
  grade: "best" | "good" | "caution" | "avoid";
  label: string;
  surfaceTempC: number;       // 추정 지면온도
  surfaceRisk: "safe" | "warn" | "danger";
  feelsLikeC: number;
  reasons: string[];
  advice: string;
}

/** 하늘상태 → 운량 근사 (0~10) */
function cloudFromSky(sky: 1 | 3 | 4): number {
  return sky === 1 ? 1 : sky === 3 ? 6 : 9;
}

/** 주간계수 — 10~16시 최대, 일몰 후 0 */
function daylightFactor(hour: number): number {
  if (hour < 7 || hour >= 19) return 0;
  if (hour >= 10 && hour <= 16) return 1;
  if (hour < 10) return (hour - 7) / 3;
  return (19 - hour) / 3;
}

/**
 * 지면온도 추정
 *   T_surface ≈ T_air + k × (1 − 운량/10) × 주간계수,  k = 25℃
 * 아스팔트·보도블록은 직사광에서 기온보다 20~30℃ 높아진다.
 */
export function estimateSurfaceTemp(tempC: number, sky: 1 | 3 | 4, hour: number): number {
  const K = 25;
  const cloud = cloudFromSky(sky);
  return tempC + K * (1 - cloud / 10) * daylightFactor(hour);
}

/** 여름 열지수 / 겨울 풍속냉각 간이식 */
export function feelsLike(tempC: number, humidity: number, windMs: number): number {
  if (tempC >= 27) {
    return tempC + 0.05 * humidity - 0.5; // 습도 보정 간이식
  }
  if (tempC <= 10 && windMs > 1.3) {
    const v = Math.pow(windMs * 3.6, 0.16);
    return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
  }
  return tempC;
}

export function calcWalkScore(w: WeatherInput): WalkScoreResult {
  const reasons: string[] = [];
  let penalty = 0;

  // ① 지면온도 — 가장 중요
  const surfaceTempC = estimateSurfaceTemp(w.tempC, w.skyCode, w.hour);
  let surfaceRisk: WalkScoreResult["surfaceRisk"] = "safe";
  if (surfaceTempC >= 52) {
    penalty += 60;
    surfaceRisk = "danger";
    reasons.push(`지면 추정 ${surfaceTempC.toFixed(0)}℃ — 발바닥 화상 위험`);
  } else if (surfaceTempC >= 40) {
    penalty += 20;
    surfaceRisk = "warn";
    reasons.push(`지면 추정 ${surfaceTempC.toFixed(0)}℃ — 짧게, 그늘 위주로`);
  }

  // ② 체감온도
  const feelsLikeC = feelsLike(w.tempC, w.humidity, w.windMs);
  if (feelsLikeC >= 31) { penalty += 20; reasons.push(`체감 ${feelsLikeC.toFixed(0)}℃ — 더위 주의`); }
  else if (feelsLikeC <= -5) { penalty += 20; reasons.push(`체감 ${feelsLikeC.toFixed(0)}℃ — 추위 주의`); }
  else if (feelsLikeC <= 0) { penalty += 8; reasons.push("쌀쌀해요"); }

  // ③ 강수확률
  if (w.popPercent >= 60) { penalty += 30; reasons.push(`강수확률 ${w.popPercent}%`); }
  else if (w.popPercent >= 30) { penalty += 10; }

  // ④ 자외선
  if (w.uvIndex != null && w.uvIndex >= 8) { penalty += 15; reasons.push(`자외선 ${w.uvIndex} 매우높음`); }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  // 점수만으로 등급을 정하면 레이블과 경고가 모순된다.
  // 예) 18℃ 맑은 봄 오후 → 점수 80이지만 지면 41℃ 경고가 떠서
  //     "산책하기 좋아요"와 "짧게, 그늘 위주로"가 같이 나온다.
  // 개별 위험 요인이 있으면 등급의 상한을 눌러 모순을 막는다.
  const GRADES = ["avoid", "caution", "good", "best"] as const;
  let gi = score >= 80 ? 3 : score >= 60 ? 2 : score >= 35 ? 1 : 0;

  if (surfaceRisk === "danger") gi = 0;              // 화상 위험 → 무조건 avoid
  else if (surfaceRisk === "warn") gi = Math.min(gi, 1);  // 지면 뜨거움 → caution 이하
  if (feelsLikeC >= 31 || feelsLikeC <= -5) gi = Math.min(gi, 1);
  if (w.popPercent >= 60) gi = Math.min(gi, 1);

  const grade = GRADES[gi];
  const label =
    grade === "best" ? "산책하기 좋아요"
    : grade === "good" ? "산책할 만해요"
    : grade === "caution" ? "짧게 다녀오세요"
    : "오늘은 쉬는 게 좋아요";

  let advice = "";
  if (surfaceRisk === "danger") advice = "해가 진 뒤에 나가세요. 지금 아스팔트는 화상을 입힐 수 있습니다.";
  else if (surfaceRisk === "warn") advice = "그늘진 코스를 고르고 20분 이내로 다녀오세요.";
  else if (feelsLikeC <= -5) advice = "체감온도가 낮습니다. 옷을 입히고 15분 이내로 다녀오세요.";
  else if (feelsLikeC >= 31) advice = "더위에 약한 견종이라면 해가 진 뒤로 미루세요.";
  else if (w.popPercent >= 60) advice = "비 소식이 있어요. 우비를 챙기세요.";
  else if (grade === "best") advice = "조건이 좋습니다. 셰르피와 긴 코스도 괜찮아요.";
  else advice = "무리하지 않는 선에서 다녀오세요.";

  return { score, grade, label, surfaceTempC, surfaceRisk, feelsLikeC, reasons, advice };
}
