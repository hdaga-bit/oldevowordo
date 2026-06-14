/**
 * Single source of truth for Wordle feedback colors (board tiles + keyboard).
 * Always read via CSS variables so cosmetic themes only affect empty/typed tiles.
 */

export const TILE_STATES = {
  CORRECT: "correct",
  PRESENT: "present",
  ABSENT: "absent",
  EMPTY: "empty",
};

/** Normalize server / legacy pattern tokens to canonical tile states. */
export function normalizeTileState(state) {
  if (!state) return TILE_STATES.EMPTY;
  const s = String(state).toLowerCase();
  if (s === "green" || s === "correct") return TILE_STATES.CORRECT;
  if (s === "yellow" || s === "present") return TILE_STATES.PRESENT;
  if (s === "gray" || s === "grey" || s === "absent") return TILE_STATES.ABSENT;
  return TILE_STATES.EMPTY;
}

/** CSS custom properties for each face (board + keyboard). */
export const TILE_CSS = {
  [TILE_STATES.CORRECT]: {
    bg: "--tile-correct-bg",
    fg: "--tile-correct-fg",
    border: "--tile-correct-bg",
  },
  [TILE_STATES.PRESENT]: {
    bg: "--tile-present-bg",
    fg: "--tile-present-fg",
    border: "--tile-present-bg",
  },
  [TILE_STATES.ABSENT]: {
    bg: "--tile-absent-bg",
    fg: "--tile-absent-fg",
    border: "--tile-absent-bg",
  },
  empty: {
    bg: "--tile-empty-bg",
    fg: "--tile-text",
    border: "--tile-empty-border",
  },
  typed: {
    bg: "--tile-typed-bg",
    fg: "--tile-text",
    border: "--tile-empty-border",
  },
};

export const KEY_CSS = {
  [TILE_STATES.CORRECT]: {
    bg: "--key-correct-bg",
    fg: "--key-correct-fg",
    border: "--key-correct-border",
  },
  [TILE_STATES.PRESENT]: {
    bg: "--key-present-bg",
    fg: "--key-present-fg",
    border: "--key-present-border",
  },
  [TILE_STATES.ABSENT]: {
    bg: "--key-absent-bg",
    fg: "--key-absent-fg",
    border: "--key-absent-border",
  },
  idle: {
    bg: "--key-idle-bg",
    fg: "--key-idle-fg",
    border: "--key-idle-border",
  },
};

/** Wordle defaults when no themed ancestor is present. */
export const FALLBACK_TILE = {
  correct: { bg: "#5a9e56", fg: "#ffffff", border: "#5a9e56" },
  present: { bg: "#b8a04a", fg: "#ffffff", border: "#b8a04a" },
  absent: { bg: "#52525b", fg: "#e4e4e7", border: "#52525b" },
  empty: { bg: "#0f1114", fg: "#f4f4f5", border: "rgba(63, 63, 70, 0.38)" },
  typed: { bg: "#16181c", fg: "#f4f4f5", border: "rgba(63, 63, 70, 0.38)" },
};

export const FALLBACK_KEY = {
  correct: FALLBACK_TILE.correct,
  present: FALLBACK_TILE.present,
  absent: FALLBACK_TILE.absent,
  idle: { bg: "#27272a", fg: "#d4d4d8", border: "#3f3f46" },
};

export function readCssColor(varsRoot, varName, fallback) {
  if (typeof window === "undefined") return fallback;
  const el = varsRoot?.current || document.documentElement;
  const value = getComputedStyle(el).getPropertyValue(varName).trim();
  return value || fallback;
}

export function swatchFromVars(varsRoot, cssMap, fallbacks) {
  return {
    bg: readCssColor(varsRoot, cssMap.bg, fallbacks.bg),
    fg: readCssColor(varsRoot, cssMap.fg, fallbacks.fg),
    border: readCssColor(varsRoot, cssMap.border, fallbacks.border),
  };
}
