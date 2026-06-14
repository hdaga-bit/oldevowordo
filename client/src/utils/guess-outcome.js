import { normalizeTileState, TILE_STATES } from "../config/tile-palette.js";

/** True when every tile in the pattern is correct (solved the word). */
export function isPatternSolved(pattern) {
  if (!Array.isArray(pattern) || pattern.length === 0) return false;
  return pattern.every(
    (s) => normalizeTileState(s) === TILE_STATES.CORRECT,
  );
}

/**
 * Player used all allowed guesses and did not solve on the final row.
 * @param {Array<{ guess?: string, pattern?: string[] }>} guesses
 * @param {number} maxGuesses
 */
export function failedAfterMaxGuesses(guesses, maxGuesses = 6) {
  if (!guesses?.length || guesses.length < maxGuesses) return false;
  const last = guesses[guesses.length - 1];
  return !isPatternSolved(last?.pattern);
}

/** Guess count on the winning row, or null if the latest row is not a solve. */
export function getWinningGuessCount(guesses) {
  if (!guesses?.length) return null;
  const last = guesses[guesses.length - 1];
  return isPatternSolved(last?.pattern) ? guesses.length : null;
}
