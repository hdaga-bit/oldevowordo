import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRandomWord } from "../api";
import { useIsMobile } from "../hooks/useIsMobile";
import { useSwipeGestures } from "../hooks/useSwipeGestures";
import { UnifiedPlayerCard } from "../components/player/UnifiedPlayerCard";
import Board from "../components/Board.jsx";
import { getViewportTileLimits } from "../utils/game-viewport-layout.js";
import GlowButton from "../components/ui/GlowButton";
import { getModeTheme } from "../config/mode-themes";
import { cn } from "../lib/utils";
import { GameLayout } from "../components/layout/GameLayout";
import { ModeHelpButton } from "../components/ModeHelpSheet.jsx";
import GamePhaseIndicator from "../components/GamePhaseIndicator.jsx";
import { useSharedPartnerLeave } from "../hooks/useSharedPartnerLeave";
import MicroProgressGrid from "../components/mobile/MicroProgressGrid";
import {
  equippedCosmeticsFromBundle,
  getBoardPreviewShellClasses,
  getPlayerCosmeticBundle,
} from "../config/cosmetics.js";
import {
  failedAfterMaxGuesses,
  getWinningGuessCount,
} from "../utils/guess-outcome.js";

function DuelGameScreen({
  room,
  me,
  opponent,
  currentGuess,
  shakeKey,
  showActiveError,
  letterStates,
  onKeyPress,
  onSubmitSecret,
  onRematch,
  onPartnerLeaveExit,
  submittingGuess = false,
  cosmeticTheme = null,
  fontPack = null,
  winAnimation = null,
}) {
  const mode = "duel";
  const theme = getModeTheme(mode);
  const isMobile = useIsMobile();
  const { partnerLeft, leftName, secondsLeft, exitNow, totalSeconds } =
    useSharedPartnerLeave({ room, onExit: onPartnerLeaveExit });
  
  // Local input for MY secret only
  const [secretWordInput, setSecretWordInput] = useState("");
  const [secretLocked, setSecretLocked] = useState(false);
  const [mySubmittedSecret, setMySubmittedSecret] = useState("");

  // Effects state
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCorrectParticles, setShowCorrectParticles] = useState(false);
  const [showStreakParticles, setShowStreakParticles] = useState(false);
  const [showVictoryParticles, setShowVictoryParticles] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const [showSecretReveal, setShowSecretReveal] = useState(false);
  const [guessFlipKey, setGuessFlipKey] = useState(0);
  const [lastStreak, setLastStreak] = useState(0);
  const secretErrorTimeoutRef = useRef(null);

  // Clean up secret error timeout on unmount
  useEffect(() => {
    return () => {
      if (secretErrorTimeoutRef.current) clearTimeout(secretErrorTimeoutRef.current);
    };
  }, []);

  // Mobile UX - which board to show
  const [mobileView, setMobileView] = useState("me");
  
  // Swipe gestures for mobile with right-edge detection
  const swipeHandlers = useSwipeGestures(
    () => setMobileView("opponent"), // Swipe left from right edge to see opponent
    () => setMobileView("me"), // Swipe right to see own board
    null,
    null,
    {
      requireRightEdge: true, // Only trigger left swipe from right edge
      edgeThreshold: 50, // 50px from right edge
      minSwipeDistance: 50,
    }
  );

  // Generate random word
  const [genBusy, setGenBusy] = useState(false);
  const [boardMetrics, setBoardMetrics] = useState(null);
  // Derived flags
  const isGameStarted = !!room?.started;
  const isGameEnded = !!(room?.winner || room?.duelReveal);
  const hasRequestedRematch = !!me?.rematchRequested;
  const opponentRequestedRematch = !!opponent?.rematchRequested;
  const bothRequestedRematch = hasRequestedRematch && opponentRequestedRematch;
  const canGuess = isGameStarted && !isGameEnded;
  const showSecretEntry = !isGameStarted && !isGameEnded;
  const isMobileSecretSetup = isMobile && showSecretEntry;
  const showBoardArea = isGameStarted || isGameEnded;
  const myGuesses = me?.guesses || [];
  const lastMeGuess = myGuesses.length ? myGuesses[myGuesses.length - 1] : null;
  const latestGuessWord = myGuesses.length
    ? (myGuesses[myGuesses.length - 1]?.guess || "").toUpperCase()
    : "";
  const normalizedCurrentGuess = (currentGuess || "").toUpperCase();
  const activeGuessForMe =
    canGuess &&
    normalizedCurrentGuess &&
    normalizedCurrentGuess !== latestGuessWord
      ? currentGuess
      : "";

  const revealNow = isGameEnded || !!room?.duelReveal;
  const myReady = !!me?.ready;
  const oppReady = !!opponent?.ready;
  const bothReady = myReady && oppReady;
  const canSetSecret = !myReady && !isGameEnded;
  const freshRound = !isGameStarted && !isGameEnded && !myReady && !oppReady;
  const deadline = room?.duelDeadline ?? null;
  const duelPhaseStep = isGameStarted ? 3 : !myReady ? 1 : !oppReady ? 2 : 3;
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("wp.duelSwipeHint") !== "1";
  });

  // Board metrics
  const secretTileSize = boardMetrics?.tile ?? 48;
  const secretGap = boardMetrics?.gap ?? 8;
  const diceSize = Math.max(36, Math.min(48, secretTileSize));
  const secretFontSize = Math.max(18, secretTileSize * 0.55);
  
  const getInitial = (value, fallback) => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : fallback;
  };
  const myAvatarInitial = getInitial(me?.name, "Y");
  const opponentAvatarInitial = getInitial(opponent?.name, "?");

  const handleBoardMeasure = useCallback((metrics) => {
    setBoardMetrics((prev) => {
      if (
        !prev ||
        prev.tile !== metrics.tile ||
        prev.gap !== metrics.gap ||
        prev.padding !== metrics.padding
      ) {
        return metrics;
      }
      return prev;
    });
  }, []);

  const showGameKeyboard =
    !isGameEnded &&
    !partnerLeft &&
    (canSetSecret || canGuess) &&
    (isMobile ? mobileView === "me" : true);

  const dualLimits = useMemo(
    () =>
      getViewportTileLimits({
        layout: "duel-dual",
        isMobile: false,
        isDualBoard: true,
      }),
    [],
  );

  const mobileLimits = useMemo(
    () =>
      getViewportTileLimits({
        layout: "duel-single",
        isMobile: true,
        isDualBoard: false,
      }),
    [],
  );

  const activeLimits = isMobile ? mobileLimits : dualLimits;

  const [secretErrorActive, setSecretErrorActive] = useState(false);
  const [secretErrorKey, setSecretErrorKey] = useState(0);

  // Clear all local secret-related state at the start of a fresh round
  useEffect(() => {
    if (freshRound) {
      setSecretWordInput("");
      setSecretLocked(false);
      setMySubmittedSecret("");
      setShowParticles(false);
      setShowConfetti(false);
      setShowCorrectParticles(false);
      setShowStreakParticles(false);
      setShowVictoryParticles(false);
      setLastStreak(0);
      setSecretErrorKey(0);
    }
  }, [freshRound]);

  const clamp5 = (w) =>
    (w || "").toString().toUpperCase().slice(0, 5).padEnd(5, " ");

  const myId = me?.id;
  const revealMine = clamp5(
    (myId && room?.duelReveal?.[myId]) || mySubmittedSecret
  );

  // Effects
  useEffect(() => {
    if (bothRequestedRematch) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [bothRequestedRematch]);

  // Fire the equipped win-animation (confetti) + victory particles when the
  // local user wins the duel. Skip on draw / opponent wins.
  const localWonDuel = isGameEnded && !!me?.id && room?.winner === me?.id;
  const localFailedSixGuesses =
    !!me?.done && failedAfterMaxGuesses(me?.guesses);
  useEffect(() => {
    if (!localWonDuel) return;
    if (typeof window !== "undefined") {
      setParticlePosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    setShowConfetti(true);
    setShowVictoryParticles(true);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
    const particlesTimer = setTimeout(() => setShowVictoryParticles(false), 3000);
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(particlesTimer);
    };
  }, [localWonDuel]);

  useEffect(() => {
    if (isGameEnded && revealNow) {
      const timer = setTimeout(() => {
        setShowSecretReveal(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowSecretReveal(false);
    }
  }, [isGameEnded, revealNow]);

  useEffect(() => {
    if (me?.guesses && me.guesses.length > 0) {
      setGuessFlipKey((prev) => prev + 1);
    }
  }, [me?.guesses?.length]);

  useEffect(() => {
    if (me?.guesses && me.guesses.length > 0) {
      const lastGuess = me.guesses[me.guesses.length - 1];
      if (lastGuess && lastGuess.pattern) {
        const hasCorrect = lastGuess.pattern.some((state) => state === "green");
        if (hasCorrect) {
          setParticlePosition({
            x: window.innerWidth / 4,
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
          x: window.innerWidth / 4,
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
    if (bothReady && !isGameStarted) {
      setParticlePosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setShowParticles(true);
      const t = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(t);
    }
  }, [bothReady, isGameStarted]);

  const handleSecretSubmit = async (word) => {
    if (word.length !== 5) return;
    const res = await onSubmitSecret(word);
    if (res?.ok) {
      setSecretLocked(true);
      setMySubmittedSecret(word.toUpperCase());
    } else {
      bumpSecretError();
    }
  };

  async function handleGenerateSecret() {
    if (!canSetSecret || genBusy) return;
    try {
      setGenBusy(true);
      const w = await getRandomWord();
      if (w && w.length === 5) {
        setSecretWordInput(w);
      }
    } catch (error) {
      console.error("Failed to generate random word:", error);
    } finally {
      setGenBusy(false);
    }
  }

  const handleSecretKeyPress = (key) => {
    if (!canSetSecret) return;
    if (key === "ENTER") {
      if (secretWordInput.length === 5) handleSecretSubmit(secretWordInput);
    } else if (key === "BACKSPACE") {
      setSecretWordInput((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key)) {
      setSecretWordInput((prev) => (prev.length < 5 ? prev + key : prev));
    }
  };

  const handleRematch = () => {
    onRematch();
    setMySubmittedSecret("");
  };

  useEffect(() => {
    if (!canSetSecret && !canGuess) return;

    const handler = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const up = event.key.toUpperCase();
      const isEnter = up === "ENTER";
      const isBackspace = up === "BACKSPACE";
      const isLetter = /^[A-Z]$/.test(up);
      if (!isEnter && !isBackspace && !isLetter) return;

      event.stopPropagation();

      if (canSetSecret) {
        if (isEnter) {
          if (secretWordInput.length === 5) handleSecretSubmit(secretWordInput);
          event.preventDefault();
        } else if (isBackspace) {
          setSecretWordInput((p) => p.slice(0, -1));
          event.preventDefault();
        } else if (isLetter) {
          setSecretWordInput((p) => (p.length < 5 ? p + up : p));
          event.preventDefault();
        }
        return;
      }

      if (canGuess) {
        if (isEnter) onKeyPress("ENTER");
        else if (isBackspace) onKeyPress("BACKSPACE");
        else if (isLetter) onKeyPress(up);
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [canSetSecret, canGuess, secretWordInput, onKeyPress, handleSecretSubmit]);

  const handleKeyPress = (key) => {
    if (canSetSecret) {
      handleSecretKeyPress(key);
      return;
    }
    if (canGuess) {
      onKeyPress(key);
    }
  };

  function bumpSecretError() {
    setSecretErrorActive(true);
    setSecretErrorKey((k) => k + 1);
    if (secretErrorTimeoutRef.current) clearTimeout(secretErrorTimeoutRef.current);
    secretErrorTimeoutRef.current = setTimeout(() => setSecretErrorActive(false), 300);
  }

  const mySecretWord = canSetSecret
    ? secretWordInput.padEnd(5, " ")
    : revealNow
    ? revealMine
    : "?????";
  const mySecretState = canSetSecret
    ? secretWordInput.length
      ? "typing"
      : "empty"
    : "set";

  // Opponent's active guess (if any)
  const opponentActiveGuess = opponent?.currentGuess || "";
  const opponentGuesses = opponent?.guesses || [];

  // Per-player cosmetics: each board shows its owner's equipped theme/font.
  // Fall back to profile props when room snapshot lacks equippedCosmetics.
  const localEquippedFallback = useMemo(
    () =>
      equippedCosmeticsFromBundle({
        theme: cosmeticTheme,
        font: fontPack,
        winAnimation,
      }),
    [cosmeticTheme, fontPack, winAnimation],
  );
  const myBundle = useMemo(
    () => getPlayerCosmeticBundle(me, localEquippedFallback),
    [me, localEquippedFallback],
  );
  const opponentBundle = useMemo(
    () => getPlayerCosmeticBundle(opponent),
    [opponent],
  );
  const myBoardClasses = getBoardPreviewShellClasses(myBundle);
  const opponentBoardClasses = getBoardPreviewShellClasses(opponentBundle);

  
  // Prepare players array for UnifiedPlayerCard
  const myPlayerData = {
    id: me?.id,
    name: me?.name || "You",
    wins: me?.wins,
    streak: me?.streak,
    avatar: myAvatarInitial,
    host: room?.hostId === me?.id,
    isTyping: canSetSecret && !!secretWordInput,
    hasSecret: myReady,
    disconnected: !!me?.disconnected,
    highlight: isGameEnded && room?.winner === me?.id ? "winner" : mobileView === "me" ? "active" : "none",
    size: isMobile ? "sm" : "md",
    active: mobileView === "me",
    guesses: me?.guesses || [],
    maxGuesses: 6,
    variant: isMobile ? "compact" : "detailed",
    onSelect: isMobile ? () => setMobileView("me") : undefined,
  };
  
  const opponentPlayerData = {
    id: opponent?.id,
    name: opponent?.name || "?",
    wins: opponent?.wins,
    streak: opponent?.streak,
    avatar: opponentAvatarInitial,
    host: room?.hostId === opponent?.id,
    isTyping: false,
    hasSecret: oppReady || isGameStarted,
    disconnected: !!opponent?.disconnected,
    highlight:
      isGameEnded && room?.winner === opponent?.id ? "winner" : mobileView === "opponent" ? "active" : "none",
    size: isMobile ? "sm" : "md",
    active: mobileView === "opponent",
    guesses: opponentGuesses,
    maxGuesses: 6,
    variant: isMobile ? "compact" : "detailed",
    onSelect: isMobile ? () => setMobileView("opponent") : undefined,
    // Add micro progress grid for mobile
    showMicroGrid: isMobile,
  };

  // Header title
  const headerTitle = isGameEnded
    ? bothRequestedRematch
      ? "Rematch starting..."
      : "Game ended - ready for rematch?"
    : null;

  // Status message - using visual indicators instead of text
  const statusMessage = isGameEnded
    ? bothRequestedRematch
      ? null // Both ready - no status needed, rematch will start
      : null // Visual indicators in footer handle status
    : null;

  // Rematch status for footer (visual indicator)
  const rematchStatus = isGameEnded
    ? bothRequestedRematch
      ? null // Both ready - rematch starting
      : opponentRequestedRematch
      ? "Opponent ready" // Opponent has requested
      : hasRequestedRematch
      ? "Waiting for opponent" // You requested, waiting
      : null // No requests yet
    : null;

  // Footer content (rematch button) - returns content only, not footer wrapper
  const renderFooter = () => {
    if (isGameEnded) {
      return (
        <div className={cn("text-center", isMobile ? "pb-4" : "mb-2")}>
          <GlowButton
            onClick={handleRematch}
            disabled={hasRequestedRematch}
            size="lg"
            variant={hasRequestedRematch ? "secondary" : "primary"}
            className={cn(isMobile && "w-full max-w-sm mx-auto")}
          >
            {hasRequestedRematch ? "Waiting..." : "Rematch"}
          </GlowButton>
          {rematchStatus && (
            <p className="text-[10px] text-white/40 mt-1.5">{rematchStatus}</p>
          )}
        </div>
      );
    }
    if (!canSetSecret && !canGuess) {
      if (isMobileSecretSetup) return null;
      return (
        <p className="text-center text-xs text-white/40 py-3">
          {!myReady ? "Set your secret word" : !oppReady ? "Waiting for opponent..." : "Starting..."}
        </p>
      );
    }
    return null;
  };

  const renderScaledBoard = ({
    limits,
    shellClasses,
    guesses,
    activeGuess,
    errorShakeKey = 0,
    errorActiveRow = false,
    isOwnBoard = true,
    secretWordReveal = false,
    guessFlipKey: flipKey = 0,
    onMeasure,
    boardTheme,
  }) => (
    <div className={cn("h-full min-h-0 w-full", shellClasses)}>
      <Board
        guesses={guesses}
        activeGuess={activeGuess}
        errorShakeKey={errorShakeKey}
        errorActiveRow={errorActiveRow}
        secretWord={null}
        isOwnBoard={isOwnBoard}
        autoFit
        gap={limits.boardGap}
        padding={limits.boardPadding}
        minTile={limits.minTile}
        maxTile={limits.maxTile}
        showGuessesLabel={false}
        secretWordReveal={secretWordReveal}
        guessFlipKey={flipKey}
        onMeasure={onMeasure}
        verticalAlign="center"
        horizontalAlign="center"
        boardTheme={boardTheme}
        className="h-full w-full"
      />
    </div>
  );

  const renderSecretTiles = ({
    tileSize = secretTileSize,
    gap = secretGap,
    fontSize = secretFontSize,
    randomButtonSize = diceSize,
    showRandomButton = true,
  } = {}) => {
    const rowWidth = tileSize * 5 + gap * 4;
    const includeRandomButton = canSetSecret && showRandomButton;
    const displayWord =
      mySecretState === "typing"
        ? secretWordInput.padEnd(5, " ")
        : mySecretWord || "";

    return (
      <div
        className="relative flex justify-center"
        style={{
          width: rowWidth + (includeRandomButton ? randomButtonSize + gap : 0),
          minHeight: tileSize,
          paddingRight: includeRandomButton ? randomButtonSize + gap : 0,
        }}
      >
        <div key={secretErrorKey} className="flex" style={{ gap }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const letter = displayWord[i] || "";
            const isEmpty = letter === "" || letter === " ";
            const isActive =
              mySecretState === "typing" && isEmpty && i === secretWordInput.length;
            const isReadyToSubmit =
              canSetSecret && secretWordInput.length === 5 && !isEmpty;

            let bg = "var(--tile-empty-bg)",
              color = "var(--tile-text)",
              border = "1px solid var(--tile-empty-border)";
            if (mySecretState === "set" && !isEmpty) {
              bg = "#e3f2fd";
              color = "#1976d2";
              border = "1px solid #1976d2";
            } else if (isReadyToSubmit) {
              bg = "var(--tile-typed-bg)";
              border = "2px solid #10b981";
            } else if (isActive) {
              bg = "var(--tile-typed-bg)";
              border = "1px solid #999";
            }
            if (secretErrorActive) {
              bg = "#fee2e2";
              color = "#991b1b";
              border = "1px solid #ef4444";
            }

            return (
              <div
                key={`secret-${i}`}
                className={secretErrorActive ? "tile-error" : ""}
                style={{
                  width: tileSize,
                  height: tileSize,
                  display: "grid",
                  placeItems: "center",
                  background: bg,
                  color,
                  border,
                  borderRadius: 6,
                  fontWeight: "bold",
                  fontSize,
                  textTransform: "uppercase",
                  transition: "all 0.15s ease",
                }}
              >
                {mySecretState === "typing" ? letter.trim() : letter || ""}
              </div>
            );
          })}
        </div>

        {includeRandomButton && (
          <motion.button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleGenerateSecret}
            disabled={genBusy}
            aria-label="Generate a random word"
            className="rounded-full border border-white/15 bg-white/5 grid place-items-center"
            whileTap={{ scale: 0.95 }}
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              marginTop: -(randomButtonSize / 2),
              width: randomButtonSize,
              height: randomButtonSize,
              fontSize: Math.round(randomButtonSize * 0.45),
            }}
          >
            🎲
          </motion.button>
        )}
      </div>
    );
  };

  const mobileSecretTileSize = Math.max(50, Math.min(56, secretTileSize + 4));
  const mobileSecretGap = Math.max(7, Math.min(10, secretGap));
  const mobileSecretFontSize = Math.max(22, mobileSecretTileSize * 0.58);
  const lockButtonDisabled = !canSetSecret || secretWordInput.length !== 5;
  const mobileSecretTitle = canSetSecret
    ? "Set your secret word"
    : !oppReady
    ? "Word locked"
    : "Starting duel";
  const mobileSecretSubtitle = canSetSecret
    ? "Pick the word your rival has to solve."
    : !oppReady
    ? "Waiting for your rival to lock theirs."
    : "Both words are ready.";

  const mobileSecretSetupBlock = isMobileSecretSetup ? (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-2 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/20 px-4 py-6 shadow-2xl shadow-black/20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35">
          Duel setup
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
          {mobileSecretTitle}
        </h1>
        <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-relaxed text-white/50">
          {mobileSecretSubtitle}
        </p>

        <div className="mt-7 flex justify-center">
          {renderSecretTiles({
            tileSize: mobileSecretTileSize,
            gap: mobileSecretGap,
            fontSize: mobileSecretFontSize,
            showRandomButton: false,
          })}
        </div>

        <div className="mt-7 space-y-3">
          <GlowButton
            type="button"
            size="lg"
            onClick={() => handleSecretSubmit(secretWordInput)}
            disabled={lockButtonDisabled}
            className="w-full"
          >
            {canSetSecret ? "Lock in word" : "Locked in"}
          </GlowButton>
          {canSetSecret && (
            <motion.button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleGenerateSecret}
              disabled={genBusy}
              aria-label="Generate a random word"
              className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-xl text-white/80 shadow-lg shadow-black/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              whileTap={genBusy ? {} : { scale: 0.95 }}
            >
              🎲
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  ) : null;

  const secretEntryBlock = showSecretEntry && !isMobile ? (
    <div className="flex w-full flex-shrink-0 flex-col items-center gap-1">
      {renderSecretTiles()}
      {canSetSecret && secretWordInput.length === 5 && (
        <span className="text-[10px] text-white/40">Press Enter</span>
      )}
    </div>
  ) : null;

  const renderAboveBoard = () => secretEntryBlock;

  const renderBoard = () => {
    if (isMobileSecretSetup) {
      return mobileSecretSetupBlock;
    }

    if (!showBoardArea) {
      return null;
    }

    if (!isMobile) {
      return (
        <div className="grid h-full w-full grid-cols-2 gap-3 md:gap-4">
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 text-center text-sm font-semibold text-white">
              {me?.name || "You"}
            </div>
            <div className="min-h-0 flex-1 w-full">
              {renderScaledBoard({
                limits: dualLimits,
                shellClasses: myBoardClasses,
                guesses: me?.guesses || [],
                activeGuess: activeGuessForMe,
                errorShakeKey: shakeKey,
                errorActiveRow: showActiveError,
                isOwnBoard: true,
                secretWordReveal: showSecretReveal,
                guessFlipKey,
                onMeasure: handleBoardMeasure,
                boardTheme: myBundle.theme,
              })}
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 text-center text-sm font-semibold text-white">
              {opponent?.name || "Opponent"}
            </div>
            <div className="min-h-0 flex-1 w-full">
              {renderScaledBoard({
                limits: dualLimits,
                shellClasses: opponentBoardClasses,
                guesses: opponentGuesses,
                activeGuess: opponentActiveGuess,
                isOwnBoard: false,
                boardTheme: opponentBundle.theme,
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          {mobileView === "me" ? (
            <motion.div
              key="player-board"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={cn("absolute inset-0", myBoardClasses)}
            >
              {renderScaledBoard({
                limits: mobileLimits,
                shellClasses: "h-full w-full",
                guesses: me?.guesses || [],
                activeGuess: activeGuessForMe,
                errorShakeKey: shakeKey,
                errorActiveRow: showActiveError,
                isOwnBoard: true,
                secretWordReveal: showSecretReveal,
                guessFlipKey,
                onMeasure: handleBoardMeasure,
                boardTheme: myBundle.theme,
              })}
            </motion.div>
          ) : (
            <motion.div
              key="opponent-board"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={cn("absolute inset-0", opponentBoardClasses)}
            >
              {renderScaledBoard({
                limits: mobileLimits,
                shellClasses: "h-full w-full",
                guesses: opponentGuesses,
                activeGuess: opponentActiveGuess,
                isOwnBoard: false,
                boardTheme: opponentBundle.theme,
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const statusDotClasses = {
    ready: "bg-emerald-400",
    typing: "bg-sky-400 animate-pulse",
    playing: "bg-indigo-300",
    done: "bg-emerald-300",
    waiting: "bg-zinc-500",
    offline: "bg-rose-500",
  };

  const getPlayerStatus = ({
    player,
    ready,
    guesses = [],
    activeGuess = "",
    isMe = false,
  }) => {
    if (player?.disconnected) return { label: "offline", tone: "offline" };

    if (isGameEnded) {
      if (room?.winner === player?.id) return { label: "won", tone: "done" };
      if (room?.winner) return { label: "done", tone: "waiting" };
      return { label: "draw", tone: "done" };
    }

    if (isGameStarted) {
      if (player?.done) return { label: "done", tone: "done" };
      if (activeGuess) return { label: "typing...", tone: "typing" };
      return {
        label: `guess ${Math.min((guesses?.length || 0) + 1, 6)}/6`,
        tone: "playing",
      };
    }

    if (ready) return { label: isMe ? "ready" : "ready", tone: "ready" };
    if (isMe && canSetSecret && secretWordInput.length > 0) {
      return { label: "typing...", tone: "typing" };
    }
    return { label: "choosing", tone: "waiting" };
  };

  const renderMobileStripPlayer = ({
    name,
    role,
    view,
    status,
    guesses = [],
  }) => {
    const isActive = mobileView === view;
    const showProgress = showBoardArea && guesses.length > 0;
    const canSelectBoard = showBoardArea;

    return (
      <button
        type="button"
        disabled={!canSelectBoard}
        onClick={() => {
          if (canSelectBoard) setMobileView(view);
        }}
        className={cn(
          "min-w-0 flex-1 rounded-2xl px-2.5 py-2 text-left transition-all duration-200",
          canSelectBoard ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
          isActive && showBoardArea
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-transparent",
        )}
        aria-pressed={canSelectBoard ? isActive : undefined}
        aria-disabled={!canSelectBoard}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {role}
          </span>
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              statusDotClasses[status.tone] || statusDotClasses.waiting,
            )}
            aria-hidden
          />
        </div>
        <p className="mt-0.5 truncate text-center text-sm font-semibold text-white">
          {name}
        </p>
        <p className="mt-0.5 text-center text-[10px] font-medium text-white/45">
          {status.label}
        </p>
        <AnimatePresence initial={false}>
          {showProgress && (
            <motion.div
              className="mt-2 flex justify-center"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <MicroProgressGrid
                rows={3}
                cols={5}
                size={7}
                gap={1.5}
                radius={2}
                patterns={guesses.map((guess) => guess.pattern || [])}
                showWrapper={false}
                showCellBorder={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  };

  // Custom player section rendering for duel mode
  const renderPlayerSection = () => {
    if (isMobile) {
      const myStatus = getPlayerStatus({
        player: me,
        ready: myReady || secretLocked,
        guesses: myGuesses,
        activeGuess: activeGuessForMe,
        isMe: true,
      });
      const opponentStatus = getPlayerStatus({
        player: opponent,
        ready: oppReady,
        guesses: opponentGuesses,
        activeGuess: opponentActiveGuess,
      });

      return (
        <section className="flex-shrink-0 px-1 pb-1 pt-1">
          <div
            className={cn(
              "mx-auto flex w-full max-w-md items-start gap-1 rounded-2xl border border-white/10 bg-black/20 px-1.5 py-1 shadow-lg shadow-black/10",
              showBoardArea && "py-1.5",
            )}
          >
            {renderMobileStripPlayer({
              name: me?.name || "You",
              role: "you",
              view: "me",
              status: myStatus,
              guesses: myGuesses,
            })}
            <div className="flex min-h-[3.75rem] shrink-0 items-center px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">
              vs
            </div>
            {renderMobileStripPlayer({
              name: opponent?.name || "Rival",
              role: "rival",
              view: "opponent",
              status: opponentStatus,
              guesses: opponentGuesses,
            })}
          </div>
        </section>
      );
    } else {
      // Desktop: Side-by-side cards
      return (
        <section className="flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <UnifiedPlayerCard
              {...myPlayerData}
              variant="detailed"
              size="md"
            />
            <UnifiedPlayerCard
              {...opponentPlayerData}
              variant="detailed"
              size="md"
            />
          </div>
        </section>
      );
    }
  };

  const headerExtra = isMobileSecretSetup ? null : (
    <>
      <div className="flex w-full justify-center">
        <ModeHelpButton mode="duel" autoShow />
      </div>
      {!isGameEnded && !isGameStarted && (
        <GamePhaseIndicator
          steps={["Set secret", "Wait for opponent", "Play"]}
          currentStep={duelPhaseStep}
        />
      )}
      {isMobile && isGameStarted && showSwipeHint && (
        <p className="text-[10px] text-white/50 text-center">
          Swipe from the right edge to view your opponent&apos;s board.{" "}
          <button
            type="button"
            className="underline text-zinc-300"
            onClick={() => {
              localStorage.setItem("wp.duelSwipeHint", "1");
              setShowSwipeHint(false);
            }}
          >
            Dismiss
          </button>
        </p>
      )}
    </>
  );

  return (
    <>
      <GameLayout
        mode={mode}
        isDualBoard={!isMobile && showBoardArea}
        viewportLimits={activeLimits}
        keyboardMaxWidth={activeLimits.keyboardMaxWidth}
        headerTitle={headerTitle}
        headerExtra={headerExtra}
        timerDeadline={deadline}
        timerLabel="Time Remaining:"
        showTimer={!!deadline && !isGameEnded}
        statusMessage={statusMessage}
        players={[]}
        playerLayout="grid-cols-2"
        showPlayerSection={isMobile}
        guesses={me?.guesses || []}
        activeGuess={activeGuessForMe}
        letterStates={letterStates}
        onKeyPress={handleKeyPress}
        keyboardDisabled={submittingGuess || isGameEnded || partnerLeft}
        showKeyboard={showGameKeyboard}
        effects={{
          showParticles,
          showConfetti,
          showCorrectParticles,
          showStreakParticles,
          showVictoryParticles,
          particlePosition,
          streak: me?.streak || 0,
          lastGuess: lastMeGuess?.guess,
          lastPattern: lastMeGuess?.pattern,
          hasError: showActiveError ? shakeKey : 0,
          isVictory: localWonDuel,
          winGuessCount: localWonDuel ? getWinningGuessCount(me?.guesses) : null,
          isDefeat: localFailedSixGuesses,
        }}
        renderPlayerSection={renderPlayerSection}
        renderAboveBoard={renderAboveBoard}
        renderBoard={renderBoard}
        renderFooter={renderFooter}
        cosmeticTheme={cosmeticTheme}
        fontPack={fontPack}
        winAnimation={winAnimation}
      />

      {partnerLeft ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="duel-opponent-left-title"
          aria-describedby="duel-opponent-left-desc"
        >
          <div className="w-full max-w-sm rounded-2xl border border-amber-400/30 bg-[#12121a] p-5 shadow-2xl">
            <p
              id="duel-opponent-left-title"
              className="text-base font-semibold text-white text-center"
            >
              {leftName} left
            </p>
            <p
              id="duel-opponent-left-desc"
              className="mt-2 text-sm text-white/65 text-center leading-relaxed"
            >
              This duel room is closing. You&apos;ll return home in{" "}
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

export default DuelGameScreen;

