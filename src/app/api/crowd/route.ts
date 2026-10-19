import { NextResponse } from "next/server";

/**
 * GET /api/crowd
 *
 * ⚠️ 명목상 구현 (PRD §3-2, §11-4)
 * 전북권에 바로 쓸 수 있는 무료 실시간 유동인구 API가 없다.
 *  - 서울시 생활인구 데이터는 서울 전용
 *  - 통신사(SKT·KT) 유동인구는 유료 B2B 계약
 *  - 한국관광공사 TourAPI 혼잡도는 관광지 한정
 * 따라서 하드코딩 더미를 반환하고, 지도 범례에 "시연용 데이터"를 표시한다.
 */
const MOCK = [
  { areaCode: "jj-deokjin-park", name: "덕진공원",   level: 2 },
  { areaCode: "jj-jbnu-front",   name: "전북대 정문", level: 3 },
  { areaCode: "jj-geonji-mt",    name: "건지산 둘레길", level: 1 },
  { areaCode: "jj-jeonjucheon",  name: "전주천 산책로", level: 2 },
];

export async function GET() {
  return NextResponse.json({
    mock: true,
    note: "시연용 더미 데이터입니다. 상용화 시 통신사 유동인구 API를 연동합니다.",
    areas: MOCK,
  });
}
