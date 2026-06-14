import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "./socket";
import { useGameContext } from "./contexts/GameContext";
import { useGameState } from "@/hooks/useGameState";
import { useAppNavigation, modeToUrlSegment } from "./hooks/useAppNavigation.js";
import { useSocketConnection } from "./hooks/useSocketConnection.js";
import { useGameActions } from "./hooks/useGameActions.js";
import { useRoomManagement } from "./hooks/useRoomManagement.js";
import { useDailyGame } from "./hooks/useDailyGame.js";
import { useDuelGame } from "./hooks/useDuelGame.js";
import { useBattleGame } from "./hooks/useBattleGame.js";
import { useBattleKicked } from "./hooks/useBattleKicked.js";
import GameRouter from "./components/GameRouter.jsx";
import NavHeader from "./components/ui/NavHeader.jsx";
import Backdrop from "./components/Backdrop.jsx";
import { RefreshCw } from "lucide-react";
import { logger } from "./utils/logger";
import { sanitizeRoomId, sanitizePlayerName } from "./utils/sanitize";
import { useGameMessageNotify } from "./hooks/useGameMessageNotify.js";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { useAudio } from "./hooks/useAudio";
import { getEquippedBundle } from "./config/cosmetics.js";
import GameAdRails from "./components/ads/GameAdRails.jsx";
import CursorTrail from "./components/CursorTrail.jsx";
import GradientBackground from "./components/ui/GradientBackground.jsx";

const LS_LAST_SOCKET = "wp.lastSocketId";

const JOIN_ERROR_COPY = {
  "Room is locked": "This room is not accepting new players",
  "Battle already in progress": "This room is already in a round",
};

function friendlyJoinError(error) {
  if (!error) return "Failed to join room";
  return JOIN_ERROR_COPY[error] || error;
}

export default function App() {
  const { user } = useAuth();
  const cosmeticsBundle = useMemo(() => getEquippedBundle(user), [user]);
  const equippedTheme = cosmeticsBundle.theme;
  const equippedFont = cosmeticsBundle.font;
  const equippedCursor = cosmeticsBundle.cursor;
  const equippedWinAnimation = cosmeticsBundle.winAnimation;
  const equippedSound = cosmeticsBundle.sound;

  const { setSoundPack } = useAudio();
  useEffect(() => {
    if (equippedSound) setSoundPack(equippedSound);
  }, [equippedSound, setSoundPack]);

  const {
    name,
    setName,
    roomId,
    setRoomId,
    mode,
    setMode,
    room,
    setRoom,
    currentGuess,
    setCurrentGuess,
    showVictory,
    setShowVictory,
    msg,
    setMsg,
    shakeKey,
    setShakeKey,
    showActiveError,
    setShowActiveError,
  } = useGameContext();

  useGameMessageNotify(msg, setMsg);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [joiningPending, setJoiningPending] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(() => {
    if (typeof sessionStorage === "undefined") return null;
    const rid = sessionStorage.getItem("wp.pendingJoinRoom");
    if (!rid || rid.length !== 6) return null;
    return {
      roomId: rid.toUpperCase(),
      mode: sessionStorage.getItem("wp.pendingJoinMode") || "duel",
    };
  });

  const clearPendingJoin = useCallback(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("wp.pendingJoinRoom");
      sessionStorage.removeItem("wp.pendingJoinMode");
    }
    setPendingJoin(null);
  }, []);

  const {
    screen,
    urlMode,
    urlRoomId,
    navigateToGame,
    navigateHome,
    navigateDaily,
  } = useAppNavigation();

  const wasHost =
    (typeof window !== "undefined" &&
      localStorage.getItem("wp.lastSocketId.wasHost") === "true") ||
    false;

  const leavingRef = useRef(false);

  // Room state from socket (ignored while exiting so a late broadcast cannot trap the player in-game)
  useEffect(() => {
    const onState = (data) => {
      if (leavingRef.current) return;
      setRoom(data);
    };
    socket.on("roomState", onState);
    return () => socket.off("roomState", onState);
  }, [setRoom]);

  // Game state derived from room
  const {
    me,
    players,
    allPlayers,
    otherPlayers,
    opponent,
    isHost,
    canGuessDuel,
    canGuessBattle,
    canGuessShared,
    letterStates,
    shouldShowVictory,
  } = useGameState(room);

  // Duel/shared: drop stale in-progress letters when the round resets (rematch, lobby)
  useEffect(() => {
    if (room?.mode === "duel") {
      if (!room?.started && (me?.guesses?.length ?? 0) === 0) {
        setCurrentGuess("");
      }
      return;
    }
    if (room?.mode === "shared") {
      const shared = room?.shared;
      if (!shared?.started && (shared?.guesses?.length ?? 0) === 0) {
        setCurrentGuess("");
      }
    }
  }, [
    room?.mode,
    room?.started,
    room?.shared?.started,
    room?.shared?.guesses?.length,
    me?.guesses?.length,
    setCurrentGuess,
  ]);

  // Socket connection management
  const onGameResumed = useCallback(
    (resumedRoomId) => {
      const savedMode = localStorage.getItem("wp.lastMode") || "duel";
      navigateToGame(savedMode, resumedRoomId);
    },
    [navigateToGame],
  );
  const { canRejoin, doRejoin, savedRoomId, reconnecting, reconnectAttempt } = useSocketConnection(
    room,
    onGameResumed,
  );

  // Game actions by mode
  const actionsByMode = useGameActions();
  const duelActions = actionsByMode.duel;
  const sharedActions = actionsByMode.shared;
  const battleActions = actionsByMode.battle;
  const aiBattleActions = actionsByMode["battle_ai"];
  const dailyActions = actionsByMode.daily;

  // Room management
  const { createRoom, joinRoom, persistSession, goHome } = useRoomManagement();

  const dailyGame = useDailyGame(screen, dailyActions, persistSession, goHome, navigateDaily);

  const leaveGame = useCallback(
    ({ resetDaily = false } = {}) => {
      leavingRef.current = true;
      const activeRoomId = room?.id || roomId || urlRoomId;
      goHome(activeRoomId || null, { clearRoom: true });
      setRoom(null);
      setRoomId("");
      setCurrentGuess("");
      setShowVictory(false);
      setLeaveConfirmOpen(false);
      if (resetDaily) {
        dailyGame.resetDailyProgress?.();
        setMode("daily");
      }
      navigateHome();
      window.setTimeout(() => {
        leavingRef.current = false;
      }, 3000);
    },
    [
      room?.id,
      roomId,
      urlRoomId,
      goHome,
      setRoom,
      setRoomId,
      setCurrentGuess,
      setShowVictory,
      navigateHome,
      dailyGame,
      setMode,
    ],
  );

  const handlePartnerLeaveExit = useCallback(() => {
    leaveGame();
  }, [leaveGame]);

  const handleKicked = useCallback(() => {
    setRoom(null);
    setRoomId("");
    setCurrentGuess("");
    setShowVictory(false);
  }, [setRoom, setRoomId, setCurrentGuess, setShowVictory]);

  useBattleKicked({
    roomId: room?.id,
    goHome,
    setMsg,
    navigateHome,
    onKicked: handleKicked,
  });

  const handleDuelLeave = useCallback(() => {
    leaveGame();
  }, [leaveGame]);

  // Duel game hook
  const { handleDuelKey, submittingGuess: submittingDuelGuess } = useDuelGame(
    room,
    canGuessDuel,
    canGuessShared,
    duelActions,
    sharedActions
  );

  // Battle game hook
  const { handleBattleKey, submittingGuess: submittingBattleGuess } = useBattleGame(
    room,
    canGuessBattle,
    isHost,
    wasHost,
    battleActions,
    aiBattleActions
  );

  // Track the last game result that opened the victory modal.
  // This prevents the modal from re-opening when roomState is re-broadcast
  // after a player clicks "Play Again" (server hasn't reset the room yet).
  const lastDuelVictoryKeyRef = useRef(null);
  const lastSharedVictoryKeyRef = useRef(null);

  // Show victory for duel mode - separate effect to reduce dependencies
  useEffect(() => {
    if (!room || room.mode !== "duel") return;
    const shouldShow = Boolean(room.winner) || Boolean(room.duelReveal);

    if (!shouldShow) {
      // Game was reset — clear the key so the next result opens the modal
      lastDuelVictoryKeyRef.current = null;
      setShowVictory(false);
      return;
    }

    // Build a stable key for this specific game result
    const revealKeys = Object.keys(room.duelReveal || {}).sort().join(",");
    const victoryKey = `${room.winner || "none"}-${revealKeys}`;

    // Only open the modal for a new result; ignore re-broadcasts of the same result
    if (victoryKey !== lastDuelVictoryKeyRef.current) {
      lastDuelVictoryKeyRef.current = victoryKey;
      setShowVictory(true);
    }
  }, [room?.mode, room?.winner, room?.duelReveal, setShowVictory]);

  // Show victory for shared mode - separate effect to reduce dependencies
  useEffect(() => {
    if (!room || room.mode !== "shared") return;
    const shouldShow =
      Boolean(room.shared?.winner) || Boolean(room.shared?.lastRevealedWord);

    if (!shouldShow) {
      lastSharedVictoryKeyRef.current = null;
      setShowVictory(false);
      return;
    }

    const victoryKey = `${room.shared?.winner || "none"}-${room.shared?.lastRevealedWord || ""}`;

    if (victoryKey !== lastSharedVictoryKeyRef.current) {
      lastSharedVictoryKeyRef.current = victoryKey;
      setShowVictory(true);
    }
  }, [room?.mode, room?.shared?.winner, room?.shared?.lastRevealedWord, setShowVictory]);

  // Show victory modal when a battle round ends
  useEffect(() => {
    if (!room || (room.mode !== "battle" && room.mode !== "battle_ai")) return;
    const roundEnded =
      room.battle?.winner != null ||
      room.battle?.reveal ||
      (room.battle?.lastRevealedWord && !room.battle?.started);
    setShowVictory(Boolean(roundEnded));
  }, [
    room?.mode,
    room?.battle?.winner,
    room?.battle?.reveal,
    room?.battle?.started,
    room?.battle?.lastRevealedWord,
    setShowVictory,
  ]);

  // Transient toast support
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(t);
  }, [msg, setMsg]);

  // Navigation guard: warn before leaving an active game
  useEffect(() => {
    const isActiveGame =
      screen === "game" &&
      room?.id &&
      !showVictory &&
      (room.mode === "battle" || room.mode === "battle_ai"
        ? room.battle?.started && !room.battle?.winner && !room.battle?.reveal
        : room.mode === "duel"
        ? room.started && !room.winner && !room.duelReveal
        : room.mode === "shared"
        ? room.shared?.started && !room.shared?.winner
        : false);

    if (!isActiveGame) return;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [screen, room?.id, room?.mode, room?.started, room?.winner, room?.duelReveal, room?.battle, room?.shared, showVictory]);

  // Dynamic document.title
  useEffect(() => {
    const modeLabels = {
      duel: "Duel Mode",
      battle: "Battle Royale",
      battle_ai: "AI Battle",
      shared: "Shared Duel",
    };
    let title = "EvoWordo";
    if (screen === "daily") {
      title = "Daily | EvoWordo";
    } else if (screen === "game" && room?.mode) {
      const label = modeLabels[room.mode] || "Game";
      const rid = room.id ? ` · ${room.id.toUpperCase()}` : "";
      title = `${label}${rid} | EvoWordo`;
    }
    document.title = title;
  }, [screen, room?.mode, room?.id]);

  // Sync URL to match active room (handles reconnects, mode mismatches; duel shares link before start)
  useEffect(() => {
    if (!room?.id || !room?.mode) return;

    const expectedSeg = modeToUrlSegment(room.mode);
    const alreadyCorrect =
      urlMode === expectedSeg &&
      urlRoomId?.toUpperCase() === room.id.toUpperCase();

    if (!alreadyCorrect) {
      navigateToGame(room.mode, room.id, { replace: true });
    }
    setCurrentGuess("");
  }, [room?.id, room?.mode, urlMode, urlRoomId, navigateToGame, setCurrentGuess]);

  // Deep link: auto-join when URL has a room but we're not connected
  const deepLinkAttemptedRef = useRef(null);
  useEffect(() => {
    if (screen !== "game" || !urlRoomId || room?.id) return;
    if (deepLinkAttemptedRef.current === urlRoomId) return;

    deepLinkAttemptedRef.current = urlRoomId;
    const savedName = name || "";

    if (!savedName) {
      setRoomId(urlRoomId);
      const joinMode = urlMode || "duel";
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("wp.pendingJoinRoom", urlRoomId);
        sessionStorage.setItem("wp.pendingJoinMode", joinMode);
      }
      setPendingJoin({ roomId: urlRoomId.toUpperCase(), mode: joinMode });
      navigateHome();
      return;
    }

    joinRoom(savedName, urlRoomId).then((result) => {
      if (result?.error) {
        setMsg(friendlyJoinError(result.error) || "Room not found");
        navigateHome();
      } else {
        clearPendingJoin();
      }
    });
  }, [screen, urlRoomId, room?.id, name, joinRoom, setMsg, navigateHome, urlMode, clearPendingJoin]);

  const handlePendingJoin = useCallback(
    async (code) => {
      const playerName = sanitizePlayerName(name);
      if (!playerName) {
        setMsg("Enter your name to join");
        return;
      }
      setJoiningPending(true);
      try {
        const result = await joinRoom(playerName, code);
        if (result?.error) {
          setMsg(friendlyJoinError(result.error));
        } else {
          clearPendingJoin();
        }
      } finally {
        setJoiningPending(false);
      }
    },
    [name, joinRoom, setMsg, clearPendingJoin],
  );

  // Back button cleanup: if user navigates to home via browser back while in a room, leave the room
  const prevScreenRef = useRef(screen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (screen === "home" && (prev === "game" || prev === "daily") && room?.id) {
      leaveGame({ resetDaily: prev === "daily" });
    }
  }, [screen, room?.id, leaveGame]);

  // Track wasHost for battle mode
  useEffect(() => {
    if (room?.mode === "battle" || room?.mode === "battle_ai") {
      localStorage.setItem("wp.lastSocketId.wasHost", String(isHost));
    }
  }, [room?.mode, isHost]);

  const viewingHost =
    (room?.mode === "battle" || room?.mode === "battle_ai") &&
    (isHost || (wasHost && me?.id === room?.hostId));

  // Room creation and joining
  const create = async (targetMode = mode) => {
    const effectiveMode = targetMode || mode || "duel";
    if (effectiveMode !== mode) {
      setMode(effectiveMode);
    }
    const sanitizedName = sanitizePlayerName(name);
    if (!sanitizedName) {
      setMsg("Please enter a valid name");
      return;
    }
    const result = await createRoom(sanitizedName, effectiveMode);
    if (result?.success) {
      setRoomId(sanitizeRoomId(result.roomId));
      setCurrentGuess("");
      setShowVictory(false);
      navigateToGame(effectiveMode, result.roomId);
    } else {
      setMsg(result?.error || "Failed to create room");
    }
  };

  const join = async (targetRoomId = roomId, preferredMode) => {
    const sanitizedRoomId = sanitizeRoomId(targetRoomId || "");
    const sanitizedName = sanitizePlayerName(name);

    if (!sanitizedRoomId) {
      setMsg("Please enter a valid room code");
      return;
    }
    if (!sanitizedName) {
      setMsg("Please enter a valid name");
      return;
    }

    const result = await joinRoom(sanitizedName, sanitizedRoomId);
    if (result?.error) {
      setMsg(friendlyJoinError(result.error));
    } else {
      const joinedMode = result?.mode || preferredMode;
      if (joinedMode && joinedMode !== mode) {
        setMode(joinedMode);
      }
      setRoomId(sanitizedRoomId);
      setCurrentGuess("");
      setShowVictory(false);
      navigateToGame(joinedMode || mode || "duel", sanitizedRoomId);
    }
  };

  const rejoinNavControl = canRejoin ? (
    <button
      type="button"
      onClick={doRejoin}
      className="inline-flex items-center gap-2 h-9 px-3 rounded-full btn-success text-xs font-semibold uppercase tracking-wide transition"
      aria-label={
        savedRoomId
          ? `Rejoin room ${savedRoomId.toUpperCase()}`
          : "Rejoin your last room"
      }
    >
      <RefreshCw className="w-4 h-4 text-white/80" />
      <span className="hidden sm:inline">
        Rejoin {savedRoomId?.toUpperCase() || "room"}
      </span>
      <span className="sm:hidden">Rejoin</span>
    </button>
  ) : null;

  const handleHomeClick = (event) => {
    const inGameSession =
      screen === "game" && Boolean(room?.id || urlRoomId || roomId);

    if (inGameSession || screen === "daily") {
      // Defer so the opening click's mouseup doesn't land on the new backdrop and dismiss.
      event?.preventDefault?.();
      event?.stopPropagation?.();
      window.setTimeout(() => setLeaveConfirmOpen(true), 0);
      return;
    }

    leaveGame({ resetDaily: screen === "daily" });
  };

  const getModeLabel = () => {
    if (screen === "game") {
      if (room?.mode === "shared") return "Shared Wordle";
      if (room?.mode === "duel") return "Duel Mode";
      if (room?.mode === "battle" || room?.mode === "battle_ai") return "Battle Royale";
    }
    if (screen === "daily") return null;
    if (screen === "home") return null;
    if (mode === "shared") return "Shared Wordle";
    if (mode === "duel") return "Duel Mode";
    if (mode === "battle") return "Battle Royale";
    return null;
  };

  return (
    <div className={`overflow-x-hidden ${equippedFont?.boardClass || ""}`}>
      <Backdrop />
      <CursorTrail cursor={equippedCursor} />

      {/* Game and Daily screens occupy full viewport */}
      {(screen === "game" || screen === "daily") && (
        <>
          <GradientBackground className="pointer-events-none fixed inset-0 -z-10" />
          <div
            className="fixed inset-0 z-0 flex flex-col overflow-hidden"
            style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
          >
            <NavHeader
              onHomeClick={handleHomeClick}
              modeLabel={getModeLabel()}
              right={screen === "game" ? rejoinNavControl : null}
              roomId={screen === "game" ? room?.id : null}
              profileMenuVariant="game"
              reconnecting={reconnecting}
              reconnectAttempt={reconnectAttempt}
            />

            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <GameAdRails layoutKey={`${screen}-${room?.id || "daily"}`}>
            <GameRouter
              screen={screen}
              room={room}
              me={me}
              opponent={opponent}
              players={players}
              allPlayers={allPlayers}
              otherPlayers={otherPlayers}
              isHost={isHost}
              wasHost={wasHost}
              canGuessDuel={canGuessDuel}
              canGuessShared={canGuessShared}
              canGuessBattle={canGuessBattle}
              letterStates={letterStates}
              currentGuess={currentGuess}
              setCurrentGuess={setCurrentGuess}
              shakeKey={shakeKey}
              showActiveError={showActiveError}
              dailyProps={{
                challenge: dailyGame.dailyChallenge,
                guesses: dailyGame.dailyGuesses,
                currentGuess: dailyGame.dailyCurrentGuess,
                letterStates: dailyGame.dailyLetterStates,
                status: dailyGame.dailyStatus,
                loading: dailyGame.dailyLoading,
                gameOver: dailyGame.dailyGameOver,
                correctWord: dailyGame.dailyCorrectWord,
                won: dailyGame.won,
                shakeKey: dailyGame.dailyShakeKey,
                showActiveError: dailyGame.dailyShowActiveError,
                notificationMessage: dailyGame.dailyNotificationMessage,
                setDailyNotificationMessage: dailyGame.setDailyNotificationMessage,
                guessFlipKey: dailyGame.dailyGuessFlipKey,
                handleDailyKey: dailyGame.handleDailyKey,
                boardTheme: equippedTheme,
                fontPack: equippedFont,
                winAnimation: equippedWinAnimation,
              }}
              handleDuelKey={handleDuelKey}
              handleBattleKey={handleBattleKey}
              submittingDuelGuess={submittingDuelGuess}
              submittingBattleGuess={submittingBattleGuess}
              duelActions={duelActions}
              sharedActions={sharedActions}
              battleActions={battleActions}
              aiBattleActions={aiBattleActions}
              roomId={roomId}
              setMsg={setMsg}
              setShowVictory={setShowVictory}
              showVictory={showVictory}
              onPlayDaily={dailyGame.startDailyMode}
              name={name}
              mode={mode}
              contextRoomId={roomId}
              setName={setName}
              setRoomId={setRoomId}
              setMode={setMode}
              onCreate={create}
              onJoin={join}
              message={msg}
              onSharedPartnerLeaveExit={handlePartnerLeaveExit}
              onDuelLeave={handleDuelLeave}
              onDuelPartnerLeaveExit={handlePartnerLeaveExit}
              onBattleHostLeaveExit={handlePartnerLeaveExit}
              pendingJoin={pendingJoin}
              onPendingJoin={handlePendingJoin}
              onPendingJoinDismiss={clearPendingJoin}
              joiningPending={joiningPending}
              cosmeticTheme={equippedTheme}
              fontPack={equippedFont}
              winAnimation={equippedWinAnimation}
            />
              </GameAdRails>
            </div>
          </div>
        </>
      )}

      {/* Home screen */}
      {screen !== "game" && screen !== "daily" && (
        <div
          className="min-h-screen overflow-y-auto scrollbar-track-app"
          style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
        >
          <NavHeader
            onHomeClick={handleHomeClick}
            modeLabel={getModeLabel()}
            right={!viewingHost ? rejoinNavControl : null}
            roomId={screen === "home" ? null : roomId}
            reconnecting={reconnecting}
            reconnectAttempt={reconnectAttempt}
          />

          <div className="font-sans">
            <GameRouter
              screen={screen}
              room={room}
              me={me}
              opponent={opponent}
              players={players}
              allPlayers={allPlayers}
              otherPlayers={otherPlayers}
              isHost={isHost}
              wasHost={wasHost}
              canGuessDuel={canGuessDuel}
              canGuessShared={canGuessShared}
              canGuessBattle={canGuessBattle}
              letterStates={letterStates}
              currentGuess={currentGuess}
              setCurrentGuess={setCurrentGuess}
              shakeKey={shakeKey}
              showActiveError={showActiveError}
              dailyProps={null}
              handleDuelKey={handleDuelKey}
              handleBattleKey={handleBattleKey}
              submittingDuelGuess={submittingDuelGuess}
              submittingBattleGuess={submittingBattleGuess}
              duelActions={duelActions}
              sharedActions={sharedActions}
              battleActions={battleActions}
              aiBattleActions={aiBattleActions}
              roomId={roomId}
              setMsg={setMsg}
              setShowVictory={setShowVictory}
              showVictory={showVictory}
              onPlayDaily={dailyGame.startDailyMode}
              name={name}
              mode={mode}
              contextRoomId={roomId}
              setName={setName}
              setRoomId={setRoomId}
              setMode={setMode}
              onCreate={create}
              onJoin={join}
              message={msg}
              onSharedPartnerLeaveExit={handlePartnerLeaveExit}
              onDuelLeave={handleDuelLeave}
              onDuelPartnerLeaveExit={handlePartnerLeaveExit}
              onBattleHostLeaveExit={handlePartnerLeaveExit}
              pendingJoin={pendingJoin}
              onPendingJoin={handlePendingJoin}
              onPendingJoinDismiss={clearPendingJoin}
              joiningPending={joiningPending}
              cosmeticTheme={equippedTheme}
              fontPack={equippedFont}
              winAnimation={equippedWinAnimation}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Leave game?"
        message="Are you sure you want to leave? You will exit the current room and other players may continue without you."
        confirmLabel="Leave game"
        cancelLabel="Stay"
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={() => {
          leaveGame({ resetDaily: screen === "daily" });
        }}
      />
    </div>
  );
}

