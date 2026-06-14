import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Leave",
  cancelLabel = "Stay",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = performance.now();
    }
  }, [open]);

  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    // Ignore the tail of the click that opened the dialog (same pointer event).
    if (performance.now() - openedAtRef.current < 400) return;
    onCancel?.();
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex={-1}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-[#1a1a2e] p-6 shadow-2xl outline-none"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-white mb-2">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="text-sm text-white/70 mb-6">
          {message}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl btn-danger py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}