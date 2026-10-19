import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { robotCommands } from "@/db/schema";
import { and, eq, asc, lt } from "drizzle-orm";
import { verifyRobotKey } from "@/lib/robot/auth";

/**
 * GET /api/robots/:id/commands/pending
 *
 * 로봇이 1Hz로 폴링한다. 로봇에 인바운드 포트를 열 필요가 없어
 * LTE·핫스팟 환경에서도 동작한다.
 * ESTOP은 큐 순서를 무시하고 최우선 반환한다.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const robotId = Number(id);

  const robot = await verifyRobotKey(robotId, req.headers.get("authorization"));
  if (!robot) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 10초 넘게 응답 없는 명령은 만료 처리
  const tenSecAgo = new Date(Date.now() - 10_000);
  await db
    .update(robotCommands)
    .set({ status: "expired" })
    .where(and(
      eq(robotCommands.robotId, robotId),
      eq(robotCommands.status, "sent"),
      lt(robotCommands.sentAt, tenSecAgo),
    ));

  const pending = await db
    .select()
    .from(robotCommands)
    .where(and(eq(robotCommands.robotId, robotId), eq(robotCommands.status, "pending")))
    .orderBy(asc(robotCommands.issuedAt))
    .limit(10);

  // ESTOP 최우선
  pending.sort((a, b) => (a.type === "ESTOP" ? -1 : b.type === "ESTOP" ? 1 : 0));

  if (pending.length > 0) {
    const now = new Date();
    for (const c of pending) {
      await db.update(robotCommands)
        .set({ status: "sent", sentAt: now })
        .where(eq(robotCommands.id, c.id));
    }
  }

  return NextResponse.json({ commands: pending });
}
