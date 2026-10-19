import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminConfigured, checkPassword, issueToken } from "@/lib/admin-auth";

const Body = z.object({ password: z.string().min(1).max(200) });

/** POST /api/admin/login — 어드민 로그인 */
export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "ADMIN_PASSWORD 미설정" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !checkPassword(parsed.data.password)) {
    // 무차별 대입을 늦춘다
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "비밀번호가 맞지 않습니다" }, { status: 401 });
  }
  const t = issueToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, t.value, {
    httpOnly: true, sameSite: "strict", secure: process.env.VERCEL === "1", path: "/", maxAge: t.maxAge,
  });
  return res;
}

/** DELETE /api/admin/login — 로그아웃 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
