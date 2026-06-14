import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlowButton from "../ui/GlowButton";

const ONBOARDING_KEY = "wp.onboardingDone";

const STEPS = [
  {
    title: "Daily Challenge",
    body: "Play one puzzle per day. Build a streak and share your emoji grid with friends.",
  },
  {
    title: "Pick a mode",
    body: "Duel a friend, race in Battle Royale, try AI Battle, or play Shared Duel together.",
  },
  {
    title: "Join or create",
    body: "Use a 6-letter room code, tap an open room, or share your link so others can join.",
  },
];

export function isOnboardingDone() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export default function HomeOnboarding({ active }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active || isOnboardingDone()) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setStep(0);
  }, [active]);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!visible) return null;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <p className="text-xs text-zinc-500 mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 id="onboarding-title" className="text-xl font-bold text-white">
            {current.title}
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{current.body}</p>
          <div className="mt-6 flex gap-2">
            <GlowButton type="button" className="flex-1" onClick={next}>
              {step < STEPS.length - 1 ? "Next" : "Got it"}
            </GlowButton>
            <button
              type="button"
              onClick={finish}
              className="px-4 text-sm text-zinc-500 hover:text-zinc-300"
            >
              Skip
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
