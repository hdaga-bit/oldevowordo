import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const CLOSE_MS = 10_000;

function secondsUntil(closingAt) {
  if (!closingAt) return 0;
  return Math.max(0, Math.ceil((closingAt - Date.now()) / 1000));
}

function readPartnerLeaveState(room) {
  if (room?.mode === "shared" && room?.shared?.partnerLeft) {
    return {
      partnerLeft: true,
      closingAt: room.shared.closingAt ?? null,
      leftName: room.shared.leftPlayerName || "Your partner",
      roomMode: "shared",
    };
  }
  if (room?.mode === "duel" && room?.duelLeave?.partnerLeft) {
    return {
      partnerLeft: true,
      closingAt: room.duelLeave.closingAt ?? null,
      leftName: room.duelLeave.leftPlayerName || "Your opponent",
      roomMode: "duel",
    };
  }
  if (room?.mode === "battle" && room?.battle?.hostLeft?.closingAt) {
    return {
      partnerLeft: true,
      closingAt: room.battle.hostLeft.closingAt,
      leftName: room.battle.hostLeft.leftPlayerName || "Host",
      roomMode: "battle",
    };
  }
  return {
    partnerLeft: false,
    closingAt: null,
    leftName: "",
    roomMode: null,
  };
}

/**
 * Handles partner/opponent-left flow: countdown UI + exit on roomClosed.
 */
export function useSharedPartnerLeave({ room, onExit }) {
  const { partnerLeft, closingAt, leftName, roomMode } = readPartnerLeaveState(room);
  const exitedRef = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(closingAt));

  useEffect(() => {
    if (!partnerLeft || !closingAt) {
      setSecondsLeft(0);
      return undefined;
    }

    setSecondsLeft(secondsUntil(closingAt));
    const tick = setInterval(() => {
      const left = secondsUntil(closingAt);
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(tick);
      }
    }, 500);

    return () => clearInterval(tick);
  }, [partnerLeft, closingAt]);

  useEffect(() => {
    if (!partnerLeft) {
      exitedRef.current = false;
    }
  }, [partnerLeft]);

  const exitNow = useCallback(() => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExit?.();
  }, [onExit]);

  useEffect(() => {
    if (!partnerLeft) return undefined;

    const onRoomClosed = (payload) => {
      if (
        payload?.reason !== "partner_left" &&
        payload?.reason !== "host_left"
      ) {
        return;
      }
      exitNow();
    };

    socket.on("roomClosed", onRoomClosed);
    return () => socket.off("roomClosed", onRoomClosed);
  }, [partnerLeft, exitNow]);

  useEffect(() => {
    if (!partnerLeft || !closingAt) return undefined;
    if (secondsLeft > 0) return undefined;

    const timer = setTimeout(exitNow, 400);
    return () => clearTimeout(timer);
  }, [partnerLeft, closingAt, secondsLeft, exitNow]);

  return {
    partnerLeft,
    leftName,
    roomMode,
    secondsLeft: partnerLeft ? Math.max(secondsLeft, secondsUntil(closingAt)) : 0,
    exitNow,
    totalSeconds: Math.ceil(CLOSE_MS / 1000),
  };
}
