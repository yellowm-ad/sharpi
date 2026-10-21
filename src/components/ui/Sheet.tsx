"use client";

import { useEffect, useState } from "react";

/**
 * 바텀시트 확인창.
 * window.confirm 대신 쓴다 — 모바일에서 보기 좋고, 브라우저 모달이 화면을 막지 않는다.
 * 닫힐 때도 내려가는 애니메이션을 보여준 뒤 사라진다. ESC로 닫히고, 열려 있는 동안 뒤 화면은 스크롤되지 않는다.
 */
export default function Sheet({
  open, title, children, confirmLabel = "확인", cancelLabel = "취소", danger, onConfirm, onClose,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  // open 이 false 가 돼도 퇴장 애니메이션이 끝날 때까지는 그려 둔다
  const [shown, setShown] = useState(open);
  const leaving = shown && !open;
  useEffect(() => {
    if (open) setShown(true);
    else if (shown) {
      const t = setTimeout(() => setShown(false), 180);
      return () => clearTimeout(t);
    }
  }, [open, shown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open && !shown) return null;
  return (
    <div className={`fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col justify-end ${leaving ? "pointer-events-none" : ""}`}>
      <button aria-label="닫기" className={`absolute inset-0 bg-overlay ${leaving ? "animate-fade-out" : "animate-fade"}`} onClick={onClose} />
      <div role="dialog" aria-modal aria-label={title}
           className={`relative rounded-t-3xl bg-surface px-4 pt-3 pb-safe ${leaving ? "animate-sheet-out" : "animate-sheet"}`}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-body">{children}</div>
        <div className={`mt-5 mb-2 grid gap-2 ${onConfirm ? "grid-cols-2" : "grid-cols-1"}`}>
          <button onClick={onClose} className="press touch rounded-xl border border-line py-3 font-semibold text-body">
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`press touch rounded-xl py-3 font-semibold text-white ${danger ? "bg-level-3" : "bg-sherpy-600"}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
