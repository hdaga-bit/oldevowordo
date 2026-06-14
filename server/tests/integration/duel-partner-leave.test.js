import {
  bootServer,
  shutdownServer,
  createClient,
  disconnectAll,
  emitAndWait,
  emitWithAck,
  waitForEvent,
} from "../helpers/socketTestHelper.js";
import { DUEL_PARTNER_LEAVE_CLOSE_MS } from "../../modes/duel.js";

let c1;
let c2;

async function collectRoomState(emitter, emitEvent, data, others = []) {
  const promises = [emitAndWait(emitter, emitEvent, data)];
  for (const s of others) {
    promises.push(waitForEvent(s, "roomState"));
  }
  const [result, ...rest] = await Promise.all(promises);
  return { ...result, others: rest };
}

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

describe("duel partner leave integration", () => {
  it(
    "notifies remaining player and closes room after a post-game leave",
    async () => {
      c1 = await createClient();
      c2 = await createClient();

      const { ack: createAck } = await emitAndWait(c1, "createRoom", {
        name: "Alice",
        mode: "duel",
      });
      const roomId = createAck.roomId;

      const joinBroadcast = waitForEvent(c1, "roomState");
      await emitWithAck(c2, "joinRoom", { name: "Bob", roomId });
      await joinBroadcast;

      await collectRoomState(c1, "setSecret", { roomId, secret: "HOUSE" }, [c2]);
      const { event: endState } = await collectRoomState(
        c2,
        "setSecret",
        { roomId, secret: "CRANE" },
        [c1],
      );
      await collectRoomState(c1, "makeGuess", { roomId, guess: "CRANE" }, [c2]);
      expect(endState.started).toBe(true);

      const leaveStatePromise = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Timed out waiting for duel partner-left roomState")),
          8000,
        );
        const onState = (state) => {
          if (state?.duelLeave?.partnerLeft) {
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
        DUEL_PARTNER_LEAVE_CLOSE_MS + 5000,
      );

      await emitWithAck(c2, "leaveRoom", { roomId });
      const state = await leaveStatePromise;

      expect(state.duelLeave?.partnerLeft).toBe(true);
      expect(state.duelLeave?.leftPlayerName).toBe("Bob");
      expect(state.duelLeave?.closingAt).toBeGreaterThan(Date.now());

      const closed = await closedPromise;
      expect(closed.reason).toBe("partner_left");
      expect(closed.roomId).toBe(roomId);
    },
    DUEL_PARTNER_LEAVE_CLOSE_MS + 15000,
  );
});
