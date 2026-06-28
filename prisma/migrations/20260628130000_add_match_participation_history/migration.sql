ALTER TABLE "Match" ADD COLUMN "referee" TEXT;

CREATE TABLE "MatchPlayerParticipation" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "starter" BOOLEAN NOT NULL DEFAULT false,
  "bionic" BOOLEAN NOT NULL DEFAULT false,
  "goals" INTEGER NOT NULL DEFAULT 0,
  "assists" INTEGER,
  "yellowCards" INTEGER NOT NULL DEFAULT 0,
  "redCards" INTEGER NOT NULL DEFAULT 0,
  "ownGoals" INTEGER NOT NULL DEFAULT 0,
  "mvp" BOOLEAN NOT NULL DEFAULT false,
  "minutesPlayed" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MatchPlayerParticipation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchPlayerParticipation_matchId_playerId_teamId_key"
  ON "MatchPlayerParticipation"("matchId", "playerId", "teamId");

CREATE INDEX "MatchPlayerParticipation_playerId_idx"
  ON "MatchPlayerParticipation"("playerId");

CREATE INDEX "MatchPlayerParticipation_teamId_idx"
  ON "MatchPlayerParticipation"("teamId");

ALTER TABLE "MatchPlayerParticipation"
  ADD CONSTRAINT "MatchPlayerParticipation_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchPlayerParticipation"
  ADD CONSTRAINT "MatchPlayerParticipation_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MatchPlayerParticipation"
  ADD CONSTRAINT "MatchPlayerParticipation_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
