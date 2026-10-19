import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb, noDb } from "@/db";
import { users } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({ accountStatus: z.enum(["ACTIVE", "SUSPENDED"]) });

/** PATCH /api/admin/users/:id — 이용 정지 / 해제 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb) return noDb();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });
  await db.update(users).set({ accountStatus: parsed.data.accountStatus }).where(eq(users.id, Number((await ctx.params).id)));
  return NextResponse.json({ ok: true });
}
