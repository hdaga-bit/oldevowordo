-- Reconcile Neon DB drift (tables/columns added outside migrate history).
-- Safe to run when objects already exist (IF NOT EXISTS / no-op ADD).

-- express-session store (not in Prisma schema, but present on Neon)
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "user_sessions" ("expire");

-- Prisma Session model
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "token" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "Session_token_expiresAt_idx" ON "Session"("token", "expiresAt");
CREATE INDEX IF NOT EXISTS "Session_deviceId_idx" ON "Session"("deviceId");

DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- User profile / auth columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mergedIntoUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mergedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileAvatar" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileColour" TEXT;

-- Leaderboard solve scores
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bestSolveAttempts" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgSolveAttempts" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgEfficiencyScore" DOUBLE PRECISION;
ALTER TABLE "DailyResult" ADD COLUMN IF NOT EXISTS "efficiencyScore" INTEGER;
