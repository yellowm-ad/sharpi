import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, hasDb, noDb } from "@/db";
import { routes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { NewRouteSchema, createRoute, loadRoutes, visibleRoute } from "@/lib/routes-db";

/** POST /api/routes — 내 코스 저장 (로그인 필요, PRD F-4) */
export async function POST(req: NextRequest) {
  if (!hasDb) return noDb();
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  if (me.accountStatus !== "ACTIVE") return NextResponse.json({ error: "이용이 정지된 계정이에요" }, { status: 403 });

  const parsed = NewRouteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력을 확인하세요" }, { status: 422 });
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(routes)
    .where(and(eq(routes.userId, me.id), isNull(routes.deletedAt)));
  if (n >= 100) return NextResponse.json({ error: "코스는 100개까지 저장할 수 있어요" }, { status: 409 });

  const id = await createRoute(me.id, parsed.data);
  const [route] = await loadRoutes(visibleRoute(id));
  return NextResponse.json({ route }, { status: 201 });
}
