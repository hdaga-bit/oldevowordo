import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const TOAST_MS = 5000;

function buildToastItems(detail) {
  const items = [];
  let toastId = 0;
  const nextId = (prefix) => `${prefix}-${Date.now()}-${toastId++}`;

  for (const ach of detail.achievements || []) {
    const theme = ach.rewards?.find((r) => r.type === "theme")?.theme;
    items.push({
      id: nextId(`ach-${ach.achievementId || ach.title}`),
      kind: "achievement",
      title: ach.title || "Achievement unlocked",
      description: ach.description || "",
      theme,
    });
  }

  const levelRewards = detail.levelRewards || detail.xp?.levelRewards || [];
  for (const reward of levelRewards) {
    if (reward.type === "theme" && reward.theme) {
      items.push({
        id: nextId(`level-theme-${reward.themeId || reward.level}`),
        kind: "level",
        title: `Level ${reward.level} reward`,
        description: `Unlocked ${reward.theme.name} theme`,
        theme: reward.theme,
      });
    }
  }

  if (detail.xp?.leveledUp && levelRewards.length === 0) {
    items.push({
      id: nextId(`levelup-${detail.xp.level}`),
      kind: "levelup",
      title: `Level ${detail.xp.level}!`,
      description: `+${detail.xp.xpGained ?? 0} XP`,
      theme: null,
    });
  }

  return items;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function AchievementUnlockToast() {
  const { isAnonymous } = useAuth();
  const [queue, setQueue] = useState([]);
  const dismissTimerRef = useRef(null);
  const titleId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const settingsReduced =
    typeof document !== "undefined" &&
    document.documentElement.dataset.reducedMotion === "true";

  const dismissCurrent = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const detail = event.detail;
      if (!detail) return;

      const items = buildToastItems(detail);
      if (items.length > 0) {
        setQueue((prev) => [...prev, ...items]);
      }
    };

    window.addEventListener("wp:progression-unlock", handler);
    return () => window.removeEventListener("wp:progression-unlock", handler);
  }, []);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    if (!current) return undefined;

    dismissTimerRef.current = window.setTimeout(() => {
      dismissCurrent();
    }, TOAST_MS);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [current?.id, dismissCurrent]);

  if (typeof document === "undefined" || !current) return null;

  const animate = !(reducedMotion || settingsReduced);

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={current.id}
        initial={animate ? { opacity: 0, y: 24, scale: 0.95 } : false}
        animate={animate ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1 }}
        exit={animate ? { opacity: 0, y: 12, scale: 0.98 } : { opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed left-1/2 z-[210] w-[min(92vw,380px)] -translate-x-1/2 pointer-events-auto"
        style={{
          bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
        }}
      >
        <motion.div
          role="status"
          aria-live="polite"
          aria-labelledby={titleId}
          className="rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden>
              {current.theme?.icon || "🏆"}
            </span>
            <div className="flex-1 min-w-0">
              <p id={titleId} className="text-sm font-semibold text-white">
                {current.title}
              </p>
              {current.description ? (
                <p className="text-xs text-white/60 mt-0.5">{current.description}</p>
              ) : null}
              {isAnonymous && (
                <p className="text-xs text-zinc-300 mt-2">
                  Sign in to keep this forever on your account.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={dismissCurrent}
              className="text-white/40 hover:text-white p-1 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -m-2"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
