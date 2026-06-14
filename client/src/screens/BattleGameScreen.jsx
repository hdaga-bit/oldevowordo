import React, { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { GameLayout } from "../components/layout/GameLayout";
import GameResults from "../components/GameResults";
import Board from "../components/Board";
import BattleProgressStrip from "../components/BattleProgressStrip";
import { getViewportTileLimits } from "../utils/game-viewport-layout.js";
import GlowButton from "../components/ui/GlowButton";
import { getModeTheme } from "../config/mode-themes";
import { logger } from "../utils/logger";
import { ModeHelpButton } from "../components/ModeHelpSheet.jsx";
import { formatBattleRulesSummary } from "../utils/battleRules.js";
import { useSharedPartnerLeave } from "../hooks/useSharedPartnerLeave";
import {
  failedAfterMaxGuesses,
  getWinningGuessCount,
} from "../utils/guess-outcome.js";

function BattleGameScreen({
  room,
  players,
  allPlayers,
  otherPlayers,
  me,
  isHost,
  currentGuess,
  shakeKey,
  showActiveError,
  letterStates,
  canGuessBattle,
  onKeyPress,
  deadline,
  countdownEndsAt,
  onClaimHost,
  onHostLeaveExit,
  pendingStart = false,
  onStartAiRound,
  submittingGuess = false,
  cosmeticTheme = null,
  fontPack = null,
  winAnimation = null,
}) {
  const hostLeftActive = Boolean(room?.battle?.hostLeft?.closingAt);
  const { secondsLeft: hostLeftSecondsRemaining } = useSharedPartnerLeave({
    room,
    onExit: onHostLeaveExit,
  });
  const isMobile = useIsMobile();
  const limits = useMemo(
    () => getViewportTileLimits({ layout: "battle", isMobile }),
    [isMobile],
  );
  const isAiMode = room?.mode === "battle_ai";
  const mode = isAiMode ? "battle_ai" : "battle";
  const theme = getModeTheme(mode);
  
  const [guessFlipKey, setGuessFlipKey] = useState(0);
  const [showCorrectParticles, setShowCorrectParticles] = useState(false);
  const [showStreakParticles, setShowStreakParticles] = useState(false);
  const [showVictoryParticles, setShowVictoryParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const [lastStreak, setLastStreak] = useState(0);
  const [claimingHost, setClaimingHost] = useState(false);
  const [startingRound, setStartingRound] = useState(false);
  const [startError, setStartError] = useState("");
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(null);
  const [countdownRemaining, setCountdownRemaining] = useState(null);

  const aiHostMode = room?.battle?.aiHost?.mode || "auto";
  const aiHostClaimedBy = room?.battle?.aiHost?.claimedBy || null;
  const hostPlayer = allPlayers.find((player) => player.id === room?.hostId);
  
  const formatDuration = (ms) => {
    if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const roundActive = !!room?.battle?.started;
  const lastWord = room?.battle?.lastRevealedWord ?? null;
  const roundFinished = !roundActive && !!lastWord;
  const playerGuesses = me?.guesses || [];
  const lastMeGuess = playerGuesses.length
    ? playerGuesses[playerGuesses.length - 1]
    : null;
  const latestBattleGuess = playerGuesses.length
    ? (playerGuesses[playerGuesses.length - 1]?.guess || "").toUpperCase()
    : "";
  const normalizedBattleGuess = (currentGuess || "").toUpperCase();
  const activeGuessForBattle =
    normalizedBattleGuess && normalizedBattleGuess !== latestBattleGuess
      ? currentGuess
      : "";

  const correctWord = useMemo(
    () => (roundFinished ? lastWord : null),
    [roundFinished, lastWord]
  );

  useEffect(() => {
    if (!deadline) {
      setRoundTimeRemaining(null);
      return;
    }
    const target = Number(deadline);
    if (!Number.isFinite(target)) {
      setRoundTimeRemaining(null);
      return;
    }
    const update = () => {
      setRoundTimeRemaining(Math.max(target - Date.now(), 0));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  useEffect(() => {
    if (!countdownEndsAt || !isAiMode) {
      setCountdownRemaining(null);
      return;
    }
    const target = Number(countdownEndsAt);
    if (!Number.isFinite(target)) {
      setCountdownRemaining(null);
      return;
    }
    const update = () => {
      setCountdownRemaining(Math.max(target - Date.now(), 0));
    };
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [countdownEndsAt, isAiMode]);

  useEffect(() => {
    if (me?.guesses && me.guesses.length > 0) {
      const timer = setTimeout(() => {
        setGuessFlipKey((prev) => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [me?.guesses?.length]);

  useEffect(() => {
    if (!pendingStart) {
      setStartError("");
    }
  }, [pendingStart]);

  const handleClaimHost = async () => {
    if (!onClaimHost || claimingHost) return;
    try {
      setClaimingHost(true);
      await onClaimHost();
    } finally {
      setClaimingHost(false);
    }
  };

  const hostLeftBanner = hostLeftActive ? (
    <div className="px-3 pt-2">
      <div className="mx-auto max-w-md rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
        <p className="text-sm font-semibold">Host left the room</p>
        <p className="mt-0.5 text-xs text-amber-200/80">
          Closing in {hostLeftSecondsRemaining}s. Claim host to keep playing.
        </p>
        {onClaimHost && (
          <button
            type="button"
            onClick={handleClaimHost}
            disabled={claimingHost}
            className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-xl btn-success px-4 text-sm font-semibold disabled:opacity-50"
          >
            {claimingHost ? "Claiming…" : "Claim host"}
          </button>
        )}
      </div>
    </div>
  ) : null;

  const handleStartRound = async () => {
    if (!onStartAiRound || startingRound) return;
    try {
      setStartingRound(true);
      const result = await onStartAiRound();
      if (result?.error) {
        logger.warn("[ai battle start]", result.error);
        setStartError(result.error || "Unable to start the game");
      } else {
        setStartError("");
      }
    } finally {
      setStartingRound(false);
    }
  };

  useEffect(() => {
    if (me?.guesses && me.guesses.length > 0) {
      const lastGuess = me.guesses[me.guesses.length - 1];
      if (lastGuess && lastGuess.pattern) {
        const hasCorrect = lastGuess.pattern.some((state) => state === "green");
        if (hasCorrect) {
          setParticlePosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 100,
          });
          setShowCorrectParticles(true);
          const timer = setTimeout(() => setShowCorrectParticles(false), 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [me?.guesses?.length]);

  useEffect(() => {
    if (me?.streak && me.streak > lastStreak && me.streak > 0) {
      setLastStreak(me.streak);
      const shouldCelebrate =
        me.streak === 3 ||
        me.streak === 5 ||
        me.streak === 10 ||
        me.streak === 15 ||
        me.streak === 20 ||
        (me.streak > 20 && me.streak % 5 === 0);

      if (shouldCelebrate) {
        setParticlePosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2 - 150,
        });
        setShowStreakParticles(true);
        const duration = me.streak >= 10 ? 3000 : 2000;
        const timer = setTimeout(() => setShowStreakParticles(false), duration);
        return () => clearTimeout(timer);
      }
    }
  }, [me?.streak, lastStreak]);

  useEffect(() => {
    if (roundFinished && room?.battle?.winner === me?.id) {
      if (typeof window !== "undefined") {
        setParticlePosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
      setShowVictoryParticles(true);
      setShowConfetti(true);
      const particlesTimer = setTimeout(() => setShowVictoryParticles(false), 3000);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      return () => {
        clearTimeout(particlesTimer);
        clearTimeout(confettiTimer);
      };
    }
  }, [roundFinished, room?.battle?.winner, me?.id]);

  const localFailedSixGuesses =
    roundFinished &&
    room?.battle?.winner !== me?.id &&
    failedAfterMaxGuesses(me?.guesses);

  // Reset confetti when a new battle round kicks off.
  useEffect(() => {
    if (roundActive) {
      setShowConfetti(false);
      setShowVictoryParticles(false);
    }
  }, [roundActive]);

  const roundTimerLabel =
    roundTimeRemaining !== null ? formatDuration(roundTimeRemaining) : null;
  const rulesSummary =
    !isAiMode && !roundActive
      ? formatBattleRulesSummary(room?.battle)
      : null;
  const countdownLabel =
    isAiMode && countdownRemaining !== null
      ? formatDuration(countdownRemaining)
      : null;
  const showStartButton =
    isAiMode &&
    aiHostMode === "auto" &&
    !roundActive &&
    typeof onStartAiRound === "function" &&
    (pendingStart || !countdownLabel);
  const startButtonLabel =
    pendingStart || !countdownLabel ? "Start Game" : "Start Now";
  const showClaimHostButton =
    isAiMode && aiHostMode === "auto" && !roundActive && Boolean(onClaimHost);
  const hostedByName =
    hostPlayer?.name ||
    (aiHostMode === "player" && aiHostClaimedBy && aiHostClaimedBy !== me?.id
      ? "Host"
      : null);
  const bannerTitle = isAiMode ? "AI Battle" : "Battle Royale";
  const helpMode = isAiMode ? "battle_ai" : "battle";
  const getWinnerName = () => {
    if (!room?.battle?.winner) return "Unknown";
    const playerArray = Array.isArray(players)
      ? players
      : Object.values(players || {});
    const winner = playerArray.find((p) => p.id === room.battle.winner);
    return winner?.name || "Unknown";
  };

  // Compact status header — single row, no redundant title (nav already shows mode)
  const renderHeader = () => {
    // Pick one status indicator to show, in priority order
    const showLive = roundActive && !roundFinished;
    const showCountdown = !roundActive && !pendingStart && !!countdownLabel;
    const showWinner = Boolean(room?.battle?.winner);
    const showWaiting = !showLive && !showCountdown && !showWinner;

    // Timer color based on remaining ms
    const timerColor =
      roundTimeRemaining !== null && roundTimeRemaining <= 10000
        ? "text-red-300 bg-red-500/10"
        : roundTimeRemaining !== null && roundTimeRemaining <= 20000
        ? "text-amber-300 bg-amber-500/10"
        : "text-emerald-300 bg-emerald-500/10";

    return (
      <div className={isMobile ? "px-4 pt-1.5 pb-1" : "px-4 pt-2 pb-2"}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap min-h-[28px]">
          {/* Live indicator + timer */}
          {showLive && (
            <span className="inline-flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-medium">
                Live
              </span>
              {roundTimerLabel && (
                <span
                  className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${timerColor}`}
                >
                  {roundTimerLabel}
                </span>
              )}
            </span>
          )}

          {/* Countdown to next round */}
          {showCountdown && (
            <span className="inline-flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400/60 font-medium">
                Next
              </span>
              <span className="font-mono text-xs font-bold tabular-nums text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                {countdownLabel}
              </span>
            </span>
          )}

          {/* Winner */}
          {showWinner && (
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400/80 font-semibold select-none">
              ✓ {getWinnerName()}
            </span>
          )}

          {/* Idle / waiting */}
          {showWaiting && (
            <span className="inline-flex flex-col items-center gap-0.5 select-none">
              {standbyMessage && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/20 font-medium">
                  Waiting
                </span>
              )}
              {rulesSummary && (
                <span className="text-[11px] normal-case tracking-normal text-white/45 font-medium">
                  {rulesSummary}
                </span>
              )}
              {!isAiMode && room?.battle?.locked && (
                <span className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                  Closed
                </span>
              )}
            </span>
          )}

          {/* Action buttons */}
          {showStartButton && (
            <GlowButton
              onClick={handleStartRound}
              size="sm"
              disabled={startingRound}
              className="!py-1 !min-h-[30px] !text-xs !px-3"
            >
              {startingRound ? "Starting…" : startButtonLabel}
            </GlowButton>
          )}
          {startError && (
            <span className="text-[10px] text-red-300">{startError}</span>
          )}
          {showClaimHostButton && (
            <GlowButton
              onClick={handleClaimHost}
              size="sm"
              disabled={claimingHost}
              className="!py-1 !min-h-[30px] !text-xs !px-3"
            >
              {claimingHost ? "Claiming…" : "Claim Host"}
            </GlowButton>
          )}
        </div>
      </div>
    );
  };

  // Strip of opponent progress cards shown above the board
  const hasOtherPlayers = roundActive && otherPlayers && otherPlayers.length > 0;

  const renderBoard = () => {
    if (!roundActive) {
      return (
        <GameResults
          room={room}
          players={allPlayers}
          correctWord={correctWord}
        />
      );
    }

    return (
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateRows: hasOtherPlayers ? "auto 1fr" : "1fr",
        }}
      >
        {hasOtherPlayers ? (
          <div className="w-full shrink-0">
            <BattleProgressStrip players={otherPlayers} isMobile={isMobile} />
          </div>
        ) : null}
        <div className="min-h-0 w-full">
          <Board
            guesses={me?.guesses || []}
            activeGuess={activeGuessForBattle}
            errorShakeKey={shakeKey}
            errorActiveRow={showActiveError}
            guessFlipKey={guessFlipKey}
            autoFit
            gap={limits.boardGap}
            padding={limits.boardPadding}
            minTile={limits.minTile}
            maxTile={limits.maxTile}
            className="h-full w-full"
          />
        </div>
      </div>
    );
  };

  const standbyMessage = (() => {
    if (roundActive) return null;
    if (isAiMode) {
      if (pendingStart) return "Waiting for host";
      if (countdownLabel) {
        return `Next round in ${countdownLabel}`;
      }
      return roundFinished
        ? "Game ended — AI host is preparing the next round..."
        : "Waiting for AI host";
    }
    return roundFinished
      ? "Game ended — waiting for host to start the next round..."
      : "Waiting for host";
  })();

  const headerExtra = (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ModeHelpButton mode={helpMode} autoShow />
        {isAiMode && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-200 bg-amber-500/10">
            AI Host
          </span>
        )}
      </div>
      {hostLeftBanner}
    </>
  );

  return (
    <GameLayout
      mode={mode}
      viewportLimits={limits}
      keyboardMaxWidth={limits.keyboardMaxWidth}
      boardZoneFillMode={roundActive ? "fit" : "scroll"}
      headerTitle={bannerTitle}
      headerExtra={headerExtra}
      timerDeadline={roundActive && deadline ? deadline : null}
      timerCountdownEndsAt={isAiMode && !roundActive ? countdownEndsAt : null}
      timerLabel={roundActive ? "Round ends in" : "Next round in"}
      showTimer={
        (isAiMode && (roundActive || !pendingStart)) ||
        (!isAiMode && roundActive && Boolean(deadline))
      }
      statusMessage={standbyMessage}
      players={[]} // No player cards in battle mode (shown in right rail)
      showPlayerSection={false}
      guesses={me?.guesses || []}
      activeGuess={activeGuessForBattle}
      boardProps={{
        errorShakeKey: shakeKey,
        errorActiveRow: showActiveError,
        guessFlipKey,
        gap: limits.boardGap,
        padding: limits.boardPadding,
        minTile: limits.minTile,
        maxTile: limits.maxTile,
      }}
      letterStates={letterStates}
      onKeyPress={onKeyPress}
      keyboardDisabled={!canGuessBattle || submittingGuess}
      showKeyboard={true}
      effects={{
        showCorrectParticles,
        showStreakParticles,
        showVictoryParticles,
        showConfetti,
        particlePosition,
        streak: me?.streak || 0,
        lastGuess: lastMeGuess?.guess,
        lastPattern: lastMeGuess?.pattern,
        hasError: showActiveError ? shakeKey : 0,
        isVictory: roundFinished && room?.battle?.winner === me?.id,
        winGuessCount:
          roundFinished && room?.battle?.winner === me?.id
            ? getWinningGuessCount(me?.guesses)
            : null,
        isDefeat: localFailedSixGuesses,
      }}
      renderHeader={renderHeader}
      renderBoard={renderBoard}
      cosmeticTheme={cosmeticTheme}
      fontPack={fontPack}
      winAnimation={winAnimation}
    />
  );
}

export default BattleGameScreen;

