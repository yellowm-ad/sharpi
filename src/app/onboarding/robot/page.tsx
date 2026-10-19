"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

function nextPath() {
  const n = new URLSearchParams(location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/home";
}

/** S05 로봇 페어링 — 로봇 화면/라벨의 6자리 코드 입력. 건너뛰기 가능. TODO(M1): POST /api/robots/pair */
export default function RobotPairing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pair = () => {
    setDone(true);
    setTimeout(() => router.push(nextPath()), 900);
  };

  return (
    <div className="min-h-dvh bg-surface">
      <PageHeader title="셰르피 연결" back />
      <div className="px-4 pt-6">
        <p className="text-xs font-semibold text-sherpy-600">2 / 2</p>
        <h2 className="mt-1 text-2xl font-bold">셰르피와 연결해요</h2>
        <p className="mt-1 text-sm text-muted">로봇 본체 라벨의 6자리 페어링 코드를 입력하세요.</p>

        <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-sherpy-600 text-white">
          {done ? <Check size={44} /> : <Bot size={44} />}
        </div>

        <button type="button" onClick={() => input.current?.focus()} className="mt-8 flex w-full justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`tabular flex h-14 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold ${code.length === i ? "border-sherpy-600" : "border-line"}`}>
              {code[i] ?? ""}
            </span>
          ))}
        </button>
        <input ref={input} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
               inputMode="numeric" autoFocus aria-label="페어링 코드" className="absolute h-px w-px opacity-0" />

        <button disabled={code.length !== 6 || done} onClick={pair}
                className="touch mt-8 w-full rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white disabled:opacity-40">
          {done ? "연결됐어요" : "연결하기"}
        </button>
        <Link href="/home" onClick={(e) => { e.preventDefault(); router.push(nextPath()); }} className="mt-4 block text-center text-sm text-muted">
          나중에 할게요 <span className="text-xs">(로봇 기능은 잠금 표시)</span>
        </Link>
      </div>
    </div>
  );
}
