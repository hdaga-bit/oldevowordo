/** Client font pack tokens — must stay in sync with server. */

export const FONT_IDS = ["system", "mono", "brush", "art_deco", "pixel"];

export const COSMETIC_FONTS = {
  system: {
    id: "system",
    name: "System",
    description: "Clean, default sans-serif.",
    icon: "🔤",
    stack:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boardClass: "font-pack-system",
  },
  mono: {
    id: "mono",
    name: "Monospace",
    description: "Even spacing, typewriter feel.",
    icon: "⌨️",
    stack:
      '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace',
    boardClass: "font-pack-mono",
  },
  brush: {
    id: "brush",
    name: "Brush",
    description: "Hand-painted, expressive letters.",
    icon: "🖌️",
    stack: '"Bradley Hand", "Brush Script MT", "Comic Sans MS", cursive',
    boardClass: "font-pack-brush",
  },
  art_deco: {
    id: "art_deco",
    name: "Art Deco",
    description: "Tall, elegant serif with sharp edges.",
    icon: "🎩",
    stack: '"Cormorant Garamond", "Bodoni 72", "Didot", Georgia, serif',
    boardClass: "font-pack-art-deco",
  },
  pixel: {
    id: "pixel",
    name: "Pixel",
    description: "Chunky retro arcade letters.",
    icon: "👾",
    stack: '"Press Start 2P", "VT323", "Courier New", monospace',
    boardClass: "font-pack-pixel",
  },
};

export const DEFAULT_FONT_ID = "system";

export function getFontById(id) {
  return COSMETIC_FONTS[id] || COSMETIC_FONTS[DEFAULT_FONT_ID];
}

export function getFontListForPicker(unlockedIds = []) {
  const set = new Set(unlockedIds);
  return Object.values(COSMETIC_FONTS).map((f) => ({
    ...f,
    unlocked:
      f.id === DEFAULT_FONT_ID ||
      set.has(`font:${f.id}`) ||
      set.has(f.id),
  }));
}
