CREATE TYPE "MatchSlotSide" AS ENUM ('HOME', 'AWAY');

CREATE TABLE "MatchSlot" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "matchId" text NOT NULL REFERENCES "Match"("id") ON DELETE CASCADE,
  "side" "MatchSlotSide" NOT NULL,
  "label" text NOT NULL,
  "resolvedTeamId" text REFERENCES "Team"("id") ON DELETE SET NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchSlot_matchId_side_key" UNIQUE ("matchId", "side")
);

CREATE INDEX "MatchSlot_resolvedTeamId_idx" ON "MatchSlot" ("resolvedTeamId");
