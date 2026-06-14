import { PrismaClient } from "@prisma/client";
import {
  ACHIEVEMENTS,
  LEVEL_MILESTONES,
  LEVEL_XP_THRESHOLDS,
  XP_GRANTS,
  getAchievementById,
  getPublicAchievementsList,
  levelFromXp,
  xpForNextLevel,
  xpProgressInLevel,
} from "./catalog.js";
import {
  COSMETIC_THEMES,
  DEFAULT_THEME_ID,
  getPublicThemesList,
  getThemeById,
} from "./cosmetic-themes.js";
import { getPublicFontsList, getFontById } from "./cosmetic-fonts.js";
import { getPublicCursorsList, getCursorById } from "./cosmetic-cursors.js";
import {
  getPublicWinAnimationsList,
  getWinAnimationById,
} from "./cosmetic-win-animations.js";
import { getPublicSoundsList, getSoundById } from "./cosmetic-sounds.js";
import {
  getActiveSeasonal,
  getPublicSeasonalsList,
} from "./cosmetic-seasonal.js";
import {
  COSMETIC_SLOTS,
  formatUnlockId,
  getAllUnlockIds,
  getDefaultEquipped,
  getDefaultUnlocks,
  isSlotIdUnlocked,
  migrateLegacyEquipped,
  migrateLegacyUnlocks,
  parseUnlockId,
  resolveEquippedSlotId,
} from "./cosmetics-registry.js";

const prisma = new PrismaClient();

function buildRewardItem(unlockId) {
  const parsed = parseUnlockId(unlockId);
  if (!parsed) return null;
  const def = COSMETIC_SLOTS[parsed.slot];
  const item = def.catalog[parsed.id];
  if (!item) return null;
  return {
    type: parsed.prefix,
    slot: parsed.slot,
    unlockId,
    id: parsed.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
  };
}

async function ensureDefaultUnlocks(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unlockedCosmetics: true },
  });
  if (!user) return getDefaultUnlocks();

  const migrated = migrateLegacyUnlocks(user.unlockedCosmetics);
  const existing = Array.isArray(user.unlockedCosmetics)
    ? user.unlockedCosmetics
    : [];
  const needsPersist =
    existing.length !== migrated.length ||
    existing.some((entry, i) => entry !== migrated[i]);

  if (needsPersist) {
    await prisma.user.update({
      where: { id: userId },
      data: { unlockedCosmetics: migrated },
    });
  }
  return migrated;
}

async function unlockCosmetic(userId, unlockId) {
  const parsed = parseUnlockId(unlockId);
  if (!parsed) return false;
  const def = COSMETIC_SLOTS[parsed.slot];
  if (!def.catalog[parsed.id]) return false;

  const normalized = formatUnlockId(parsed.slot, parsed.id);
  const list = await ensureDefaultUnlocks(userId);
  if (list.includes(normalized)) return false;
  list.push(normalized);
  await prisma.user.update({
    where: { id: userId },
    data: { unlockedCosmetics: list },
  });
  return true;
}

async function unlockAchievement(userId, achievementId, meta = null) {
  const def = getAchievementById(achievementId);
  if (!def) return null;

  try {
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        meta: meta || undefined,
      },
    });
  } catch (error) {
    if (error.code === "P2002") return null;
    throw error;
  }

  const rewards = [];
  const rewardIds = Array.isArray(def.rewardUnlocks)
    ? def.rewardUnlocks
    : def.rewardThemeId
    ? [`theme:${def.rewardThemeId}`]
    : [];

  for (const rewardId of rewardIds) {
    const newlyUnlocked = await unlockCosmetic(userId, rewardId);
    if (newlyUnlocked) {
      const item = buildRewardItem(rewardId);
      if (item) rewards.push(item);
    }
  }

  return {
    achievementId,
    title: def.title,
    description: def.description,
    rewards,
  };
}

function evaluateCondition(condition, stats, context) {
  switch (condition.type) {
    case "daily_completed":
      return stats.dailyCompleted >= (condition.min ?? 1);
    case "daily_wins":
      return stats.dailyWins >= (condition.min ?? 1);
    case "streak":
      return stats.longestStreak >= (condition.min ?? 1);
    case "daily_win_attempts":
      return context.won && context.attempts <= (condition.max ?? 6);
    case "duel_wins":
      return stats.duelWins >= (condition.min ?? 1);
    case "level":
      return stats.level >= (condition.min ?? 1);
    default:
      return false;
  }
}

async function loadProgressStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      totalWins: true,
      longestStreak: true,
      streak: true,
    },
  });
  if (!user) return null;

  const dailyWins = await prisma.dailyResult.count({
    where: { userId, won: true, completed: true },
  });
  const dailyCompleted = await prisma.dailyResult.count({
    where: { userId, completed: true },
  });

  const duelWins = await prisma.event.count({
    where: { userId, type: "duel_win" },
  });

  return {
    xp: user.xp,
    level: user.level,
    dailyWins,
    dailyCompleted,
    longestStreak: user.longestStreak,
    currentStreak: user.streak,
    duelWins,
  };
}

export async function grantXp(userId, amount, reason = "generic") {
  if (!userId || amount <= 0) {
    return { xpGained: 0, leveledUp: false, level: 1, xp: 0 };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  if (!user) {
    return { xpGained: 0, leveledUp: false, level: 1, xp: 0 };
  }

  const newXp = user.xp + amount;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });

  const levelRewards = [];
  if (leveledUp) {
    for (let l = user.level + 1; l <= newLevel; l++) {
      const milestone = LEVEL_MILESTONES.find((m) => m.level === l);
      const rewardIds = milestone?.rewardUnlocks?.length
        ? milestone.rewardUnlocks
        : milestone?.rewardThemeId
        ? [`theme:${milestone.rewardThemeId}`]
        : [];

      for (const rewardId of rewardIds) {
        const unlocked = await unlockCosmetic(userId, rewardId);
        if (unlocked) {
          const item = buildRewardItem(rewardId);
          if (item) levelRewards.push({ ...item, level: l });
        }
      }
    }
  }

  return {
    xpGained: amount,
    reason,
    leveledUp,
    level: newLevel,
    xp: newXp,
    levelRewards,
  };
}

export async function checkAchievements(userId, context = {}) {
  if (!userId) return { newlyUnlocked: [] };

  const stats = await loadProgressStats(userId);
  if (!stats) return { newlyUnlocked: [] };

  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const existingIds = new Set(existing.map((e) => e.achievementId));

  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) continue;
    if (!evaluateCondition(achievement.condition, stats, context)) continue;

    const result = await unlockAchievement(userId, achievement.id, context);
    if (result) newlyUnlocked.push(result);
  }

  return { newlyUnlocked };
}

export async function processDailyComplete(userId, { won, attempts, isFirstDailyToday }) {
  if (!userId) return null;

  let xpAmount = won ? XP_GRANTS.DAILY_WIN : XP_GRANTS.DAILY_LOSS;
  if (isFirstDailyToday) xpAmount += XP_GRANTS.FIRST_DAILY_BONUS;

  const xpResult = await grantXp(userId, xpAmount, won ? "daily_win" : "daily_loss");
  const achievementResult = await checkAchievements(userId, {
    won,
    attempts,
    type: "daily_complete",
  });

  return {
    xp: xpResult,
    achievements: achievementResult.newlyUnlocked,
    levelRewards: xpResult.levelRewards || [],
  };
}

export async function processDuelWin(userId) {
  if (!userId) return null;

  await prisma.event.create({
    data: { userId, type: "duel_win", meta: {} },
  });

  const xpResult = await grantXp(userId, XP_GRANTS.DUEL_WIN, "duel_win");
  const achievementResult = await checkAchievements(userId, { type: "duel_win" });

  return {
    xp: xpResult,
    achievements: achievementResult.newlyUnlocked,
    levelRewards: xpResult.levelRewards || [],
  };
}

export async function isFirstDailyToday(userId) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const count = await prisma.dailyResult.count({
    where: {
      userId,
      completed: true,
      completedAt: { gte: start },
    },
  });
  return count <= 1;
}

export function getPublicCatalog() {
  const seasonal = getActiveSeasonal();
  return {
    achievements: getPublicAchievementsList(),
    themes: getPublicThemesList(),
    fonts: getPublicFontsList(),
    cursors: getPublicCursorsList(),
    winAnimations: getPublicWinAnimationsList(),
    sounds: getPublicSoundsList(),
    seasonals: getPublicSeasonalsList(),
    activeSeasonal: seasonal
      ? { id: seasonal.id, name: seasonal.name, icon: seasonal.icon }
      : null,
    xpGrants: XP_GRANTS,
    levelMilestones: LEVEL_MILESTONES,
    slots: Object.fromEntries(
      Object.entries(COSMETIC_SLOTS).map(([slot, def]) => [
        slot,
        { prefix: def.prefix, defaultId: def.defaultId },
      ]),
    ),
  };
}

export async function getProgressionSnapshot(userId) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      unlockedCosmetics: true,
      equippedCosmetics: true,
      isAnonymous: true,
    },
  });
  if (!user) return null;

  const unlocked = await ensureDefaultUnlocks(userId);
  const equipped = migrateLegacyEquipped(user.equippedCosmetics);

  // Drop slot ids that aren't unlocked (e.g. after an admin yank).
  for (const [slot, def] of Object.entries(COSMETIC_SLOTS)) {
    if (!isSlotIdUnlocked(unlocked, slot, equipped[slot])) {
      equipped[slot] = def.defaultId;
    }
  }

  const persistedEquipped =
    user.equippedCosmetics && typeof user.equippedCosmetics === "object"
      ? user.equippedCosmetics
      : null;
  const equippedChanged =
    !persistedEquipped ||
    Object.keys(equipped).some(
      (slot) => equipped[slot] !== persistedEquipped[slot],
    );
  if (equippedChanged) {
    await prisma.user.update({
      where: { id: userId },
      data: { equippedCosmetics: equipped },
    });
  }

  const unlockedRows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });
  const unlockedAchievementIds = new Set(unlockedRows.map((r) => r.achievementId));

  const stats = await loadProgressStats(userId);

  const achievements = ACHIEVEMENTS.map((def) => {
    const unlockedAt = unlockedRows.find((r) => r.achievementId === def.id)?.unlockedAt;
    let progress = null;
    if (!unlockedAt && stats) {
      if (def.condition.type === "daily_wins") {
        progress = { current: stats.dailyWins, target: def.condition.min };
      } else if (def.condition.type === "daily_completed") {
        progress = { current: stats.dailyCompleted, target: def.condition.min };
      } else if (def.condition.type === "duel_wins") {
        progress = { current: stats.duelWins, target: def.condition.min };
      } else if (def.condition.type === "streak") {
        progress = { current: stats.longestStreak, target: def.condition.min };
      } else if (def.condition.type === "level") {
        progress = { current: user.level, target: def.condition.min };
      }
    }
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      rewardThemeId: def.rewardThemeId,
      rewardUnlocks: def.rewardUnlocks || [],
      unlocked: unlockedAchievementIds.has(def.id),
      unlockedAt: unlockedAt || null,
      progress,
    };
  });

  const progress = xpProgressInLevel(user.xp, user.level);
  const seasonal = getActiveSeasonal();

  return {
    xp: user.xp,
    level: user.level,
    xpToNextLevel: xpForNextLevel(user.level),
    xpProgress: progress,
    unlockedCosmetics: unlocked,
    equippedCosmetics: equipped,
    equippedTheme: getThemeById(equipped.boardTheme),
    equippedFont: getFontById(equipped.fontPack),
    equippedCursor: getCursorById(equipped.cursor),
    equippedWinAnimation: getWinAnimationById(equipped.winAnimation),
    equippedSound: getSoundById(equipped.soundPack),
    activeSeasonal: seasonal
      ? {
          id: seasonal.id,
          name: seasonal.name,
          icon: seasonal.icon,
          description: seasonal.description,
        }
      : null,
    achievements,
    isAnonymous: user.isAnonymous,
  };
}

export async function updateEquippedCosmetics(userId, partial) {
  const snapshot = await getProgressionSnapshot(userId);
  if (!snapshot) return { error: "User not found" };
  if (!partial || typeof partial !== "object") {
    return { error: "Invalid payload" };
  }

  const next = { ...snapshot.equippedCosmetics };

  for (const [slot, def] of Object.entries(COSMETIC_SLOTS)) {
    if (!Object.prototype.hasOwnProperty.call(partial, slot)) continue;

    const requested = partial[slot];
    if (requested == null) {
      next[slot] = def.defaultId;
      continue;
    }
    const id = resolveEquippedSlotId(slot, requested);
    if (!def.catalog[id]) {
      return { error: `Invalid ${slot}` };
    }
    if (!isSlotIdUnlocked(snapshot.unlockedCosmetics, slot, id)) {
      return { error: `${slot} not unlocked` };
    }
    next[slot] = id;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { equippedCosmetics: next },
  });

  return {
    equippedCosmetics: next,
    equippedTheme: getThemeById(next.boardTheme),
    equippedFont: getFontById(next.fontPack),
    equippedCursor: getCursorById(next.cursor),
    equippedWinAnimation: getWinAnimationById(next.winAnimation),
    equippedSound: getSoundById(next.soundPack),
  };
}

export async function mergeProgressionIntoUser(tx, anonUserId, targetUserId) {
  const anon = await tx.user.findUnique({
    where: { id: anonUserId },
    select: {
      xp: true,
      level: true,
      unlockedCosmetics: true,
      equippedCosmetics: true,
    },
  });
  const target = await tx.user.findUnique({
    where: { id: targetUserId },
    select: {
      xp: true,
      level: true,
      unlockedCosmetics: true,
      equippedCosmetics: true,
    },
  });
  if (!anon || !target) return;

  const mergedUnlocks = [
    ...new Set([
      ...migrateLegacyUnlocks(target.unlockedCosmetics),
      ...migrateLegacyUnlocks(anon.unlockedCosmetics),
    ]),
  ];

  const mergedXp = target.xp + anon.xp;
  const mergedLevel = levelFromXp(mergedXp);

  const targetEquipped = migrateLegacyEquipped(target.equippedCosmetics);
  const anonEquipped = migrateLegacyEquipped(anon.equippedCosmetics);
  const mergedEquipped = { ...targetEquipped };
  for (const [slot, def] of Object.entries(COSMETIC_SLOTS)) {
    if (
      targetEquipped[slot] === def.defaultId &&
      anonEquipped[slot] !== def.defaultId
    ) {
      mergedEquipped[slot] = anonEquipped[slot];
    }
  }

  await tx.user.update({
    where: { id: targetUserId },
    data: {
      xp: mergedXp,
      level: mergedLevel,
      unlockedCosmetics: mergedUnlocks,
      equippedCosmetics: mergedEquipped,
    },
  });

  const anonAchievements = await tx.userAchievement.findMany({
    where: { userId: anonUserId },
  });

  for (const row of anonAchievements) {
    try {
      await tx.userAchievement.create({
        data: {
          userId: targetUserId,
          achievementId: row.achievementId,
          unlockedAt: row.unlockedAt,
          meta: row.meta ?? undefined,
        },
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }
}

/**
 * Dev-only: max level, all cosmetics from every slot, all achievements.
 */
export async function grantSuperUserProgression(userId) {
  if (!userId) return null;

  const maxXp = LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
  const maxLevel = levelFromXp(maxXp);
  const allUnlocks = getAllUnlockIds();

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: maxXp,
      level: maxLevel,
      unlockedCosmetics: allUnlocks,
    },
  });

  for (const ach of ACHIEVEMENTS) {
    try {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: ach.id,
          meta: { source: "dev_grant" },
        },
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }

  return getProgressionSnapshot(userId);
}
