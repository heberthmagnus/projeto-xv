-- Agenda independente dos times permanentes; não altera jogos de campeonatos existentes.

CREATE TYPE "InterclubesFixtureType" AS ENUM ('AMISTOSO', 'INTERCLUBES');

CREATE TABLE "InterclubesFixture" (
  "id" TEXT NOT NULL,
  "permanentTeamId" TEXT NOT NULL,
  "type" "InterclubesFixtureType" NOT NULL,
  "opponentName" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "notes" TEXT,
  "homeGame" BOOLEAN NOT NULL DEFAULT true,
  "status" "MatchStatus" NOT NULL DEFAULT 'AGENDADO',
  "clubScore" INTEGER,
  "opponentScore" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterclubesFixture_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterclubesFixture_permanentTeamId_fkey" FOREIGN KEY ("permanentTeamId") REFERENCES "PermanentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InterclubesFixture_permanentTeamId_scheduledAt_idx" ON "InterclubesFixture"("permanentTeamId", "scheduledAt");
CREATE INDEX "InterclubesFixture_scheduledAt_status_idx" ON "InterclubesFixture"("scheduledAt", "status");
