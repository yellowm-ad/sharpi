import Link from "next/link";

/** S01 스플래시 — 로고 + 슬로건 */
export default function SplashPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-sherpy-600 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">셰르피</h1>
        <p className="mt-3 text-lg text-sherpy-100">강아지를 자유롭게</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="touch flex items-center justify-center rounded-xl bg-white py-3.5 font-semibold text-sherpy-700"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="touch flex items-center justify-center rounded-xl border border-white/40 py-3.5 font-semibold text-white"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
