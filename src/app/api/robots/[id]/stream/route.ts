import { NextRequest } from "next/server";
import { db, hasDb, noDb } from "@/db";
import { robotTelemetry } from "@/db/schema";
import { eq, gt, and, asc } from "drizzle-orm";
import { requireRobotOwner } from "@/lib/robot/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Hobby 플랜 상한. 끊기면 EventSource가 자동 재연결한다.

/**
 * GET /api/robots/:id/stream   (Server-Sent Events)
 *
 * Vercel Functions는 SSE를 지원하지만 함수 최대 실행시간 제한을 받는다.
 * Hobby = 300초. 따라서 클라이언트 재연결이 필수이고,
 * Last-Event-ID로 유실 구간을 이어받는다. (useRobotStream 훅 참고)
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasDb) return noDb();
  const { id } = await ctx.params;
  const robotId = Number(id);

  const denied = await requireRobotOwner(robotId);
  if (denied) return denied;

  const lastEventId = req.headers.get("last-event-id");
  let lastId = lastEventId ? Number(lastEventId) : 0;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      send(`retry: 2000\n\n`); // 재연결 간격 권고

      const tick = async () => {
        try {
          const rows = await db
            .select()
            .from(robotTelemetry)
            .where(and(eq(robotTelemetry.robotId, robotId), gt(robotTelemetry.id, lastId)))
            .orderBy(asc(robotTelemetry.id))
            .limit(20);

          for (const r of rows) {
            lastId = r.id;
            send(`id: ${r.id}\nevent: telemetry\ndata: ${JSON.stringify(r)}\n\n`);
          }
          if (rows.length === 0) send(`: keepalive\n\n`); // 프록시 타임아웃 방지
        } catch {
          send(`event: error\ndata: {"message":"db"}\n\n`);
        }
      };

      await tick();
      const timer = setInterval(tick, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
