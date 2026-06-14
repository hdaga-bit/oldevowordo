import { jest } from "@jest/globals";
import { levelFromXp, xpProgressInLevel } from "../progression/catalog.js";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userAchievement: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  dailyResult: {
    count: jest.fn(),
  },
  event: {
    count: jest.fn(),
    create: jest.fn(),
  },
};

jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const {
  grantXp,
  getPublicCatalog,
  updateEquippedCosmetics,
  mergeProgressionIntoUser,
} = await import("../progression/progressionService.js");

const {
  migrateLegacyUnlocks,
  migrateLegacyEquipped,
  getDefaultUnlocks,
  isValidUnlock,
  parseUnlockId,
} = await import("../progression/cosmetics-registry.js");

describe("progression catalog", () => {
  it("computes level from XP thresholds", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
  });

  it("returns XP progress within current level", () => {
    const progress = xpProgressInLevel(150, 2);
    expect(progress.current).toBe(50);
    expect(progress.needed).toBe(150);
    expect(progress.percent).toBeGreaterThan(0);
  });
});

describe("getPublicCatalog", () => {
  it("returns multi-slot catalog", () => {
    const catalog = getPublicCatalog();
    expect(Array.isArray(catalog.achievements)).toBe(true);
    expect(catalog.themes.length).toBeGreaterThanOrEqual(2);
    expect(catalog.fonts.length).toBeGreaterThan(0);
    expect(catalog.cursors.length).toBeGreaterThan(0);
    expect(catalog.winAnimations.length).toBeGreaterThan(0);
    expect(catalog.sounds.length).toBeGreaterThan(0);
    expect(catalog.slots.boardTheme.prefix).toBe("theme");
  });
});

describe("cosmetics registry migration", () => {
  it("maps legacy theme ids to new names", () => {
    const migrated = migrateLegacyUnlocks(["default", "space", "cyber", "ninja"]);
    expect(migrated).toEqual(
      expect.arrayContaining([
        "theme:classic",
        "theme:neon_slate",
      ]),
    );
  });

  it("keeps already-namespaced ids and ignores unknown ones", () => {
    const migrated = migrateLegacyUnlocks([
      "theme:aurora",
      "font:brush",
      "bogus:value",
      "unknown_theme",
    ]);
    expect(migrated).toEqual(
      expect.arrayContaining(["theme:neon_slate", "font:brush"]),
    );
    expect(migrated).not.toContain("bogus:value");
    expect(migrated).not.toContain("theme:unknown_theme");
  });

  it("always includes default unlocks", () => {
    const migrated = migrateLegacyUnlocks(null);
    for (const def of getDefaultUnlocks()) {
      expect(migrated).toContain(def);
    }
  });

  it("migrates legacy equipped objects", () => {
    const migrated = migrateLegacyEquipped({ boardTheme: "ninja" });
    expect(migrated.boardTheme).toBe("classic");
    expect(migrated.fontPack).toBe("system");
    expect(migrated.cursor).toBe("none");
  });

  it("parses namespaced unlock ids", () => {
    expect(parseUnlockId("theme:aurora")).toMatchObject({
      slot: "boardTheme",
      id: "neon_slate",
    });
    expect(parseUnlockId("font:brush")).toMatchObject({
      slot: "fontPack",
      id: "brush",
    });
    expect(isValidUnlock("theme:aurora")).toBe(true);
    expect(isValidUnlock("theme:nope")).toBe(false);
    expect(isValidUnlock("bogus:value")).toBe(false);
  });
});

describe("grantXp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ xp: 0, level: 1 });
    mockPrisma.user.update.mockResolvedValue({});
  });

  it("grants XP to anonymous users (any userId)", async () => {
    const result = await grantXp("anon-user-1", 50, "daily_win");
    expect(result.xpGained).toBe(50);
    expect(result.xp).toBe(50);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "anon-user-1" },
      data: { xp: 50, level: 1 },
    });
  });
});

describe("updateEquippedCosmetics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      xp: 0,
      level: 1,
      unlockedCosmetics: getDefaultUnlocks(),
      equippedCosmetics: { boardTheme: "classic" },
      isAnonymous: true,
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);
    mockPrisma.dailyResult.count.mockResolvedValue(0);
    mockPrisma.event.count.mockResolvedValue(0);
  });

  it("rejects equipping a locked theme", async () => {
    const result = await updateEquippedCosmetics("user-1", {
      boardTheme: "cyber_synthwave",
    });
    expect(result.error).toBe("boardTheme not unlocked");
    const equipCalls = mockPrisma.user.update.mock.calls.filter(
      ([args]) => args?.data?.equippedCosmetics?.boardTheme === "cyber_synthwave",
    );
    expect(equipCalls).toHaveLength(0);
  });

  it("allows equipping an unlocked theme", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      xp: 200,
      level: 2,
      unlockedCosmetics: [...getDefaultUnlocks(), "theme:aurora"],
      equippedCosmetics: { boardTheme: "classic" },
      isAnonymous: true,
    });

    const result = await updateEquippedCosmetics("user-1", {
      boardTheme: "aurora",
    });
    expect(result.equippedCosmetics.boardTheme).toBe("neon_slate");
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it("allows equipping a font pack across slots", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      xp: 200,
      level: 2,
      unlockedCosmetics: [...getDefaultUnlocks(), "font:brush"],
      equippedCosmetics: { boardTheme: "classic" },
      isAnonymous: true,
    });

    const result = await updateEquippedCosmetics("user-1", {
      fontPack: "brush",
    });
    expect(result.equippedCosmetics.fontPack).toBe("brush");
  });
});

describe("mergeProgressionIntoUser", () => {
  it("sums XP and merges unlock lists with legacy migration", async () => {
    const tx = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            xp: 20,
            level: 1,
            unlockedCosmetics: ["default", "cyber"],
            equippedCosmetics: { boardTheme: "cyber" },
          })
          .mockResolvedValueOnce({
            xp: 80,
            level: 1,
            unlockedCosmetics: ["default", "space"],
            equippedCosmetics: { boardTheme: "space" },
          }),
        update: jest.fn(),
      },
      userAchievement: {
        findMany: jest.fn().mockResolvedValue([
          {
            achievementId: "first_daily",
            unlockedAt: new Date("2026-01-01"),
            meta: null,
          },
        ]),
        create: jest.fn(),
      },
    };

    await mergeProgressionIntoUser(tx, "anon-1", "auth-1");

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "auth-1" },
      data: expect.objectContaining({
        xp: 100,
        unlockedCosmetics: expect.arrayContaining([
          "theme:classic",
          "theme:neon_slate",
        ]),
      }),
    });
    expect(tx.userAchievement.create).toHaveBeenCalled();
  });
});
