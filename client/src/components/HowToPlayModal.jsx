import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import WordleHowToPlayDemo from "./WordleHowToPlayDemo.jsx";

export default function HowToPlayModal({
  open,
  onOpenChange,
  title = "How to Play",
  subtitle,
  modeSteps = [],
  modeTitle,
  onDismissForever,
  dismissLabel = "Got it",
}) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const closeModal = useCallback(() => {
    onDismissForever?.();
    onOpenChange?.(false);
  }, [onDismissForever, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, closeModal]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#12121f] p-6 shadow-2xl outline-none scrollbar-track-panel"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="how-to-play-title" className="text-xl font-bold text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-white/60 mt-1">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-zinc-500 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <WordleHowToPlayDemo animate={open} />

        {modeSteps.length > 0 ? (
          <div>
            <div className="border-t border-white/10 my-5" />
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              {modeTitle ? `${modeTitle} rules` : "Mode rules"}
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-white/80">
              {modeSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          {onDismissForever ? (
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-xl btn-success py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--btn-success-bg)]"
            >
              {dismissLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={closeModal}
            className="flex-1 rounded-xl border border-white/20 text-white/80 py-2.5 text-sm hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
