import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb, noDb } from "@/db";
import { messages, reports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/report-reasons";


const Body = z.object({
  messageId: z.number().int().positive(),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().trim().max(500).optional().default(""),
});

/** POST /api/reports — 메시지 신고. 신고 시점 원문을 스냅샷으로 남긴다 */
export async function POST(req: NextRequest) {
  if (!hasDb) return noDb();
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "신고 사유를 선택해 주세요" }, { status: 400 });
  const { messageId, reason, detail } = parsed.data;
  if (reason === "OTHER" && !detail) {
    return NextResponse.json({ error: "'기타' 사유는 상세 내용을 적어 주세요" }, { status: 400 });
  }

  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!msg || !msg.senderId) return NextResponse.json({ error: "없는 메시지예요" }, { status: 404 });
  if (msg.senderId === me.id) return NextResponse.json({ error: "내 메시지는 신고할 수 없어요" }, { status: 400 });

  const [dup] = await db.select({ id: reports.id }).from(reports)
    .where(and(eq(reports.reporterId, me.id), eq(reports.messageId, messageId))).limit(1);
  if (dup) return NextResponse.json({ error: "이미 신고한 메시지예요" }, { status: 409 });

  const [r] = await db.insert(reports).values({
    reporterId: me.id,
    reportedUserId: msg.senderId,
    roomId: msg.roomId,
    messageId,
    reason,
    detail: detail || null,
    messageContentSnapshot: msg.content,
  }).returning({ id: reports.id });
  return NextResponse.json({ ok: true, reportId: r.id }, { status: 201 });
}
