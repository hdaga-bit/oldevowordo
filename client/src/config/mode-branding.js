/** Shared accent colors for mode marks, cards, and open rooms */
export const MODE_ACCENT = {
  duel: "#F43F5E",
  battle: "#FB923C",
  battle_ai: "#A855F7",
  shared: "#22D3EE",
  daily: "#4ADE80",
};

export const MODE_LABELS = {
  duel: "Duel",
  battle: "Battle Royale",
  battle_ai: "AI Battle",
  shared: "Shared Duel",
  daily: "Daily",
};

export function getModeAccent(mode) {
  return MODE_ACCENT[mode] ?? "#71717a";
}
