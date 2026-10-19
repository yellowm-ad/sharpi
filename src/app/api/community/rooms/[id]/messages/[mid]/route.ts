import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, hasDb, noDb } from "@/db";
import { messages } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

/** DELETE — 카카오톡식 전체 삭제. 보낸 사람 본인만, 아직 안 지워진 메시지만 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; mid: string }> }) {
  if (!hasDb) return noDb();
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const { id, mid } = await ctx.params;

  const [row] = await db
    .update(messages)
    .set({ deletedAt: new Date() })
    .where(and(eq(messages.id, Number(mid)), eq(messages.roomId, Number(id)), eq(messages.senderId, me.id), isNull(messages.deletedAt)))
    .returning({ id: messages.id });
  if (!row) return NextResponse.json({ error: "삭제할 수 없는 메시지예요" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
