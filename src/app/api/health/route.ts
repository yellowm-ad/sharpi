import { NextResponse } from "next/server";
import { hasDb } from "@/db";

export const dynamic = "force-dynamic";

/** GET /api/health — 앱이 실연동/시연 모드를 고르는 기준 */
export async function GET() {
  return NextResponse.json({
    db: hasDb,
    weather: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
  });
}
