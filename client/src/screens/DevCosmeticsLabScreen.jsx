import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import Board from "../components/Board";
import CursorTrail from "../components/CursorTrail";
import { GameEffects } from "../components/features/GameEffects";
import GradientBackground from "../components/ui/GradientBackground";
import { grantSuperUser } from "../api/devApi";
import { useAuth } from "../contexts/AuthContext";
import {
  COSMETIC_THEMES,
  DEFAULT_THEME_ID,
} from "../config/cosmetic-themes";
import {
  COSMETIC_FONTS,
  DEFAULT_FONT_ID,
} from "../config/cosmetic-fonts";
import {
  COSMETIC_CURSORS,
  DEFAULT_CURSOR_ID,
} from "../config/cosmetic-cursors";
import {
  COSMETIC_WIN_ANIMATIONS,
  DEFAULT_WIN_ANIMATION_ID,
} from "../config/cosmetic-win-animations";
import {
  COSMETIC_SOUNDS,
  DEFAULT_SOUND_ID,
} from "../config/cosmetic-sounds";
import { getBoardPreviewShellClasses } from "../config/cosmetics.js";

// Flipped tiles use standard green/yellow/gray; themes style empty + typed faces.
const SAMPLE_GUESSES = [
  { guess: "CRANE", pattern: ["gray", "yellow", "gray", "gray", "gray"] },
  { guess: "SLATE", pattern: ["yellow", "gray", "green", "gray", "gray"] },
];

const ACTIVE_GUESS = "WO";

function OptionCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? "border-zinc-400 bg-zinc-800 ring-1 ring-zinc-400"
          : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-600"
      }`}
    >
      <span className="text-xl" aria-hidden>
        {item.icon}
      </span>
      <span className="mt-1 block text-sm font-medium text-white">
        {item.name}
      </span>
      {item.description && (
        <span className="block text-xs text-zinc-500 line-clamp-2">
          {item.description}
        </span>
      )}
    </button>
  );
}

function SlotSection({ title, items, selectedId, onSelect, cols = 3 }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 mb-3">
        {title}
      </h2>
      <div
        className={`grid grid-cols-2 sm:grid-cols-${cols} gap-3`}
      >
        {items.map((item) => (
          <OptionCard
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default function DevCosmeticsLabScreen() {
  const { user, refreshUser } = useAuth();
  const [previewThemeId, setPreviewThemeId] = useState(DEFAULT_THEME_ID);
  const [previewFontId, setPreviewFontId] = useState(DEFAULT_FONT_ID);
  const [previewCursorId, setPreviewCursorId] = useState(DEFAULT_CURSOR_ID);
  const [previewWinId, setPreviewWinId] = useState(DEFAULT_WIN_ANIMATION_ID);
  const [previewSoundId, setPreviewSoundId] = useState(DEFAULT_SOUND_ID);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showVictoryParticles, setShowVictoryParticles] = useState(false);
  const [grantStatus, setGrantStatus] = useState(null);
  const [granting, setGranting] = useState(false);

  const previewTheme = useMemo(
    () => COSMETIC_THEMES[previewThemeId] || COSMETIC_THEMES[DEFAULT_THEME_ID],
    [previewThemeId],
  );
  const previewFont = useMemo(
    () => COSMETIC_FONTS[previewFontId] || COSMETIC_FONTS[DEFAULT_FONT_ID],
    [previewFontId],
  );
  const previewCursor = useMemo(
    () => COSMETIC_CURSORS[previewCursorId] || COSMETIC_CURSORS[DEFAULT_CURSOR_ID],
    [previewCursorId],
  );
  const previewWin = useMemo(
    () =>
      COSMETIC_WIN_ANIMATIONS[previewWinId] ||
      COSMETIC_WIN_ANIMATIONS[DEFAULT_WIN_ANIMATION_ID],
    [previewWinId],
  );

  const themes = useMemo(() => Object.values(COSMETIC_THEMES), []);
  const fonts = useMemo(() => Object.values(COSMETIC_FONTS), []);
  const cursors = useMemo(() => Object.values(COSMETIC_CURSORS), []);
  const winAnimations = useMemo(
    () => Object.values(COSMETIC_WIN_ANIMATIONS),
    [],
  );
  const sounds = useMemo(() => Object.values(COSMETIC_SOUNDS), []);

  const particlePosition = useMemo(() => {
    if (typeof window === "undefined") return { x: 400, y: 300 };
    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }, []);

  const pulseEffect = useCallback((setter) => {
    setter(true);
    window.setTimeout(() => setter(false), 120);
  }, []);

  const handleGrant = async () => {
    setGranting(true);
    setGrantStatus(null);
    try {
      await grantSuperUser();
      await refreshUser?.();
      setGrantStatus({
        type: "success",
        text: "Super user granted. Open Profile → Customise / Achievements to verify.",
      });
    } catch (err) {
      setGrantStatus({
        type: "error",
        text: err.message || "Grant failed (is ENABLE_DEV_TOOLS on and server in dev?)",
      });
    } finally {
      setGranting(false);
    }
  };

  const level = user?.progression?.level ?? user?.level;
  const unlockedCount = user?.progression?.unlockedCosmetics?.length ?? 0;

  return (
    <GradientBackground>
      <CursorTrail cursor={previewCursor} />
      <GameEffects
        showConfetti={showConfetti}
        showVictoryParticles={showVictoryParticles}
        particlePosition={particlePosition}
        enableAudio={false}
        cosmeticTheme={previewTheme}
        winAnimation={previewWin}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14 pb-24">
        <Link
          to="/settings"
          className="text-sm text-zinc-400 hover:text-white transition mb-6 inline-block"
        >
          ← Settings
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Cosmetics lab</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Local dev only — preview every cosmetics slot without grinding XP.
        </p>

        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 mb-3">
            Board preview
          </h2>
          <div
            className={cn(
              "border border-zinc-800 bg-zinc-950/40 h-[min(52vh,420px)]",
              getBoardPreviewShellClasses({
                theme: previewTheme,
                font: previewFont,
              }),
            )}
          >
            <Board
              guesses={SAMPLE_GUESSES}
              activeGuess={ACTIVE_GUESS}
              autoFit
              showGuessesLabel={false}
              boardTheme={previewTheme}
              className="w-full h-full"
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 px-1">
            Flipped tiles always use the standard Wordle green / yellow / gray
            scheme. Cosmetic themes restyle the unflipped (empty + typed) tile
            face and the board background.
          </p>
        </section>

        <SlotSection
          title="Board theme"
          items={themes}
          selectedId={previewThemeId}
          onSelect={setPreviewThemeId}
        />

        <SlotSection
          title="Font pack"
          items={fonts}
          selectedId={previewFontId}
          onSelect={setPreviewFontId}
        />

        <SlotSection
          title="Win animation"
          items={winAnimations}
          selectedId={previewWinId}
          onSelect={setPreviewWinId}
        />

        <SlotSection
          title="Cursor trail"
          items={cursors}
          selectedId={previewCursorId}
          onSelect={setPreviewCursorId}
        />

        <SlotSection
          title="Sound pack"
          items={sounds}
          selectedId={previewSoundId}
          onSelect={setPreviewSoundId}
        />

        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 mb-3">
            Effects
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => pulseEffect(setShowConfetti)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
            >
              Play win animation
            </button>
            <button
              type="button"
              onClick={() => pulseEffect(setShowVictoryParticles)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
            >
              Play victory particles
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Theme {previewTheme.name} · win animation {previewWin.name} ·
            particles {previewTheme.particles}.
          </p>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
            Account
          </h2>
          {user ? (
            <p className="text-sm text-zinc-400 px-1">
              Signed in as{" "}
              <span className="text-white">
                {user.displayName || user.name || "Player"}
              </span>
              {level != null ? (
                <>
                  {" "}
                  · level {level}
                  {unlockedCount > 0 ? ` · ${unlockedCount} unlocks` : ""}
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 px-1">Loading account…</p>
          )}
          <button
            type="button"
            disabled={granting}
            onClick={handleGrant}
            className="w-full rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-900/40 disabled:opacity-50 transition"
          >
            {granting ? "Granting…" : "Grant super user on this account"}
          </button>
          {grantStatus ? (
            <p
              className={`text-sm px-1 ${
                grantStatus.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {grantStatus.text}
            </p>
          ) : null}
          <p className="text-xs text-zinc-500 px-1">
            After granting, use the profile menu (top right) → Customise or
            Achievements to see unlocked content in the real UI.
          </p>
        </section>
      </div>
    </GradientBackground>
  );
}
