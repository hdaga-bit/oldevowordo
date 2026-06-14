/**
 * Win animation catalog — overrides the default confetti burst on victory.
 *
 * `effect` maps to a preset name in client/src/components/ConfettiEffect.jsx
 * (`confetti`, `fireworks`, `stars`, `pixel`, `trophy`, `foil_sparkle`, etc.).
 */

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
  return COSMETIC_WIN_ANIMATIONS[id] || COSMETIC_WIN_ANIMATIONS[DEFAULT_WIN_ANIMATION_ID];
}

export function getPublicWinAnimationsList() {
  return WIN_ANIMATION_IDS.map((id) => {
    const w = COSMETIC_WIN_ANIMATIONS[id];
    return {
      id: w.id,
      name: w.name,
      description: w.description,
      icon: w.icon,
    };
  });
}
