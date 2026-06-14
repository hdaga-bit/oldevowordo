/**
 * Normalized equipped-cosmetic slots for profile UI + client resolution.
 */

import { resolveLegacyThemeId } from "./cosmetic-themes";
import { DEFAULT_FONT_ID, getFontById } from "./cosmetic-fonts";
import { DEFAULT_CURSOR_ID, getCursorById } from "./cosmetic-cursors";
import {
  DEFAULT_WIN_ANIMATION_ID,
  getWinAnimationById,
} from "./cosmetic-win-animations";
import { DEFAULT_SOUND_ID, getSoundPackById } from "./cosmetic-sounds";
import { getThemeById } from "./cosmetic-themes";

export function getEquippedRecord(user) {
  return (
    user?.progression?.equippedCosmetics ||
    user?.equippedCosmetics ||
    {}
  );
}

/** Canonical slot ids safe for picker selection and API payloads. */
export function resolveEquippedSlots(raw = {}) {
  return {
    boardTheme: getThemeById(resolveLegacyThemeId(raw.boardTheme)).id,
    fontPack: getFontById(raw.fontPack).id,
    cursor: getCursorById(raw.cursor).id,
    winAnimation: getWinAnimationById(raw.winAnimation).id,
    soundPack: getSoundPackById(raw.soundPack).id,
  };
}

export function readCustomiseForm(user) {
  const equipped = resolveEquippedSlots(getEquippedRecord(user));
  return {
    displayName: user?.displayName || "",
    profileAvatar: user?.profileAvatar ?? null,
    profileColour: user?.profileColour ?? null,
    ...equipped,
  };
}

/** Partial `equippedCosmetics` patch for changed slots only. */
export function buildEquippedCosmeticsPatch(saved, next) {
  const patch = {};
  if (next.boardTheme !== saved.boardTheme) patch.boardTheme = next.boardTheme;
  if (next.fontPack !== saved.fontPack) patch.fontPack = next.fontPack;
  if (next.cursor !== saved.cursor) patch.cursor = next.cursor;
  if (next.winAnimation !== saved.winAnimation) patch.winAnimation = next.winAnimation;
  if (next.soundPack !== saved.soundPack) patch.soundPack = next.soundPack;
  return patch;
}

export function buildProfileUpdatePatch(saved, form) {
  const updates = {};

  const trimmedName = form.displayName.trim();
  if (trimmedName !== (saved.displayName || "")) {
    updates.displayName = trimmedName || null;
  }
  if (form.profileAvatar !== saved.profileAvatar) {
    updates.profileAvatar = form.profileAvatar;
  }
  if (form.profileColour !== saved.profileColour) {
    updates.profileColour = form.profileColour;
  }

  const equippedPatch = buildEquippedCosmeticsPatch(saved, form);
  if (Object.keys(equippedPatch).length > 0) {
    updates.equippedCosmetics = equippedPatch;
  }

  return updates;
}

export function hasCustomiseChanges(saved, form) {
  return Object.keys(buildProfileUpdatePatch(saved, form)).length > 0;
}

function unlockSet(unlockedIds = []) {
  return new Set(Array.isArray(unlockedIds) ? unlockedIds : []);
}

export function isCosmeticUnlocked(unlockedIds, prefix, id, defaultId) {
  if (id === defaultId) return true;
  const set = unlockSet(unlockedIds);
  return set.has(`${prefix}:${id}`) || set.has(id);
}
