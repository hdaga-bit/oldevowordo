import {
  getActivePlayerIds,
  isRoomInProgress,
  shouldDeleteRoom,
  pruneDisconnectedPlayers,
  ROOM_EMPTY_GRACE_MS,
  ROOM_LOBBY_ABANDONED_MS,
  ROOM_MAX_IDLE_MS,
} from "../room-lifecycle.js";

describe("room-lifecycle", () => {
  const now = 1_000_000;

  it("detects active vs disconnected players", () => {
    const room = {
      players: {
        a: { disconnected: false },
        b: { disconnected: true, disconnectedAt: now - 1000 },
      },
    };
    expect(getActivePlayerIds(room)).toEqual(["a"]);
  });

  it("deletes empty waiting lobby after lobby abandoned TTL", () => {
    const room = {
      mode: "duel",
      started: false,
      createdAt: now - ROOM_LOBBY_ABANDONED_MS - 1000,
      updatedAt: now - ROOM_LOBBY_ABANDONED_MS - 1000,
      players: {
        host: { disconnected: true, disconnectedAt: now - ROOM_LOBBY_ABANDONED_MS - 500 },
      },
    };
    expect(shouldDeleteRoom(room, now)).toBe("delete");
  });

  it("keeps room with an active player", () => {
    const room = {
      mode: "duel",
      started: false,
      updatedAt: now,
      players: {
        host: { disconnected: false },
      },
    };
    expect(shouldDeleteRoom(room, now)).toBe("keep");
  });

  it("deletes all-disconnected room after empty grace", () => {
    const room = {
      mode: "battle",
      battle: { started: true },
      updatedAt: now,
      players: {
        a: { disconnected: true, disconnectedAt: now - ROOM_EMPTY_GRACE_MS - 1 },
        b: { disconnected: true, disconnectedAt: now - ROOM_EMPTY_GRACE_MS - 1 },
      },
    };
    expect(isRoomInProgress(room)).toBe(true);
    expect(shouldDeleteRoom(room, now)).toBe("delete");
  });

  it("deletes room after max idle regardless of player flags", () => {
    const room = {
      mode: "duel",
      started: true,
      updatedAt: now - ROOM_MAX_IDLE_MS - 1,
      createdAt: now - ROOM_MAX_IDLE_MS - 1,
      players: {
        a: { disconnected: false },
      },
    };
    expect(shouldDeleteRoom(room, now)).toBe("delete");
  });

  it("prunes players disconnected longer than player TTL", () => {
    const room = {
      hostId: "old",
      mode: "duel",
      players: {
        old: {
          disconnected: true,
          disconnectedAt: now - 31 * 60 * 1000,
        },
        fresh: { disconnected: true, disconnectedAt: now - 1000 },
      },
    };
    expect(pruneDisconnectedPlayers(room, now)).toBe(true);
    expect(room.players.old).toBeUndefined();
    expect(room.players.fresh).toBeDefined();
  });
});
