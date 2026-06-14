import { useEffect, useMemo, useRef, useState } from "react";
import { GameLayout } from "../components/layout/GameLayout";
import { getViewportTileLimits } from "../utils/game-viewport-layout.js";
import Board from "../components/Board";
import { useIsMobile } from "../hooks/useIsMobile";
import PlayerAvatar from "../components/PlayerAvatar";
import { IconStatusBadge } from "../components/ui/IconStatusBadge";
import { ModeHelpButton } from "../components/ModeHelpSheet.jsx";
import { logger } from "../utils/logger";
import { cn } from "../lib/utils";
import { useSharedPartnerLeave } from "../hooks/useSharedPartnerLeave";
import GlowButton from "../components/ui/GlowButton";
import {
  failedAfterMaxGuesses,
  getWinningGuessCount,
} from "../utils/guess-outcome.js";

function TurnPill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "text-white/70 border-white/15 bg-white/5",
    active: "text-emerald-200 border-emerald-400/40 bg-emerald-500/15",
    wait: "text-amber-200 border-amber-400/35 bg-amber-500/10",
    win: "text-zinc-200 border-zinc-500 bg-zinc-800",
  };
  return (
    <p
      className={cn(
        "text-[11px] font-semibold px-3 py-1 rounded-full border truncate max-w-[min(100%,220px)]",
        tones[tone] || tones.neutral,
      )}
      aria-live="polite"
    >
      {children}
    </p>
  );
}

function SharedPlayerChip({ name, avatarKey, colour, isActive, isYou }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-2.5 py-2 min-w-0 transition-all duration-200",
        isActive
          ? "border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
          : "border-white/10 bg-white/5 opacity-80",
      )}
      aria-current={isActive ? "true" : undefined}
    >
      <PlayerAvatar
        avatarKey={avatarKey}
        colour={colour}
        name={name}
        size={32}
        className={cn(
          isActive && "ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#0b0b10]",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-white/45">
          {isYou ? "You" : "Partner"}
        </p>
        <p className="text-sm font-semibold text-white truncate">{name}</p>
      </div>
      {isActive ? (
        <span
          className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export default function SharedDuelGameScreen({
  room,
  me,
  currentGuess,
  shakeKey = 0,
  showActiveError = false,
  onKeyPress,
  letterStates,
  onStartShared,
  onRematch,
  onPartnerLeaveExit,
  submittingGuess = false,
  cosmeticTheme = null,
  fontPack = null,
  winAnimation = null,
}) {
  const mode = "shared";
  const isMobile = useIsMobile();
  const limits = useMemo(
    () => getViewportTileLimits({ layout: "shared", isMobile }),
    [isMobile],
  );
  const { partnerLeft, leftName, secondsLeft, exitNow, totalSeconds } =
    useSharedPartnerLeave({ room, onExit: onPartnerLeaveExit });
  const opponentEntry = Object.entries(room.players || {}).find(
    ([id]) => id !== me?.id,
  );
  const opponent = opponentEntry
    ? { id: opponentEntry[0], ...opponentEntry[1] }
    : null;

  const canGuess = room.shared?.started && !room.shared?.winner;
  const myTurn = room.shared?.turn === me?.id;
  const isHost = room?.hostId === me?.id;
  const [starting, setStarting] = useState(false);
  const [guessFlipKey, setGuessFlipKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVictoryParticles, setShowVictoryParticles] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const prevGuessCountRef = useRef(0);

  // Shared duel is co-op: both players celebrate when the word is solved.
  const sharedSolved = !!(
    room.shared?.winner && room.shared.winner !== "draw"
  );
  const sharedFailedSixGuesses =
    room.shared?.winner === "draw" &&
    failedAfterMaxGuesses(room.shared?.guesses);
  useEffect(() => {
    if (!sharedSolved) {
      setShowConfetti(false);
      setShowVictoryParticles(false);
      return;
    }
    if (typeof window !== "undefined") {
      setParticlePosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    setShowConfetti(true);
    setShowVictoryParticles(true);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
    const particlesTimer = setTimeout(
      () => setShowVictoryParticles(false),
      3000,
    );
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(particlesTimer);
    };
  }, [sharedSolved]);

  const playerCount = Object.keys(room?.players || {}).length;
  const canStart = isHost && playerCount >= 2 && !room.shared?.started;

  useEffect(() => {
    const count = room.shared?.guesses?.length ?? 0;
    if (count > prevGuessCountRef.current) {
      setGuessFlipKey((k) => k + 1);
    }
    prevGuessCountRef.current = count;
  }, [room.shared?.guesses?.length]);

  const sharedGuesses = room.shared?.guesses || [];
  const lastSharedGuess = sharedGuesses.length
    ? sharedGuesses[sharedGuesses.length - 1]
    : null;
  const latestGuessWord = sharedGuesses.length
    ? (sharedGuesses[sharedGuesses.length - 1].guess || "").toUpperCase()
    : "";
  const normalizedCurrentGuess = (currentGuess || "").toUpperCase();
  const activeGuessForBoard =
    canGuess &&
    myTurn &&
    normalizedCurrentGuess &&
    normalizedCurrentGuess !== latestGuessWord
      ? currentGuess
      : "";

  const secretWord =
    !room.shared?.started && room.shared?.lastRevealedWord
      ? room.shared.lastRevealedWord
      : null;
  const secretWordState =
    !room.shared?.started && room.shared?.lastRevealedWord ? "set" : "empty";

  const handleKey = (k) => {
    if (!canGuess || !myTurn) return;
    onKeyPress(k);
  };

  // Keyboard only while actively guessing on your turn (not in lobby / partner turn / post-game)
  const showKeyboard = Boolean(
    !partnerLeft &&
      room.shared?.started &&
      canGuess &&
      myTurn &&
      !room.shared?.winner,
  );

  const turnPill = useMemo(() => {
    if (room.shared?.winner) {
      if (room.shared.winner === "draw") {
        return <TurnPill tone="win">Draw</TurnPill>;
      }
      const won = room.shared.winner === me?.id;
      return (
        <TurnPill tone="win">
          {won ? "You won!" : `${opponent?.name || "Partner"} won`}
        </TurnPill>
      );
    }
    if (!room.shared?.started) {
      if (playerCount < 2) {
        return <TurnPill tone="wait">Waiting for partner</TurnPill>;
      }
      if (!isHost) {
        return <TurnPill tone="wait">Host will start</TurnPill>;
      }
      return <TurnPill tone="wait">Ready to start</TurnPill>;
    }
    if (myTurn) {
      return <TurnPill tone="active">Your turn — type & enter</TurnPill>;
    }
    return (
      <TurnPill tone="neutral">
        {`${opponent?.name?.split(" ")[0] || "Partner"}'s turn`}
      </TurnPill>
    );
  }, [
    room.shared?.winner,
    room.shared?.started,
    playerCount,
    isHost,
    myTurn,
    me?.id,
    opponent?.name,
  ]);

  const renderHeader = () => (
    <header className="px-3 pt-2 pb-1 shrink-0">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-purple-300/90 shrink-0">
          Shared
        </span>
        <div className="flex min-w-0 flex-1 justify-center">{turnPill}</div>
        <ModeHelpButton mode="shared" autoShow className="shrink-0 !px-1.5" />
      </div>
    </header>
  );

  const renderPlayerSection = () => (
    <section className="shrink-0 px-3 py-1">
      <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
        <SharedPlayerChip
          name={me?.name || "You"}
          avatarKey={me?.profileAvatar}
          colour={me?.profileColour}
          isYou
          isActive={Boolean(room.shared?.started && !room.shared?.winner && myTurn)}
        />
        <SharedPlayerChip
          name={opponent?.name || "Partner"}
          avatarKey={opponent?.profileAvatar}
          colour={opponent?.profileColour}
          isActive={Boolean(
            room.shared?.started && !room.shared?.winner && canGuess && !myTurn,
          )}
        />
      </div>
    </section>
  );

  const renderBoard = () => (
    <section
      className={cn(
        "relative h-full w-full",
        myTurn &&
          canGuess &&
          "before:pointer-events-none before:absolute before:inset-2 before:rounded-3xl before:border before-emerald-400/20",
      )}
    >
      <Board
        guesses={sharedGuesses}
        activeGuess={activeGuessForBoard}
        isOwnBoard={true}
        secretWord={secretWord}
        secretWordState={secretWordState}
        autoFit
        gap={limits.boardGap}
        padding={limits.boardPadding}
        minTile={limits.minTile}
        maxTile={limits.maxTile}
        players={room?.players || {}}
        currentPlayerId={me?.id}
        guessFlipKey={guessFlipKey}
        className="h-full w-full"
      />
    </section>
  );

  const renderFooter = () => {
    if (room.shared?.winner) {
      return (
        <div className="mx-auto w-full max-w-md px-1">
          <GlowButton onClick={onRematch} size="lg" className="w-full">
            Play again
          </GlowButton>
        </div>
      );
    }

    if (!room.shared?.started) {
      if (isHost) {
        return (
          <div className="mx-auto w-full max-w-md space-y-2 px-1">
            <GlowButton
              onClick={async () => {
                if (starting || !canStart) return;
                try {
                  setStarting(true);
                  const result = await onStartShared();
                  if (result?.error) {
                    logger.error("Start shared error:", result.error);
                  }
                } finally {
                  setStarting(false);
                }
              }}
              disabled={starting || !canStart}
              size="lg"
              className="w-full"
            >
              {starting ? "Starting…" : "Start round"}
            </GlowButton>
            {playerCount < 2 ? (
              <div className="flex items-center justify-center gap-2 text-xs text-white/55">
                <IconStatusBadge type="waitingForPlayer" size="sm" animated />
                <span>Share room link to invite partner</span>
              </div>
            ) : null}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center gap-2 text-sm text-white/55">
          <IconStatusBadge type="waiting" size="sm" animated />
          <span>Waiting for host to start</span>
        </div>
      );
    }

    return null;
  };

  const hasFooterActions = Boolean(
    !partnerLeft && (room.shared?.winner || !room.shared?.started),
  );

  return (
    <>
    <GameLayout
      mode={mode}
      viewportLimits={limits}
      keyboardMaxWidth={limits.keyboardMaxWidth}
      renderHeader={renderHeader}
      renderPlayerSection={renderPlayerSection}
      renderBoard={renderBoard}
      renderFooter={hasFooterActions ? renderFooter : undefined}
      showPlayerSection={true}
      statusMessage={null}
      statusBadges={[]}
      letterStates={letterStates}
      onKeyPress={handleKey}
      keyboardDisabled={submittingGuess}
      showKeyboard={showKeyboard}
      footerClassName={cn("!pt-0", !showKeyboard && hasFooterActions && "!pb-0")}
      cosmeticTheme={cosmeticTheme}
      fontPack={fontPack}
      winAnimation={winAnimation}
      effects={{
        showConfetti,
        showVictoryParticles,
        particlePosition,
        lastGuess: lastSharedGuess?.guess,
        lastPattern: lastSharedGuess?.pattern,
        hasError: showActiveError ? shakeKey : 0,
        isVictory: sharedSolved && room.shared?.winner === me?.id,
        winGuessCount:
          sharedSolved && room.shared?.winner === me?.id
            ? getWinningGuessCount(me?.guesses)
            : null,
        isDefeat: sharedFailedSixGuesses,
      }}
    />

    {partnerLeft ? (
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="shared-partner-left-title"
        aria-describedby="shared-partner-left-desc"
      >
        <div className="w-full max-w-sm rounded-2xl border border-amber-400/30 bg-[#12121a] p-5 shadow-2xl">
          <p
            id="shared-partner-left-title"
            className="text-base font-semibold text-white text-center"
          >
            {leftName} left
          </p>
          <p
            id="shared-partner-left-desc"
            className="mt-2 text-sm text-white/65 text-center leading-relaxed"
          >
            This shared duel is ending. You&apos;ll return home in{" "}
            <span className="font-semibold text-amber-200 tabular-nums">
              {secondsLeft}
            </span>
            s.
          </p>
          <div
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-linear"
              style={{
                width: `${Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100)}%`,
              }}
            />
          </div>
          <GlowButton
            type="button"
            variant="danger"
            onClick={exitNow}
            size="lg"
            className="mt-5 w-full"
          >
            Leave now
          </GlowButton>
        </div>
      </div>
    ) : null}
    </>
  );
}
