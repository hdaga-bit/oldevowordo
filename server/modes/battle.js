export const DEFAULT_MAX_GUESSES = 6;
export const MIN_MAX_GUESSES = 1;
export const MAX_MAX_GUESSES = 6;

/** Grace period before terminating a classic battle room after the host leaves (ms). */
export const BATTLE_HOST_LEAVE_CLOSE_MS = 20 * 1000;

/** Allowed round durations (ms). null = no timer. */
export const ALLOWED_ROUND_MS = [
  null,
  3 * 60 * 1000,
  5 * 60 * 1000,
  6 * 60 * 1000,
];

function nonHostPlayerIds(room) {
  return Object.keys(room.players || {}).filter((pid) => pid !== room.hostId);
}

export function getBattleMaxGuesses(room) {
  const n = room?.battle?.maxGuesses;
  if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_MAX_GUESSES;
  return Math.min(MAX_MAX_GUESSES, Math.max(MIN_MAX_GUESSES, Math.floor(n)));
}

export function clampMaxGuesses(value) {
  if (value == null) return DEFAULT_MAX_GUESSES;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_MAX_GUESSES;
  return Math.min(MAX_MAX_GUESSES, Math.max(MIN_MAX_GUESSES, n));
}

export function normalizeRoundMs(value, maxAllowedMs = 6 * 60 * 1000) {
  if (value == null || value === 0 || value === false) return null;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  const capped = Math.min(n, maxAllowedMs);
  const allowed = ALLOWED_ROUND_MS.filter((v) => v != null);
  if (allowed.includes(capped)) return capped;
  // Snap to nearest allowed preset
  let best = allowed[0];
  let bestDiff = Math.abs(capped - best);
  for (const preset of allowed) {
    const diff = Math.abs(capped - preset);
    if (diff < bestDiff) {
      best = preset;
      bestDiff = diff;
    }
  }
  return best;
}

export function initBattleRoom(room) {
  room.battle = {
    secret: null,
    started: false,
    winner: null,
    lastRevealedWord: null,
    deadline: null,
    countdownEndsAt: null,
    aiHost: null,
    pendingStart: false,
    locked: false,
    maxGuesses: DEFAULT_MAX_GUESSES,
    roundMs: null,
    hostLeft: null,
  };
}

export function markBattleHostLeft(room, leftPlayerId) {
  if (!room?.battle) return false;
  if (room.battle.hostLeft?.closingAt) return false;
  const leftPlayer = room.players?.[leftPlayerId];
  room.battle.hostLeft = {
    leftPlayerId,
    leftPlayerName: leftPlayer?.name || "Host",
    closingAt: Date.now() + BATTLE_HOST_LEAVE_CLOSE_MS,
  };
  return true;
}

export function clearBattleHostLeft(room) {
  if (room?.battle) room.battle.hostLeft = null;
}

export function sanitizeBattleHostLeft(room) {
  if (!room?.battle?.hostLeft) return undefined;
  return {
    leftPlayerName: room.battle.hostLeft.leftPlayerName ?? null,
    closingAt: room.battle.hostLeft.closingAt ?? null,
  };
}

export function canJoinBattle(room, { isRejoin } = {}) {
  if (isRejoin) return { ok: true };
  if (room.battle?.locked) {
    return { error: "Room is locked" };
  }
  if (room.battle?.started) {
    return { error: "Battle already in progress" };
  }
  return { ok: true };
}

export function setBattleSettings({ room, locked, maxGuesses, roundMs, maxRoundMs }) {
  if (!room.battle) return { error: "Battle not configured" };
  if (room.battle.started) {
    return { error: "Cannot change settings during a round" };
  }
  if (locked !== undefined) {
    room.battle.locked = Boolean(locked);
  }
  if (maxGuesses !== undefined) {
    room.battle.maxGuesses = clampMaxGuesses(maxGuesses);
  }
  if (roundMs !== undefined) {
    room.battle.roundMs = normalizeRoundMs(roundMs, maxRoundMs);
  }
  return { ok: true };
}

export function kickBattlePlayer({ room, playerId }) {
  if (!room.battle) return { error: "Battle not configured" };
  if (room.battle.started) {
    return { error: "Cannot kick during a round" };
  }
  if (!playerId || playerId === room.hostId) {
    return { error: "Cannot kick this player" };
  }
  const player = room.players?.[playerId];
  if (!player) return { error: "Player not in room" };
  const socketId = player.socketId || null;
  delete room.players[playerId];
  return { ok: true, socketId };
}

export function setHostWord({ room, secret, validateWord }) {
  if (room.battle?.started) {
    return { error: "Cannot set word during a round" };
  }
  if (!validateWord(secret)) {
    return { error: "Invalid word" };
  }
  room.battle.secret = secret.toUpperCase();
  room.battle.lastRevealedWord = null;
  room.battle.winner = null;
  room.battle.deadline = null;
  room.battle.countdownEndsAt = null;
  room.roundClosed = false;
  Object.values(room.players).forEach((p) => {
    p.guesses = [];
    p.done = false;
  });
  return { ok: true };
}

export function startBattleRound({ room }) {
  if (!room.battle.secret) {
    return { error: "Set a word first" };
  }
  if (nonHostPlayerIds(room).length < 1) {
    return { error: "Need at least 2 players" };
  }
  Object.values(room.players).forEach((p) => {
    p.guesses = [];
    p.done = false;
  });
  room.battle.lastRevealedWord = null;
  room.battle.started = true;
  room.battle.winner = null;
  room.roundClosed = false;
  return { ok: true };
}

export function endBattleRound(room, winnerId, { updateStatsOnWin }) {
  room.battle.started = false;
  room.battle.winner = winnerId || null;
  room.battle.lastRevealedWord = room.battle.secret || null;
  room.battle.deadline = null;
  room.battle.countdownEndsAt = null;
  nonHostPlayerIds(room).forEach((pid) => {
    room.players[pid].done = true;
  });
  if (winnerId && !room.roundClosed) {
    updateStatsOnWin(room, winnerId);
  }
  room.roundClosed = true;
}

export function handleBattleGuess({ room, socketId, guess, scoreGuess, updateStatsOnWin }) {
  if (socketId === room.hostId) {
    return { error: "Host is spectating this round" };
  }
  if (!room.battle.started) return { error: "Battle not started" };

  const player = room.players[socketId];
  if (!player) return { error: "Not in room" };
  if (player.done) return { error: "No guesses left" };

  const normalizedGuess = guess.toUpperCase();
  if (player.guesses.some((g) => g.guess === normalizedGuess)) {
    return { error: "Already guessed" };
  }

  const maxGuesses = getBattleMaxGuesses(room);
  const pattern = scoreGuess(room.battle.secret, guess);
  player.guesses.push({ guess, pattern });

  let ended = false;
  if (guess === room.battle.secret) {
    endBattleRound(room, socketId, { updateStatsOnWin });
    ended = true;
  } else if (player.guesses.length >= maxGuesses) {
    player.done = true;
    const allDone = nonHostPlayerIds(room).every((pid) => room.players[pid].done);
    if (allDone && !room.battle.winner) {
      endBattleRound(room, null, { updateStatsOnWin });
      ended = true;
    }
  }

  if (!ended && room.battle.winner && !room.battle.lastRevealedWord) {
    endBattleRound(room, room.battle.winner, { updateStatsOnWin });
    ended = true;
  }

  return { ok: true, pattern, ended };
}

export function resetBattleRound(room) {
  Object.values(room.players).forEach((p) => {
    p.guesses = [];
    p.done = false;
  });
  room.battle.started = false;
  room.battle.winner = null;
  room.roundClosed = false;
  room.battle.deadline = null;
  room.battle.countdownEndsAt = null;
}

export function sanitizeBattle(room) {
  if (!room.battle) return undefined;
  return {
    started: room.battle.started,
    winner: room.battle.winner,
    hasSecret: !!room.battle.secret,
    secret: null,
    lastRevealedWord: room.battle.lastRevealedWord || null,
    deadline: room.battle.deadline ?? null,
    countdownEndsAt: room.battle.countdownEndsAt ?? null,
    pendingStart: room.battle.pendingStart ?? false,
    locked: Boolean(room.battle.locked),
    maxGuesses: getBattleMaxGuesses(room),
    roundMs: room.battle.roundMs ?? null,
    aiHost: room.battle.aiHost
      ? {
          mode: room.battle.aiHost.mode,
          claimedBy: room.battle.aiHost.claimedBy || null,
          pendingStart:
            room.battle.aiHost.pendingStart ?? room.battle.pendingStart ?? false,
        }
      : null,
    hostLeft: sanitizeBattleHostLeft(room),
  };
}
