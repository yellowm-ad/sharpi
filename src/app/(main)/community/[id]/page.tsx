"use client";

import Link from "next/link";
import { use, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, Send, Info, ShieldCheck, Trash2, Flag, AlertCircle, LogIn } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import ReportSheet from "@/components/community/ReportSheet";
import { useUser } from "@/lib/session";
import { formatClock, formatDateDivider, isSameDay } from "@/lib/format";

type Msg = {
  id: number; senderId: number | null; senderNickname: string; type: "TEXT" | "SYSTEM";
  content: string; createdAt: string; isMine: boolean; deleted: boolean;
};

const POLL_MS = 2500; // 먹메이트와 동일 — 상시 연결 대신 짧은 폴링
const DELETED = "삭제된 메시지예요";

/** S14 커뮤니티 채팅방 — 먹메이트 ChatRoomView 방식 (폴링·소프트삭제·신고) */
export default function CommunityRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUser();
  const [title, setTitle] = useState("");
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [delTarget, setDelTarget] = useState<Msg | null>(null);
  const [reportTarget, setReportTarget] = useState<{ messageId: number; nickname: string } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);
  const deletedSince = useRef(new Date().toISOString());
  const scrolledUpRef = useRef(false);
  scrolledUpRef.current = scrolledUp;

  // 방 제목
  useEffect(() => {
    fetch("/api/community/rooms").then((r) => r.json())
      .then((j) => setTitle(j.rooms?.find((x: { id: number }) => x.id === Number(id))?.title ?? "커뮤니티"))
      .catch(() => setTitle("커뮤니티"));
  }, [id]);

  // 첫 로드 + 2.5초 증분 폴링 (after 커서 + 최근 삭제 확인). 로그인 상태가 바뀌면 isMine 이 달라지므로 다시 받는다
  useEffect(() => {
    let alive = true;
    lastId.current = 0;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/community/rooms/${id}/messages?after=${lastId.current}&deletedSince=${encodeURIComponent(deletedSince.current)}`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j: { messages: Msg[]; deletedMessageIds: number[]; deletedCheckedAt: string } = await r.json();
        if (!alive) return;
        deletedSince.current = j.deletedCheckedAt;
        const del = new Set(j.deletedMessageIds);
        const first = lastId.current === 0;
        if (j.messages.length) lastId.current = j.messages[j.messages.length - 1].id;
        setMsgs((prev) => {
          const base = first ? [] : (prev ?? []);
          const patched = del.size ? base.map((m) => (del.has(m.id) ? { ...m, deleted: true, content: DELETED } : m)) : base;
          const seen = new Set(patched.map((m) => m.id));
          return [...patched, ...j.messages.filter((m) => !seen.has(m.id))];
        });
        if (!first && j.messages.length && scrolledUpRef.current) setNewCount((n) => n + j.messages.length);
      } catch {
        if (alive) setMsgs((v) => v ?? []); // 폴링 오류는 조용히 — 다음 주기에 다시
      }
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [id, user?.username]);

  // 첫 렌더는 맨 아래로, 이후엔 내가 위로 올려 보고 있지 않을 때만 따라 내려간다
  const didInit = useRef(false);
  useLayoutEffect(() => {
    if (!msgs) return;
    if (!didInit.current) { bottomRef.current?.scrollIntoView({ block: "end" }); didInit.current = true; return; }
    if (!scrolledUpRef.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setScrolledUp(!atBottom);
    if (atBottom) setNewCount(0);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true); setError(null);
    const r = await fetch(`/api/community/rooms/${id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
    }).catch(() => null);
    setSending(false);
    const j = await r?.json().catch(() => null);
    if (!r?.ok) return setError(j?.error ?? "메시지 전송에 실패했어요.");
    lastId.current = Math.max(lastId.current, j.message.id);
    setMsgs((prev) => (prev?.some((m) => m.id === j.message.id) ? prev : [...(prev ?? []), j.message]));
    setInput("");
    setScrolledUp(false);
  };

  // 카카오톡식 전체 삭제 — 낙관적 업데이트, 실패하면 되돌린다
  const remove = async (m: Msg) => {
    setMsgs((prev) => prev?.map((x) => (x.id === m.id ? { ...x, deleted: true, content: DELETED } : x)) ?? prev);
    const r = await fetch(`/api/community/rooms/${id}/messages/${m.id}`, { method: "DELETE" }).catch(() => null);
    if (!r?.ok) {
      setMsgs((prev) => prev?.map((x) => (x.id === m.id ? m : x)) ?? prev);
      setError("메시지 삭제에 실패했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-[45] mx-auto flex max-w-[480px] flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-2">
        <button onClick={() => router.back()} aria-label="뒤로" className="touch flex items-center justify-center"><ChevronLeft size={24} /></button>
        <h1 className="flex-1 truncate font-bold">{title}</h1>
        <button onClick={() => setGuideOpen(true)} aria-label="안전 이용 안내" className="touch flex items-center justify-center text-level-0"><ShieldCheck size={20} /></button>
      </header>

      <p className="flex shrink-0 items-start gap-2 border-b border-line bg-surface px-4 py-2 text-[11px] leading-snug text-muted">
        <Info size={14} className="mt-px shrink-0" />
        서로 존중하며 대화해 주세요. 욕설·도배·광고·개인정보 요구는 신고 대상이에요. 메시지를 누르면 삭제·신고할 수 있어요.
      </p>

      <div ref={boxRef} onScroll={onScroll} onClick={() => setPicked(null)} className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {msgs === null && <p className="m-auto text-sm text-muted">불러오는 중…</p>}
        {msgs?.length === 0 && (
          <p className="m-auto text-center text-sm text-muted">아직 대화가 없어요.<br />첫 메시지를 남겨 보세요 🐾</p>
        )}
        {msgs?.map((m, i) => {
          const prev = msgs[i - 1];
          const divider = !prev || !isSameDay(prev.createdAt, m.createdAt);
          if (m.type === "SYSTEM") {
            return (
              <div key={m.id}>
                {divider && <DateDivider iso={m.createdAt} />}
                <p className="mx-auto my-2 w-fit rounded-full bg-line/60 px-3 py-1 text-xs text-muted">{m.content}</p>
              </div>
            );
          }
          const showName = !m.isMine && (!prev || prev.senderId !== m.senderId || divider);
          const canAct = !m.deleted && !!user && (m.isMine || !!m.senderId);
          return (
            <div key={m.id}>
              {divider && <DateDivider iso={m.createdAt} />}
              <div className={`flex gap-2 ${m.isMine ? "flex-row-reverse" : ""}`}>
                {!m.isMine && (
                  <div className="w-8 shrink-0 self-start">
                    {showName && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sherpy-100 text-sm">🐶</span>}
                  </div>
                )}
                <div className={`flex flex-col gap-0.5 ${m.isMine ? "items-end" : "items-start"}`}>
                  {showName && <span className="px-1 text-xs font-semibold text-muted">{m.senderNickname}</span>}
                  <div className={`flex items-end gap-1.5 ${m.isMine ? "flex-row-reverse" : ""}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (canAct) setPicked(picked === m.id ? null : m.id); }}
                      className={[
                        "max-w-64 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed",
                        m.deleted ? "border border-dashed border-line italic text-muted"
                          : m.isMine ? "rounded-br-sm bg-sherpy-600 text-white"
                          : "rounded-bl-sm bg-surface text-ink ring-1 ring-line",
                        picked === m.id ? "ring-2 ring-sherpy-400" : "",
                      ].join(" ")}
                    >
                      {m.content}
                    </button>
                    <span className="shrink-0 text-[10px] text-muted">{formatClock(m.createdAt)}</span>
                  </div>
                  {picked === m.id && (
                    <div className="animate-fade flex gap-1.5 pt-0.5">
                      {m.isMine ? (
                        <button onClick={(e) => { e.stopPropagation(); setPicked(null); setDelTarget(m); }}
                                className="flex h-8 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-level-3 ring-1 ring-line"><Trash2 size={13} />삭제</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setPicked(null); setReportTarget({ messageId: m.id, nickname: m.senderNickname }); }}
                                className="flex h-8 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-level-3 ring-1 ring-line"><Flag size={13} />신고</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {scrolledUp && newCount > 0 && (
        <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); setNewCount(0); }}
                className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-sherpy-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          새 메시지 {newCount}개 <ChevronDown size={14} />
        </button>
      )}

      {user ? (
        <form onSubmit={send} className="shrink-0 border-t border-line bg-surface px-3 pt-2.5 pb-safe">
          {error && <p className="mb-1.5 flex items-center gap-1 px-1 text-xs text-level-3"><AlertCircle size={13} />{error}</p>}
          <div className="flex items-end gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="메시지를 입력하세요 (최대 500자)"
                   className="h-11 flex-1 rounded-full border border-line bg-bg px-4 text-base outline-none focus:border-sherpy-600" />
            <button type="submit" disabled={sending || !input.trim()} aria-label="전송"
                    className="touch flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sherpy-600 text-white disabled:opacity-40">
              <Send size={17} />
            </button>
          </div>
        </form>
      ) : (
        <div className="shrink-0 border-t border-line bg-surface px-3 pt-2.5 pb-safe">
          <Link href={`/login?next=/community/${id}`} className="touch flex items-center justify-center gap-1.5 rounded-full bg-sherpy-600 text-sm font-semibold text-white">
            <LogIn size={16} /> 로그인하고 대화 참여하기
          </Link>
        </div>
      )}

      <Sheet open={!!delTarget} title="메시지를 삭제할까요?" confirmLabel="삭제" danger
             onClose={() => setDelTarget(null)} onConfirm={() => delTarget && remove(delTarget)}>
        모든 사람의 화면에서 &lsquo;{DELETED}&rsquo;로 바뀌어요.
      </Sheet>

      <Sheet open={guideOpen} title="안전 이용 안내" cancelLabel="확인" onClose={() => setGuideOpen(false)}>
        <ul className="list-disc space-y-1.5 pl-4 text-xs">
          <li>함께 산책할 땐 덕진공원처럼 사람이 많은 공개된 장소에서 만나세요.</li>
          <li>주소·전화번호 같은 개인정보를 대화에 남기지 마세요.</li>
          <li>다른 강아지와 만날 땐 서로 리드줄을 짧게 잡고 인사시켜 주세요.</li>
          <li>불쾌한 메시지는 눌러서 신고할 수 있어요. 신고자는 공개되지 않아요.</li>
        </ul>
      </Sheet>

      <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}

function DateDivider({ iso }: { iso: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-line/70 px-3 py-1 text-[11px] text-muted">{formatDateDivider(iso)}</span>
    </div>
  );
}
