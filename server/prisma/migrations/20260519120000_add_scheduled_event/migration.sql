-- CreateTable
CREATE TABLE "ScheduledEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "scheduleSlot" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScheduledEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEvent_eventKey_key" ON "ScheduledEvent"("eventKey");

-- CreateIndex
CREATE INDEX "ScheduledEvent_isActive_idx" ON "ScheduledEvent"("isActive");
