import bcrypt from "bcryptjs";
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
