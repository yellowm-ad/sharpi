import { NextRequest, NextResponse } from "next/server";
import { latLngToGrid, getBaseDateTime } from "@/lib/weather/grid";
import { calcWalkScore, type WeatherInput } from "@/lib/weather/walk-score";

export const revalidate = 1800; // 30분 캐시 — 공공데이터 일일 호출 한도 보호

/**
 * GET /api/weather?lat=&lng=
 * 기상청 초단기실황을 프록시하고 산책적합도를 계산해 돌려준다.
 * 서비스키는 서버 환경변수에만 두고 클라이언트에 노출하지 않는다.
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
      { error: "DATA_GO_KR_SERVICE_KEY 미설정 — .env.local 을 확인하세요" },
      { status: 503 },
    );
  }

  const { nx, ny } = latLngToGrid(lat, lng);
  const { baseDate, baseTime } = getBaseDateTime();

  const url =
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst" +
    `?serviceKey=${encodeURIComponent(key)}&numOfRows=10&pageNo=1&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`KMA ${res.status}`);
    const json = await res.json();

    const items: { category: string; obsrValue: string }[] =
      json?.response?.body?.items?.item ?? [];
    const pick = (c: string) => Number(items.find((i) => i.category === c)?.obsrValue ?? NaN);

    const kstHour = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
    const input: WeatherInput = {
      tempC: pick("T1H"),
      humidity: pick("REH"),
      windMs: pick("WSD"),
      popPercent: 0,          // 초단기실황에는 강수확률이 없음 → 단기예보에서 보강 (M5)
      skyCode: 3,             // 초단기실황에는 하늘상태가 없음 → 단기예보에서 보강 (M5)
      pm25: null,             // /api/air 에서 받아 합산 (M5)
      uvIndex: null,
      hour: kstHour,
    };

    if (!Number.isFinite(input.tempC)) throw new Error("no observation");

    return NextResponse.json({
      grid: { nx, ny },
      base: { baseDate, baseTime },
      raw: input,
      walkScore: calcWalkScore(input),
    });
  } catch (e) {
    // API 실패해도 앱은 계속 동작해야 한다 (PRD F-5 수용기준)
    return NextResponse.json(
      { error: "weather fetch failed", detail: String(e), grid: { nx, ny } },
      { status: 502 },
    );
  }
}
