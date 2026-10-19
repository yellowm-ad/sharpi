import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 어드민 인증 — ADMIN_PASSWORD 환경변수 하나로 들어간다.
 * 쿠키에는 비밀번호가 아니라 만료시각 + HMAC 서명만 담는다 (httpOnly).
 * ADMIN_PASSWORD 가 없으면 어드민은 잠긴다.
 */
export const ADMIN_COOKIE = "sherpy_admin";
const TTL_MS = 12 * 3600 * 1000;

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return `${pw}:${process.env.SESSION_SECRET ?? "sherpy"}`;
}

function sign(payload: string, s: string) {
  return createHmac("sha256", s).update(payload).digest("hex");
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueToken() {
  const s = secret()!;
  const exp = String(Date.now() + TTL_MS);
  return { value: `${exp}.${sign(exp, s)}`, maxAge: TTL_MS / 1000 };
}

export async function isAdmin() {
  const s = secret();
  if (!s) return false;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const want = Buffer.from(sign(exp, s));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
