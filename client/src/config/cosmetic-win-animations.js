/** Client win-animation tokens — must stay in sync with server. */

export const WIN_ANIMATION_IDS = [
  "confetti",
  "fireworks",
  "kanji_stamp",
  "dunk",
  "mic_drop",
];

export const COSMETIC_WIN_ANIMATIONS = {
  confetti: {
    id: "confetti",
    name: "Confetti",
    description: "Classic colorful confetti burst.",
    icon: "🎉",
    effect: "confetti",
  },
  fireworks: {
    id: "fireworks",
    name: "Fireworks",
    description: "Star bursts arc across the screen.",
    icon: "🎆",
    effect: "stars",
  },
  kanji_stamp: {
    id: "kanji_stamp",
    name: "Kanji Stamp",
    description: "Ink stamp slams onto the board.",
    icon: "🥷",
    effect: "ink_splash",
  },
  dunk: {
    id: "dunk",
    name: "Dunk",
    description: "Explosive pixel celebration.",
    icon: "🏀",
    effect: "pixel",
  },
  mic_drop: {
    id: "mic_drop",
    name: "Mic Drop",
    description: "Subtle drop with foil sparkle.",
    icon: "🎤",
    effect: "foil_sparkle",
  },
};

export const DEFAULT_WIN_ANIMATION_ID = "confetti";

export function getWinAnimationById(id) {
  return (
    COSMETIC_WIN_ANIMATIONS[id] ||
    COSMETIC_WIN_ANIMATIONS[DEFAULT_WIN_ANIMATION_ID]
  );
}

export function getWinAnimationListForPicker(unlockedIds = []) {
  const set = new Set(unlockedIds);
  return Object.values(COSMETIC_WIN_ANIMATIONS).map((w) => ({
    ...w,
    unlocked:
      w.id === DEFAULT_WIN_ANIMATION_ID ||
      set.has(`win:${w.id}`) ||
      set.has(w.id),
  }));
}
