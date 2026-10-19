import { NextResponse } from "next/server";
import { hasDb } from "@/db";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/status — 연동 설정 현황. 값은 절대 내보내지 않고 설정 여부만 */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    env: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    db: hasDb,
    weatherKey: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
    kakaoKey: Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY),
    streamBase: Boolean(process.env.NEXT_PUBLIC_ROBOT_STREAM_BASE),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
  });
}
