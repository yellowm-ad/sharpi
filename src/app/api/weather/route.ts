import { NextRequest, NextResponse } from "next/server";
import { latLngToGrid, getBaseDateTime, getVillageBaseDateTime } from "@/lib/weather/grid";
import { calcWalkScore, type WeatherInput } from "@/lib/weather/walk-score";

export const revalidate = 1800; // 30분 캐시 — 공공데이터 일일 호출 한도 보호

const KMA = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const AIR = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";
/** 에어코리아 측정소 — 덕진공원·전북대에서 가장 가까운 곳 */
const AIR_STATION = "덕진동";

type KmaItem = { category: string; obsrValue?: string; fcstValue?: string; fcstDate?: string; fcstTime?: string };

/**
 * 공공데이터포털은 키 오류 시 dataType=JSON 이어도 XML 을 돌려준다.
 * 그 경우 resultCode/메시지를 뽑아 원인을 알 수 있게 던진다.
 */
async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    const code = j?.response?.header?.resultCode;
    if (code && code !== "00") throw new Error(`${code} ${j.response.header.resultMsg}`);
    return j;
  } catch (e) {
    if (e instanceof SyntaxError) {
      const msg = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1] ?? text.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1] ?? `HTTP ${res.status}`;
      throw new Error(msg);
    }
    throw e;
  }
}

/**
 * GET /api/weather?lat=&lng=
 * 기상청 초단기실황 + 단기예보, 에어코리아 PM2.5 를 프록시하고 산책적합도를 계산한다.
 * 서비스키는 서버 환경변수에만 두고 클라이언트에 노출하지 않는다.
 * 실황이 실패하면 502, 예보·대기질은 실패해도 나머지로 계산한다. (PRD F-5 수용기준)
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "DATA_GO_KR_SERVICE_KEY 미설정 — scripts/set_weather_key.py 로 등록하세요" },
      { status: 503 },
    );
  }

  const sk = encodeURIComponent(key);
  const { nx, ny } = latLngToGrid(lat, lng);
  const now = getBaseDateTime();
  const vil = getVillageBaseDateTime();
  const kstHour = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();

  const [ncst, fcst, air] = await Promise.allSettled([
    getJson(`${KMA}/getUltraSrtNcst?serviceKey=${sk}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${now.baseDate}&base_time=${now.baseTime}&nx=${nx}&ny=${ny}`),
    getJson(`${KMA}/getVilageFcst?serviceKey=${sk}&numOfRows=300&pageNo=1&dataType=JSON&base_date=${vil.baseDate}&base_time=${vil.baseTime}&nx=${nx}&ny=${ny}`),
    getJson(`${AIR}?serviceKey=${sk}&returnType=json&numOfRows=1&pageNo=1&stationName=${encodeURIComponent(AIR_STATION)}&dataTerm=DAILY&ver=1.3`),
  ]);

  const status = {
    kmaNow: ncst.status === "fulfilled" ? "ok" : String((ncst as PromiseRejectedResult).reason?.message ?? "fail"),
    kmaForecast: fcst.status === "fulfilled" ? "ok" : String((fcst as PromiseRejectedResult).reason?.message ?? "fail"),
    air: air.status === "fulfilled" ? "ok" : String((air as PromiseRejectedResult).reason?.message ?? "fail"),
  };

  if (ncst.status !== "fulfilled") {
    // API 실패해도 앱은 계속 동작해야 한다 — 클라이언트는 시연값으로 대체한다
    return NextResponse.json({ error: "weather fetch failed", status, grid: { nx, ny } }, { status: 502 });
  }

  const obs: KmaItem[] = ncst.value?.response?.body?.items?.item ?? [];
  const pick = (c: string) => Number(obs.find((i) => i.category === c)?.obsrValue ?? NaN);

  // 단기예보에서 지금 시각과 가장 가까운 POP(강수확률)·SKY(하늘상태)
  let pop = 0;
  let sky: 1 | 3 | 4 = 3;
  if (fcst.status === "fulfilled") {
    const items: KmaItem[] = fcst.value?.response?.body?.items?.item ?? [];
    // "YYYYMMDDHH00" (KST) — fcstDate+fcstTime 과 같은 형식
    const nowKey = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:T]/g, "").slice(0, 10) + "00";
    const upcoming = (c: string) =>
      items.filter((i) => i.category === c && `${i.fcstDate}${i.fcstTime}` >= nowKey)
           .sort((a, b) => `${a.fcstDate}${a.fcstTime}`.localeCompare(`${b.fcstDate}${b.fcstTime}`))[0];
    const p = upcoming("POP");
    const s = upcoming("SKY");
    if (p) pop = Number(p.fcstValue) || 0;
    if (s && ["1", "3", "4"].includes(String(s.fcstValue))) sky = Number(s.fcstValue) as 1 | 3 | 4;
  }

  // PTY(강수형태) 실황이 비/눈이면 강수확률을 100으로 본다
  if (pick("PTY") > 0) pop = 100;

  let pm25: number | null = null;
  if (air.status === "fulfilled") {
    const v = Number(air.value?.response?.body?.items?.[0]?.pm25Value);
    if (Number.isFinite(v)) pm25 = v;
  }

  const input: WeatherInput = {
    tempC: pick("T1H"),
    humidity: pick("REH"),
    windMs: pick("WSD"),
    popPercent: pop,
    skyCode: sky,
    pm25,
    uvIndex: null, // TODO(M5): 생활기상지수 자외선
    hour: kstHour,
  };

  if (!Number.isFinite(input.tempC)) {
    return NextResponse.json({ error: "no observation", status, grid: { nx, ny } }, { status: 502 });
  }

  return NextResponse.json({
    grid: { nx, ny },
    base: { now, village: vil },
    station: AIR_STATION,
    status,
    raw: input,
    walkScore: calcWalkScore(input),
  });
}
