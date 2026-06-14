/**
 * Font pack catalog — drives the `--board-font` CSS variable on game wrappers.
 *
 * Stack values use widely available web-safe fonts to avoid bundling new assets
 * in Tier 1. Higher-fidelity custom fonts can be added later via @font-face.
 */

export const FONT_IDS = ["system", "mono", "brush", "art_deco", "pixel"];

export const COSMETIC_FONTS = {
  system: {
    id: "system",
    name: "System",
    description: "Clean, default sans-serif.",
    icon: "🔤",
    stack:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  mono: {
    id: "mono",
    name: "Monospace",
    description: "Even spacing, typewriter feel.",
    icon: "⌨️",
    stack:
      '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace',
  },
  brush: {
    id: "brush",
    name: "Brush",
    description: "Hand-painted, expressive letters.",
    icon: "🖌️",
    stack: '"Bradley Hand", "Brush Script MT", "Comic Sans MS", cursive',
  },
  art_deco: {
    id: "art_deco",
    name: "Art Deco",
    description: "Tall, elegant serif with sharp edges.",
    icon: "🎩",
    stack: '"Cormorant Garamond", "Bodoni 72", "Didot", Georgia, serif',
  },
  pixel: {
    id: "pixel",
    name: "Pixel",
    description: "Chunky retro arcade letters.",
    icon: "👾",
    stack: '"Press Start 2P", "VT323", "Courier New", monospace',
  },
};

export const DEFAULT_FONT_ID = "system";

export function getFontById(id) {
  return COSMETIC_FONTS[id] || COSMETIC_FONTS[DEFAULT_FONT_ID];
}

export function getPublicFontsList() {
  return FONT_IDS.map((id) => {
    const f = COSMETIC_FONTS[id];
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      icon: f.icon,
    };
  });
}
