import { NextRequest, NextResponse } from "next/server";
import { db, hasDb, noDb } from "@/db";
import { robotCommands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyRobotKey } from "@/lib/robot/auth";

/** POST /api/robots/:id/commands/:cid/ack — 로봇이 명령 수행을 확인 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; cid: string }> }) {
  if (!hasDb) return noDb();
  const { id, cid } = await ctx.params;
  const robotId = Number(id);

  const robot = await verifyRobotKey(robotId, req.headers.get("authorization"));
  if (!robot) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [row] = await db
    .update(robotCommands)
    .set({ status: "acked", ackedAt: new Date() })
    .where(and(eq(robotCommands.id, Number(cid)), eq(robotCommands.robotId, robotId)))
    .returning();

  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, command: row });
}
