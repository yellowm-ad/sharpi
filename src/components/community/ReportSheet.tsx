"use client";

import { useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { REPORT_LABEL, REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";

/** 메시지 신고 — 먹메이트 ReportModal 과 같은 흐름 (사유 선택 → 상세 → 접수 완료) */
export default function ReportSheet({
  target, onClose,
}: { target: { messageId: number; nickname: string } | null; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!target) return null;

  const close = () => {
    onClose();
    setReason(null); setDetail(""); setError(null); setDone(false);
  };

  const submit = async () => {
    if (!reason) return setError("신고 사유를 선택해 주세요.");
    if (reason === "OTHER" && !detail.trim()) return setError("'기타' 사유는 상세 내용을 적어 주세요.");
    setBusy(true); setError(null);
    const r = await fetch("/api/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: target.messageId, reason, detail: detail.trim() }),
    }).catch(() => null);
    setBusy(false);
    if (r?.ok) return setDone(true);
    setError((await r?.json().catch(() => null))?.error ?? "신고 접수에 실패했어요.");
  };

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col justify-end">
      <button aria-label="닫기" className="animate-fade absolute inset-0 bg-overlay" onClick={close} />
      <div role="dialog" aria-modal className="animate-sheet relative max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface px-4 pt-3 pb-safe">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2 size={40} className="text-level-0" />
            <p className="mt-3 text-lg font-bold">신고가 접수되었습니다</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              운영자가 확인한 뒤 조치합니다.<br /><b className="text-body">신고자 정보는 상대에게 공개되지 않아요.</b>
            </p>
            <button onClick={close} className="touch mt-5 mb-2 w-full rounded-xl bg-sherpy-600 py-3 font-semibold text-white">확인</button>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-lg font-bold text-level-3"><ShieldAlert size={20} />신고하기</p>
            <p className="mt-1 text-xs text-muted">신고 대상: <b className="text-ink">{target.nickname}</b> (메시지 신고)</p>
            {error && <p role="alert" className="mt-3 rounded-xl bg-level-3/10 px-3 py-2 text-xs text-level-3">{error}</p>}
            <div className="mt-3 space-y-1.5">
              {REPORT_REASONS.map((c) => (
                <button key={c} onClick={() => { setReason(c); setError(null); }}
                        className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left text-xs font-semibold ${reason === c ? "border-sherpy-600 bg-sherpy-50 text-sherpy-700" : "border-line"}`}>
                  {REPORT_LABEL[c]}
                  {reason === c && <span className="h-2 w-2 rounded-full bg-sherpy-600" />}
                </button>
              ))}
            </div>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={500}
                      placeholder={`상세 내용 ${reason === "OTHER" ? "(필수)" : "(선택)"} — 최대 500자`}
                      className="mt-3 min-h-20 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-sherpy-600" />
            <div className="mt-3 mb-2 grid grid-cols-2 gap-2">
              <button onClick={close} disabled={busy} className="touch rounded-xl border border-line py-3 font-semibold text-body">취소</button>
              <button onClick={submit} disabled={busy || !reason} className="touch rounded-xl bg-level-3 py-3 font-semibold text-white disabled:opacity-40">
                {busy ? "접수하는 중…" : "신고 접수"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
