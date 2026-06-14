-- Live ops event configuration, run history, and participation tracking.

ALTER TABLE "ScheduledEvent"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "recurrenceRule" TEXT,
  ADD COLUMN "recurrenceTimezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "lastRunAt" TIMESTAMP(3),
  ADD COLUMN "nextRunAt" TIMESTAMP(3),
  ADD COLUMN "rules" JSONB,
  ADD COLUMN "theme" JSONB,
  ADD COLUMN "rewards" JSONB,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "disabledAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "updatedByUserId" TEXT;

UPDATE "ScheduledEvent"
SET
  "status" = CASE WHEN "isActive" THEN 'live' ELSE 'scheduled' END,
  "enabled" = true,
  "durationMinutes" = 60,
  "recurrenceTimezone" = COALESCE("timezone", 'UTC');

CREATE TABLE "EventRun" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "scheduledEventId" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'live',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "plannedEndAt" TIMESTAMP(3) NOT NULL,
  "endedReason" TEXT,
  "roomId" TEXT,
  "rulesSnapshot" JSONB,
  "themeSnapshot" JSONB,
  "rewardsSnapshot" JSONB,
  "metadata" JSONB,
  "uniqueParticipants" INTEGER NOT NULL DEFAULT 0,
  "peakConcurrentPlayers" INTEGER NOT NULL DEFAULT 0,
  "matchCount" INTEGER NOT NULL DEFAULT 0,
  "completedMatchCount" INTEGER NOT NULL DEFAULT 0,
  "avgSessionDurationMs" INTEGER,

  CONSTRAINT "EventRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventParticipation" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "eventRunId" TEXT NOT NULL,
  "userId" TEXT,
  "playerId" TEXT,
  "roomId" TEXT,
  "displayNameSnapshot" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "sessionDurationMs" INTEGER,
  "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "disconnects" INTEGER NOT NULL DEFAULT 0,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB,

  CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduledEvent_enabled_status_idx" ON "ScheduledEvent"("enabled", "status");
CREATE INDEX "ScheduledEvent_nextRunAt_idx" ON "ScheduledEvent"("nextRunAt");
CREATE INDEX "ScheduledEvent_mode_status_idx" ON "ScheduledEvent"("mode", "status");

CREATE INDEX "EventRun_status_startedAt_idx" ON "EventRun"("status", "startedAt");
CREATE INDEX "EventRun_eventKey_startedAt_idx" ON "EventRun"("eventKey", "startedAt");
CREATE INDEX "EventRun_scheduledEventId_startedAt_idx" ON "EventRun"("scheduledEventId", "startedAt");
CREATE INDEX "EventRun_roomId_idx" ON "EventRun"("roomId");

CREATE UNIQUE INDEX "EventParticipation_eventRunId_playerId_key" ON "EventParticipation"("eventRunId", "playerId");
CREATE INDEX "EventParticipation_eventRunId_lastActiveAt_idx" ON "EventParticipation"("eventRunId", "lastActiveAt");
CREATE INDEX "EventParticipation_userId_joinedAt_idx" ON "EventParticipation"("userId", "joinedAt");
CREATE INDEX "EventParticipation_roomId_idx" ON "EventParticipation"("roomId");

ALTER TABLE "EventRun"
  ADD CONSTRAINT "EventRun_scheduledEventId_fkey"
  FOREIGN KEY ("scheduledEventId") REFERENCES "ScheduledEvent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventParticipation"
  ADD CONSTRAINT "EventParticipation_eventRunId_fkey"
  FOREIGN KEY ("eventRunId") REFERENCES "EventRun"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventParticipation"
  ADD CONSTRAINT "EventParticipation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
