import PageHeader from "@/components/ui/PageHeader";
import { MARKET } from "@/lib/demo/data";

/** S15 마켓 — 명목상 기능 (PRD F-8). 등록·결제·채팅 없음 */
export default function MarketPage() {
  return (
    <div>
      <PageHeader title="마켓" back />
      <p className="mx-4 mt-3 rounded-xl bg-sherpy-50 px-3 py-2 text-xs text-sherpy-700">
        준비 중인 기능입니다 · 시연용 상품 목록이에요
      </p>
      <ul className="grid grid-cols-2 gap-3 px-4 py-3 pb-6">
        {MARKET.map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <div className="flex aspect-square items-center justify-center bg-sherpy-50 text-5xl">{m.emoji}</div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold">{m.title}</p>
              <p className="tabular mt-0.5 font-bold">{m.price.toLocaleString()}원</p>
              <p className="text-[11px] text-muted">{m.condition}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
