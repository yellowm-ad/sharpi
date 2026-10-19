import { NextResponse } from "next/server";
import { hasDb, noDb } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { loadRoutes, ownRoutes } from "@/lib/routes-db";

export const dynamic = "force-dynamic";

/** GET /api/routes/mine — 내가 저장한 코스 */
export async function GET() {
  if (!hasDb) return noDb();
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  return NextResponse.json({ routes: await loadRoutes(ownRoutes(me.id)) });
}
