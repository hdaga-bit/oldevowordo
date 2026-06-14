import { useMemo } from "react";
import { socket } from "../socket";
import { MODES } from "../modes/index.js";
import { getOrCreatePlayerId } from "../utils/playerId.js";

/** Resolve stable player key used in room.players (UUID in production, socket.id in legacy rooms). */
function resolveMyPlayerId(room, socketId) {
  const stableId = getOrCreatePlayerId();
  if (stableId && room?.players?.[stableId]) return stableId;
  if (socketId && room?.players?.[socketId]) return socketId;
  if (socketId) {
    const bySocket = Object.entries(room?.players || {}).find(
      ([, p]) => p?.socketId === socketId
    );
    if (bySocket) return bySocket[0];
  }
  return stableId || socketId || null;
}

export function useGameState(room) {
  const modeKey = room?.mode || "duel";
  const module = MODES[modeKey] || MODES.duel;
  const socketId = socket?.id;
  const myPlayerId = resolveMyPlayerId(room, socketId);

  // Memoize computed player data to avoid unnecessary recalculations
  const { me, players, allPlayers, otherPlayers, opponent, isHost } = useMemo(() => {
    if (!room?.players || !myPlayerId) {
      return {
        me: null,
        players: [],
        allPlayers: [],
        otherPlayers: [],
        opponent: null,
        isHost: false,
      };
    }

    // Calculate me (room.players keys are stable playerId UUIDs)
    const player = room.players[myPlayerId];
    const meValue = player ? { id: myPlayerId, ...player } : null;

    // Calculate players
    let playersValue = [];
    if (room.mode === "battle" || room.mode === "battle_ai") {
      playersValue = Object.entries(room.players)
        .filter(([id]) => id !== room.hostId)
        .map(([id, p]) => ({ id, ...p }));
    } else {
      playersValue = Object.entries(room.players).map(([id, p]) => ({
        id,
        ...p,
      }));
    }

    // Calculate allPlayers
    const allPlayersValue = Object.entries(room.players).map(([id, p]) => ({
      id,
      ...p,
    }));

    // Calculate otherPlayers
    let otherPlayersValue = [];
    if (room.mode === "battle" || room.mode === "battle_ai") {
      otherPlayersValue = Object.entries(room.players)
        .filter(([id]) => id !== room.hostId && id !== myPlayerId)
        .map(([id, p]) => ({ id, ...p }));
    }

    // Calculate opponent
    let opponentValue = null;
    if (room.mode === "duel") {
      const entry = Object.entries(room.players).find(
        ([id]) => id !== myPlayerId
      );
      opponentValue = entry ? { id: entry[0], ...entry[1] } : null;
    }

    // Calculate isHost
    const isHostValue = room.hostId === myPlayerId;

    return {
      me: meValue,
      players: playersValue,
      allPlayers: allPlayersValue,
      otherPlayers: otherPlayersValue,
      opponent: opponentValue,
      isHost: isHostValue,
    };
  }, [room?.players, room?.mode, room?.hostId, myPlayerId]);

  // Memoize mode state selectors to avoid recalculating on every render
  const modeState = useMemo(() => {
    if (!module?.createSelectors) {
      return {};
    }
    return module.createSelectors({
      room,
      me,
      players,
      opponent,
      isHost,
    }) || {};
  }, [module, room, me, players, opponent, isHost]);

  // Memoize derived values from modeState
  const canGuessDuel = useMemo(
    () => (room?.mode === "duel" ? Boolean(modeState.canGuess) : false),
    [room?.mode, modeState.canGuess]
  );
  
  const canGuessShared = useMemo(
    () => (room?.mode === "shared" ? Boolean(modeState.canGuess) : false),
    [room?.mode, modeState.canGuess]
  );
  
  const canGuessBattle = useMemo(
    () =>
      room?.mode === "battle" || room?.mode === "battle_ai"
        ? Boolean(modeState.canGuess)
        : false,
    [room?.mode, modeState.canGuess]
  );

  const letterStates = useMemo(
    () => modeState.letterStates || {},
    [modeState.letterStates]
  );
  
  const shouldShowVictory = useMemo(
    () => Boolean(modeState.shouldShowVictory),
    [modeState.shouldShowVictory]
  );
  
  const duelSecrets = useMemo(
    () => modeState.duelSecrets || {
      leftSecret: null,
      rightSecret: null,
    },
    [modeState.duelSecrets]
  );

  return {
    me,
    players,
    allPlayers,
    otherPlayers,
    opponent,
    isHost,
    canGuessDuel,
    canGuessShared,
    canGuessBattle,
    letterStates,
    shouldShowVictory,
    duelSecrets,
  };
}
