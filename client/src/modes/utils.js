export const emitAsync = (socket, event, payload) =>
  new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response));
  });

import { normalizeTileState, TILE_STATES } from "../config/tile-palette.js";

const LETTER_RANK = { correct: 3, present: 2, absent: 1 };

export const buildLetterStates = (guesses = []) => {
  const states = {};

  for (const row of guesses) {
    const word = row?.guess || "";
    for (let i = 0; i < 5; i++) {
      const ch = word[i]?.toUpperCase();
      if (!ch) continue;
      const state = normalizeTileState(row.pattern?.[i]);
      if (state === TILE_STATES.EMPTY) continue;
      if (!states[ch] || LETTER_RANK[state] > LETTER_RANK[states[ch]]) {
        states[ch] = state;
      }
    }
  }

  return states;
};
