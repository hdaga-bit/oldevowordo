import {
  ROOM_CLEANUP_INTERVAL_MS,
  getActivePlayerIds,
  pruneDisconnectedPlayers,
  shouldDeleteRoom,
} from "../room-lifecycle.js";

/**
 * Start periodic room cleanup against Redis-backed room ids.
 */
export function startRoomCleanupInterval({
  listRoomIds,
  getRoom,
  saveRoom,
  deleteRoom,
  clearPendingDisconnect,
  clearAbandonedRoomCloseTimer,
  clearAiBattleTimers,
  duelMode,
  battleMode,
  maybeEnsureAiBattleRound,
  isAiBattleEventActive,
  onRoomDeleted,
}) {
  return setInterval(() => {
    void (async () => {
      const now = Date.now();
      for (const roomId of await listRoomIds()) {
        const room = await getRoom(roomId);
        if (!room) {
          await deleteRoom(roomId);
          continue;
        }

        const updated = pruneDisconnectedPlayers(room, now);

        if (
          shouldDeleteRoom(room, now, { isAiBattleEventActive }) === "delete"
        ) {
          clearAbandonedRoomCloseTimer?.(roomId);
          if (room.mode === "battle_ai") {
            clearAiBattleTimers(room);
            battleMode.resetBattleRound(room);
            room.battle.secret = null;
            room.battle.lastRevealedWord = null;
            room.battle.deadline = null;
            room.battle.countdownEndsAt = null;
          } else if (room.mode === "duel" || room.mode === "shared") {
            duelMode.clearDuelTimer(room);
          }
          for (const pid of Object.keys(room.players || {})) {
            clearPendingDisconnect(roomId, pid);
          }
          await onRoomDeleted?.(roomId, room, "cleanup");
          await deleteRoom(roomId);
          continue;
        }

        if (updated) {
          await saveRoom(room);
        }

        if (
          room.mode === "battle_ai" &&
          room.battle?.aiHost?.mode === "auto" &&
          !room.battle.started &&
          !room.battle.countdownEndsAt
        ) {
          void maybeEnsureAiBattleRound(roomId);
        }
      }
    })();
  }, ROOM_CLEANUP_INTERVAL_MS);
}
