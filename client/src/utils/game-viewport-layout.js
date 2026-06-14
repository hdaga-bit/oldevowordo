/**
 * Viewport-based gameplay layout metrics (NYT Wordle–style).
 * Boards scale inside a fixed shell; the page does not scroll during play.
 */

/** @typedef {'daily' | 'duel-single' | 'duel-dual' | 'shared' | 'battle' | 'spectate'} GameLayoutPreset */

const ROWS = 6;
const COLS = 5;

const PRESETS = {
  daily: {
    maxTile: 62,
    maxTileMobile: 48,
    minTile: 36,
    boardGap: 5,
    boardPadding: 8,
    keyboardMaxWidth: 500,
    stackMaxWidth: 360,
  },
  "duel-single": {
    maxTile: 62,
    maxTileMobile: 48,
    minTile: 36,
    boardGap: 8,
    boardPadding: 10,
    keyboardMaxWidth: 500,
    stackMaxWidth: 400,
  },
  "duel-dual": {
    maxTile: 54,
    maxTileMobile: 48,
    minTile: 32,
    boardGap: 8,
    boardPadding: 10,
    keyboardMaxWidth: 1100,
    stackMaxWidth: 1200,
  },
  shared: {
    maxTile: 62,
    maxTileMobile: 48,
    minTile: 36,
    boardGap: 8,
    boardPadding: 8,
    keyboardMaxWidth: 500,
    stackMaxWidth: 400,
  },
  battle: {
    maxTile: 62,
    maxTileMobile: 48,
    minTile: 36,
    boardGap: 8,
    boardPadding: 10,
    keyboardMaxWidth: 500,
    stackMaxWidth: 440,
  },
  spectate: {
    maxTile: 48,
    maxTileMobile: 40,
    minTile: 32,
    boardGap: 8,
    boardPadding: 8,
    keyboardMaxWidth: 0,
    stackMaxWidth: 1400,
  },
};

/**
 * Tile limits + spacing for Board autoFit inside a flex board zone.
 * @param {object} opts
 * @param {GameLayoutPreset} [opts.layout]
 * @param {boolean} [opts.isMobile]
 * @param {boolean} [opts.isDualBoard]
 */
export function getViewportTileLimits({
  layout = "daily",
  isMobile = false,
  isDualBoard = false,
} = {}) {
  const preset = PRESETS[layout] || PRESETS.daily;
  const useDual = isDualBoard && !isMobile;
  const maxTile = isMobile ? preset.maxTileMobile : preset.maxTile;

  return {
    minTile: preset.minTile,
    maxTile,
    boardGap: preset.boardGap,
    boardPadding: preset.boardPadding,
    keyboardMaxWidth: useDual
      ? PRESETS["duel-dual"].keyboardMaxWidth
      : preset.keyboardMaxWidth,
    stackMaxWidth: useDual
      ? PRESETS["duel-dual"].stackMaxWidth
      : preset.stackMaxWidth,
    rows: ROWS,
    cols: COLS,
  };
}
