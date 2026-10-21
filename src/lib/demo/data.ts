/**
 * 시연용 더미 데이터 — DB(Neon)가 연결되기 전까지 화면을 채운다.
 * 좌표는 전주시 덕진구(전북대 일대) 실제 위치 근사값. (PRD §1-4 1차 지역)
 */

export type PoiType = "water" | "bag" | "shade" | "caution" | "petfriendly";

export interface DemoRoute {
  id: number;
  name: string;
  description: string;
  author: string;
  difficulty: "쉬움" | "보통" | "어려움";
  likeCount: number;
  isPublic: boolean;
  /** 셰르피가 티칭을 마쳐 자동주행이 가능한 코스 */
  taught: boolean;
  keyframes: number;
  points: [number, number][]; // [lat, lng]
  pois: { type: PoiType; lat: number; lng: number; label: string }[];
}

export const POI_LABEL: Record<PoiType, string> = {
  water: "급수대",
  bag: "배변봉투함",
  shade: "그늘",
  caution: "주의구간",
  petfriendly: "펫프렌들리",
};

export const ROUTES: DemoRoute[] = [
  {
    id: 12,
    name: "덕진공원 한바퀴",
    description: "연못을 끼고 도는 평탄한 산책로. 연꽃 시즌엔 사람이 많아요.",
    author: "지훈",
    difficulty: "쉬움",
    likeCount: 48,
    isPublic: true,
    taught: true,
    keyframes: 120,
    // 덕진호 연못 둘레 — 카카오맵 위에서 직접 따라 그린 좌표
    points: [
      [35.84912, 127.12102], [35.84958, 127.12190], [35.84975, 127.12285], [35.84960, 127.12390],
      [35.84933, 127.12489], [35.84865, 127.12482], [35.84798, 127.12469], [35.84772, 127.12360],
      [35.84753, 127.12247], [35.84780, 127.12160], [35.84813, 127.12082], [35.84865, 127.12090],
      [35.84912, 127.12102],
    ],
    pois: [
      { type: "water", lat: 35.84958, lng: 127.12190, label: "북쪽 정자 급수대" },
      { type: "shade", lat: 35.84933, lng: 127.12489, label: "동쪽 버드나무 그늘" },
      { type: "bag", lat: 35.84772, lng: 127.12360, label: "남문 봉투함" },
    ],
  },
  {
    id: 15,
    name: "건지산 둘레길 입구 코스",
    description: "흙길 위주라 발바닥에 부담이 적어요. 초입 경사 주의.",
    author: "프리가이즈",
    difficulty: "보통",
    likeCount: 31,
    isPublic: true,
    taught: false,
    keyframes: 0,
    points: [
      [35.85010, 127.13280], [35.85120, 127.13350], [35.85240, 127.13460],
      [35.85330, 127.13600], [35.85280, 127.13740], [35.85150, 127.13690],
      [35.85060, 127.13540], [35.85010, 127.13280],
    ],
    pois: [
      { type: "caution", lat: 35.85240, lng: 127.13460, label: "경사 구간" },
      { type: "shade", lat: 35.85330, lng: 127.13600, label: "숲길" },
    ],
  },
  {
    id: 18,
    name: "전북대 캠퍼스 저녁 코스",
    description: "해 진 뒤 조명이 밝은 캠퍼스 순환. 정문 쪽은 혼잡해요.",
    author: "콩이맘",
    difficulty: "쉬움",
    likeCount: 22,
    isPublic: true,
    taught: true,
    keyframes: 86,
    points: [
      [35.84650, 127.12930], [35.84560, 127.13050], [35.84470, 127.13170],
      [35.84380, 127.13090], [35.84420, 127.12960], [35.84530, 127.12880],
      [35.84650, 127.12930],
    ],
    pois: [
      { type: "petfriendly", lat: 35.84560, lng: 127.13050, label: "잔디광장" },
      { type: "caution", lat: 35.84650, lng: 127.12930, label: "정문 차량 진입" },
    ],
  },
];

/** 혼잡도 (명목상, PRD F-9) — /api/crowd 와 같은 지역 */
export const CROWD = [
  { areaCode: "jj-deokjin-park", name: "덕진공원",     level: 2, lat: 35.84865, lng: 127.12290 },
  { areaCode: "jj-jbnu-front",   name: "전북대 정문",   level: 3, lat: 35.84640, lng: 127.12920 },
  { areaCode: "jj-geonji-mt",    name: "건지산 둘레길", level: 1, lat: 35.85200, lng: 127.13500 },
];

export const CROWD_LABEL = ["", "여유", "보통", "혼잡"] as const;

export const DOG = {
  name: "콩이",
  breed: "포메라니안",
  weightKg: 4.1,
  age: "3살",
};

export const USER = { nickname: "지훈", username: "dev" };

export interface DemoWalk {
  id: number;
  routeId: number;
  startedAt: string; // ISO
  durationS: number;
  distanceM: number;
  avgSpeed: number;
  maxSpeed: number;
  avgTensionN: number;
  maxTensionN: number;
  pullCount: number;
  warnings: { at: string; level: number; reason: string }[];
  walkScore: number;
  /** 실제로 지나간 좌표 — 산책 중 화면에서 기록한 경우에만 있다 */
  trail?: [number, number][];
}

export const WALKS: DemoWalk[] = [
  {
    id: 104, routeId: 12, startedAt: "2026-10-18T19:10:00+09:00",
    durationS: 1920, distanceM: 1810, avgSpeed: 0.94, maxSpeed: 1.32,
    avgTensionN: 9.4, maxTensionN: 34.1, pullCount: 3,
    warnings: [{ at: "19:24", level: 2, reason: "견인 과다 — 자동 감속" }],
    walkScore: 82,
  },
  {
    id: 103, routeId: 18, startedAt: "2026-10-17T20:05:00+09:00",
    durationS: 1500, distanceM: 1320, avgSpeed: 0.88, maxSpeed: 1.18,
    avgTensionN: 7.8, maxTensionN: 26.5, pullCount: 1,
    warnings: [],
    walkScore: 76,
  },
  {
    id: 102, routeId: 12, startedAt: "2026-10-15T18:40:00+09:00",
    durationS: 2040, distanceM: 1835, avgSpeed: 0.9, maxSpeed: 1.4,
    avgTensionN: 11.2, maxTensionN: 38.7, pullCount: 5,
    warnings: [
      { at: "18:51", level: 2, reason: "견인 과다 — 자동 감속" },
      { at: "19:02", level: 1, reason: "F4 경로 매칭 신뢰도 저하" },
    ],
    walkScore: 68,
  },
  {
    id: 101, routeId: 12, startedAt: "2026-10-12T19:00:00+09:00",
    durationS: 1980, distanceM: 1790, avgSpeed: 0.91, maxSpeed: 1.35,
    avgTensionN: 12.0, maxTensionN: 39.2, pullCount: 6,
    warnings: [{ at: "19:15", level: 2, reason: "견인 과다 — 자동 감속" }],
    walkScore: 71,
  },
];

/** 마켓 (명목상, PRD F-8) — 시드 고정 */
export const MARKET = [
  { id: 1, title: "Y자 하네스 S", price: 18000, condition: "새상품", emoji: "🦺" },
  { id: 2, title: "휴대용 급수통 350ml", price: 9000, condition: "새상품", emoji: "💧" },
  { id: 3, title: "닭가슴살 져키 300g", price: 12000, condition: "새상품", emoji: "🍗" },
  { id: 4, title: "LED 목걸이 (USB 충전)", price: 7000, condition: "중고 · 상", emoji: "💡" },
  { id: 5, title: "강아지 우비 M", price: 15000, condition: "중고 · 중", emoji: "🧥" },
  { id: 6, title: "배변봉투 디스펜서", price: 4000, condition: "새상품", emoji: "🛍️" },
  { id: 7, title: "발바닥 보호 왁스", price: 11000, condition: "새상품", emoji: "🐾" },
  { id: 8, title: "쿨링 반다나", price: 6000, condition: "중고 · 상", emoji: "🧣" },
  { id: 9, title: "산책 간식 파우치", price: 8000, condition: "새상품", emoji: "👝" },
  { id: 10, title: "리드줄 5m 자동", price: 14000, condition: "중고 · 상", emoji: "🪢" },
];

export function routeById(id: number) {
  return ROUTES.find((r) => r.id === id);
}

/** 두 좌표 사이 거리(m) — haversine */
export function distM(a: [number, number], b: [number, number]) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function routeLength(points: [number, number][]) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += distM(points[i - 1], points[i]);
  return d;
}

/** 예상 소요시간 — 1.0 m/s 기준 (PRD F-4) */
export function routeDurationMin(points: [number, number][]) {
  return Math.round(routeLength(points) / 1.0 / 60);
}
