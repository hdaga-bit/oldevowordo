import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import SpectateCard from "../components/SpectateCard.jsx";
import SecretWordInputRow from "../components/SecretWordInputRow.jsx";
import BattleHostDashboard from "../components/battle/BattleHostDashboard.jsx";
import { GameLayout } from "../components/layout/GameLayout";
import GlowButton from "../components/ui/GlowButton";
import { ModeHelpButton } from "../components/ModeHelpSheet.jsx";
import { getViewportTileLimits } from "../utils/game-viewport-layout.js";
import { useIsMobile } from "../hooks/useIsMobile";

function LeaderboardModal({ open, onClose, leaderboard }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[85vh] w-full max-w-md overflow-auto rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <h4 className="text-lg font-semibold text-white">Leaderboard</h4>
              </div>
              <GlowButton variant="ghost" size="sm" onClick={onClose}>
                Close
              </GlowButton>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-auto">
              {leaderboard.map((p, i) => (
                <div
                  key={p.id}
                  className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="truncate text-white">
                    {i + 1}. {p.name}
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-white/50">
                    W:{p.wins}
                  </span>
                </div>
              ))}
              {leaderboard.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/50">
                  No players yet.
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function HostSpectateScreen({
  room,
  players = [],
  onWordSubmit,
  onSetWord,
  onSetWordAndStart,
  onStartRound,
  onSetSettings,
  onKickPlayer,
  onStartAiRound,
  pendingStart = false,
  onReleaseHost,
}) {
  const isMobile = useIsMobile();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [startingRound, setStartingRound] = useState(false);
  const [startError, setStartError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [countdownRemaining, setCountdownRemaining] = useState(null);
  const [liveRemaining, setLiveRemaining] = useState(null);
  const [secretKeyHandler, setSecretKeyHandler] = useState(null);

  const isAiMode = room?.mode === "battle_ai";
  const isClassicBattle = room?.mode === "battle";
  const aiIsInControl = isAiMode && room?.battle?.aiHost?.mode !== "player";
  const layoutMode = isAiMode ? "battle_ai" : "battle";

  const spectateLimits = useMemo(
    () => getViewportTileLimits({ layout: "spectate", isMobile }),
    [isMobile],
  );

  const [showReconnected, setShowReconnected] = useState(() => {
    const s = sessionStorage.getItem("wp.reconnected") === "1";
    const legacy = localStorage.getItem("wp.lastSocketId.wasHost") === "true";
    return s || legacy;
  });

  useEffect(() => {
    if (!showReconnected) return;
    sessionStorage.removeItem("wp.reconnected");
    localStorage.removeItem("wp.lastSocketId.wasHost");
    const t = setTimeout(() => setShowReconnected(false), 3500);
    return () => clearTimeout(t);
  }, [showReconnected]);

  const connectedCount = useMemo(
    () => players.filter((p) => !p.disconnected).length,
    [players],
  );

  const started = !!room?.battle?.started;
  const hasAnyGuesses = useMemo(
    () => players.some((p) => (p.guesses?.length || 0) > 0),
    [players],
  );
  const roundActive = started;
  const isBattleLobby = isClassicBattle && !roundActive;
  const roundFinished =
    !started && (Boolean(room?.battle?.winner) || hasAnyGuesses);
  const canReleaseHost =
    isAiMode && typeof onReleaseHost === "function" && !roundActive;

  const formatDuration = (ms) => {
    if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const countdownLabel =
    countdownRemaining !== null ? formatDuration(countdownRemaining) : null;
  const liveDeadline = room?.battle?.deadline ?? null;
  const liveTimerLabel =
    liveRemaining !== null ? formatDuration(liveRemaining) : null;

  useEffect(() => {
    if (!liveDeadline || !roundActive) {
      setLiveRemaining(null);
      return;
    }
    const target = Number(liveDeadline);
    if (!Number.isFinite(target)) {
      setLiveRemaining(null);
      return;
    }
    const update = () => setLiveRemaining(Math.max(target - Date.now(), 0));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveDeadline, roundActive]);

  const canStartRound =
    isAiMode &&
    typeof onStartAiRound === "function" &&
    !roundActive &&
    (pendingStart || !countdownLabel);

  const winnerName = useMemo(() => {
    const id = room?.battle?.winner;
    if (!id) return null;
    return (
      room?.players?.[id]?.name ||
      players.find((p) => p.id === id)?.name ||
      "Unknown player"
    );
  }, [room?.battle?.winner, room?.players, players]);

  const standbyMessage = (() => {
    if (roundActive) return null;
    if (isAiMode) {
      if (pendingStart) return "Waiting for someone to start the game...";
      if (countdownLabel) return `Next round in ${countdownLabel}`;
      return roundFinished
        ? "Game ended — AI host is preparing the next round..."
        : "Waiting for AI host to start the game...";
    }
    return roundFinished
      ? "Game ended — waiting for host to start the next round..."
      : "Waiting for players...";
  })();

  const handleReleaseHost = async () => {
    if (!canReleaseHost || releasing) return;
    try {
      setReleasing(true);
      await onReleaseHost?.();
    } finally {
      setReleasing(false);
    }
  };

  const handleStartRound = async () => {
    if (!canStartRound || startingRound) return;
    try {
      setStartingRound(true);
      const result = await onStartAiRound?.();
      if (result?.error) {
        setStartError(result.error || "Unable to start the game");
      } else {
        setStartError("");
      }
    } finally {
      setStartingRound(false);
    }
  };

  useEffect(() => {
    if (!pendingStart) {
      setStartError("");
    }
  }, [pendingStart]);

  useEffect(() => {
    if (!isAiMode) {
      setCountdownRemaining(null);
      return;
    }
    const target = Number(room?.battle?.countdownEndsAt);
    if (!Number.isFinite(target)) {
      setCountdownRemaining(null);
      return;
    }
    const update = () => {
      setCountdownRemaining(Math.max(target - Date.now(), 0));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [isAiMode, room?.battle?.countdownEndsAt]);

  const leaderboard = useMemo(() => {
    return [...players]
      .filter((p) => p && p.id && p.id !== room?.hostId)
      .map((p) => ({
        id: p.id,
        name: p.name || "Player",
        wins: p.wins ?? 0,
        streak: p.streak ?? 0,
        disconnected: !!p.disconnected,
      }))
      .sort(
        (a, b) =>
          b.wins - a.wins || b.streak - a.streak || a.name.localeCompare(b.name),
      );
  }, [players, room?.hostId]);

  const needsSecretKeyboard =
    !roundActive && !aiIsInControl && !room?.battle?.started;

  const handleShellKey = useCallback(
    (key) => {
      secretKeyHandler?.(key);
    },
    [secretKeyHandler],
  );

  const renderSpectateHeader = () => (
    <div className="px-3 pt-2 pb-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white/50">
          Host
          {showReconnected ? (
            <span className="ml-1.5 text-emerald-400">· reconnected</span>
          ) : null}
        </span>
        <div className="flex items-center gap-2">
          <ModeHelpButton
            mode={isAiMode ? "battle_ai" : "battle"}
            autoShow
            className="!text-[10px]"
          />
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="text-[10px] text-white/40 transition-colors hover:text-white/60"
          >
            Leaderboard
          </button>
          {canStartRound ? (
            <GlowButton
              onClick={handleStartRound}
              size="sm"
              disabled={startingRound}
              className="!px-3 !py-1 !text-xs"
            >
              {startingRound
                ? "Starting..."
                : pendingStart
                ? "Start"
                : "Start Now"}
            </GlowButton>
          ) : null}
          {canReleaseHost ? (
            <button
              type="button"
              onClick={handleReleaseHost}
              disabled={releasing}
              className="text-[10px] text-white/30 transition-colors hover:text-white/50"
            >
              {releasing ? "..." : "Release"}
            </button>
          ) : null}
          <span className="text-[10px] text-white/30">
            {connectedCount}/{players.length}
          </span>
        </div>
      </div>
      {startError ? (
        <p className="mt-1 text-[10px] text-red-300">{startError}</p>
      ) : null}
    </div>
  );

  const renderSecretWordSection = () => {
    if (roundActive || aiIsInControl) {
      if (!roundActive && aiIsInControl) {
        return (
          <div className="px-3 pb-2 text-center">
            <p className="mx-auto max-w-md text-xs text-white/50">
              {roundFinished
                ? winnerName
                  ? `${winnerName} won`
                  : "No winner"
                : standbyMessage || "Waiting..."}
            </p>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="px-3 pb-2 text-center">
        {roundFinished ? (
          <p className="mb-2 text-xs text-emerald-400/70">
            {winnerName ? `${winnerName} won` : "No winner"}
          </p>
        ) : null}
        {!room?.battle?.started ? (
          <SecretWordInputRow
            onSubmit={onWordSubmit}
            submitHint="Press Enter to set word"
            showGenerate={true}
            size={56}
            onExposeKeyHandler={setSecretKeyHandler}
          />
        ) : null}
      </div>
    );
  };

  const renderSpectateGrid = () => {
    if (!roundActive) {
      return null;
    }

    return (
      <div
        className="grid w-full gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          alignContent: "start",
        }}
      >
        {players.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <SpectateCard player={p} room={room} dense />
          </motion.div>
        ))}
      </div>
    );
  };

  const renderLiveStatus = () => {
    if (!roundActive) return null;
    return (
      <div className="flex justify-center px-3 pb-2">
        <div className="inline-flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
          {liveTimerLabel ? (
            <span
              className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums ${
                liveRemaining !== null && liveRemaining <= 10000
                  ? "bg-red-500/10 text-red-300"
                  : liveRemaining !== null && liveRemaining <= 20000
                  ? "bg-amber-500/10 text-amber-300"
                  : "bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {liveTimerLabel}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  if (isBattleLobby) {
    return (
      <>
        <GameLayout
          mode="battle"
          viewportLimits={spectateLimits}
          keyboardMaxWidth={500}
          showPlayerSection={false}
          showKeyboard
          keyboardDisabled={!secretKeyHandler}
          onKeyPress={handleShellKey}
          boardZoneFillMode="scroll"
          renderHeader={() => null}
          renderBoard={() => (
            <BattleHostDashboard
              room={room}
              players={players}
              settingsError={settingsError}
              startError={startError}
              onExposeKeyHandler={setSecretKeyHandler}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              onSetSettings={async (partial) => {
                setSettingsError("");
                const result = await onSetSettings?.(partial);
                if (result?.error) setSettingsError(result.error);
              }}
              onKickPlayer={async (playerId) => {
                const result = await onKickPlayer?.(playerId);
                if (result?.error) setSettingsError(result.error);
                return result;
              }}
              onSetWord={async (word) => {
                setStartError("");
                const result = await onSetWord?.(word);
                if (result?.error) setStartError(result.error);
                return result;
              }}
              onSetWordAndStart={async (word) => {
                setStartError("");
                const result = await onSetWordAndStart?.(word);
                if (result?.error) setStartError(result.error);
                return result;
              }}
              onStartRound={async () => {
                setStartError("");
                const result = await onStartRound?.();
                if (result?.error) setStartError(result.error);
                return result;
              }}
            />
          )}
        />
        <LeaderboardModal
          open={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          leaderboard={leaderboard}
        />
      </>
    );
  }

  return (
    <>
      <GameLayout
        mode={layoutMode}
        viewportLimits={spectateLimits}
        keyboardMaxWidth={500}
        showPlayerSection={false}
        showKeyboard={needsSecretKeyboard}
        keyboardDisabled={needsSecretKeyboard && !secretKeyHandler}
        onKeyPress={handleShellKey}
        boardZoneFillMode={roundActive ? "scroll" : "fit"}
        renderHeader={() => (
          <>
            {renderSpectateHeader()}
            {renderLiveStatus()}
          </>
        )}
        renderAboveBoard={renderSecretWordSection}
        renderBoard={renderSpectateGrid}
      />
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        leaderboard={leaderboard}
      />
    </>
  );
}

export default HostSpectateScreen;
