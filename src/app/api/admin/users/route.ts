import { NextResponse } from "next/server";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { db, hasDb, noDb } from "@/db";
import { messages, reports, routes, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — 회원 목록 + 개요 통계 */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb) return noDb();
  const routeCount = db.$with("rc").as(
    db.select({ uid: routes.userId, n: sql<number>`count(*)::int`.as("route_n") }).from(routes).where(isNull(routes.deletedAt)).groupBy(routes.userId),
  );
  const msgCount = db.$with("mc").as(
    db.select({ uid: messages.senderId, n: sql<number>`count(*)::int`.as("msg_n") }).from(messages).groupBy(messages.senderId),
  );
  const list = await db.with(routeCount, msgCount)
    .select({
      id: users.id, username: users.username, nickname: users.nickname, role: users.role,
      accountStatus: users.accountStatus, createdAt: users.createdAt,
      routes: sql<number>`coalesce(${routeCount.n}, 0)`, messages: sql<number>`coalesce(${msgCount.n}, 0)`,
    })
    .from(users)
    .leftJoin(routeCount, eq(routeCount.uid, users.id))
    .leftJoin(msgCount, eq(msgCount.uid, users.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
    .limit(200);

  const [stats] = await db.select({
    users: sql<number>`(select count(*)::int from sherpy.users where deleted_at is null)`,
    routes: sql<number>`(select count(*)::int from sherpy.routes where deleted_at is null)`,
    messagesToday: sql<number>`(select count(*)::int from sherpy.messages where created_at > now() - interval '24 hours')`,
    pendingReports: sql<number>`(select count(*)::int from ${reports} where status = 'PENDING')`,
  }).from(sql`(select 1) as one`);

  return NextResponse.json({ users: list, stats });
}
