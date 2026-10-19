"use client";

/**
 * 바텀시트 확인창.
 * window.confirm 대신 쓴다 — 모바일에서 보기 좋고, 브라우저 모달이 화면을 막지 않는다.
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col justify-end">
      <button aria-label="닫기" className="animate-fade absolute inset-0 bg-overlay" onClick={onClose} />
      <div role="dialog" aria-modal className="animate-sheet relative rounded-t-3xl bg-surface px-4 pt-3 pb-safe">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-body">{children}</div>
        <div className="mt-5 mb-2 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="touch rounded-xl border border-line py-3 font-semibold text-body">
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`touch rounded-xl py-3 font-semibold text-white ${danger ? "bg-level-3" : "bg-sherpy-600"}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
