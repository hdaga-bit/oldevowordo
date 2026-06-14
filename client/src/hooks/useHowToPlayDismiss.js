import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  dismissHomeHowToPlay,
  dismissModeHelp,
  wasHomeHowToPlayDismissed,
  wasModeHelpDismissed,
} from "../config/mode-help.js";

/**
 * Per-player how-to-play dismiss state (home or a game mode).
 * Waits for auth so guests and signed-in users get stable user ids.
 */
export function useHowToPlayDismiss(scope) {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const ready = !isLoading && Boolean(userId);

  const dismissed =
    ready &&
    (scope === "home"
      ? wasHomeHowToPlayDismissed(userId)
      : wasModeHelpDismissed(scope, userId));

  const dismiss = useCallback(() => {
    if (!userId) return;
    if (scope === "home") {
      dismissHomeHowToPlay(userId);
    } else {
      dismissModeHelp(scope, userId);
    }
  }, [scope, userId]);

  return { ready, dismissed, dismiss, userId };
}
