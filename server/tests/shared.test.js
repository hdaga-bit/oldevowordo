import {
  markSharedPartnerLeft,
  clearSharedPartnerLeft,
  sanitizeShared,
  SHARED_PARTNER_LEAVE_CLOSE_MS,
  initSharedRoom,
  handleSharedDisconnect,
} from "../modes/shared.js";

function makeRoom() {
  const room = {
    id: "ROOM1",
    mode: "shared",
    hostId: "p1",
    players: {
      p1: { name: "Alice", disconnected: false },
      p2: { name: "Bob", disconnected: true },
    },
  };
  initSharedRoom(room, { pickRandomWords: () => ["HOUSE"] });
  room.shared.started = true;
  room.shared.turn = "p2";
  room.shared.secret = "HOUSE";
  return room;
}

describe("shared partner leave", () => {
  it("marks partner left and exposes closingAt in sanitize", () => {
    const room = makeRoom();
    const before = Date.now();
    expect(markSharedPartnerLeft(room, "p2")).toBe(true);
    expect(room.shared.partnerLeft).toBe(true);
    expect(room.shared.leftPlayerName).toBe("Bob");
    expect(room.shared.started).toBe(false);
    expect(room.shared.secret).toBeNull();
    expect(room.shared.closingAt).toBeGreaterThanOrEqual(
      before + SHARED_PARTNER_LEAVE_CLOSE_MS - 50,
    );

    const snapshot = sanitizeShared(room);
    expect(snapshot.partnerLeft).toBe(true);
    expect(snapshot.closingAt).toBe(room.shared.closingAt);
    expect(snapshot.leftPlayerName).toBe("Bob");
  });

  it("clears partner left state on restore", () => {
    const room = makeRoom();
    markSharedPartnerLeft(room, "p2");
    clearSharedPartnerLeft(room);
    expect(room.shared.partnerLeft).toBe(false);
    expect(room.shared.closingAt).toBeNull();
  });

  it("handleSharedDisconnect reassigns turn when active leaver had turn", () => {
    const room = makeRoom();
    room.players.p2.disconnected = false;
    room.shared.turn = "p2";
    handleSharedDisconnect(room, "p2");
    room.players.p2.disconnected = true;
    expect(room.shared.turn).toBe("p1");
  });
});
