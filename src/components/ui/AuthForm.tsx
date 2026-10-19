"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { login, signup } from "@/lib/session";

/**
 * S02 로그인 / S03 회원가입 공용 폼.
 * 정책은 먹메이트와 동일 — 아이디 10자 / 비밀번호 16자, 외부 인증 없음 (PRD §8)
 * 로그인은 선택이다 — 게스트로 둘러보다가 저장이 필요할 때 들어온다.
 * ?next= 로 원래 보던 화면에 돌려보낸다.
 * 서버 /api/auth/* (bcrypt + httpOnly 쿠키). DB 없는 시연 배포에서는 브라우저에만 보관한다.
 */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";
  const ok = id.length > 0 && pw.length >= 4 && (!isSignup || nick.length > 0);

  return (
    <div className="min-h-dvh bg-surface">
      <PageHeader title={isSignup ? "회원가입" : "로그인"} back />
      <form className="px-4 pt-8" onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        const next = new URLSearchParams(location.search).get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
        const err = isSignup ? await signup(id.trim(), pw, nick.trim()) : await login(id.trim(), pw);
        setBusy(false);
        if (err) return setError(err);
        router.replace(isSignup ? `/onboarding/dog?next=${encodeURIComponent(safeNext)}` : safeNext);
      }}>
        <h2 className="text-2xl font-bold">{isSignup ? "셰르피와 함께 시작해요" : "다시 만나서 반가워요"}</h2>
        <p className="mt-1 text-sm text-muted">로그인하면 내가 짠 코스와 산책 기록이 저장돼요</p>

        <div className="mt-8 space-y-3">
          <Field label="아이디" value={id} onChange={(v) => setId(v.toLowerCase())} max={10} autoComplete="username" />
          <Field label="비밀번호" value={pw} onChange={setPw} max={16} type="password" autoComplete={isSignup ? "new-password" : "current-password"} />
          {isSignup && <Field label="닉네임" value={nick} onChange={setNick} max={12} />}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl bg-level-3/10 px-3 py-2.5 text-sm text-level-3">{error}</p>}

        <button disabled={!ok || busy} className="touch mt-8 w-full rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white disabled:opacity-40">
          {busy ? "확인 중…" : isSignup ? "가입하기" : "로그인"}
        </button>
        <button type="button" onClick={() => (history.length > 1 ? router.back() : router.replace("/home"))} className="touch mt-2 w-full text-sm text-muted">로그인 없이 둘러보기</button>
        <p className="mt-2 text-center text-sm text-muted">
          {isSignup ? "이미 계정이 있나요? " : "처음이신가요? "}
          <Link href={isSignup ? "/login" : "/signup"} replace onClick={(e) => { e.preventDefault(); router.replace((isSignup ? "/login" : "/signup") + location.search); }} className="font-semibold text-sherpy-600">{isSignup ? "로그인" : "회원가입"}</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, max, type = "text", autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; max: number; type?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-body">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} type={type} autoComplete={autoComplete}
             className="mt-1.5 w-full rounded-xl border border-line bg-bg px-4 py-3 text-base outline-none focus:border-sherpy-600 focus:bg-surface" />
    </label>
  );
}
