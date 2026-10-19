import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { NextResponse } from "next/server";
import * as schema from "./schema";

/**
 * DATABASE_URL 이 없으면 import 단계에서 죽지 않고 hasDb=false 로 둔다.
 * 라우트는 noDb() 로 503을 돌려주고, 앱은 브라우저 안의 시연용 로봇으로 동작한다.
 * (AGENTS.md §6 — 키가 없어도 앱 전체가 죽으면 안 된다)
 */
export const hasDb = Boolean(process.env.DATABASE_URL);

function create() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export const db = (hasDb ? create() : null) as ReturnType<typeof create>;
export { schema };

export function noDb() {
  return NextResponse.json(
    { error: "DATABASE_URL 미설정 — 시연 모드로 동작합니다", demo: true },
    { status: 503 },
  );
}
