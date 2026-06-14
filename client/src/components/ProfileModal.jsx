import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  LogIn,
  LogOut,
  Zap,
  Check,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createPortal } from "react-dom";
import PlayerAvatar from "./PlayerAvatar";
import { PRESET_AVATARS, PRESET_COLOURS } from "../config/avatars";
import { COSMETIC_THEMES, getThemeListForPicker } from "../config/cosmetic-themes";
import { getFontListForPicker } from "../config/cosmetic-fonts";
import { getCursorListForPicker } from "../config/cosmetic-cursors";
import { getWinAnimationListForPicker } from "../config/cosmetic-win-animations";
import { getSoundListForPicker } from "../config/cosmetic-sounds";
import LoadingSpinner from "./ui/LoadingSpinner";
import DonateButton from "./DonateButton";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";
import {
  buildProfileUpdatePatch,
  hasCustomiseChanges,
  readCustomiseForm,
} from "../config/cosmetic-equip";

const TABS = [
  { id: "profile", label: "Overview" },
  { id: "customise", label: "Customise" },
  { id: "achievements", label: "Achievements" },
];

const SHEET_SHELL =
  "relative flex flex-col w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-xl bg-zinc-900 border-t sm:border border-zinc-800 sm:rounded-2xl shadow-2xl outline-none overflow-hidden";

const FIELD_LABEL =
  "text-[11px] uppercase tracking-wide text-zinc-500 font-medium";

const TEXT_INPUT =
  "w-full px-3 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition";

const SURFACE_CARD = "rounded-xl border border-zinc-800 bg-zinc-900/80";

function getAchievementStyle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("win") || t.includes("champion") || t.includes("victor")) {
    return { Icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-400/20", border: "border-l-amber-400" };
  }
  if (t.includes("streak") || t.includes("flame") || t.includes("fire") || t.includes("hot")) {
    return { Icon: Flame, color: "text-orange-400", bg: "bg-orange-500/15 border-orange-400/20", border: "border-l-orange-400" };
  }
  if (t.includes("daily") || t.includes("puzzle") || t.includes("challenge")) {
    return { Icon: Target, color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", border: "border-l-zinc-500" };
  }
  return { Icon: Zap, color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", border: "border-l-zinc-500" };
}

export default function ProfileModal({ open, onOpenChange, view = "profile" }) {
  const { user, isAnonymous, login, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState(view);
  const dialogRef = useRef(null);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => { if (view) setActiveView(view); }, [view]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const stats = user?.stats || {};
  const progression = user?.progression;
  const achievements = useMemo(() => {
    if (Array.isArray(user?.progression?.achievements)) return user.progression.achievements;
    if (Array.isArray(user?.achievements)) return user.achievements;
    return [];
  }, [user?.achievements, user?.progression?.achievements]);

  if (!mounted) return null;

  const storedName =
    typeof window !== "undefined"
      ? window.localStorage?.getItem("wp.lastName")?.trim()
      : "";

  const playerName = user
    ? (user.displayName && user.displayName.trim()) ||
      storedName ||
      (isAnonymous ? "Guest Player" : "Player")
    : storedName || "Player";

  const winRate = stats.winRate || 0;

  const statCards = [
    { icon: Target, color: "text-cyan-400", label: "Games", value: stats.totalGames || 0 },
    { icon: Trophy, color: "text-amber-400", label: "Wins", value: stats.totalWins || 0 },
    { icon: TrendingUp, color: "text-emerald-400", label: "Win Rate", value: `${winRate}%` },
    { icon: Flame, color: "text-orange-400", label: "Streak", value: stats.currentStreak || 0 },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
            aria-hidden
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`${SHEET_SHELL} pointer-events-auto`}
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!user ? (
              <div className="flex flex-1 items-center justify-center px-6 py-16 text-white/70">
                <LoadingSpinner size="lg" variant="white" text="Loading profile..." />
              </div>
            ) : (
              <>
                <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-1 rounded-lg px-2 py-2 -ml-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      aria-label="Back"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      aria-label="Close profile"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <PlayerAvatar
                      avatarKey={user.profileAvatar}
                      colour={user.profileColour}
                      name={playerName}
                      size={56}
                    />
                    <div className="min-w-0 flex-1">
                      <h2
                        id="profile-modal-title"
                        className="text-lg font-bold text-white truncate"
                      >
                        {playerName}
                      </h2>
                      {progression?.level && (
                        <p className="text-xs text-zinc-400 font-medium">
                          Level {progression.level} · {progression.xp} XP
                        </p>
                      )}
                      {isAnonymous && (
                        <button
                          type="button"
                          onClick={login}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
                        >
                          Sign in to keep progress
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 mt-4">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveView(tab.id)}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          activeView === tab.id
                            ? "bg-zinc-800 text-white border border-zinc-700"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-track-app">
                  <AnimatePresence mode="wait">
                    {activeView === "achievements" ? (
                      <motion.div
                        key="achievements"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <AchievementsSection
                          achievements={achievements}
                          isAnonymous={isAnonymous}
                          login={login}
                        />
                      </motion.div>
                    ) : activeView === "customise" ? (
                      <motion.div
                        key="customise"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CustomiseSection
                        user={user}
                        playerName={playerName}
                        isActive={activeView === "customise"}
                      />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <StatsSection
                          statCards={statCards}
                          winRate={winRate}
                          stats={stats}
                          progression={progression}
                          isAnonymous={isAnonymous}
                          login={login}
                          logout={logout}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------- Customise Tab ---------- */

function SlotPicker({ label, options, selectedId, onSelect, lockedHint = "Locked — keep playing to unlock" }) {
  return (
    <div className="space-y-1.5">
      <label className={FIELD_LABEL}>{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = selectedId === opt.id;
          const locked = !opt.unlocked;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelect(opt.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                locked
                  ? "opacity-50 border-zinc-800 bg-zinc-900/40 cursor-not-allowed"
                  : selected
                  ? "border-zinc-600 bg-zinc-800"
                  : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <p className="text-xs font-semibold text-white mt-1">{opt.name}</p>
              <p className="text-[10px] text-zinc-500 line-clamp-2">{opt.description}</p>
              {locked && (
                <p className="text-[10px] text-zinc-400 mt-1">{lockedHint}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomiseSection({ user, playerName, isActive }) {
  const { updateProfile } = useAuth();
  const { showNotification } = useErrorNotification();
  const baseline = useMemo(() => readCustomiseForm(user), [user]);
  const [form, setForm] = useState(baseline);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (isActive) {
      setForm(baseline);
      setSaveError("");
    }
  }, [isActive, baseline]);

  const unlocked = user?.progression?.unlockedCosmetics || [];
  const activeSeasonal = user?.progression?.activeSeasonal || null;

  const themeOptions = getThemeListForPicker(unlocked);
  const fontOptions = getFontListForPicker(unlocked);
  const cursorOptions = getCursorListForPicker(unlocked);
  const winOptions = getWinAnimationListForPicker(unlocked);
  const soundOptions = getSoundListForPicker(unlocked);

  const hasChanges = hasCustomiseChanges(baseline, form);

  async function handleSave() {
    if (!hasChanges || saving) return;
    setSaving(true);
    setShowSaved(false);
    setSaveError("");
    try {
      const updates = buildProfileUpdatePatch(baseline, form);
      const updated = await updateProfile(updates);
      setForm(readCustomiseForm(updated));

      if (updates.displayName !== undefined) {
        const storedName = updates.displayName || form.displayName.trim();
        if (storedName) localStorage.setItem("wp.lastName", storedName);
      }

      showNotification("Profile saved", "success", { duration: 2200 });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      const message = err?.message || "Failed to save profile";
      setSaveError(message);
      showNotification(message, "error", { duration: 4000 });
      console.error("Profile save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-5 pb-8 space-y-5">
      {/* Live preview */}
      <div className="flex justify-center">
        <PlayerAvatar
          avatarKey={form.profileAvatar}
          colour={form.profileColour}
          name={form.displayName || playerName}
          size={72}
        />
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Display name</label>
        <input
          type="text"
          value={form.displayName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, displayName: e.target.value.slice(0, 20) }))
          }
          placeholder="Enter a name..."
          className={TEXT_INPUT}
        />
      </div>

      {/* Avatar picker */}
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Avatar</label>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_AVATARS.map(({ key, emoji }) => {
            const selected = form.profileAvatar === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    profileAvatar: selected ? null : key,
                  }))
                }
                className={`aspect-square rounded-lg text-xl grid place-items-center transition-all ${
                  selected
                    ? "ring-2 ring-zinc-500 bg-zinc-800 scale-110"
                    : "bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800"
                }`}
                style={selected ? { ringColor: form.profileColour || "#52525b" } : undefined}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      {activeSeasonal && (
        <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-pink-200/80 font-medium">
            Limited time
          </p>
          <p className="text-sm text-white mt-1">
            {activeSeasonal.icon} {activeSeasonal.name}
          </p>
          {activeSeasonal.description && (
            <p className="text-[11px] text-white/50 mt-0.5">
              {activeSeasonal.description}
            </p>
          )}
        </div>
      )}

      <SlotPicker
        label="Board theme"
        options={themeOptions}
        selectedId={form.boardTheme}
        onSelect={(id) => setForm((prev) => ({ ...prev, boardTheme: id }))}
        lockedHint="Locked — earn in Achievements"
      />

      <SlotPicker
        label="Font pack"
        options={fontOptions}
        selectedId={form.fontPack}
        onSelect={(id) => setForm((prev) => ({ ...prev, fontPack: id }))}
      />

      <SlotPicker
        label="Win animation"
        options={winOptions}
        selectedId={form.winAnimation}
        onSelect={(id) => setForm((prev) => ({ ...prev, winAnimation: id }))}
      />

      <SlotPicker
        label="Cursor trail"
        options={cursorOptions}
        selectedId={form.cursor}
        onSelect={(id) => setForm((prev) => ({ ...prev, cursor: id }))}
      />

      <SlotPicker
        label="Sound pack"
        options={soundOptions}
        selectedId={form.soundPack}
        onSelect={(id) => setForm((prev) => ({ ...prev, soundPack: id }))}
      />

      {/* Colour picker */}
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Accent colour</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLOURS.map((hex) => {
            const selected = form.profileColour === hex;
            return (
              <button
                key={hex}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    profileColour: selected ? null : hex,
                  }))
                }
                className="w-8 h-8 rounded-full grid place-items-center transition-transform hover:scale-110 flex-shrink-0"
                style={{
                  backgroundColor: hex,
                  boxShadow: selected ? `0 0 0 2px ${hex}, 0 0 0 4px rgba(255,255,255,0.3)` : "none",
                }}
              >
                {selected && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </div>

      {saveError ? (
        <p className="text-sm text-red-400 text-center" role="alert">
          {saveError}
        </p>
      ) : null}

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--btn-success-bg)] ${
          hasChanges && !saving
            ? "btn-success"
            : "border border-zinc-800 bg-zinc-900/80 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {saving && <LoadingSpinner size="sm" variant="white" />}
        {showSaved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

/* ---------- Stats Tab ---------- */

function StatsSection({ statCards, winRate, stats, progression, isAnonymous, login, logout }) {
  const xpPercent = progression?.xpProgress?.percent ?? 0;

  return (
    <div className="px-4 sm:px-6 py-5 pb-8 space-y-4">
      {progression && (
        <div className={`${SURFACE_CARD} p-4 space-y-2`}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white font-semibold">Level {progression.level}</span>
            <span className="text-zinc-400 text-xs">{progression.xp} XP</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--tile-correct-bg)]"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
            />
          </div>
          {progression.xpToNextLevel != null && (
            <p className="text-[11px] text-zinc-500">
              {progression.xpProgress?.current ?? 0} / {progression.xpProgress?.needed ?? 0} XP to next level
            </p>
          )}
        </div>
      )}

      {isAnonymous && (
        <p className="text-xs text-center text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
          You&apos;re earning XP and rewards. Sign in to save them across devices.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ icon: Icon, color, label, value }) => (
          <div
            key={label}
            className={`${SURFACE_CARD} p-4 min-h-[80px] flex flex-col justify-between`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Win rate</span>
          <span className="text-emerald-400 font-semibold">{winRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--tile-correct-bg)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(winRate, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {stats.longestStreak > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">Best streak</span>
          </div>
          <span className="text-xl font-bold text-amber-400">{stats.longestStreak}</span>
        </div>
      )}

      {isAnonymous ? (
        <>
          <motion.button
            onClick={login}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 btn-success font-semibold rounded-xl transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Save Progress
          </motion.button>
          <p className="text-xs text-center text-white/45 leading-relaxed">
            By signing in you agree to our{" "}
            <a href="/terms" className="underline hover:text-white/70">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-white/70">
              Privacy Policy
            </a>
            .
          </p>
        </>
      ) : (
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 btn-danger font-medium rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      )}

      <DonateButton variant="button" label="Support the project" className="mt-3" />
    </div>
  );
}

/* ---------- Achievements Tab ---------- */

function AchievementsSection({ achievements, isAnonymous, login }) {
  if (achievements.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-10 text-center space-y-3">
        <div className="text-5xl select-none">🏆</div>
        <p className="text-base font-semibold text-white/70">Loading achievements...</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="px-4 sm:px-6 py-5 pb-8 space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{unlockedCount} / {achievements.length} unlocked</span>
      </div>

      {isAnonymous && (
        <button
          type="button"
          onClick={login}
          className={`w-full text-left px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 transition ${SURFACE_CARD}`}
        >
          Sign in to save achievements and themes across devices.
        </button>
      )}

      {achievements.map((achievement, idx) => {
        const title = achievement?.title || `Achievement ${idx + 1}`;
        const description = achievement?.description || "";
        const unlocked = Boolean(achievement?.unlocked);
        const rewardTheme = achievement?.rewardThemeId
          ? COSMETIC_THEMES[achievement.rewardThemeId]
          : null;
        const rewardLabel = (() => {
          const rewards = achievement?.rewardUnlocks || [];
          if (rewards.length === 0) return null;
          if (rewards.length === 1) {
            return rewardTheme
              ? `${rewardTheme.name} theme`
              : rewards[0].replace(":", " · ");
          }
          return `${rewards.length} rewards`;
        })();
        const progress = achievement?.progress;
        const { Icon, color, bg, border } = getAchievementStyle(title);

        return (
          <motion.div
            key={achievement.id || idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`border border-l-2 rounded-xl p-4 ${
              unlocked
                ? `bg-zinc-900/80 border-zinc-800 ${border}`
                : "bg-zinc-900/40 border-zinc-800 border-l-zinc-700 opacity-80"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  unlocked ? `${bg} ${border}` : "bg-zinc-900/80 border-zinc-800"
                }`}
              >
                {unlocked ? (
                  <Icon className={`w-5 h-5 ${color}`} />
                ) : (
                  <span className="text-lg opacity-60">{rewardTheme?.icon || "🔒"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                {description && (
                  <p className="text-xs text-white/50 mt-0.5">{description}</p>
                )}
                {rewardLabel && (
                  <p className="text-[11px] text-zinc-300/90 mt-1">
                    Reward: {rewardLabel}
                  </p>
                )}
                {!unlocked && progress?.target != null && (
                  <p className="text-[11px] text-white/35 mt-1">
                    Progress: {progress.current} / {progress.target}
                  </p>
                )}
                {unlocked && achievement.unlockedAt && (
                  <p className="text-[11px] text-white/30 mt-1">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
