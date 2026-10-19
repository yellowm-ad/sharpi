"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store, Users, ChevronRight, Info } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { formatRelativeTime } from "@/lib/format";

type Room = { id: number; title: string; description: string; emoji: string; lastMessage: string; lastMessageAt: string; todayCount: number };

/** S14 커뮤니티 — 먹메이트 "음식 커뮤니티"와 같은 고정 오픈채팅방 목록 (PRD F-7) */
export default function CommunityPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch("/api/community/rooms", { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error(String(r.status));
          setRooms((await r.json()).rooms);
          setOffline(false);
        })
        .catch(() => { setOffline(true); setRooms((v) => v ?? []); });
    load();
    // 목록도 가볍게 폴링 — 마지막 메시지 미리보기 갱신
    const t = setInterval(() => { if (!document.hidden) load(); }, 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="커뮤니티" right={
        <Link href="/market" className="touch flex items-center gap-1 px-2 text-sm text-sherpy-600"><Store size={16} />마켓</Link>
      } />

      <p className="mx-4 mt-3 flex items-start gap-2 rounded-xl bg-sherpy-50 px-3 py-2.5 text-xs leading-relaxed text-sherpy-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        누구나 들어와서 읽을 수 있는 오픈채팅방이에요. 대화에 참여하려면 로그인하세요.
      </p>

      {offline && (
        <p className="mx-4 mt-3 rounded-xl bg-level-1/10 px-3 py-2.5 text-xs text-body">
          커뮤니티 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      <ul className="mt-3 divide-y divide-line border-y border-line bg-surface">
        {rooms === null
          ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-[76px] animate-pulse bg-surface" />)
          : rooms.map((r) => (
              <li key={r.id}>
                <Link href={`/community/${r.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-bg">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sherpy-50 text-2xl">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{r.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{r.lastMessage || r.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {r.lastMessageAt && <span className="text-[11px] text-muted">{formatRelativeTime(r.lastMessageAt)}</span>}
                    {r.todayCount > 0 ? (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-sherpy-600"><Users size={11} />오늘 {r.todayCount}</span>
                    ) : (
                      <ChevronRight size={16} className="text-muted" />
                    )}
                  </div>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}
