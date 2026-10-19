import Link from "next/link";
import { Bot } from "lucide-react";

/** S01 스플래시 — 로고 + 슬로건 */
export default function SplashPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-sherpy-600 to-sherpy-900 px-4 pt-[22dvh] pb-safe">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sherpy-400/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-32 -left-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-sherpy-600 shadow-2xl shadow-black/20">
          <Bot size={52} strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">셰르피</h1>
        <p className="mt-3 text-lg text-sherpy-100">강아지를 자유롭게</p>
        <p className="mt-6 text-sm leading-relaxed text-sherpy-100/80">
          로봇이 줄을 잡고, 보호자는 지켜보기만.<br />반려견 산책 보조 로봇 셰르피와 함께하세요.
        </p>
      </div>

      <div className="relative mb-8 flex w-full max-w-xs flex-col gap-3">
        <Link href="/login" className="touch flex items-center justify-center rounded-2xl bg-white py-3.5 font-semibold text-sherpy-700">
          로그인
        </Link>
        <Link href="/signup" className="touch flex items-center justify-center rounded-2xl border border-white/40 py-3.5 font-semibold text-white">
          회원가입
        </Link>
        <Link href="/home" className="mt-1 text-center text-xs text-sherpy-100/80 underline underline-offset-4">
          둘러보기 (시연용 계정)
        </Link>
      </div>
    </main>
  );
}
