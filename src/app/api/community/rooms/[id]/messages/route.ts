import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { hasDb, noDb, db } from "@/db";
import { messages } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { CONTENT_MAX, getMessages, getRecentlyDeletedIds, getRoom } from "@/lib/community";
import { maskProfanity } from "@/lib/profanity";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET ?after=<id>&deletedSince=<iso> — 증분 폴링 (게스트도 읽기 가능) */
export async function GET(req: NextRequest, ctx: Ctx) {
  if (!hasDb) return noDb();
  const roomId = Number((await ctx.params).id);
  if (!(await getRoom(roomId))) return NextResponse.json({ error: "없는 방이에요" }, { status: 404 });

  const me = await getSessionUser();
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0);
  const since = req.nextUrl.searchParams.get("deletedSince");
  const sinceDate = since ? new Date(since) : null;
  const checkedAt = new Date();

  const [list, deletedIds] = await Promise.all([
    getMessages(roomId, Number.isFinite(after) ? after : 0, me?.id ?? null),
    sinceDate && !Number.isNaN(sinceDate.getTime()) ? getRecentlyDeletedIds(roomId, sinceDate) : Promise.resolve([]),
  ]);
  return NextResponse.json({ messages: list, deletedMessageIds: deletedIds, deletedCheckedAt: checkedAt.toISOString() });
}

/** POST { content } — 보내기 (로그인 + 정상 계정만) */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!hasDb) return noDb();
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  if (me.accountStatus !== "ACTIVE") {
    return NextResponse.json({ error: "이용이 정지된 계정이라 메시지를 보낼 수 없어요" }, { status: 403 });
  }
  const roomId = Number((await ctx.params).id);
  if (!(await getRoom(roomId))) return NextResponse.json({ error: "없는 방이에요" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > CONTENT_MAX) {
    return NextResponse.json({ error: "메시지를 확인해 주세요 (최대 500자)" }, { status: 400 });
  }

  // 도배 방지 — 10초에 5개까지
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.senderId, me.id), gte(messages.createdAt, new Date(Date.now() - 10_000))));
  if (n >= 5) return NextResponse.json({ error: "메시지를 너무 빨리 보내고 있어요. 잠시 후 다시 보내 주세요" }, { status: 429 });

  const [m] = await db.insert(messages).values({ roomId, senderId: me.id, content }).returning();
  return NextResponse.json({
    message: {
      id: m.id, roomId, senderId: me.id, senderNickname: me.nickname, type: "TEXT",
      content: maskProfanity(m.content), createdAt: m.createdAt.toISOString(), isMine: true, deleted: false,
    },
  }, { status: 201 });
}
