import React, { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import HowToPlayModal from "./HowToPlayModal.jsx";
import { MODE_HELP } from "../config/mode-help.js";
import { useHowToPlayDismiss } from "../hooks/useHowToPlayDismiss.js";

/** Button + Wordle-style how-to-play modal for a game mode. */
export function ModeHelpButton({ mode, className = "", autoShow = false }) {
  const [open, setOpen] = useState(false);
  const autoShownRef = useRef(false);
  const { ready, dismissed, dismiss } = useHowToPlayDismiss(mode);
  const help = MODE_HELP[mode];
  if (!help) return null;

  useEffect(() => {
    if (!autoShow || !ready || dismissed || autoShownRef.current) return;
    autoShownRef.current = true;
    setOpen(true);
  }, [autoShow, ready, dismissed]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${className}`}
        aria-label={`How ${help.title} works`}
      >
        <HelpCircle className="w-4 h-4" aria-hidden />
        <span className="hidden sm:inline">How to play</span>
      </button>
      <HowToPlayModal
        open={open}
        onOpenChange={setOpen}
        title="How to Play"
        subtitle={help.subtitle}
        modeSteps={help.steps}
        modeTitle={help.title}
        onDismissForever={dismiss}
      />
    </>
  );
}

/** Controlled modal (for screens that manage open state themselves). */
export default function ModeHelpSheet({ mode, open, onOpenChange, autoShow = false }) {
  const autoShownRef = useRef(false);
  const { ready, dismissed, dismiss } = useHowToPlayDismiss(mode);
  const help = MODE_HELP[mode];

  useEffect(() => {
    if (!autoShow || !ready || dismissed || autoShownRef.current || !help) return;
    autoShownRef.current = true;
    onOpenChange?.(true);
  }, [autoShow, ready, dismissed, help, onOpenChange]);

  if (!help) return null;

  return (
    <HowToPlayModal
      open={open}
      onOpenChange={onOpenChange}
      title="How to Play"
      subtitle={help.subtitle}
      modeSteps={help.steps}
      modeTitle={help.title}
      onDismissForever={dismiss}
    />
  );
}
