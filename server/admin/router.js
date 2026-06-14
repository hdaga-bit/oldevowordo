import express from "express";
import { requireAdminSession, getAdminProfile } from "./auth.js";
import { LEADERBOARD_USER_FILTER } from "../leaderboard-utils.js";
import { listFeedback } from "../feedback.js";
import {
  listScheduledEvents,
  createScheduledEvent,
  updateScheduledEvent,
  deleteScheduledEvent,
  startScheduledEventNow,
  stopScheduledEventNow,
  enableScheduledEvent,
  disableScheduledEvent,
  getLiveOpsSummary,
  listEventRuns,
  getEventRunDetail,
} from "../scheduled-events.js";

export default function createAdminRouter({
  prisma,
  getActiveRoomCount,
  getRuntimeSnapshot,
}) {
  const router = express.Router();

  router.use(requireAdminSession);

  router.get("/me", async (req, res) => {
    try {
      res.json(await getAdminProfile(req));
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: "Failed to fetch admin profile" });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const userWhere = { ...LEADERBOARD_USER_FILTER };

      const [
        totalUsers,
        authenticatedUsers,
        dailyCompleted,
        gamesAggregate,
        duelWins,
        feedbackTotal,
        feedbackNew,
        activeScheduledEvents,
        activeRooms,
      ] = await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.user.count({
          where: { ...userWhere, isAnonymous: false },
        }),
        prisma.dailyResult.count({ where: { completed: true } }),
        prisma.user.aggregate({
          where: userWhere,
          _sum: { totalGames: true },
        }),
        prisma.event.count({ where: { type: "duel_win" } }),
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: "new" } }),
        prisma.scheduledEvent.count({ where: { isActive: true } }),
        getActiveRoomCount(),
      ]);

      const anonymousUsers = totalUsers - authenticatedUsers;

      res.json({
        users: {
          total: totalUsers,
          authenticated: authenticatedUsers,
          anonymous: anonymousUsers,
        },
        games: {
          dailyCompleted,
          totalGamesRecorded: gamesAggregate._sum.totalGames ?? 0,
          duelWins,
        },
        feedback: {
          total: feedbackTotal,
          new: feedbackNew,
        },
        live: {
          activeRooms,
          activeScheduledEvents,
        },
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  router.get("/scheduled-events", async (_req, res) => {
    try {
      const items = await listScheduledEvents(prisma);
      res.json({ items });
    } catch (error) {
      console.error("Error listing scheduled events:", error);
      res.status(500).json({ error: "Failed to list events" });
    }
  });

  router.get("/live-ops/summary", async (_req, res) => {
    try {
      const data = await getLiveOpsSummary(prisma, { getRuntimeSnapshot });
      res.json(data);
    } catch (error) {
      console.error("Error fetching live ops summary:", error);
      res.status(500).json({ error: "Failed to fetch live ops summary" });
    }
  });

  router.get("/events", async (_req, res) => {
    try {
      const items = await listScheduledEvents(prisma);
      res.json({ items });
    } catch (error) {
      console.error("Error listing live ops events:", error);
      res.status(500).json({ error: "Failed to list events" });
    }
  });

  router.post("/events", async (req, res) => {
    try {
      const result = await createScheduledEvent(prisma, req.body, {
        adminUserId: req.user?.dbUserId ?? null,
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error creating live ops event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  router.patch("/events/:id", async (req, res) => {
    try {
      const result = await updateScheduledEvent(prisma, req.params.id, req.body, {
        adminUserId: req.user?.dbUserId ?? null,
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error updating live ops event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  router.post("/events/:id/start", async (req, res) => {
    try {
      const result = await startScheduledEventNow(prisma, req.params.id, {
        reason: "manual",
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error starting event:", error);
      res.status(500).json({ error: "Failed to start event" });
    }
  });

  router.post("/events/:id/stop", async (req, res) => {
    try {
      const result = await stopScheduledEventNow(prisma, req.params.id, {
        reason: "manual",
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error stopping event:", error);
      res.status(500).json({ error: "Failed to stop event" });
    }
  });

  router.post("/events/:id/enable", async (req, res) => {
    try {
      const result = await enableScheduledEvent(prisma, req.params.id);
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error enabling event:", error);
      res.status(500).json({ error: "Failed to enable event" });
    }
  });

  router.post("/events/:id/disable", async (req, res) => {
    try {
      const result = await disableScheduledEvent(prisma, req.params.id);
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error disabling event:", error);
      res.status(500).json({ error: "Failed to disable event" });
    }
  });

  router.get("/event-runs", async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const items = await listEventRuns(prisma, {
        status,
        limit: req.query.limit,
      });
      res.json({ items });
    } catch (error) {
      console.error("Error listing event runs:", error);
      res.status(500).json({ error: "Failed to list event runs" });
    }
  });

  router.get("/event-runs/:id", async (req, res) => {
    try {
      const item = await getEventRunDetail(prisma, req.params.id);
      if (!item) return res.status(404).json({ error: "Event run not found" });
      res.json(item);
    } catch (error) {
      console.error("Error fetching event run:", error);
      res.status(500).json({ error: "Failed to fetch event run" });
    }
  });

  router.get("/event-runs/:id/participants", async (req, res) => {
    try {
      const items = await prisma.eventParticipation.findMany({
        where: { eventRunId: req.params.id },
        orderBy: { joinedAt: "desc" },
        take: 200,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              totalGames: true,
              totalWins: true,
              streak: true,
            },
          },
        },
      });
      res.json({ items });
    } catch (error) {
      console.error("Error listing event participants:", error);
      res.status(500).json({ error: "Failed to list participants" });
    }
  });

  router.get("/players", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const where = {
        ...LEADERBOARD_USER_FILTER,
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const users = await prisma.user.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAnonymous: true,
          totalGames: true,
          totalWins: true,
          streak: true,
          longestStreak: true,
          level: true,
          xp: true,
          createdAt: true,
          updatedAt: true,
          eventParticipations: {
            orderBy: { lastActiveAt: "desc" },
            take: 5,
            include: {
              eventRun: {
                select: {
                  id: true,
                  eventKey: true,
                  mode: true,
                  status: true,
                  startedAt: true,
                },
              },
            },
          },
        },
      });
      res.json({ items: users });
    } catch (error) {
      console.error("Error listing players:", error);
      res.status(500).json({ error: "Failed to list players" });
    }
  });

  router.get("/players/:id", async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAnonymous: true,
          totalGames: true,
          totalWins: true,
          streak: true,
          longestStreak: true,
          level: true,
          xp: true,
          createdAt: true,
          updatedAt: true,
          results: {
            orderBy: { updatedAt: "desc" },
            take: 10,
            select: {
              id: true,
              won: true,
              attempts: true,
              completed: true,
              completedAt: true,
              durationMs: true,
            },
          },
          eventParticipations: {
            orderBy: { joinedAt: "desc" },
            take: 50,
            include: {
              eventRun: {
                include: {
                  scheduledEvent: {
                    select: { id: true, name: true, eventKey: true, mode: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!user) return res.status(404).json({ error: "Player not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ error: "Failed to fetch player" });
    }
  });

  router.post("/scheduled-events", async (req, res) => {
    try {
      const result = await createScheduledEvent(prisma, req.body);
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error creating scheduled event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  router.patch("/scheduled-events/:id", async (req, res) => {
    try {
      const result = await updateScheduledEvent(prisma, req.params.id, req.body);
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error updating scheduled event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  router.delete("/scheduled-events/:id", async (req, res) => {
    try {
      const result = await deleteScheduledEvent(prisma, req.params.id);
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Error deleting scheduled event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  router.get("/feedback", async (req, res) => {
    try {
      const limit = req.query.limit;
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const data = await listFeedback(prisma, { limit, status });
      res.json(data);
    } catch (error) {
      console.error("Error listing feedback:", error);
      res.status(500).json({ error: "Failed to list feedback" });
    }
  });

  router.patch("/feedback/:id", async (req, res) => {
    try {
      const { status } = req.body || {};
      if (status !== "reviewed" && status !== "new") {
        return res.status(400).json({ error: "Invalid status" });
      }

      const row = await prisma.feedback.update({
        where: { id: req.params.id },
        data: { status },
      });
      res.json(row);
    } catch (error) {
      if (error?.code === "P2025") {
        return res.status(404).json({ error: "Feedback not found" });
      }
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  return router;
}
