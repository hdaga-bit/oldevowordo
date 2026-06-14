/** Display name for leaderboard rows (never empty / generic "Anonymous"). */

import { isPlaceholderDisplayName } from "./player-profile.js";

export const LEADERBOARD_USER_FILTER = {
  mergedIntoUserId: null,
};

/**
 * @param {{ displayName?: string | null, username?: string | null, email?: string | null, id?: string }} user
 * @returns {string}
 */
export function resolveLeaderboardName(user) {
  if (!user) return "Player";

  const display =
    typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (display && !isPlaceholderDisplayName(display)) return display;

  const username =
    typeof user.username === "string" ? user.username.trim() : "";
  if (username) return username;

  const email = typeof user.email === "string" ? user.email.trim() : "";
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  if (user.id) {
    return `Player ${String(user.id).slice(-6)}`;
  }

  return "Player";
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function decorateLeaderboardRow(row) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    leaderboardName: resolveLeaderboardName(row),
  };
}

/**
 * @param {unknown[]} rows
 * @returns {Record<string, unknown>[]}
 */
export function decorateLeaderboardRows(rows) {
  return Array.isArray(rows) ? rows.map(decorateLeaderboardRow) : [];
}
