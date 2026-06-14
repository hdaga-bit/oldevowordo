import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import WordleHowToPlayDemo from "./WordleHowToPlayDemo.jsx";
import HowToPlayModal from "./HowToPlayModal.jsx";
import { useHowToPlayDismiss } from "../hooks/useHowToPlayDismiss.js";

export default function HomeHowToPlaySection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const autoShownRef = useRef(false);
  const { ready, dismissed, dismiss } = useHowToPlayDismiss("home");

  useEffect(() => {
    const t = window.setTimeout(() => setPreviewActive(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || dismissed || autoShownRef.current) return;
    autoShownRef.current = true;
    const t = window.setTimeout(() => setModalOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [ready, dismissed]);

  return (
    <>
      <motion.section
        className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:p-8 overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">How to Play</h2>
            <p className="text-sm text-white/60 mt-1">
              Learn the tiles — then pick a mode below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-500 shrink-0"
          >
            <HelpCircle className="w-4 h-4" aria-hidden />
            Full guide
          </button>
        </div>

        <WordleHowToPlayDemo animate={previewActive} compact className="max-w-sm mx-auto" />
      </motion.section>

      <HowToPlayModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="How to Play"
        subtitle="Master the tiles, then challenge friends."
        modeSteps={[]}
        onDismissForever={dismiss}
        dismissLabel="Got it, let's play"
      />
    </>
  );
}
