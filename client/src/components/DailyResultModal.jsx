import React, { useEffect, useRef, memo, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Share2 } from "lucide-react";
import {
  buildDailyShareText,
  copyDailyShareText,
  shareDailyResult,
} from "../utils/dailyShare";

function WordTiles({ word = "" }) {
  const letters = (word || "").toUpperCase().padEnd(5).slice(0, 5).split("");
  return (
    <div className="flex justify-center gap-1.5" aria-hidden>
      {letters.map((ch, i) => (
        <div
          key={i}
          className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-md border border-[#5a9a54] bg-[#6aaa64] text-sm sm:text-base font-bold text-white"
        >
          {ch.trim()}
        </div>
      ))}
    </div>
  );
}

function DailyResultModal({
  open,
  onOpenChange,
  won = false,
  correctWord = "",
  guesses = null,
  guessEntries = [],
  streak = 0,
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [shareStatus, setShareStatus] = useState("");

  const shareText = useMemo(
    () =>
      buildDailyShareText(guessEntries, {
        won,
        guessCount: guesses ?? guessEntries.length,
        streak,
      }),
    [guessEntries, won, guesses, streak],
  );

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      dialogRef.current?.querySelector("[data-autofocus]")?.focus();
    }, 50);

    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setShareStatus("");
      return;
    }
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.className = "sr-only";
    liveRegion.textContent = won
      ? `Solved in ${guesses ?? "?"} guesses.`
      : `Game over. The word was ${correctWord || "unknown"}.`;
    document.body.appendChild(liveRegion);
    return () => liveRegion.remove();
  }, [open, won, guesses, correctWord]);

  if (!open || typeof document === "undefined") return null;

  const onOverlayClick = (e) => {
    if (e.target === overlayRef.current) onOpenChange?.(false);
  };

  const title = won ? "Solved" : "Better luck tomorrow";
  const titleId = won ? "daily-win-title" : "daily-loss-title";

  const handleCopy = async () => {
    const ok = await copyDailyShareText(shareText);
    setShareStatus(ok ? "Copied!" : "Could not copy");
    setTimeout(() => setShareStatus(""), 2500);
  };

  const handleShare = async () => {
    const result = await shareDailyResult(shareText);
    if (result.method === "cancelled") return;
    if (result.ok) {
      setShareStatus(result.method === "share" ? "Shared!" : "Copied!");
    } else {
      setShareStatus("Share unavailable");
    }
    setTimeout(() => setShareStatus(""), 2500);
  };

  return createPortal(
    <div
      ref={overlayRef}
      role="presentation"
      onMouseDown={onOverlayClick}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-[min(100%,360px)] max-h-[min(90dvh,520px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1b26] shadow-xl outline-none"
      >
        <div className="p-4 sm:p-5">
          <h2
            id={titleId}
            className="text-center text-lg font-semibold tracking-tight text-white"
          >
            {title}
          </h2>

          <div className="mt-4 space-y-4 text-center">
            {won ? (
              guesses != null && (
                <p className="text-sm text-white/55">
                  {guesses}/6 {guesses === 1 ? "guess" : "guesses"}
                </p>
              )
            ) : (
              <>
                <p className="text-sm text-white/55">The word was</p>
                <WordTiles word={correctWord} />
              </>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className={cn(
                "flex-1 h-11 rounded-xl border-white/15 bg-white/5 text-white",
                "hover:bg-white/10",
              )}
            >
              <Copy className="w-4 h-4 mr-2 shrink-0" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShare}
              className={cn(
                "flex-1 h-11 rounded-xl border-white/15 bg-white/5 text-white",
                "hover:bg-white/10",
              )}
            >
              <Share2 className="w-4 h-4 mr-2 shrink-0" />
              Share
            </Button>
          </div>
          {shareStatus ? (
            <p className="mt-2 text-center text-xs text-emerald-400/90" role="status">
              {shareStatus}
            </p>
          ) : null}

          <Button
            data-autofocus
            type="button"
            onClick={() => onOpenChange?.(false)}
            className={cn(
              "mt-4 h-11 w-full rounded-xl bg-white/10 text-sm font-medium text-white",
              "hover:bg-white/15 active:scale-[0.98]",
            )}
          >
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default memo(DailyResultModal);
