/**
 * Cursor trail catalog — drives the CursorTrail overlay on the client.
 *
 * Each entry describes color palette + style hint; the renderer respects
 * reduced-motion and disables itself when `id === "none"`.
 */

export const CURSOR_IDS = ["none", "spark", "ink", "pixel", "neon"];

export const COSMETIC_CURSORS = {
  none: {
    id: "none",
    name: "None",
    description: "No cursor trail.",
    icon: "🚫",
    palette: [],
    style: "none",
  },
  spark: {
    id: "spark",
    name: "Spark",
    description: "Tiny warm sparks follow the cursor.",
    icon: "✨",
    palette: ["#fde68a", "#fb923c", "#f97316"],
    style: "spark",
  },
  ink: {
    id: "ink",
    name: "Ink",
    description: "Calligraphic ink ribbon.",
    icon: "🖋️",
    palette: ["#1f2937", "#374151", "#0f172a"],
    style: "ink",
  },
  pixel: {
    id: "pixel",
    name: "Pixel",
    description: "Blocky 8-bit dots fall behind the cursor.",
    icon: "👾",
    palette: ["#22c55e", "#eab308", "#3b82f6", "#ef4444"],
    style: "pixel",
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Magenta and cyan light trail.",
    icon: "💡",
    palette: ["#ec4899", "#06b6d4", "#a855f7"],
    style: "neon",
  },
};

export const DEFAULT_CURSOR_ID = "none";

export function getCursorById(id) {
  return COSMETIC_CURSORS[id] || COSMETIC_CURSORS[DEFAULT_CURSOR_ID];
}

export function getPublicCursorsList() {
  return CURSOR_IDS.map((id) => {
    const c = COSMETIC_CURSORS[id];
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
    };
  });
}
