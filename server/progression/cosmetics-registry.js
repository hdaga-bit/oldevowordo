/**
 * Central cosmetics registry.
 *
 * - Defines the equip slots and their underlying catalogs.
 * - Provides namespaced unlock id helpers ("theme:aurora", "font:brush", ...).
 * - Migrates legacy bare ids ("default", "space", ...) to the new schema.
 *
 * `User.unlockedCosmetics` is stored as a flat string[] of namespaced ids.
 * `User.equippedCosmetics` is an object keyed by slot, with bare ids per slot.
 */

import {
  COSMETIC_THEMES,
  THEME_IDS,
  DEFAULT_THEME_ID,
  resolveThemeId,
} from "./cosmetic-themes.js";
import { getFontById } from "./cosmetic-fonts.js";
import { getCursorById } from "./cosmetic-cursors.js";
import { getWinAnimationById } from "./cosmetic-win-animations.js";
import { getSoundById } from "./cosmetic-sounds.js";
import {
  COSMETIC_FONTS,
  FONT_IDS,
  DEFAULT_FONT_ID,
} from "./cosmetic-fonts.js";
import {
  COSMETIC_CURSORS,
  CURSOR_IDS,
  DEFAULT_CURSOR_ID,
} from "./cosmetic-cursors.js";
import {
  COSMETIC_WIN_ANIMATIONS,
  WIN_ANIMATION_IDS,
  DEFAULT_WIN_ANIMATION_ID,
} from "./cosmetic-win-animations.js";
import {
  COSMETIC_SOUNDS,
  SOUND_IDS,
  DEFAULT_SOUND_ID,
} from "./cosmetic-sounds.js";

export const COSMETIC_SLOTS = {
  boardTheme: {
    prefix: "theme",
    catalog: COSMETIC_THEMES,
    ids: THEME_IDS,
    defaultId: DEFAULT_THEME_ID,
  },
  fontPack: {
    prefix: "font",
    catalog: COSMETIC_FONTS,
    ids: FONT_IDS,
    defaultId: DEFAULT_FONT_ID,
  },
  cursor: {
    prefix: "cursor",
    catalog: COSMETIC_CURSORS,
    ids: CURSOR_IDS,
    defaultId: DEFAULT_CURSOR_ID,
  },
  winAnimation: {
    prefix: "win",
    catalog: COSMETIC_WIN_ANIMATIONS,
    ids: WIN_ANIMATION_IDS,
    defaultId: DEFAULT_WIN_ANIMATION_ID,
  },
  soundPack: {
    prefix: "sound",
    catalog: COSMETIC_SOUNDS,
    ids: SOUND_IDS,
    defaultId: DEFAULT_SOUND_ID,
  },
};

export const SLOT_BY_PREFIX = Object.fromEntries(
  Object.entries(COSMETIC_SLOTS).map(([slot, def]) => [def.prefix, slot]),
);

/** Map legacy bare theme ids to active catalog ids (via resolveThemeId). */
export const LEGACY_THEME_MAP = {
  default: "classic",
  space: "neon_slate",
  cyber: "neon_slate",
  retro: "classic",
  ninja: "classic",
  minimal_pro: "classic",
};

export function formatUnlockId(slot, id) {
  const def = COSMETIC_SLOTS[slot];
  if (!def) return null;
  return `${def.prefix}:${id}`;
}

export function parseUnlockId(unlockId) {
  if (typeof unlockId !== "string" || !unlockId) return null;
  const colonIdx = unlockId.indexOf(":");
  if (colonIdx === -1) {
    // Legacy bare id — assume board theme.
    const migrated = resolveThemeId(LEGACY_THEME_MAP[unlockId] || unlockId);
    return COSMETIC_SLOTS.boardTheme.catalog[migrated]
      ? { slot: "boardTheme", prefix: "theme", id: migrated }
      : null;
  }
  const prefix = unlockId.slice(0, colonIdx);
  const rawId = unlockId.slice(colonIdx + 1);
  const slot = SLOT_BY_PREFIX[prefix];
  if (!slot) return null;
  const id =
    slot === "boardTheme" ? resolveThemeId(rawId) : rawId;
  if (!COSMETIC_SLOTS[slot].catalog[id]) return null;
  return { slot, prefix, id };
}

export function isValidUnlock(unlockId) {
  const parsed = parseUnlockId(unlockId);
  if (!parsed) return false;
  return !!COSMETIC_SLOTS[parsed.slot].catalog[parsed.id];
}

export function getDefaultEquipped() {
  const equipped = {};
  for (const [slot, def] of Object.entries(COSMETIC_SLOTS)) {
    equipped[slot] = def.defaultId;
  }
  return equipped;
}

export function getDefaultUnlocks() {
  return Object.values(COSMETIC_SLOTS).map(
    (def) => `${def.prefix}:${def.defaultId}`,
  );
}

export function getAllUnlockIds() {
  const ids = [];
  for (const def of Object.values(COSMETIC_SLOTS)) {
    for (const id of def.ids) {
      ids.push(`${def.prefix}:${id}`);
    }
  }
  return ids;
}

export function migrateLegacyUnlocks(rawList) {
  const set = new Set(getDefaultUnlocks());
  if (!Array.isArray(rawList)) return [...set];

  for (const entry of rawList) {
    if (typeof entry !== "string" || !entry) continue;

    if (entry.includes(":")) {
      const parsed = parseUnlockId(entry);
      if (parsed && COSMETIC_SLOTS[parsed.slot].catalog[parsed.id]) {
        set.add(formatUnlockId(parsed.slot, parsed.id));
      }
      continue;
    }

    const migrated = resolveThemeId(LEGACY_THEME_MAP[entry] || entry);
    if (COSMETIC_SLOTS.boardTheme.catalog[migrated]) {
      set.add(`theme:${migrated}`);
    }
  }

  return [...set];
}

export function resolveEquippedSlotId(slot, rawId) {
  const def = COSMETIC_SLOTS[slot];
  if (!def || rawId == null) return def?.defaultId;
  const id = String(rawId);
  if (slot === "boardTheme") {
    return resolveThemeId(LEGACY_THEME_MAP[id] || id);
  }
  if (slot === "fontPack") return getFontById(id).id;
  if (slot === "cursor") return getCursorById(id).id;
  if (slot === "winAnimation") return getWinAnimationById(id).id;
  if (slot === "soundPack") return getSoundById(id).id;
  return def.catalog[id] ? id : def.defaultId;
}

export function migrateLegacyEquipped(raw) {
  const defaults = getDefaultEquipped();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;

  const next = { ...defaults };

  if (typeof raw.boardTheme === "string") {
    next.boardTheme = resolveEquippedSlotId("boardTheme", raw.boardTheme);
  }

  for (const slot of ["fontPack", "cursor", "winAnimation", "soundPack"]) {
    if (typeof raw[slot] === "string") {
      next[slot] = resolveEquippedSlotId(slot, raw[slot]);
    }
  }

  return next;
}

/**
 * Returns true if the user has unlocked the slot id (e.g. has "theme:aurora").
 * Default slot ids are always considered unlocked.
 */
const NEON_SLATE_LEGACY_UNLOCKS = new Set([
  "aurora",
  "liquid_mercury",
  "stained_glass",
  "cyber_synthwave",
  "trading_card",
  "constellation",
]);

export function isSlotIdUnlocked(unlockedList, slot, id) {
  const def = COSMETIC_SLOTS[slot];
  if (!def) return false;
  if (id === def.defaultId) return true;
  if (!Array.isArray(unlockedList)) return false;

  const namespaced = `${def.prefix}:${id}`;
  if (unlockedList.includes(namespaced)) return true;

  if (slot === "boardTheme" && id === "neon_slate") {
    for (const legacyId of NEON_SLATE_LEGACY_UNLOCKS) {
      if (
        unlockedList.includes(`theme:${legacyId}`) ||
        unlockedList.includes(legacyId)
      ) {
        return true;
      }
    }
  }

  return unlockedList.includes(id);
}
