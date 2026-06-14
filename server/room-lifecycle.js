/** Shared room idle / abandonment policy (used by cleanup job + disconnect handlers). */

/** Drop disconnected player records after this long. */
export const DISCONNECT_PLAYER_TTL_MS = 30 * 60 * 1000;

/** How often the cleanup sweep runs. */
export const ROOM_CLEANUP_INTERVAL_MS = 60 * 1000;

/** All players disconnected — delete the room after this grace. */
export const ROOM_EMPTY_GRACE_MS = 3 * 60 * 1000;

/** Waiting lobby (never started) with nobody connected — delete sooner. */
export const ROOM_LOBBY_ABANDONED_MS = 10 * 60 * 1000;

/** Hard cap: delete any room with no activity for this long. */
export const ROOM_MAX_IDLE_MS = 60 * 60 * 1000;

/** After last player goes idle, close quickly if the match never started. */
export const ROOM_ABANDONED_CLOSE_MS = 30 * 1000;

export function getActivePlayerIds(room) {
  return Object.keys(room?.players || {}).filter(
    (id) => !room.players[id]?.disconnected,
  );
}

export function isRoomInProgress(room) {
  if (!room) return false;
  if (room.mode === "battle" || room.mode === "battle_ai") {
    return Boolean(room.battle?.started);
  }
  if (room.mode === "shared") {
    return Boolean(room.shared?.started);
  }
  return Boolean(room.started);
}

function oldestDisconnectAt(room) {
  const times = Object.values(room?.players || {})
    .map((p) =>
      typeof p?.disconnectedAt === "number" ? p.disconnectedAt : Infinity,
    )
    .filter((t) => Number.isFinite(t));
  return times.length ? Math.min(...times) : null;
}

function lastActivityAt(room) {
  return Number(room?.updatedAt || room?.createdAt || 0);
}

/**
 * Decide whether a room should be deleted on this cleanup pass.
 * @returns {'delete' | 'keep'}
 */
export function shouldDeleteRoom(room, now, { isAiBattleEventActive } = {}) {
  if (!room) return "delete";
  if (room.meta?.isEvent && isAiBattleEventActive?.()) {
    return "keep";
  }

  const activeIds = getActivePlayerIds(room);
  const idleMs = now - lastActivityAt(room);
  if (idleMs >= ROOM_MAX_IDLE_MS) {
    return "delete";
  }

  if (activeIds.length > 0) {
    return "keep";
  }

  const oldestDc = oldestDisconnectAt(room);
  if (!oldestDc) {
    // No disconnect timestamps — treat as empty lobby from updatedAt.
    if (!isRoomInProgress(room) && idleMs >= ROOM_LOBBY_ABANDONED_MS) {
      return "delete";
    }
    return "keep";
  }

  const emptyFor = now - oldestDc;
  if (!isRoomInProgress(room) && emptyFor >= ROOM_LOBBY_ABANDONED_MS) {
    return "delete";
  }
  if (emptyFor >= ROOM_EMPTY_GRACE_MS) {
    return "delete";
  }

  return "keep";
}

/**
 * Prune long-disconnected player entries and optionally reassign host.
 * @returns {boolean} whether the room document was mutated
 */
export function pruneDisconnectedPlayers(room, now) {
  if (!room?.players) return false;

  let updated = false;
  for (const pid of Object.keys(room.players)) {
    const player = room.players[pid];
    if (
      player?.disconnected &&
      player.disconnectedAt &&
      now - player.disconnectedAt > DISCONNECT_PLAYER_TTL_MS
    ) {
      if (room.hostId === pid) {
        if (room.mode === "battle_ai") {
          room.hostId = null;
          room.hostConnected = false;
          if (room.battle?.aiHost) {
            room.battle.aiHost.mode = "auto";
            room.battle.aiHost.claimedBy = null;
          }
        } else {
          const next = Object.keys(room.players).find(
            (id) => !room.players[id]?.disconnected && id !== pid,
          );
          if (next) room.hostId = next;
        }
      }
      if (room.battle?.aiHost?.claimedBy === pid) {
        room.battle.aiHost.claimedBy = null;
        if (room.mode === "battle_ai") {
          room.battle.aiHost.mode = "auto";
        }
      }
      delete room.players[pid];
      updated = true;
    }
  }

  const activeIds = getActivePlayerIds(room);
  const hostPlayer = room.players?.[room.hostId];
  if ((!hostPlayer || hostPlayer.disconnected) && room.mode !== "battle_ai") {
    const nextHost = activeIds[0];
    if (nextHost && room.hostId !== nextHost) {
      room.hostId = nextHost;
      updated = true;
    }
  }

  if (updated) {
    room.updatedAt = now;
  }
  return updated;
}
