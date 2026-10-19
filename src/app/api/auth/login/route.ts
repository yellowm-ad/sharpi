import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb, noDb } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookie } from "@/lib/auth";

const Body = z.object({ username: z.string().min(1).max(10), password: z.string().min(1).max(16) });

/** POST /api/auth/login */
export async function POST(req: NextRequest) {
  if (!hasDb) return noDb();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요" }, { status: 422 });

  const [u] = await db.select().from(users).where(eq(users.username, parsed.data.username.trim())).limit(1);
  const ok = u && !u.deletedAt && (await bcrypt.compare(parsed.data.password, u.passwordHash));
  if (!ok) return NextResponse.json({ error: "아이디 또는 비밀번호가 맞지 않아요" }, { status: 401 });

  if (u.accountStatus !== "ACTIVE") {
    return NextResponse.json({ error: "이용이 정지된 계정이에요. 운영자에게 문의하세요" }, { status: 403 });
  }

  const c = sessionCookie(u.id);
  const res = NextResponse.json({ user: { id: u.id, username: u.username, nickname: u.nickname, role: u.role } });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}

/** DELETE /api/auth/login — 로그아웃 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
