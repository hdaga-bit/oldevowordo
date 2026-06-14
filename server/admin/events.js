import express from "express";
import { config } from "../config/env.js";
import { requireAdminToken } from "../feedback.js";

export default function createAdminEventsRouter({
  setAiBattleEventActive,
  getAiBattleEventStatus,
} = {}) {
  if (typeof setAiBattleEventActive !== "function") {
    throw new Error("setAiBattleEventActive must be provided");
  }
  if (typeof getAiBattleEventStatus !== "function") {
    throw new Error("getAiBattleEventStatus must be provided");
  }

  const router = express.Router();
  const adminToken = config.eventAdminToken;

  function requireAdmin(req, res, next) {
    return requireAdminToken(req, res, next, adminToken);
  }

  router.post("/ai-battle/start", requireAdmin, async (_req, res) => {
    const status = await setAiBattleEventActive(true);
    res.json({ ok: true, ...status });
  });

  router.post("/ai-battle/stop", requireAdmin, async (_req, res) => {
    const status = await setAiBattleEventActive(false);
    res.json({ ok: true, ...status });
  });

  router.get("/ai-battle/status", requireAdmin, async (_req, res) => {
    res.json({ ok: true, ...(await getAiBattleEventStatus()) });
  });

  return router;
}
