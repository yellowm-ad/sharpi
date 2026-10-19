"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-surface px-6">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sherpy-900 text-white"><LockKeyhole /></span>
      <h1 className="mt-4 text-center text-xl font-bold">셰르피 어드민</h1>
      <p className="mt-1 text-center text-sm text-muted">운영자 비밀번호를 입력하세요</p>
      <form className="mt-8" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
        setBusy(false);
        if (r.ok) router.refresh();
        else setError((await r.json().catch(() => null))?.error ?? "로그인 실패");
      }}>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" aria-label="어드민 비밀번호"
               className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-base outline-none focus:border-sherpy-600" />
        {error && <p role="alert" className="mt-2 text-sm text-level-3">{error}</p>}
        <button disabled={!pw || busy} className="touch mt-4 w-full rounded-xl bg-sherpy-900 py-3 font-semibold text-white disabled:opacity-40">
          {busy ? "확인 중…" : "들어가기"}
        </button>
      </form>
    </main>
  );
}
