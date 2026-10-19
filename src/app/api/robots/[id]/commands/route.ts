import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { robotCommands } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CommandSchema } from "@/lib/robot/types";

/** POST /api/robots/:id/commands — 앱이 명령을 큐에 넣는다 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const robotId = Number(id);

  // TODO(M1): 세션 인증 — 로봇 소유자만 명령 가능
  const parsed = CommandSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid command" }, { status: 422 });
  }

  const [row] = await db
    .insert(robotCommands)
    .values({ robotId, type: parsed.data.type, payload: parsed.data.payload })
    .returning();

  return NextResponse.json({ ok: true, command: row }, { status: 201 });
}

/** GET /api/robots/:id/commands — 최근 명령 이력 (앱 표시용) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rows = await db
    .select()
    .from(robotCommands)
    .where(eq(robotCommands.robotId, Number(id)))
    .orderBy(desc(robotCommands.issuedAt))
    .limit(20);

  return NextResponse.json({ commands: rows });
}
