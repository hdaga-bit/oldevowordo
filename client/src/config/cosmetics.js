/**
 * Client-side cosmetics resolver.
 *
 * Reads `user.progression.equippedCosmetics` (plus legacy fields) and returns
 * a `{ theme, font, cursor, winAnimation, sound }` bundle, with safe defaults
 * for unauthenticated users or older accounts.
 */

import {
  COSMETIC_THEMES,
  DEFAULT_THEME_ID,
  getEquippedTheme,
  getThemeById,
} from "./cosmetic-themes";
import {
  COSMETIC_FONTS,
  DEFAULT_FONT_ID,
  getFontById,
} from "./cosmetic-fonts";
import {
  COSMETIC_CURSORS,
  DEFAULT_CURSOR_ID,
  getCursorById,
} from "./cosmetic-cursors";
import {
  COSMETIC_WIN_ANIMATIONS,
  DEFAULT_WIN_ANIMATION_ID,
  getWinAnimationById,
} from "./cosmetic-win-animations";
import {
  COSMETIC_SOUNDS,
  DEFAULT_SOUND_ID,
  getSoundPackById,
} from "./cosmetic-sounds";
import { cn } from "../lib/utils";
import { resolveEquippedSlots, getEquippedRecord } from "./cosmetic-equip.js";

export const COSMETIC_SLOT_META = {
  boardTheme: { catalog: COSMETIC_THEMES, defaultId: DEFAULT_THEME_ID, prefix: "theme" },
  fontPack: { catalog: COSMETIC_FONTS, defaultId: DEFAULT_FONT_ID, prefix: "font" },
  cursor: { catalog: COSMETIC_CURSORS, defaultId: DEFAULT_CURSOR_ID, prefix: "cursor" },
  winAnimation: {
    catalog: COSMETIC_WIN_ANIMATIONS,
    defaultId: DEFAULT_WIN_ANIMATION_ID,
    prefix: "win",
  },
  soundPack: { catalog: COSMETIC_SOUNDS, defaultId: DEFAULT_SOUND_ID, prefix: "sound" },
};

function getEquippedFromUser(user) {
  const raw = getEquippedRecord(user);
  return Object.keys(raw).length > 0 ? resolveEquippedSlots(raw) : null;
}

function getUnlockedFromUser(user) {
  return (
    user?.progression?.unlockedCosmetics ||
    user?.unlockedCosmetics ||
    []
  );
}

export function getEquippedBundle(user) {
  const equipped = getEquippedFromUser(user) || resolveEquippedSlots({});
  return {
    theme: getThemeById(equipped.boardTheme),
    font: getFontById(equipped.fontPack),
    cursor: getCursorById(equipped.cursor),
    winAnimation: getWinAnimationById(equipped.winAnimation),
    sound: getSoundPackById(equipped.soundPack),
  };
}

/**
 * Build an `equippedCosmetics` object from resolved bundle entries (profile props).
 */
export function equippedCosmeticsFromBundle(bundle) {
  if (!bundle?.theme?.id) return null;
  return {
    boardTheme: bundle.theme.id,
    fontPack: bundle.font?.id,
    cursor: bundle.cursor?.id,
    winAnimation: bundle.winAnimation?.id,
    soundPack: bundle.sound?.id,
  };
}

function resolvePlayerEquipped(player, fallbackEquipped) {
  const fromRoom =
    player?.equippedCosmetics && typeof player.equippedCosmetics === "object"
      ? player.equippedCosmetics
      : null;
  const hasBoardTheme =
    fromRoom?.boardTheme != null && String(fromRoom.boardTheme).length > 0;
  if (hasBoardTheme) return fromRoom;
  if (fallbackEquipped && typeof fallbackEquipped === "object") {
    return { ...fallbackEquipped, ...(fromRoom || {}) };
  }
  return fromRoom || {};
}

/**
 * Cosmetics bundle for a room player (`room.players[id].equippedCosmetics`).
 *
 * Pass `fallbackEquipped` (e.g. from the logged-in profile) when the room
 * snapshot has not yet included cosmetics — avoids forcing `theme-classic` dark
 * tiles while the GameLayout wrapper already shows the profile theme.
 *
 * Cursor and sound pack only matter for the local user; remotes keep defaults.
 */
export function getPlayerCosmeticBundle(player, fallbackEquipped = null) {
  const equipped = resolveEquippedSlots(
    resolvePlayerEquipped(player, fallbackEquipped) || {},
  );
  return {
    theme: getThemeById(equipped.boardTheme),
    font: getFontById(equipped.fontPack),
    cursor: getCursorById(equipped.cursor),
    winAnimation: getWinAnimationById(equipped.winAnimation),
    sound: getSoundPackById(equipped.soundPack),
  };
}

/** CSS classes to wrap a board so tile variables inherit from the owner's theme. */
export function getBoardWrapperClasses(bundle) {
  return cn(bundle?.theme?.boardClass, bundle?.font?.boardClass);
}

/** Themed board shell — matches /dev/lab board preview framing. */
export function getBoardPreviewShellClasses(bundle, extra = "") {
  return cn(
    "board-shell rounded-2xl p-4 min-h-0 w-full h-full flex flex-col",
    getBoardWrapperClasses(bundle),
    extra,
  );
}

export function isSlotIdUnlocked(user, slot, id) {
  const meta = COSMETIC_SLOT_META[slot];
  if (!meta) return false;
  if (id === meta.defaultId) return true;
  const unlocked = getUnlockedFromUser(user);
  if (!Array.isArray(unlocked)) return false;
  return unlocked.includes(`${meta.prefix}:${id}`);
}

export { getThemeById };
