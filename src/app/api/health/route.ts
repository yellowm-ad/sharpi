import { NextResponse } from "next/server";
import { hasDb } from "@/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — 앱이 실연동/시연 모드를 고르는 기준.
 * 로봇은 ROBOT_MODE=live 이고 DB가 있을 때만 실로봇(SSE) 경로를 쓴다.
 * 그 전까지는 DB가 있어도 브라우저 안의 가상 셰르피로 시연한다.
 */
export async function GET() {
  return NextResponse.json({
    db: hasDb,
    robotLive: hasDb && process.env.ROBOT_MODE === "live",
    weather: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
  });
}
