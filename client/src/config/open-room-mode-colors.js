import { MODE_ACCENT } from "./mode-branding";

/** Accent colors for open-room cards (badge, border, glow) */
export const OPEN_ROOM_MODE_COLORS = {
  ...MODE_ACCENT,
  ai: MODE_ACCENT.battle_ai,
};

const FALLBACK_ACCENT = "#71717a";

export function getOpenRoomAccent(mode) {
  if (!mode) return FALLBACK_ACCENT;
  return OPEN_ROOM_MODE_COLORS[mode] ?? FALLBACK_ACCENT;
}

/** @param {string} hex @param {number} alpha 0–1 */
export function hexToRgba(hex, alpha = 1) {
  const h = String(hex).replace("#", "");
  if (h.length !== 6) return `rgba(113, 113, 122, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
