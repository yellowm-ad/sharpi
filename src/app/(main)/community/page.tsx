"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, PenLine, Store, Route } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { POSTS, routeById, type PostCategory } from "@/lib/demo/data";

const CATS: ("전체" | PostCategory)[] = ["전체", "자유", "산책코스 추천", "셰르피 사용팁", "질문"];

/** S14 커뮤니티 목록 (PRD F-7) */
export default function CommunityPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("전체");
  const list = POSTS.filter((p) => cat === "전체" || p.category === cat);

  return (
    <div>
      <PageHeader title="커뮤니티" right={
        <Link href="/market" className="touch flex items-center gap-1 px-2 text-sm text-sherpy-600"><Store size={16} />마켓</Link>
      } />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${cat === c ? "bg-sherpy-600 text-white" : "bg-surface text-body ring-1 ring-line"}`}>
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-2 px-4 pb-6">
        {list.map((p) => {
          const r = p.routeId ? routeById(p.routeId) : null;
          return (
            <li key={p.id} className="card p-4">
              <p className="text-[11px] font-semibold text-sherpy-600">{p.category}</p>
              <p className="mt-1 font-semibold">{p.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-body">{p.body}</p>
              {r && (
                <Link href={`/routes/${r.id}`} className="mt-2 flex items-center gap-2 rounded-xl bg-sherpy-50 p-2.5 text-sm">
                  <Route size={16} className="text-sherpy-600" /> <span className="font-semibold">{r.name}</span>
                  <span className="ml-auto text-xs text-sherpy-600">코스 보기</span>
                </Link>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                <span>{p.author} · {p.ago}</span>
                <span className="ml-auto flex items-center gap-1"><Heart size={13} />{p.likeCount}</span>
                <span className="flex items-center gap-1"><MessageCircle size={13} />{p.commentCount}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <button aria-label="글쓰기"
              className="fixed right-[max(1rem,calc(50%-240px+1rem))] bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sherpy-600 text-white shadow-lg">
        <PenLine size={22} />
      </button>
    </div>
  );
}
