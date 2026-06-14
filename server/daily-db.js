import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import { createHash } from "crypto";
import { scoreGame, resolveEfficiencyScore } from "./leaderboard-scoring.js";

const prisma = new PrismaClient();

function normalizeDate(input) {
  return DateTime.fromISO(input).startOf("day");
}

async function pruneFutureDailyPuzzles(referenceDate = new Date()) {
  const todayIso = DateTime.fromJSDate(referenceDate).toISODate();

  try {
    const { count } = await prisma.dailyPuzzle.deleteMany({
      where: {
        date: {
          gt: todayIso,
        },
      },
    });

    if (count > 0) {
      console.info(
        `[DailyPuzzle] Pruned ${count} future daily puzzles scheduled after ${todayIso}`
      );
    }
  } catch (error) {
    console.error("[DailyPuzzle] Failed to prune future daily puzzles", error);
  }
}

function deriveDailyStats(results) {
  const completedResults = results.filter((r) => r.completed);
  const totalPlayed = completedResults.length;
  const totalWins = completedResults.filter((r) => r.won).length;
  const winRate =
    totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

  // Calculate streaks using chronological order
  const sortedAsc = [...completedResults].sort(
    (a, b) =>
      normalizeDate(a.puzzle.date).toMillis() -
      normalizeDate(b.puzzle.date).toMillis()
  );

  let rollingStreak = 0;
  let maxStreak = 0;
  let previousDate = null;

  for (const result of sortedAsc) {
    const resultDate = normalizeDate(result.puzzle.date);

    if (result.won) {
      if (previousDate && resultDate.diff(previousDate, "days").days === 1) {
        rollingStreak += 1;
      } else {
        rollingStreak = 1;
      }
      if (rollingStreak > maxStreak) {
        maxStreak = rollingStreak;
      }
    } else {
      rollingStreak = 0;
    }

    previousDate = resultDate;
  }

  // Current streak: walk backward from most recent completed puzzle
  const sortedDesc = [...completedResults].sort(
    (a, b) =>
      normalizeDate(b.puzzle.date).toMillis() -
      normalizeDate(a.puzzle.date).toMillis()
  );

  let currentStreak = 0;
  let expectedDate = null;

  for (const result of sortedDesc) {
    const resultDate = normalizeDate(result.puzzle.date);

    if (!result.won) {
      break; // streak broken by a loss
    }

    if (expectedDate === null) {
      // First win (most recent)
      currentStreak = 1;
      expectedDate = resultDate.minus({ days: 1 });
      continue;
    }

    const diff = expectedDate.diff(resultDate, "days").days;
    if (Math.abs(diff) < 0.5) {
      currentStreak += 1;
      expectedDate = resultDate.minus({ days: 1 });
    } else {
      break;
    }
  }

  return {
    totalPlayed,
    totalWins,
    winRate,
    currentStreak,
    maxStreak,
  };
}

const MIN_SKILL_LEADERBOARD_WINS = 5;

function deriveSolveStats(results) {
  const wonResults = results.filter((r) => r.completed && r.won);
  if (wonResults.length === 0) {
    return {
      bestSolveAttempts: null,
      avgSolveAttempts: null,
      avgEfficiencyScore: null,
      skillGamesWon: 0,
    };
  }

  const attemptsList = wonResults.map((r) => r.attempts);
  const efficiencyScores = wonResults.map((r) =>
    resolveEfficiencyScore(r.patterns, true, r.efficiencyScore)
  );

  const avgAttempts =
    attemptsList.reduce((sum, n) => sum + n, 0) / attemptsList.length;
  const avgEfficiency =
    efficiencyScores.reduce((sum, n) => sum + n, 0) / efficiencyScores.length;

  return {
    bestSolveAttempts: Math.min(...attemptsList),
    avgSolveAttempts: Math.round(avgAttempts * 100) / 100,
    avgEfficiencyScore: Math.round(avgEfficiency * 10) / 10,
    skillGamesWon: wonResults.length,
  };
}

async function updateUserAggregateStats(userId) {
  const allResults = await prisma.dailyResult.findMany({
    where: { userId },
    include: {
      puzzle: true,
    },
    orderBy: {
      puzzle: {
        date: "asc",
      },
    },
  });

  const stats = deriveDailyStats(allResults);
  const solveStats = deriveSolveStats(allResults);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalGames: stats.totalPlayed,
        totalWins: stats.totalWins,
        streak: stats.currentStreak,
        longestStreak: stats.maxStreak,
        bestSolveAttempts: solveStats.bestSolveAttempts,
        avgSolveAttempts: solveStats.avgSolveAttempts,
        avgEfficiencyScore: solveStats.avgEfficiencyScore,
      },
    });
  } catch (error) {
    console.error(
      "[Daily Stats] Failed to update user aggregates",
      userId,
      error
    );
  }

  return stats;
}

export async function getOrCreateAnonymousUser(cookieUserId) {
  if (cookieUserId) {
    const existing = await prisma.user.findUnique({
      where: { id: cookieUserId }
    });
    if (existing) return existing;
    
    // Create user with the provided cookieUserId.
    // Guard against P2002 (unique constraint) from concurrent first-time requests.
    try {
      const user = await prisma.user.create({
        data: { id: cookieUserId }
      });
      return user;
    } catch (error) {
      if (error.code === "P2002") {
        return await prisma.user.findUnique({ where: { id: cookieUserId } });
      }
      throw error;
    }
  }

  // No userId provided, create a new one (should rarely happen now)
  const user = await prisma.user.create({
    data: {}
  });

  return user;
}

// In-memory cache for today's puzzle — keyed by ISO date string.
// Avoids repeated DB lookups on every guess submission.
let _puzzleCache = { date: null, puzzle: null };
// In-flight promise guard — prevents cache stampede when multiple requests
// arrive simultaneously during a cache miss.
let _puzzleFetchInFlight = null;

export async function getTodaysPuzzle(date = new Date()) {
  const dateStr = DateTime.fromJSDate(date).toISODate();

  // Fast path: cached puzzle still valid for today
  if (_puzzleCache.date === dateStr && _puzzleCache.puzzle) {
    return _puzzleCache.puzzle;
  }

  // If a DB fetch is already running, piggyback on it instead of firing another
  if (_puzzleFetchInFlight) {
    return _puzzleFetchInFlight;
  }

  // Cache miss — fetch (or create) from DB.
  // Prune only runs here (server start / day rollover), not on every request.
  _puzzleFetchInFlight = (async () => {
    try {
      await pruneFutureDailyPuzzles();

      let puzzle = await prisma.dailyPuzzle.findUnique({
        where: { date: dateStr }
      });

      if (!puzzle) {
        const word = await getDeterministicWordForDate(dateStr);
        puzzle = await prisma.dailyPuzzle.create({
          data: { date: dateStr, word, difficulty: "medium" }
        });
      }

      _puzzleCache = { date: dateStr, puzzle };
      return puzzle;
    } finally {
      _puzzleFetchInFlight = null;
    }
  })();

  return _puzzleFetchInFlight;
}

async function getDeterministicWordForDate(dateStr) {
  const allWords = await prisma.wordLexicon.findMany({
    where: { active: true, length: 5 }
  });

  if (allWords.length === 0) {
    throw new Error("No words available in WordLexicon");
  }

  // Use a cryptographic hash so consecutive dates do not yield adjacent words.
  const hashHex = createHash("sha256").update(dateStr).digest("hex");
  const hashInt = parseInt(hashHex.slice(0, 12), 16);
  const index = hashInt % allWords.length;
  return allWords[index].word;
}

export async function getUserDailyResult(userId, puzzleId) {
  return await prisma.dailyResult.findUnique({
    where: {
      userId_puzzleId: {
        userId,
        puzzleId
      }
    }
  });
}

export async function createOrUpdateDailyResult(userId, puzzleId, data) {
  const { guesses, patterns, won, completed } = data;
  const attempts = guesses.length;
  const efficiencyScore = completed ? (won ? scoreGame(patterns, true) : null) : undefined;

  return await prisma.dailyResult.upsert({
    where: {
      userId_puzzleId: {
        userId,
        puzzleId
      }
    },
    update: {
      guesses,
      patterns,
      won,
      solved: won,
      completed,
      completedAt: completed ? new Date() : null,
      attempts,
      ...(completed ? { efficiencyScore: efficiencyScore ?? null } : {}),
    },
    create: {
      userId,
      puzzleId,
      guesses,
      patterns,
      won,
      solved: won,
      completed,
      completedAt: completed ? new Date() : null,
      attempts,
      efficiencyScore: efficiencyScore ?? null,
    }
  }).then(async (result) => {
    if (completed) {
      await updateUserAggregateStats(userId);
    }
    return result;
  });
}

export async function getUserDailyStats(userId, limit = 30) {
  const results = await prisma.dailyResult.findMany({
    where: { userId },
    include: {
      puzzle: true,
    },
    orderBy: {
      puzzle: {
        date: "desc",
      },
    },
  });

  const stats = deriveDailyStats(results);

  return {
    ...stats,
    recentResults: results.slice(0, limit).map((r) => ({
      date: r.puzzle.date,
      won: r.won,
      attempts: r.attempts,
    })),
  };
}

export { prisma, deriveSolveStats, MIN_SKILL_LEADERBOARD_WINS };
