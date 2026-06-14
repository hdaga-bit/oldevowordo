/**
 * Client board theme tokens — sync with server/progression/cosmetic-themes.js.
 * Two finalized skins: Classic (default) and Neon Slate (unlock / legacy remap).
 */

export const THEME_IDS = ["classic", "neon_slate"];

export const COSMETIC_THEMES = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Clean graphite board tuned for competitive readability.",
    icon: "◆",
    category: "starter",
    lighting: { glowColor: "#52525b", pulse: false, intensity: 0.06 },
    confetti: "confetti",
    particles: "victory",
    boardClass: "theme-classic",
  },
  neon_slate: {
    id: "neon_slate",
    name: "Neon Slate",
    description: "Cool atmospheric slate with a whisper of cyan on the grid.",
    icon: "◇",
    category: "atmospheric",
    lighting: { glowColor: "#38bdf8", pulse: false, intensity: 0.1 },
    confetti: "stars",
    particles: "minimal",
    boardClass: "theme-neon-slate",
  },
};

export const DEFAULT_THEME_ID = "classic";

/** Legacy bare ids (pre-overhaul). */
const LEGACY_THEME_MAP = {
  default: "classic",
  space: "neon_slate",
  cyber: "neon_slate",
  retro: "classic",
  ninja: "classic",
  minimal_pro: "classic",
};

/** Retired theme ids map to one of the two active skins. */
const RETIRED_THEME_MAP = {
  aurora: "neon_slate",
  liquid_mercury: "neon_slate",
  stained_glass: "neon_slate",
  origami: "classic",
  retro_arcade: "classic",
  ninja_village: "classic",
  cyber_synthwave: "neon_slate",
  trading_card: "neon_slate",
  botanical_garden: "classic",
  ceramic: "classic",
  library_inkwell: "classic",
  championship_gold: "classic",
  volcanic: "classic",
  constellation: "neon_slate",
};

const NEON_SLATE_UNLOCK_SOURCES = new Set(
  Object.entries(RETIRED_THEME_MAP)
    .filter(([, target]) => target === "neon_slate")
    .map(([id]) => id),
);

export function resolveLegacyThemeId(themeId) {
  if (!themeId) return DEFAULT_THEME_ID;
  const bare = LEGACY_THEME_MAP[themeId] || themeId;
  return RETIRED_THEME_MAP[bare] || bare;
}

export function getThemeById(themeId) {
  const resolved = resolveLegacyThemeId(themeId);
  return COSMETIC_THEMES[resolved] || COSMETIC_THEMES[DEFAULT_THEME_ID];
}

export function getEquippedTheme(user) {
  const themeId =
    user?.equippedTheme?.id ||
    user?.progression?.equippedTheme?.id ||
    user?.equippedCosmetics?.boardTheme ||
    user?.progression?.equippedCosmetics?.boardTheme ||
    DEFAULT_THEME_ID;
  return getThemeById(themeId);
}

function isNeonSlateUnlocked(unlockedSet) {
  if (unlockedSet.has("theme:neon_slate") || unlockedSet.has("neon_slate")) {
    return true;
  }
  for (const legacyId of NEON_SLATE_UNLOCK_SOURCES) {
    if (unlockedSet.has(`theme:${legacyId}`) || unlockedSet.has(legacyId)) {
      return true;
    }
  }
  return false;
}

export function getThemeListForPicker(unlockedIds = []) {
  const unlockedSet = new Set(unlockedIds.length ? unlockedIds : []);
  return Object.values(COSMETIC_THEMES).map((t) => ({
    ...t,
    unlocked:
      t.id === DEFAULT_THEME_ID ||
      (t.id === "neon_slate" && isNeonSlateUnlocked(unlockedSet)) ||
      unlockedSet.has(`theme:${t.id}`) ||
      unlockedSet.has(t.id),
  }));
}
