"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { saveDog } from "@/lib/dog";

/** S04 반려견 등록 (온보딩) — 이 기기에 저장해 홈·마이에 바로 반영. TODO(M1): POST /api/dogs */
export default function DogOnboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");

  // 이미 등록했다면 그 값으로 채워서 '수정' 화면처럼 쓴다
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("sherpy.dog") ?? "null");
      if (d) { setName(d.name ?? ""); setBreed(d.breed === "견종 미입력" ? "" : d.breed ?? ""); setWeight(d.weightKg ? String(d.weightKg) : ""); }
    } catch { /* 첫 등록 */ }
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      <PageHeader title="반려견 등록" back />
      <div className="px-4 pt-6">
        <p className="text-xs font-semibold text-sherpy-600">1 / 2</p>
        <h2 className="mt-1 text-2xl font-bold">함께 걸을 친구를 알려주세요</h2>
        <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full bg-sherpy-100 text-5xl">🐶</div>
        <div className="mt-6 space-y-3">
          <In label="이름" value={name} onChange={setName} ph="콩이" />
          <In label="견종" value={breed} onChange={setBreed} ph="포메라니안" />
          <In label="몸무게 (kg)" value={weight} onChange={setWeight} ph="4.1" type="number" />
        </div>
        <p className="mt-3 text-xs text-muted">몸무게는 장력 임계값 안내에 참고합니다.</p>
        <button disabled={!name.trim()} onClick={() => {
          const kg = Number(weight);
          saveDog({ name: name.trim(), breed: breed.trim() || "견종 미입력", weightKg: weight && Number.isFinite(kg) && kg > 0 ? kg : null, age: "" });
          router.push(`/onboarding/robot${location.search}`);
        }}
                className="press touch mt-8 w-full rounded-2xl bg-sherpy-600 py-3.5 font-semibold text-white disabled:opacity-40">
          다음
        </button>
      </div>
    </div>
  );
}

function In({ label, value, onChange, ph, type = "text" }: { label: string; value: string; onChange: (v: string) => void; ph: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-body">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} type={type} inputMode={type === "number" ? "decimal" : undefined}
             className="mt-1.5 w-full rounded-xl border border-line bg-bg px-4 py-3 text-base outline-none focus:border-sherpy-600 focus:bg-surface" />
    </label>
  );
}
