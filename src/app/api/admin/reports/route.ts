import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, hasDb, noDb } from "@/db";
import { chatRooms, messages, reports, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/reports — 최근 신고 100건 (처리 대기 먼저) */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb) return noDb();
  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");
  const rows = await db
    .select({
      id: reports.id, reason: reports.reason, detail: reports.detail, status: reports.status,
      snapshot: reports.messageContentSnapshot, createdAt: reports.createdAt, messageId: reports.messageId,
      reporter: reporter.nickname, reportedId: reported.id, reported: reported.nickname, reportedStatus: reported.accountStatus,
      room: chatRooms.title, messageDeletedAt: messages.deletedAt,
    })
    .from(reports)
    .innerJoin(reporter, eq(reporter.id, reports.reporterId))
    .innerJoin(reported, eq(reported.id, reports.reportedUserId))
    .leftJoin(chatRooms, eq(chatRooms.id, reports.roomId))
    .leftJoin(messages, eq(messages.id, reports.messageId))
    .orderBy(desc(reports.createdAt))
    .limit(100);
  rows.sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));
  return NextResponse.json({ reports: rows });
}
