import Link from "next/link";
import { Bot } from "lucide-react";

/** S01 스플래시 — 로고 + 슬로건 */
export default function SplashPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-sherpy-600 to-sherpy-900 px-4 pt-[22dvh] pb-safe">
      {/* 배경 빛 덩어리가 천천히 떠다닌다 — 정지 화면이 아니라 "살아 있는" 첫인상 */}
      <div className="animate-float pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sherpy-400/30 blur-3xl" />
      <div className="animate-float pointer-events-none absolute bottom-32 -left-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: "-3s" }} />

      <div className="stagger relative text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-sherpy-600 shadow-2xl shadow-black/20">
          <Bot size={52} strokeWidth={1.8} />
        </div>
        <h1 style={{ "--i": 1 } as React.CSSProperties} className="mt-6 text-5xl font-bold tracking-tight text-white">셰르피</h1>
        <p style={{ "--i": 2 } as React.CSSProperties} className="mt-3 text-lg text-sherpy-100">강아지를 자유롭게</p>
        <p style={{ "--i": 3 } as React.CSSProperties} className="mt-6 text-sm leading-relaxed text-sherpy-100/80">
          로봇이 줄을 잡고, 보호자는 지켜보기만.<br />반려견 산책 보조 로봇 셰르피와 함께하세요.
        </p>
      </div>

      <div className="stagger relative mb-8 flex w-full max-w-xs flex-col gap-3">
        <Link href="/home" style={{ "--i": 5 } as React.CSSProperties} className="press touch flex items-center justify-center rounded-2xl bg-white py-3.5 font-semibold text-sherpy-700 shadow-xl shadow-black/20">
          바로 시작하기
        </Link>
        <p style={{ "--i": 6 } as React.CSSProperties} className="mt-1 text-center text-xs text-sherpy-100/80">
          로그인 없이 둘러볼 수 있어요 ·{" "}
          <Link href="/login?next=/home" className="font-semibold text-white underline underline-offset-4">로그인</Link>
        </p>
      </div>
    </main>
  );
}
