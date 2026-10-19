import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { containsProfanity } from "@/lib/profanity";
import { db, hasDb, noDb } from "@/db";
import { users } from "@/db/schema";
import { NicknameSchema, PasswordSchema, UsernameSchema, sessionCookie } from "@/lib/auth";

const Body = z.object({ username: UsernameSchema, password: PasswordSchema, nickname: NicknameSchema });

/** POST /api/auth/signup — 가입 후 바로 로그인 */
export async function POST(req: NextRequest) {
  if (!hasDb) return noDb();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력을 확인하세요" }, { status: 422 });
  }
  const { username, password, nickname } = parsed.data;

  // 아이디·닉네임은 계속 노출되므로 비속어면 아예 막는다 (먹메이트 정책)
  if (containsProfanity(username) || containsProfanity(nickname)) {
    return NextResponse.json({ error: "아이디나 닉네임에 쓸 수 없는 표현이 있어요" }, { status: 422 });
  }

  const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (dup) return NextResponse.json({ error: "이미 사용 중인 아이디예요" }, { status: 409 });

  const [u] = await db
    .insert(users)
    .values({ username, nickname, passwordHash: await bcrypt.hash(password, 10) })
    .returning({ id: users.id, username: users.username, nickname: users.nickname, role: users.role });

  const c = sessionCookie(u.id);
  const res = NextResponse.json({ user: u }, { status: 201 });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
