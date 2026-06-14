/**
 * Seasonal board themes — limited windows that drive return visits.
 *
 * `getActiveSeasonal()` returns the currently active seasonal id (or null)
 * based on UTC month, with `ACTIVE_SEASONAL_ID` env override for dev/preview.
 */

export const SEASONAL_IDS = ["cherry_blossom", "snowglobe"];

export const COSMETIC_SEASONALS = {
  cherry_blossom: {
    id: "cherry_blossom",
    name: "Cherry Blossom",
    description: "Spring petals drift across a soft pink board.",
    icon: "🌸",
    boardClass: "theme-seasonal-cherry-blossom",
    months: [3, 4, 5],
    confetti: "petals",
    particles: "minimal",
    lighting: { glowColor: "#fb7185", pulse: true, intensity: 0.35 },
  },
  snowglobe: {
    id: "snowglobe",
    name: "Snowglobe",
    description: "Quiet winter board inside a glass dome.",
    icon: "❄️",
    boardClass: "theme-seasonal-snowglobe",
    months: [12, 1, 2],
    confetti: "stars",
    particles: "minimal",
    lighting: { glowColor: "#bfdbfe", pulse: true, intensity: 0.35 },
  },
};

export function getActiveSeasonal(now = new Date()) {
  const override = process.env.ACTIVE_SEASONAL_ID;
  if (override && COSMETIC_SEASONALS[override]) {
    return COSMETIC_SEASONALS[override];
  }
  const month = now.getUTCMonth() + 1;
  for (const id of SEASONAL_IDS) {
    const def = COSMETIC_SEASONALS[id];
    if (def.months.includes(month)) return def;
  }
  return null;
}

export function getPublicSeasonalsList() {
  return SEASONAL_IDS.map((id) => {
    const s = COSMETIC_SEASONALS[id];
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      months: s.months,
    };
  });
}
