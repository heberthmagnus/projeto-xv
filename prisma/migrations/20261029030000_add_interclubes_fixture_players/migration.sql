CREATE TABLE "InterclubesFixturePlayer" (
  "id" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "played" BOOLEAN NOT NULL DEFAULT false,
  "starter" BOOLEAN NOT NULL DEFAULT false,
  "goals" INTEGER NOT NULL DEFAULT 0,
  "yellowCards" INTEGER NOT NULL DEFAULT 0,
  "blueCards" INTEGER NOT NULL DEFAULT 0,
  "redCards" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InterclubesFixturePlayer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterclubesFixturePlayer_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "InterclubesFixture"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InterclubesFixturePlayer_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InterclubesFixturePlayer_fixtureId_athleteId_key" ON "InterclubesFixturePlayer"("fixtureId", "athleteId");
CREATE INDEX "InterclubesFixturePlayer_athleteId_idx" ON "InterclubesFixturePlayer"("athleteId");
