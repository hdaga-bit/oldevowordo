import { DEFAULT_THEME_ID } from "./cosmetic-themes.js";

/** XP required to reach each level (index = level - 1). Level 1 starts at 0 XP. */
export const LEVEL_XP_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000,
];

export const XP_GRANTS = {
  DAILY_WIN: 50,
  DAILY_LOSS: 15,
  DUEL_WIN: 40,
  FIRST_DAILY_BONUS: 20,
};

/**
 * Level milestones — namespaced unlock ids ("theme:aurora", "font:brush", ...).
 * `rewardThemeId` is kept for legacy snapshot consumers but `rewardUnlocks`
 * drives all actual unlock logic.
 */
export const LEVEL_MILESTONES = [
  {
    level: 2,
    rewardUnlocks: ["theme:aurora"],
    rewardThemeId: "aurora",
  },
  {
    level: 3,
    rewardUnlocks: ["font:mono", "sound:asmr_clack"],
    rewardThemeId: null,
  },
  {
    level: 4,
    rewardUnlocks: ["theme:retro_arcade", "font:pixel", "cursor:pixel"],
    rewardThemeId: "retro_arcade",
  },
  {
    level: 5,
    rewardUnlocks: ["theme:botanical_garden"],
    rewardThemeId: "botanical_garden",
  },
  {
    level: 6,
    rewardUnlocks: ["theme:library_inkwell", "font:art_deco"],
    rewardThemeId: "library_inkwell",
  },
  {
    level: 7,
    rewardUnlocks: ["theme:cyber_synthwave", "cursor:neon", "sound:chiptune"],
    rewardThemeId: "cyber_synthwave",
  },
  {
    level: 8,
    rewardUnlocks: ["theme:ceramic", "win:mic_drop"],
    rewardThemeId: "ceramic",
  },
  {
    level: 9,
    rewardUnlocks: ["theme:stained_glass", "win:fireworks"],
    rewardThemeId: "stained_glass",
  },
  {
    level: 10,
    rewardUnlocks: ["theme:liquid_mercury", "sound:orchestral"],
    rewardThemeId: "liquid_mercury",
  },
  {
    level: 11,
    rewardUnlocks: ["theme:championship_gold"],
    rewardThemeId: "championship_gold",
  },
];

export const ACHIEVEMENTS = [
  {
    id: "first_daily",
    title: "First Steps",
    description: "Complete your first daily challenge.",
    category: "daily",
    rewardUnlocks: [`theme:${DEFAULT_THEME_ID}`],
    rewardThemeId: DEFAULT_THEME_ID,
    condition: { type: "daily_completed", min: 1 },
  },
  {
    id: "daily_winner",
    title: "Daily Victor",
    description: "Win 5 daily challenges.",
    category: "daily",
    rewardUnlocks: ["cursor:spark"],
    rewardThemeId: null,
    condition: { type: "daily_wins", min: 5 },
  },
  {
    id: "streak_3",
    title: "On a Roll",
    description: "Reach a 3-day daily win streak.",
    category: "streak",
    rewardUnlocks: ["theme:constellation"],
    rewardThemeId: "constellation",
    condition: { type: "streak", min: 3 },
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Reach a 7-day daily win streak.",
    category: "streak",
    rewardUnlocks: ["theme:origami", "font:brush"],
    rewardThemeId: "origami",
    condition: { type: "streak", min: 7 },
  },
  {
    id: "speed_3",
    title: "Speed Reader",
    description: "Solve the daily in 3 guesses or fewer.",
    category: "skill",
    rewardUnlocks: ["theme:cyber_synthwave"],
    rewardThemeId: "cyber_synthwave",
    condition: { type: "daily_win_attempts", max: 3 },
  },
  {
    id: "speed_2",
    title: "Mind Reader",
    description: "Solve the daily in 2 guesses or fewer.",
    category: "skill",
    rewardUnlocks: ["win:dunk"],
    rewardThemeId: null,
    condition: { type: "daily_win_attempts", max: 2 },
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Solve the daily in 1 guess.",
    category: "skill",
    rewardUnlocks: ["theme:ninja_village", "win:kanji_stamp", "cursor:ink"],
    rewardThemeId: "ninja_village",
    condition: { type: "daily_win_attempts", max: 1 },
  },
  {
    id: "duelist",
    title: "Duelist",
    description: "Win your first duel round.",
    category: "multiplayer",
    rewardUnlocks: ["theme:trading_card"],
    rewardThemeId: "trading_card",
    condition: { type: "duel_wins", min: 1 },
  },
  {
    id: "duel_veteran",
    title: "Arena Veteran",
    description: "Win 10 duel rounds.",
    category: "multiplayer",
    rewardUnlocks: ["theme:volcanic"],
    rewardThemeId: "volcanic",
    condition: { type: "duel_wins", min: 10 },
  },
  {
    id: "dedicated",
    title: "Dedicated",
    description: "Win 10 daily challenges total.",
    category: "daily",
    rewardUnlocks: ["theme:ceramic"],
    rewardThemeId: "ceramic",
    condition: { type: "daily_wins", min: 10 },
  },
  {
    id: "level_5",
    title: "Rising Star",
    description: "Reach account level 5.",
    category: "progression",
    rewardUnlocks: ["sound:chiptune"],
    rewardThemeId: null,
    condition: { type: "level", min: 5 },
  },
  {
    id: "level_10",
    title: "Wordle Master",
    description: "Reach account level 10.",
    category: "progression",
    rewardUnlocks: ["theme:championship_gold"],
    rewardThemeId: "championship_gold",
    condition: { type: "level", min: 10 },
  },
];

export function levelFromXp(xp) {
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(level) {
  if (level >= LEVEL_XP_THRESHOLDS.length) {
    return null;
  }
  return LEVEL_XP_THRESHOLDS[level];
}

export function xpProgressInLevel(xp, level) {
  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = xpForNextLevel(level);
  if (nextThreshold == null) {
    return { current: xp - currentThreshold, needed: 0, percent: 100 };
  }
  const needed = nextThreshold - currentThreshold;
  const current = xp - currentThreshold;
  const percent = needed > 0 ? Math.min(100, Math.round((current / needed) * 100)) : 100;
  return { current, needed, percent };
}

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getPublicAchievementsList() {
  return ACHIEVEMENTS.map(
    ({ id, title, description, category, rewardThemeId, rewardUnlocks, condition }) => ({
      id,
      title,
      description,
      category,
      rewardThemeId,
      rewardUnlocks: rewardUnlocks || [],
      conditionType: condition.type,
    }),
  );
}
