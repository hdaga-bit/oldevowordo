import React, { useMemo } from "react";
import { GameLayout } from "../components/layout/GameLayout";
import { LoadingOverlay } from "../components/ui/LoadingSpinner";
import { cn } from "../lib/utils";
import { ModeHelpButton } from "../components/ModeHelpSheet.jsx";
import {
  failedAfterMaxGuesses,
  getWinningGuessCount,
} from "../utils/guess-outcome.js";
import { getViewportTileLimits } from "../utils/game-viewport-layout.js";
import { useIsMobile } from "../hooks/useIsMobile";

function GuessProgress({ used, max }) {
  return (
    <div
      className="flex items-center gap-1"
      role="progressbar"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${used} of ${max} guesses used`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 w-4 rounded-full transition-colors sm:w-5",
            i < used ? "bg-emerald-400" : "bg-white/15"
          )}
        />
      ))}
    </div>
  );
}

export default function DailyGameScreen({
  challenge,
  guesses,
  currentGuess,
  letterStates,
  onKeyPress,
  loading = false,
  gameOver = false,
  shakeKey = 0,
  showActiveError = false,
  notificationMessage = "",
  guessFlipKey = 0,
  boardTheme = null,
  fontPack = null,
  winAnimation = null,
}) {
  const mode = "daily";
  const isMobile = useIsMobile();
  const limits = useMemo(
    () => getViewportTileLimits({ layout: "daily", isMobile }),
    [isMobile],
  );

  const maxGuesses = challenge?.maxGuesses || 6;
  const guessCount = guesses?.length ?? 0;
  const won =
    gameOver &&
    guesses?.length > 0 &&
    guesses[guesses.length - 1]?.pattern?.every((s) => s === "green");

  const lastEntry = useMemo(() => {
    if (!guesses?.length) return null;
    return guesses[guesses.length - 1];
  }, [guesses, guessFlipKey]);

  const renderHeader = () => (
    <>
      {loading && !challenge && (
        <LoadingOverlay text="Loading…" scoped />
      )}
      <div className="flex items-center justify-between px-3 pt-1 pb-0.5">
        {!gameOver ? (
          <GuessProgress used={guessCount} max={maxGuesses} />
        ) : (
          <span className="h-1 w-4" aria-hidden />
        )}
        <ModeHelpButton
          mode="daily"
          autoShow
          className="!px-1.5 !py-1 shrink-0"
        />
      </div>
      {notificationMessage && (
        <p className="sr-only" aria-live="polite">
          {notificationMessage}
        </p>
      )}
    </>
  );

  return (
    <GameLayout
      mode={mode}
      viewportLimits={limits}
      keyboardMaxWidth={limits.keyboardMaxWidth}
      players={[]}
      showPlayerSection={false}
      guesses={guesses}
      activeGuess={gameOver ? "" : currentGuess}
      boardProps={{
        secretWord: null,
        secretWordState: "empty",
        errorShakeKey: shakeKey,
        errorActiveRow: showActiveError,
        guessFlipKey,
      }}
      letterStates={letterStates}
      onKeyPress={onKeyPress}
      keyboardDisabled={gameOver || loading}
      showKeyboard={true}
      renderHeader={renderHeader}
      cosmeticTheme={boardTheme}
      fontPack={fontPack}
      winAnimation={winAnimation}
      effects={{
        showConfetti: won,
        showParticles: false,
        lastGuess: lastEntry?.guess,
        lastPattern: lastEntry?.pattern,
        hasError: showActiveError ? shakeKey : 0,
        isVictory: gameOver && won,
        winGuessCount: won ? getWinningGuessCount(guesses) : null,
        isDefeat: gameOver && !won && failedAfterMaxGuesses(guesses, maxGuesses),
      }}
    />
  );
}
