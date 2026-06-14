import { config } from "./config/env.js";
import { randomUUID } from "crypto";

const VALID_MODES = new Set(["battle_ai", "battle", "duel", "shared"]);
const EVENT_KEY_RE = /^[a-z][a-z0-9_]{2,48}$/;
const SLOT_RE = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
const VALID_STATUSES = new Set(["draft", "scheduled", "live", "ended", "disabled"]);
const DEFAULT_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 24 * 60;

/** @type {{
 * setAiBattleEventActive?: (active: boolean) => Promise<object>,
 * setCurrentEventSlot?: (slot: string) => void,
 * activateEventRun?: ({ event: object, run: object }) => Promise<object>,
 * deactivateEventRun?: ({ event: object, run: object, reason?: string }) => Promise<object>,
 * getRuntimeSnapshot?: () => Promise<object>
 * } | null} */
let runtime = null;

export function registerEventRuntime(handlers) {
  runtime = handlers;
}

function requireRuntime() {
  if (!runtime) {
    throw new Error("Event runtime is not registered");
  }
  return runtime;
}

function sanitizeScheduleSlot(value, fallback = config.aiBattleEventSlot || "20:00-21:00") {
  const scheduleSlot = typeof value === "string" ? value.trim() : "";
  return SLOT_RE.test(scheduleSlot) ? scheduleSlot : fallback;
}

function parseDate(value) {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseDuration(value) {
  if (value == null || value === "") return DEFAULT_DURATION_MINUTES;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DURATION_MINUTES;
  return Math.min(MAX_DURATION_MINUTES, n);
}

function normalizeJsonObject(value, fieldName) {
  if (value == null || value === "") return { value: null };
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed == null || typeof parsed === "object") return { value: parsed };
    } catch {
      return { error: `${fieldName} must be valid JSON` };
    }
  }
  if (typeof value === "object") return { value };
  return { error: `${fieldName} must be an object` };
}

function buildScheduleSlotFromDates(startsAt, durationMinutes, fallback) {
  if (!startsAt) return fallback;
  const end = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const hhmm = (date) =>
    `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return `${hhmm(startsAt)}-${hhmm(end)}`;
}

export function computeNextRun(event, from = new Date()) {
  const recurrence = typeof event?.recurrenceRule === "string"
    ? event.recurrenceRule.trim().toLowerCase()
    : "";
  const startsAt = parseDate(event?.startsAt);

  if (!recurrence || recurrence === "none" || recurrence === "one_time") {
    return startsAt && startsAt > from ? startsAt : null;
  }

  const base = startsAt || from;
  const next = new Date(base);
  const intervalDays = recurrence === "weekly" ? 7 : 1;
  while (next <= from) {
    next.setUTCDate(next.getUTCDate() + intervalDays);
  }
  return next;
}

function nextConfigStatus(data) {
  if (data.enabled === false) return "disabled";
  if (data.status && VALID_STATUSES.has(data.status)) return data.status;
  if (data.startsAt || data.nextRunAt || data.recurrenceRule) return "scheduled";
  return "draft";
}

function parseEventBody(body, { partial = false } = {}) {
  const data = {};

  if (body?.name !== undefined || !partial) {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "Name is required" };
    data.name = name.slice(0, 120);
  }

  if (body?.eventKey !== undefined || !partial) {
    const eventKey =
      typeof body?.eventKey === "string" ? body.eventKey.trim().toLowerCase() : "";
    if (!EVENT_KEY_RE.test(eventKey)) {
      return { error: "Invalid event key" };
    }
    data.eventKey = eventKey;
  }

  if (body?.mode !== undefined || !partial) {
    const mode =
      typeof body?.mode === "string" ? body.mode.trim().toLowerCase() : "";
    if (!VALID_MODES.has(mode)) {
      return { error: "Invalid mode" };
    }
    data.mode = mode;
  }

  if (body?.scheduleSlot !== undefined) {
    const scheduleSlot = typeof body?.scheduleSlot === "string" ? body.scheduleSlot.trim() : "";
    if (scheduleSlot && !SLOT_RE.test(scheduleSlot)) {
      return { error: "Schedule slot must be like 20:00-21:00" };
    }
    if (scheduleSlot) data.scheduleSlot = scheduleSlot;
  } else if (!partial) {
    data.scheduleSlot = sanitizeScheduleSlot();
  }

  if (body?.timezone !== undefined) {
    const timezone =
      typeof body.timezone === "string" && body.timezone.trim()
        ? body.timezone.trim().slice(0, 64)
        : "UTC";
    data.timezone = timezone;
  }

  if (body?.description !== undefined) {
    data.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim().slice(0, 500)
        : null;
  }

  if (body?.featured !== undefined) {
    data.featured = Boolean(body.featured);
  }

  if (body?.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  if (body?.enabled !== undefined) {
    data.enabled = Boolean(body.enabled);
    if (!data.enabled) {
      data.status = "disabled";
      data.disabledAt = new Date();
    } else if (body.status === undefined) {
      data.status = "scheduled";
      data.disabledAt = null;
    }
  }

  if (body?.status !== undefined) {
    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!VALID_STATUSES.has(status)) return { error: "Invalid status" };
    data.status = status;
    if (status === "disabled") {
      data.enabled = false;
      data.disabledAt = new Date();
    }
  }

  if (body?.startsAt !== undefined) {
    const startsAt = parseDate(body.startsAt);
    if (body.startsAt && !startsAt) return { error: "Invalid start time" };
    data.startsAt = startsAt;
  }

  if (body?.durationMinutes !== undefined || body?.duration !== undefined) {
    data.durationMinutes = parseDuration(body.durationMinutes ?? body.duration);
  }

  if (body?.endsAt !== undefined) {
    const endsAt = parseDate(body.endsAt);
    if (body.endsAt && !endsAt) return { error: "Invalid end time" };
    data.endsAt = endsAt;
  }

  if (body?.recurrenceRule !== undefined) {
    const recurrenceRule =
      typeof body.recurrenceRule === "string" && body.recurrenceRule.trim()
        ? body.recurrenceRule.trim().toLowerCase().slice(0, 64)
        : null;
    data.recurrenceRule = recurrenceRule;
  }

  if (body?.recurrenceTimezone !== undefined) {
    data.recurrenceTimezone =
      typeof body.recurrenceTimezone === "string" && body.recurrenceTimezone.trim()
        ? body.recurrenceTimezone.trim().slice(0, 64)
        : data.timezone ?? "UTC";
  }

  for (const field of ["rules", "theme", "rewards", "metadata"]) {
    if (body?.[field] !== undefined) {
      const parsed = normalizeJsonObject(body[field], field);
      if (parsed.error) return { error: parsed.error };
      data[field] = parsed.value;
    }
  }

  return { data };
}

function isLegacyScheduledEventSchema(error) {
  const message = error?.message || "";
  return (
    error?.code === "P2022" ||
    message.includes("Unknown argument `status`") ||
    message.includes("Unknown argument `enabled`") ||
    message.includes("column `status` does not exist") ||
    message.includes("column `ScheduledEvent.status` does not exist")
  );
}

function legacyEventShape(row) {
  if (!row) return row;
  return {
    ...row,
    status: row.isActive ? "live" : "scheduled",
    enabled: true,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    recurrenceRule: null,
    recurrenceTimezone: row.timezone || "UTC",
    nextRunAt: null,
    runs: [],
  };
}

async function legacyListScheduledEvents(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT "id", "createdAt", "updatedAt", "name", "eventKey", "mode",
           "scheduleSlot", "timezone", "description", "isActive", "featured"
    FROM "ScheduledEvent"
    ORDER BY "isActive" DESC, "updatedAt" DESC
  `);
  return rows.map(legacyEventShape);
}

async function legacyFindScheduledEventById(prisma, id) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", "createdAt", "updatedAt", "name", "eventKey", "mode",
            "scheduleSlot", "timezone", "description", "isActive", "featured"
     FROM "ScheduledEvent" WHERE "id" = $1 LIMIT 1`,
    id,
  );
  return legacyEventShape(rows[0] || null);
}

async function legacyFindScheduledEventByKey(prisma, eventKey) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", "createdAt", "updatedAt", "name", "eventKey", "mode",
            "scheduleSlot", "timezone", "description", "isActive", "featured"
     FROM "ScheduledEvent" WHERE "eventKey" = $1 LIMIT 1`,
    eventKey,
  );
  return legacyEventShape(rows[0] || null);
}

async function legacyCreateScheduledEvent(prisma, data) {
  const now = new Date();
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO "ScheduledEvent"
       ("id", "createdAt", "updatedAt", "name", "eventKey", "mode",
        "scheduleSlot", "timezone", "description", "isActive", "featured")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)
     RETURNING "id", "createdAt", "updatedAt", "name", "eventKey", "mode",
               "scheduleSlot", "timezone", "description", "isActive", "featured"`,
    id,
    now,
    now,
    data.name,
    data.eventKey,
    data.mode,
    data.scheduleSlot,
    data.timezone ?? "UTC",
    data.description ?? null,
    data.featured ?? true,
  );
  return legacyEventShape(rows[0]);
}

async function legacyUpdateScheduledEvent(prisma, id, data) {
  const existing = await legacyFindScheduledEventById(prisma, id);
  if (!existing) return null;
  const next = {
    ...existing,
    ...Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        ["name", "mode", "scheduleSlot", "timezone", "description", "isActive", "featured"].includes(key),
      ),
    ),
    updatedAt: new Date(),
  };
  const rows = await prisma.$queryRawUnsafe(
    `UPDATE "ScheduledEvent"
     SET "updatedAt" = $2, "name" = $3, "mode" = $4, "scheduleSlot" = $5,
         "timezone" = $6, "description" = $7, "isActive" = $8, "featured" = $9
     WHERE "id" = $1
     RETURNING "id", "createdAt", "updatedAt", "name", "eventKey", "mode",
               "scheduleSlot", "timezone", "description", "isActive", "featured"`,
    id,
    next.updatedAt,
    next.name,
    next.mode,
    next.scheduleSlot,
    next.timezone,
    next.description,
    next.isActive,
    next.featured,
  );
  return legacyEventShape(rows[0]);
}

export async function listScheduledEvents(prisma) {
  try {
    return await prisma.scheduledEvent.findMany({
      where: { deletedAt: null },
      include: {
        runs: {
          where: { status: "live" },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }, { updatedAt: "desc" }],
    });
  } catch (error) {
    if (isLegacyScheduledEventSchema(error)) {
      return legacyListScheduledEvents(prisma);
    }
    throw error;
  }
}

export async function createScheduledEvent(prisma, body, { adminUserId = null } = {}) {
  const parsed = parseEventBody(body);
  if (parsed.error) return { status: 400, body: { error: parsed.error } };

  let existing;
  try {
    existing = await prisma.scheduledEvent.findUnique({
      where: { eventKey: parsed.data.eventKey },
    });
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error)) throw error;
    existing = await legacyFindScheduledEventByKey(prisma, parsed.data.eventKey);
    if (existing) {
      return { status: 409, body: { error: "Event key already exists" } };
    }
    const row = await legacyCreateScheduledEvent(prisma, {
      ...parsed.data,
      scheduleSlot: parsed.data.scheduleSlot ?? sanitizeScheduleSlot(),
      timezone: parsed.data.timezone ?? "UTC",
    });
    return { status: 201, body: row };
  }
  if (existing) {
    return { status: 409, body: { error: "Event key already exists" } };
  }

  const durationMinutes = parsed.data.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const startsAt = parsed.data.startsAt ?? null;
  const nextRunAt = computeNextRun({ ...parsed.data, startsAt, durationMinutes });
  const scheduleSlot =
    parsed.data.scheduleSlot ??
    buildScheduleSlotFromDates(startsAt, durationMinutes, sanitizeScheduleSlot());

  let row;
  try {
    row = await prisma.scheduledEvent.create({
      data: {
        ...parsed.data,
        scheduleSlot,
        timezone: parsed.data.timezone ?? "UTC",
        recurrenceTimezone:
          parsed.data.recurrenceTimezone ?? parsed.data.timezone ?? "UTC",
        durationMinutes,
        nextRunAt,
        status: nextConfigStatus({ ...parsed.data, nextRunAt }),
        isActive: false,
        enabled: parsed.data.enabled ?? true,
        createdByUserId: adminUserId,
        updatedByUserId: adminUserId,
      },
    });
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error)) throw error;
    row = await legacyCreateScheduledEvent(prisma, {
      ...parsed.data,
      scheduleSlot,
      timezone: parsed.data.timezone ?? "UTC",
    });
  }

  return { status: 201, body: row };
}

async function getLiveRun(prisma, scheduledEventId) {
  return prisma.eventRun.findFirst({
    where: { scheduledEventId, status: "live" },
    orderBy: { startedAt: "desc" },
  });
}

async function deactivateOtherBattleAiEvents(prisma, exceptId) {
  const others = await prisma.scheduledEvent.findMany({
    where: { mode: "battle_ai", isActive: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  for (const other of others) {
    const run = await getLiveRun(prisma, other.id);
    await clearEventRuntime(other, run, "superseded");
    await prisma.scheduledEvent.update({
      where: { id: other.id },
      data: { isActive: false, status: "ended", lastRunAt: new Date() },
    });
    if (run) {
      await prisma.eventRun.update({
        where: { id: run.id },
        data: { status: "ended", endedAt: new Date(), endedReason: "superseded" },
      });
    }
  }
}

async function applyEventRuntime(event, run) {
  const rt = requireRuntime();
  if (typeof rt.activateEventRun === "function") {
    await rt.activateEventRun({ event, run });
    return;
  }

  if (event.mode === "battle_ai") {
    rt.setCurrentEventSlot?.(event.scheduleSlot);
    await rt.setAiBattleEventActive?.(true);
    return;
  }

  console.warn(
    `[scheduled-events] Mode "${event.mode}" has no runtime handler yet (event ${event.eventKey})`,
  );
}

async function clearEventRuntime(event, run, reason = "stopped") {
  const rt = requireRuntime();
  if (typeof rt.deactivateEventRun === "function") {
    await rt.deactivateEventRun({ event, run, reason });
    return;
  }

  if (event.mode === "battle_ai") {
    await rt.setAiBattleEventActive?.(false);
  }
}

export async function updateScheduledEvent(prisma, id, body, { adminUserId = null } = {}) {
  let existing;
  try {
    existing = await prisma.scheduledEvent.findUnique({ where: { id } });
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error)) throw error;
    existing = await legacyFindScheduledEventById(prisma, id);
    if (!existing) {
      return { status: 404, body: { error: "Event not found" } };
    }
    const parsed = parseEventBody(body, { partial: true });
    if (parsed.error) return { status: 400, body: { error: parsed.error } };
    const wasActive = existing.isActive;
    const row = await legacyUpdateScheduledEvent(prisma, id, parsed.data);
    if (row?.mode === "battle_ai") {
      requireRuntime().setCurrentEventSlot?.(row.scheduleSlot);
      if (row.isActive && !wasActive) await requireRuntime().setAiBattleEventActive?.(true);
      if (!row.isActive && wasActive) await requireRuntime().setAiBattleEventActive?.(false);
    }
    return { status: 200, body: row };
  }
  if (!existing) {
    return { status: 404, body: { error: "Event not found" } };
  }
  if (!Object.prototype.hasOwnProperty.call(existing, "status")) {
    const parsed = parseEventBody(body, { partial: true });
    if (parsed.error) return { status: 400, body: { error: parsed.error } };
    const wasActive = existing.isActive;
    const row = await legacyUpdateScheduledEvent(prisma, id, parsed.data);
    if (row?.mode === "battle_ai") {
      requireRuntime().setCurrentEventSlot?.(row.scheduleSlot);
      if (row.isActive && !wasActive) await requireRuntime().setAiBattleEventActive?.(true);
      if (!row.isActive && wasActive) await requireRuntime().setAiBattleEventActive?.(false);
    }
    return { status: 200, body: row };
  }

  const parsed = parseEventBody(body, { partial: true });
  if (parsed.error) return { status: 400, body: { error: parsed.error } };

  if (
    parsed.data.eventKey &&
    parsed.data.eventKey !== existing.eventKey
  ) {
    const conflict = await prisma.scheduledEvent.findUnique({
      where: { eventKey: parsed.data.eventKey },
    });
    if (conflict) {
      return { status: 409, body: { error: "Event key already exists" } };
    }
  }

  const nextIsActive = parsed.data.isActive !== undefined ? parsed.data.isActive : existing.isActive;
  const startsAt = parsed.data.startsAt !== undefined ? parsed.data.startsAt : existing.startsAt;
  const durationMinutes = parsed.data.durationMinutes ?? existing.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const nextRunAt =
    parsed.data.nextRunAt ??
    (parsed.data.startsAt !== undefined || parsed.data.recurrenceRule !== undefined
      ? computeNextRun({ ...existing, ...parsed.data, startsAt, durationMinutes })
      : undefined);
  if (nextRunAt !== undefined) parsed.data.nextRunAt = nextRunAt;
  if (parsed.data.scheduleSlot === undefined && parsed.data.startsAt !== undefined) {
    parsed.data.scheduleSlot = buildScheduleSlotFromDates(
      startsAt,
      durationMinutes,
      existing.scheduleSlot,
    );
  }
  if (parsed.data.status === undefined && parsed.data.enabled !== undefined) {
    parsed.data.status = parsed.data.enabled ? "scheduled" : "disabled";
  }
  parsed.data.updatedByUserId = adminUserId;

  if (nextIsActive && (parsed.data.mode === "battle_ai" || existing.mode === "battle_ai")) {
    await deactivateOtherBattleAiEvents(prisma, id);
  }

  const row = await prisma.scheduledEvent.update({
    where: { id },
    data: parsed.data,
  });

  const effective = { ...existing, ...row };

  if (nextIsActive && !existing.isActive) {
    const result = await startScheduledEventNow(prisma, effective.id, { reason: "manual_toggle" });
    return result.status === 200 ? { status: 200, body: result.body.event } : result;
  } else if (!nextIsActive && existing.isActive) {
    await stopScheduledEventNow(prisma, effective.id, { reason: "manual_toggle" });
  } else if (nextIsActive && existing.isActive) {
    if (
      effective.mode === "battle_ai" &&
      (parsed.data.scheduleSlot || parsed.data.mode)
    ) {
      requireRuntime().setCurrentEventSlot?.(effective.scheduleSlot);
    }
  }

  return { status: 200, body: row };
}

export async function deleteScheduledEvent(prisma, id) {
  let existing;
  try {
    existing = await prisma.scheduledEvent.findUnique({ where: { id } });
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error)) throw error;
    existing = await legacyFindScheduledEventById(prisma, id);
    if (!existing) {
      return { status: 404, body: { error: "Event not found" } };
    }
    if (existing.isActive && existing.mode === "battle_ai") {
      await requireRuntime().setAiBattleEventActive?.(false);
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "ScheduledEvent" WHERE "id" = $1`, id);
    return { status: 200, body: { ok: true } };
  }
  if (!existing) {
    return { status: 404, body: { error: "Event not found" } };
  }
  if (!Object.prototype.hasOwnProperty.call(existing, "status")) {
    if (existing.isActive && existing.mode === "battle_ai") {
      await requireRuntime().setAiBattleEventActive?.(false);
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "ScheduledEvent" WHERE "id" = $1`, id);
    return { status: 200, body: { ok: true } };
  }

  if (existing.isActive) {
    await stopScheduledEventNow(prisma, id, { reason: "deleted" });
  }

  await prisma.scheduledEvent.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      enabled: false,
      isActive: false,
      status: "disabled",
      disabledAt: new Date(),
    },
  });
  return { status: 200, body: { ok: true } };
}

export async function startScheduledEventNow(prisma, id, { reason = "manual" } = {}) {
  const event = await prisma.scheduledEvent.findUnique({ where: { id } });
  if (!event || event.deletedAt) return { status: 404, body: { error: "Event not found" } };
  if (!event.enabled && reason !== "manual_toggle") {
    return { status: 400, body: { error: "Event is disabled" } };
  }

  if (event.mode === "battle_ai") {
    await deactivateOtherBattleAiEvents(prisma, id);
  }

  const existingRun = await getLiveRun(prisma, id);
  if (existingRun) return { status: 200, body: { event, run: existingRun } };

  const startedAt = new Date();
  const durationMinutes = event.durationMinutes || DEFAULT_DURATION_MINUTES;
  const plannedEndAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  const run = await prisma.eventRun.create({
    data: {
      scheduledEventId: event.id,
      eventKey: event.eventKey,
      mode: event.mode,
      status: "live",
      startedAt,
      plannedEndAt,
      rulesSnapshot: event.rules ?? undefined,
      themeSnapshot: event.theme ?? undefined,
      rewardsSnapshot: event.rewards ?? undefined,
      metadata: { reason },
    },
  });

  await applyEventRuntime(event, run);

  const row = await prisma.scheduledEvent.update({
    where: { id },
    data: {
      isActive: true,
      enabled: true,
      status: "live",
      startsAt: event.startsAt ?? startedAt,
      endsAt: plannedEndAt,
      lastRunAt: startedAt,
      nextRunAt: null,
    },
  });

  await prisma.event.create({
    data: {
      type: "event_run_started",
      meta: { eventKey: event.eventKey, eventRunId: run.id, mode: event.mode, reason },
    },
  }).catch(() => {});

  return { status: 200, body: { event: row, run } };
}

export async function stopScheduledEventNow(prisma, id, { reason = "manual" } = {}) {
  const event = await prisma.scheduledEvent.findUnique({ where: { id } });
  if (!event || event.deletedAt) return { status: 404, body: { error: "Event not found" } };
  const run = await getLiveRun(prisma, id);
  const endedAt = new Date();

  if (run) {
    await clearEventRuntime(event, run, reason);
    await closeParticipationsForRun(prisma, run.id, endedAt);
    const rollup = await computeRunRollup(prisma, run.id);
    await prisma.eventRun.update({
      where: { id: run.id },
      data: {
        status: "ended",
        endedAt,
        endedReason: reason,
        ...rollup,
      },
    });
  } else if (event.isActive) {
    await clearEventRuntime(event, null, reason);
  }

  const nextRunAt = computeNextRun({ ...event, startsAt: event.startsAt }, endedAt);
  const row = await prisma.scheduledEvent.update({
    where: { id },
    data: {
      isActive: false,
      status: event.enabled && nextRunAt ? "scheduled" : "ended",
      endsAt: endedAt,
      lastRunAt: endedAt,
      nextRunAt,
    },
  });

  await prisma.event.create({
    data: {
      type: "event_run_ended",
      meta: { eventKey: event.eventKey, eventRunId: run?.id ?? null, mode: event.mode, reason },
    },
  }).catch(() => {});

  return { status: 200, body: { event: row, runId: run?.id ?? null } };
}

export async function enableScheduledEvent(prisma, id) {
  const event = await prisma.scheduledEvent.findUnique({ where: { id } });
  if (!event || event.deletedAt) return { status: 404, body: { error: "Event not found" } };
  const nextRunAt = computeNextRun(event);
  const row = await prisma.scheduledEvent.update({
    where: { id },
    data: { enabled: true, disabledAt: null, status: nextRunAt ? "scheduled" : "draft", nextRunAt },
  });
  return { status: 200, body: row };
}

export async function disableScheduledEvent(prisma, id) {
  const event = await prisma.scheduledEvent.findUnique({ where: { id } });
  if (!event || event.deletedAt) return { status: 404, body: { error: "Event not found" } };
  if (event.isActive) await stopScheduledEventNow(prisma, id, { reason: "disabled" });
  const row = await prisma.scheduledEvent.update({
    where: { id },
    data: { enabled: false, status: "disabled", disabledAt: new Date(), nextRunAt: null },
  });
  return { status: 200, body: row };
}

export async function closeParticipationsForRun(prisma, eventRunId, endedAt = new Date()) {
  const open = await prisma.eventParticipation.findMany({
    where: { eventRunId, leftAt: null },
  });
  for (const participation of open) {
    const sessionDurationMs = Math.max(
      0,
      endedAt.getTime() - participation.joinedAt.getTime(),
    );
    await prisma.eventParticipation.update({
      where: { id: participation.id },
      data: { leftAt: endedAt, sessionDurationMs, lastActiveAt: endedAt },
    });
  }
}

async function computeRunRollup(prisma, eventRunId) {
  const participations = await prisma.eventParticipation.findMany({
    where: { eventRunId },
  });
  const durations = participations
    .map((p) => p.sessionDurationMs)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const avgSessionDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length)
      : null;
  const matchCount = participations.reduce((sum, p) => sum + (p.matchesPlayed || 0), 0);
  return {
    uniqueParticipants: participations.length,
    matchCount,
    completedMatchCount: matchCount,
    avgSessionDurationMs,
  };
}

export async function tickScheduledEvents(prisma, now = new Date()) {
  let liveRuns = [];
  try {
    liveRuns = await prisma.eventRun.findMany({
      where: { status: "live", plannedEndAt: { lte: now } },
      select: { scheduledEventId: true },
    });
  } catch (error) {
    if (isLegacyScheduledEventSchema(error) || error?.code === "P2021" || error?.code === "P2022") {
      return;
    }
    throw error;
  }
  for (const run of liveRuns) {
    await stopScheduledEventNow(prisma, run.scheduledEventId, { reason: "expired" });
  }

  let due = [];
  try {
    due = await prisma.scheduledEvent.findMany({
      where: {
        enabled: true,
        deletedAt: null,
        isActive: false,
        nextRunAt: { lte: now },
        status: { in: ["scheduled", "ended"] },
      },
      orderBy: { nextRunAt: "asc" },
      take: 10,
    });
  } catch (error) {
    if (isLegacyScheduledEventSchema(error) || error?.code === "P2021" || error?.code === "P2022") {
      return;
    }
    throw error;
  }
  for (const event of due) {
    await startScheduledEventNow(prisma, event.id, { reason: "scheduled" });
  }
}

export async function getLiveOpsSummary(prisma, { getRuntimeSnapshot } = {}) {
  const now = new Date();
  await tickScheduledEvents(prisma, now);
  let eventsTotal = 0;
  let liveRuns = [];
  let scheduled = 0;
  let disabled = 0;
  let recentRuns = [];
  let runtimeSnapshot = null;
  try {
    [eventsTotal, liveRuns, scheduled, disabled, recentRuns, runtimeSnapshot] =
      await Promise.all([
      prisma.scheduledEvent.count({ where: { deletedAt: null } }),
      prisma.eventRun.findMany({
        where: { status: "live" },
        include: { scheduledEvent: true, participations: true },
        orderBy: { startedAt: "desc" },
      }),
      prisma.scheduledEvent.count({
        where: { deletedAt: null, enabled: true, status: "scheduled" },
      }),
      prisma.scheduledEvent.count({
        where: { deletedAt: null, OR: [{ enabled: false }, { status: "disabled" }] },
      }),
      prisma.eventRun.findMany({
        where: { status: "ended" },
        orderBy: { endedAt: "desc" },
        take: 8,
        include: { scheduledEvent: true },
      }),
      typeof getRuntimeSnapshot === "function" ? getRuntimeSnapshot() : Promise.resolve(null),
    ]);
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error) && error?.code !== "P2021" && error?.code !== "P2022") {
      throw error;
    }
    const legacyEvents = await legacyListScheduledEvents(prisma).catch(() => []);
    eventsTotal = legacyEvents.length;
    scheduled = legacyEvents.filter((event) => !event.isActive).length;
    disabled = 0;
    runtimeSnapshot =
      typeof getRuntimeSnapshot === "function" ? await getRuntimeSnapshot() : null;
  }

  const live = liveRuns.map((run) => {
    const activePlayers = run.participations.filter((p) => !p.leftAt).length;
    return {
      ...run,
      activePlayers,
      uptimeMs: Math.max(0, now.getTime() - run.startedAt.getTime()),
    };
  });

  return {
    generatedAt: now.toISOString(),
    totals: {
      events: eventsTotal,
      liveEvents: liveRuns.length,
      scheduledEvents: scheduled,
      disabledEvents: disabled,
      activeParticipants: live.reduce((sum, run) => sum + run.activePlayers, 0),
    },
    live,
    recentRuns,
    runtime: runtimeSnapshot,
  };
}

export async function listEventRuns(prisma, { status, limit = 50 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return prisma.eventRun.findMany({
    where: status ? { status } : undefined,
    orderBy: { startedAt: "desc" },
    take,
    include: { scheduledEvent: true },
  });
}

export async function getEventRunDetail(prisma, id) {
  return prisma.eventRun.findUnique({
    where: { id },
    include: { scheduledEvent: true, participations: { orderBy: { joinedAt: "desc" } } },
  });
}

export async function ensureDefaultScheduledEvent(prisma) {
  try {
    await prisma.scheduledEvent.upsert({
      where: { eventKey: "ai_battle_hour" },
      create: {
        name: "AI Battle Hour",
        eventKey: "ai_battle_hour",
        mode: "battle_ai",
        scheduleSlot: config.aiBattleEventSlot,
        timezone: "UTC",
        description: "Featured AI Battle lobby for live events",
        isActive: config.aiBattleEventActive,
        featured: true,
        status: config.aiBattleEventActive ? "live" : "scheduled",
        enabled: true,
        durationMinutes: 60,
        recurrenceRule: "daily",
        recurrenceTimezone: "UTC",
      },
      update: {
        durationMinutes: 60,
        recurrenceRule: "daily",
        recurrenceTimezone: "UTC",
      },
    });
  } catch (error) {
    if (!isLegacyScheduledEventSchema(error)) throw error;
    const existing = await legacyFindScheduledEventByKey(prisma, "ai_battle_hour");
    if (!existing) {
      await legacyCreateScheduledEvent(prisma, {
        name: "AI Battle Hour",
        eventKey: "ai_battle_hour",
        mode: "battle_ai",
        scheduleSlot: config.aiBattleEventSlot,
        timezone: "UTC",
        description: "Featured AI Battle lobby for live events",
        isActive: config.aiBattleEventActive,
        featured: true,
      });
    }
  }
}

export async function syncActiveEventsOnStartup(prisma) {
  await ensureDefaultScheduledEvent(prisma);
  await tickScheduledEvents(prisma);

  let active = [];
  try {
    active = await prisma.scheduledEvent.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    if (isLegacyScheduledEventSchema(error)) {
      active = (await legacyListScheduledEvents(prisma)).filter((event) => event.isActive);
    } else {
      throw error;
    }
  }

  let battleAiApplied = false;

  for (const event of active) {
    if (!Object.prototype.hasOwnProperty.call(event, "status")) {
      if (event.mode === "battle_ai") {
        requireRuntime().setCurrentEventSlot?.(event.scheduleSlot);
        await requireRuntime().setAiBattleEventActive?.(true);
      }
      continue;
    }
    if (event.mode === "battle_ai") {
      if (battleAiApplied) {
        await prisma.scheduledEvent.update({
          where: { id: event.id },
          data: { isActive: false },
        });
        continue;
      }
      let run = await getLiveRun(prisma, event.id);
      if (!run) {
        const result = await startScheduledEventNow(prisma, event.id, {
          reason: "startup",
        });
        run = result.body?.run ?? null;
      } else {
        await applyEventRuntime(event, run);
      }
      battleAiApplied = true;
      continue;
    }

    const run = await getLiveRun(prisma, event.id);
    if (run) await applyEventRuntime(event, run);
  }
}
