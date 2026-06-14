import { buildApiUrl } from "../config";
import { sanitizePlayerName } from "./sanitize";

/**
 * Persist the lobby name to the user record for leaderboards.
 * @param {string | undefined | null} playerName
 */
export async function syncDisplayNameToServer(playerName) {
  const normalized = sanitizePlayerName(String(playerName || "").trim());
  if (!normalized) return;

  try {
    await fetch(buildApiUrl("/api/player/sync-display-name"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: normalized }),
    });
  } catch {
    // Non-blocking; leaderboard will update on next successful sync
  }
}
