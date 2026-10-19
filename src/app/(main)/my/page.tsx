import Link from "next/link";
import { ChevronRight, Bot, Footprints, Route, Store, LogOut, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { DOG, USER, WALKS } from "@/lib/demo/data";

/** S16 마이페이지 */
export default function MyPage() {
  return (
    <div>
      <PageHeader title="마이" />
      <div className="px-4 pt-4 pb-6">
        <section className="card flex items-center gap-4 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sherpy-100 text-4xl">🐶</div>
          <div>
            <p className="text-lg font-bold">{DOG.name}</p>
            <p className="text-sm text-muted">{DOG.breed} · {DOG.weightKg}kg · {DOG.age}</p>
            <p className="mt-0.5 text-xs text-muted">보호자 {USER.nickname} (@{USER.username})</p>
          </div>
        </section>

        <section className="card mt-3 flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sherpy-600 text-white"><Bot size={22} /></span>
          <div className="flex-1">
            <p className="font-semibold">셰르피 #SHP-0001</p>
            <p className="text-xs text-muted">페어링됨 · 펌웨어 0.1.0</p>
          </div>
          <Link href="/robot" className="text-sm text-sherpy-600">대시보드</Link>
        </section>

        <ul className="card mt-3 divide-y divide-line">
          <Row href="/walks" icon={<Footprints size={18} />} label="산책 기록" sub={`${WALKS.length}회`} />
          <Row href="/map" icon={<Route size={18} />} label="내 코스" />
          <Row href="/market" icon={<Store size={18} />} label="마켓" sub="준비 중" />
          <Row href="/" icon={<LogOut size={18} />} label="로그아웃" />
        </ul>

        <section className="mt-3 flex gap-2 rounded-2xl bg-level-1/10 p-4 text-xs leading-relaxed text-body">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-level-1" />
          <p>
            원격 정지는 보조 수단입니다. 앱의 명령은 네트워크를 거쳐 약 1초 지연되거나 끊길 수 있어요.
            긴급 상황에서는 로봇 본체의 물리 정지 버튼을 사용하세요. 로봇은 서버 명령을 3초 이상 받지 못하면 스스로 멈춥니다.
          </p>
        </section>

        <p className="mt-6 text-center text-[11px] text-muted">셰르피 v0.1 · 전북대학교 캡스톤디자인 · 팀 프리가이즈</p>
      </div>
    </div>
  );
}

function Row({ href, icon, label, sub }: { href: string; icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <li>
      <Link href={href} className="touch flex items-center gap-3 px-4 py-3.5 text-sm">
        <span className="text-sherpy-600">{icon}</span>
        <span className="flex-1">{label}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
        <ChevronRight size={16} className="text-muted" />
      </Link>
    </li>
  );
}
