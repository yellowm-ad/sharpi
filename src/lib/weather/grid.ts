/**
 * 위경도 → 기상청 단기예보 격자(nx, ny) 변환
 *
 * 기상청이 배포하는 DFS_XY_CONV 알고리즘(Lambert Conformal Conic)을 그대로 옮긴 것.
 * 단기예보 조회서비스는 위경도가 아니라 이 격자 좌표를 받는다.
 * https://www.data.go.kr/data/15084084/openapi.do
 */
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0;      // 격자 간격(km)
const SLAT1 = 30.0;    // 표준 위도 1
const SLAT2 = 60.0;    // 표준 위도 2
const OLON = 126.0;    // 기준점 경도
const OLAT = 38.0;     // 기준점 위도
const XO = 43;         // 기준점 X
const YO = 136;        // 기준점 Y

const DEGRAD = Math.PI / 180.0;

export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/**
 * 초단기실황(getUltraSrtNcst) base_date / base_time 계산.
 * 매시 40분에 생성되므로 그 전에는 직전 시각을 써야 한다.
 */
export function getBaseDateTime(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000); // UTC → KST
  if (kst.getUTCMinutes() < 40) kst.setUTCHours(kst.getUTCHours() - 1);

  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  const h = String(kst.getUTCHours()).padStart(2, "0");

  return { baseDate: `${y}${m}${d}`, baseTime: `${h}00` };
}
