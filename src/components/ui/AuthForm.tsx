"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";

/**
 * S02 로그인 / S03 회원가입 공용 폼.
 * 정책은 먹메이트와 동일 — 아이디 10자 / 비밀번호 16자, 외부 인증 없음 (PRD §8)
 * TODO(M1): /api/auth/* 연결. 지금은 시연용으로 홈으로 보낸다.
 */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [id, setId] = useState(mode === "login" ? "dev" : "");
  const [pw, setPw] = useState(mode === "login" ? "dev1234" : "");
  const [nick, setNick] = useState("");
  const signup = mode === "signup";
  const ok = id.length > 0 && pw.length >= 4 && (!signup || nick.length > 0);

  return (
    <div className="min-h-dvh bg-surface">
      <PageHeader title={signup ? "회원가입" : "로그인"} back />
      <form className="px-4 pt-8" onSubmit={(e) => { e.preventDefault(); router.push(signup ? "/onboarding/dog" : "/home"); }}>
        <h2 className="text-2xl font-bold">{signup ? "셰르피와 함께 시작해요" : "다시 만나서 반가워요"}</h2>
        <p className="mt-1 text-sm text-muted">강아지를 자유롭게</p>

        <div className="mt-8 space-y-3">
          <Field label="아이디" value={id} onChange={setId} max={10} autoComplete="username" />
          <Field label="비밀번호" value={pw} onChange={setPw} max={16} type="password" autoComplete={signup ? "new-password" : "current-password"} />
          {signup && <Field label="닉네임" value={nick} onChange={setNick} max={12} />}
        </div>

        <button disabled={!ok} className="touch mt-8 w-full rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white disabled:opacity-40">
          {signup ? "가입하기" : "로그인"}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          {signup ? "이미 계정이 있나요? " : "처음이신가요? "}
          <Link href={signup ? "/login" : "/signup"} className="font-semibold text-sherpy-600">{signup ? "로그인" : "회원가입"}</Link>
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
