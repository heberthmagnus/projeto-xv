ALTER TYPE "MatchEventType" ADD VALUE IF NOT EXISTS 'CARTAO_AZUL';

ALTER TABLE "MatchEvent"
  ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "playerId" TEXT;

CREATE INDEX IF NOT EXISTS "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");
CREATE INDEX IF NOT EXISTS "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");
CREATE INDEX IF NOT EXISTS "MatchEvent_teamId_idx" ON "MatchEvent"("teamId");

ALTER TABLE "MatchEvent"
  ADD CONSTRAINT "MatchEvent_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "AthleteProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "SuspensionStatus" AS ENUM ('ATIVA', 'CUMPRIDA', 'CANCELADA');

CREATE TABLE "Suspension" (
  "id" TEXT NOT NULL,
  "championshipId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "relatedEventId" TEXT,
  "relatedMatchId" TEXT,
  "matchesSuspended" INTEGER NOT NULL DEFAULT 1,
  "status" "SuspensionStatus" NOT NULL DEFAULT 'ATIVA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Suspension_championshipId_status_idx" ON "Suspension"("championshipId", "status");
CREATE INDEX "Suspension_playerId_idx" ON "Suspension"("playerId");
CREATE INDEX "Suspension_teamId_idx" ON "Suspension"("teamId");
CREATE INDEX "Suspension_relatedEventId_idx" ON "Suspension"("relatedEventId");
CREATE INDEX "Suspension_relatedMatchId_idx" ON "Suspension"("relatedMatchId");

ALTER TABLE "Suspension"
  ADD CONSTRAINT "Suspension_championshipId_fkey"
  FOREIGN KEY ("championshipId") REFERENCES "Championship"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Suspension"
  ADD CONSTRAINT "Suspension_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "AthleteProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Suspension"
  ADD CONSTRAINT "Suspension_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Suspension"
  ADD CONSTRAINT "Suspension_relatedEventId_fkey"
  FOREIGN KEY ("relatedEventId") REFERENCES "MatchEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Suspension"
  ADD CONSTRAINT "Suspension_relatedMatchId_fkey"
  FOREIGN KEY ("relatedMatchId") REFERENCES "Match"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
