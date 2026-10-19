import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { users } from "@/db/schema";

/**
 * 사용자 세션 — 먹메이트와 같은 아이디/비밀번호(bcrypt) 방식, 외부 인증 없음 (PRD §3-3).
 * 쿠키에는 "userId.만료.서명"만 담고(httpOnly), 요청마다 DB에서 계정 상태를 다시 본다.
 */
export const SESSION_COOKIE = "sherpy_session";
const TTL_S = 30 * 24 * 3600;

export const UsernameSchema = z.string().regex(/^[a-z0-9_]{3,10}$/, "아이디는 영문 소문자·숫자·_ 3~10자예요");
export const PasswordSchema = z.string().min(6, "비밀번호는 6자 이상이에요").max(16, "비밀번호는 16자 이하예요");
export const NicknameSchema = z.string().trim().min(1, "닉네임을 입력하세요").max(12, "닉네임은 12자 이하예요");

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET 미설정");
  return s;
}

const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("hex");

export function sessionCookie(userId: number) {
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  const payload = `${userId}.${exp}`;
  return {
    name: SESSION_COOKIE,
    value: `${payload}.${sign(payload)}`,
    options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.VERCEL === "1", path: "/", maxAge: TTL_S },
  };
}

export type SessionUser = {
  id: number;
  username: string;
  nickname: string;
  role: string;
  accountStatus: string;
};

/** 로그인 사용자 또는 null(게스트). 탈퇴 계정은 null */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!hasDb || !process.env.SESSION_SECRET) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || !sig || Number(exp) * 1000 < Date.now()) return null;
  const want = Buffer.from(sign(`${id}.${exp}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;

  const [u] = await db
    .select({ id: users.id, username: users.username, nickname: users.nickname, role: users.role, accountStatus: users.accountStatus, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, Number(id)))
    .limit(1);
  if (!u || u.deletedAt) return null;
  const { deletedAt: _d, ...rest } = u;
  return rest;
}
