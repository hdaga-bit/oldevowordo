/**
 * Recompute DailyResult.efficiencyScore and User solve aggregates from history.
 * Run from server/: node scripts/backfill-solve-stats.js
 */
import { PrismaClient } from "@prisma/client";
import { scoreGame } from "../leaderboard-scoring.js";
import { deriveSolveStats } from "../daily-db.js";

const prisma = new PrismaClient();

async function main() {
  const results = await prisma.dailyResult.findMany({
    where: { completed: true, won: true },
    select: { id: true, patterns: true, efficiencyScore: true },
  });

  let updatedResults = 0;
  for (const row of results) {
    const next = scoreGame(row.patterns, true);
    if (row.efficiencyScore === next) continue;
    await prisma.dailyResult.update({
      where: { id: row.id },
      data: { efficiencyScore: next },
    });
    updatedResults += 1;
  }

  const userIds = await prisma.user.findMany({ select: { id: true } });
  let updatedUsers = 0;

  for (const { id } of userIds) {
    const allResults = await prisma.dailyResult.findMany({
      where: { userId: id },
      include: { puzzle: true },
      orderBy: { puzzle: { date: "asc" } },
    });
    const solveStats = deriveSolveStats(allResults);
    await prisma.user.update({
      where: { id },
      data: {
        bestSolveAttempts: solveStats.bestSolveAttempts,
        avgSolveAttempts: solveStats.avgSolveAttempts,
        avgEfficiencyScore: solveStats.avgEfficiencyScore,
      },
    });
    updatedUsers += 1;
  }

  console.info(
    `[backfill-solve-stats] ${updatedResults} daily results, ${updatedUsers} users updated`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
