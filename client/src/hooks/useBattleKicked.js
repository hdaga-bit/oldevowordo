import { useEffect } from "react";
import { socket } from "../socket";

const DEFAULT_MESSAGE = "You were removed from the room by the host";

/**
 * Listens for the server `kicked` event and bounces the player home.
 * Mirrors the partner-leave pattern used by shared/duel modes.
 */
export function useBattleKicked({ roomId, goHome, setMsg, navigateHome, onKicked }) {
  useEffect(() => {
    const handler = (payload) => {
      const eventRoomId = payload?.roomId || null;
      if (roomId && eventRoomId && eventRoomId.toUpperCase() !== roomId.toUpperCase()) {
        return;
      }
      setMsg?.(payload?.message || DEFAULT_MESSAGE);
      goHome?.(eventRoomId || roomId, { clearRoom: true });
      onKicked?.();
      navigateHome?.();
    };

    socket.on("kicked", handler);
    return () => socket.off("kicked", handler);
  }, [roomId, goHome, setMsg, navigateHome, onKicked]);
}
