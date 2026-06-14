/**
 * Board theme catalog — two finalized skins (Classic + Neon Slate).
 * Legacy theme ids remap for equipped cosmetics and achievement unlocks.
 */

export const THEME_IDS = ["classic", "neon_slate"];

export const THEME_CATEGORIES = {
  starter: "Starter",
  atmospheric: "Atmospheric",
};

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

const LEGACY_THEME_MAP = {
  default: "classic",
  space: "neon_slate",
  cyber: "neon_slate",
  retro: "classic",
  ninja: "classic",
  minimal_pro: "classic",
};

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

export function resolveThemeId(themeId) {
  if (!themeId) return DEFAULT_THEME_ID;
  const bare = LEGACY_THEME_MAP[themeId] || themeId;
  return RETIRED_THEME_MAP[bare] || bare;
}

export function getThemeById(themeId) {
  const resolved = resolveThemeId(themeId);
  return COSMETIC_THEMES[resolved] || COSMETIC_THEMES[DEFAULT_THEME_ID];
}

export function getPublicThemesList() {
  return THEME_IDS.map((id) => {
    const t = COSMETIC_THEMES[id];
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.category,
    };
  });
}
