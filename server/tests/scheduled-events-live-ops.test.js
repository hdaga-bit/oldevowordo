import { jest } from "@jest/globals";
import {
  computeNextRun,
  registerEventRuntime,
  startScheduledEventNow,
  stopScheduledEventNow,
} from "../scheduled-events.js";

function fakePrisma(seedEvent) {
  const scheduledEvents = new Map([[seedEvent.id, { ...seedEvent }]]);
  const eventRuns = new Map();
  const participations = new Map();
  let runSeq = 0;

  return {
    _state: { scheduledEvents, eventRuns, participations },
    scheduledEvent: {
      findUnique: async ({ where }) => scheduledEvents.get(where.id) || null,
      update: async ({ where, data }) => {
        const current = scheduledEvents.get(where.id);
        const next = { ...current, ...data, updatedAt: new Date() };
        scheduledEvents.set(where.id, next);
        return next;
      },
      findMany: async () => [...scheduledEvents.values()],
    },
    eventRun: {
      findFirst: async ({ where }) =>
        [...eventRuns.values()].find(
          (run) =>
            run.scheduledEventId === where.scheduledEventId &&
            (!where.status || run.status === where.status),
        ) || null,
      create: async ({ data }) => {
        const run = {
          id: `run-${++runSeq}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          uniqueParticipants: 0,
          peakConcurrentPlayers: 0,
          matchCount: 0,
          completedMatchCount: 0,
          avgSessionDurationMs: null,
          ...data,
        };
        eventRuns.set(run.id, run);
        return run;
      },
      update: async ({ where, data }) => {
        const current = eventRuns.get(where.id);
        const next = { ...current, ...data, updatedAt: new Date() };
        eventRuns.set(where.id, next);
        return next;
      },
      findMany: async () => [...eventRuns.values()],
    },
    eventParticipation: {
      findMany: async ({ where }) =>
        [...participations.values()].filter((p) => p.eventRunId === where.eventRunId),
      update: async ({ where, data }) => {
        const current = participations.get(where.id);
        const next = { ...current, ...data, updatedAt: new Date() };
        participations.set(where.id, next);
        return next;
      },
    },
    event: {
      create: async () => ({}),
    },
  };
}

describe("live ops scheduled events", () => {
  beforeEach(() => {
    registerEventRuntime({
      activateEventRun: jest.fn(async () => ({ ok: true })),
      deactivateEventRun: jest.fn(async () => ({ ok: true })),
    });
  });

  it("computes next one-time and recurring runs", () => {
    const now = new Date("2026-05-25T12:00:00Z");
    expect(
      computeNextRun(
        { startsAt: new Date("2026-05-25T13:00:00Z"), recurrenceRule: null },
        now,
      )?.toISOString(),
    ).toBe("2026-05-25T13:00:00.000Z");

    expect(
      computeNextRun(
        { startsAt: new Date("2026-05-24T13:00:00Z"), recurrenceRule: "daily" },
        now,
      )?.toISOString(),
    ).toBe("2026-05-25T13:00:00.000Z");
  });

  it("starts and stops an event run with lifecycle state updates", async () => {
    const prisma = fakePrisma({
      id: "event-1",
      name: "Rush Hour",
      eventKey: "rush_hour",
      mode: "battle",
      scheduleSlot: "20:00-21:00",
      timezone: "UTC",
      description: null,
      isActive: false,
      featured: true,
      status: "scheduled",
      enabled: true,
      durationMinutes: 30,
      startsAt: null,
      recurrenceRule: null,
      rules: { roundMs: 180000 },
      theme: null,
      rewards: null,
      metadata: null,
    });

    const started = await startScheduledEventNow(prisma, "event-1");
    expect(started.status).toBe(200);
    expect(started.body.event.status).toBe("live");
    expect(started.body.run.status).toBe("live");

    const stopped = await stopScheduledEventNow(prisma, "event-1", {
      reason: "manual",
    });
    expect(stopped.status).toBe(200);
    expect(stopped.body.event.isActive).toBe(false);
    expect([...prisma._state.eventRuns.values()][0].status).toBe("ended");
  });
});
