/** Tile points and speed bonus for daily skill leaderboards. */

export const TILE_POINTS = {
  green: 3,
  correct: 3,
  yellow: 1,
  present: 1,
  gray: 0,
  grey: 0,
  absent: 0,
};

export const GREEN_POINTS = 3;
export const YELLOW_POINTS = 1;
export const ATTEMPT_BONUS = 10;
export const MAX_ATTEMPTS = 6;

/**
 * @param {string[]} pattern
 * @returns {number}
 */
export function scoreRow(pattern) {
  if (!Array.isArray(pattern)) return 0;
  return pattern.reduce((sum, tile) => {
    const key = String(tile || "").toLowerCase();
    return sum + (TILE_POINTS[key] ?? 0);
  }, 0);
}

/**
 * @param {unknown} patterns - JSON array of per-guess patterns
 * @param {boolean} won
 * @returns {number}
 */
export function scoreGame(patterns, won) {
  if (!won || !Array.isArray(patterns) || patterns.length === 0) return 0;

  const rowScores = patterns.map((row) => scoreRow(row));
  const tileTotal = rowScores.reduce((a, b) => a + b, 0);
  const attempts = patterns.length;
  const speedBonus = Math.max(0, (MAX_ATTEMPTS + 1 - attempts) * ATTEMPT_BONUS);

  return tileTotal + speedBonus;
}

/**
 * @param {unknown} patterns
 * @param {boolean} won
 * @param {number | null | undefined} storedScore
 * @returns {number}
 */
export function resolveEfficiencyScore(patterns, won, storedScore) {
  if (storedScore != null && Number.isFinite(storedScore)) {
    return storedScore;
  }
  return scoreGame(patterns, won);
}
