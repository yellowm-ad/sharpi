import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { robots } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 로봇 API 키 검증.
 * 로봇은 Authorization: Bearer <api_key> 헤더로 인증한다.
 * DB에는 해시만 저장하므로 평문 비교를 하지 않는다.
 */
export async function verifyRobotKey(robotId: number, authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!key) return null;

  const [robot] = await db.select().from(robots).where(eq(robots.id, robotId)).limit(1);
  if (!robot) return null;

  const ok = await bcrypt.compare(key, robot.apiKeyHash);
  return ok ? robot : null;
}

export async function hashRobotKey(plain: string) {
  return bcrypt.hash(plain, 10);
}

/** 페어링 코드 — 숫자 6자리 */
export function generatePairingCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 앱(보호자) 쪽 권한 — 로그인한 사용자가 이 로봇의 주인인지.
 * 명령·실시간 스트림은 로봇 소유자만 쓸 수 있다 (PRD §12 보안).
 * 통과하면 null, 막히면 돌려줄 응답.
 */
export async function requireRobotOwner(robotId: number) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  if (me.accountStatus !== "ACTIVE") return NextResponse.json({ error: "이용이 정지된 계정이에요" }, { status: 403 });
  const [robot] = await db.select({ ownerId: robots.ownerId }).from(robots).where(eq(robots.id, robotId)).limit(1);
  if (!robot || robot.ownerId !== me.id) return NextResponse.json({ error: "내 로봇이 아니에요" }, { status: 403 });
  return null;
}
