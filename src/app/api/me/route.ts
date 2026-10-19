import { NextResponse } from "next/server";
import { hasDb } from "@/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/me — 로그인 사용자 또는 { user: null }(게스트). DB 없으면 demo:true */
export async function GET() {
  if (!hasDb) return NextResponse.json({ user: null, demo: true });
  return NextResponse.json({ user: await getSessionUser() });
}
