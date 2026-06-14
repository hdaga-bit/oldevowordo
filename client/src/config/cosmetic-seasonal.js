/** Client seasonal theme tokens — must stay in sync with server. */

export const SEASONAL_IDS = ["cherry_blossom", "snowglobe"];

export const COSMETIC_SEASONALS = {
  cherry_blossom: {
    id: "cherry_blossom",
    name: "Cherry Blossom",
    description: "Spring petals drift across a soft pink board.",
    icon: "🌸",
    boardClass: "theme-seasonal-cherry-blossom",
    confetti: "petals",
    particles: "minimal",
    lighting: { glowColor: "#fb7185", pulse: true, intensity: 0.35 },
  },
  snowglobe: {
    id: "snowglobe",
    name: "Snowglobe",
    description: "Quiet winter board inside a glass dome.",
    icon: "❄️",
    boardClass: "theme-seasonal-snowglobe",
    confetti: "stars",
    particles: "minimal",
    lighting: { glowColor: "#bfdbfe", pulse: true, intensity: 0.35 },
  },
};

export function getSeasonalById(id) {
  return COSMETIC_SEASONALS[id] || null;
}
