import {
  bootServer,
  shutdownServer,
  createClient,
  disconnectAll,
  emitAndWait,
  emitWithAck,
  waitForEvent,
} from "../helpers/socketTestHelper.js";
import { SHARED_PARTNER_LEAVE_CLOSE_MS } from "../../modes/shared.js";

let c1;
let c2;

beforeAll(async () => {
  await bootServer();
}, 15000);

afterAll(async () => {
  disconnectAll(c1, c2);
  await shutdownServer();
});

afterEach(() => {
  disconnectAll(c1, c2);
  c1 = null;
  c2 = null;
});

describe("shared partner leave integration", () => {
  it("does not mark partner left when host re-joins lobby alone", async () => {
    c1 = await createClient();
    const hostPlayerId = "11111111-1111-4111-8111-111111111111";

    const { ack: createAck, event: createState } = await emitAndWait(
      c1,
      "createRoom",
      { name: "Alice", mode: "shared", playerId: hostPlayerId },
    );
    const roomId = createAck.roomId;
    expect(createState.shared?.partnerLeft).toBeFalsy();

    const rejoinAck = await emitWithAck(c1, "joinRoom", {
      name: "Alice",
      roomId,
      playerId: hostPlayerId,
    });
    expect(rejoinAck.ok).toBe(true);
    expect(rejoinAck.resumed).toBe(true);

    const syncAck = await emitWithAck(c1, "syncRoom", { roomId });
    expect(syncAck.state?.shared?.partnerLeft).toBeFalsy();
    expect(syncAck.state?.shared?.closingAt ?? null).toBeNull();
  });

  it(
    "notifies remaining player and closes room after timer",
    async () => {
    c1 = await createClient();
    c2 = await createClient();

    const { ack: createAck } = await emitAndWait(c1, "createRoom", {
      name: "Alice",
      mode: "shared",
    });
    const roomId = createAck.roomId;

    const joinBroadcast = waitForEvent(c1, "roomState");
    await emitWithAck(c2, "joinRoom", { name: "Bob", roomId });
    await joinBroadcast;

    const leaveStatePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timed out waiting for partner-left roomState')),
        5000,
      );
      const onState = (state) => {
        if (state?.shared?.partnerLeft) {
          clearTimeout(timer);
          c1.off("roomState", onState);
          resolve(state);
        }
      };
      c1.on("roomState", onState);
    });
    const closedPromise = waitForEvent(
      c1,
      "roomClosed",
      SHARED_PARTNER_LEAVE_CLOSE_MS + 5000,
    );

    await emitWithAck(c2, "leaveRoom", { roomId });
    const state = await leaveStatePromise;

    expect(state.shared?.partnerLeft).toBe(true);
    expect(state.shared?.leftPlayerName).toBe("Bob");
    expect(state.shared?.closingAt).toBeGreaterThan(Date.now());

    const closed = await closedPromise;
    expect(closed.reason).toBe("partner_left");
    expect(closed.roomId).toBe(roomId);
    },
    SHARED_PARTNER_LEAVE_CLOSE_MS + 10000,
  );
});
