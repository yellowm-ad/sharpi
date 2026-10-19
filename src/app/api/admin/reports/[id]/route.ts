import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb, noDb } from "@/db";
import { messages, reports, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  deleteMessage: z.boolean().optional(),
  suspendUser: z.boolean().optional(),
});

/** PATCH /api/admin/reports/:id — 처리. 필요하면 메시지 직권 삭제·작성자 정지까지 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb) return noDb();
  const id = Number((await ctx.params).id);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });

  const [r] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.deleteMessage && r.messageId) {
    await db.update(messages).set({ deletedAt: new Date() }).where(eq(messages.id, r.messageId));
  }
  if (parsed.data.suspendUser) {
    await db.update(users).set({ accountStatus: "SUSPENDED" }).where(eq(users.id, r.reportedUserId));
  }
  await db.update(reports).set({ status: parsed.data.status, handledAt: new Date() }).where(eq(reports.id, id));
  return NextResponse.json({ ok: true });
}
