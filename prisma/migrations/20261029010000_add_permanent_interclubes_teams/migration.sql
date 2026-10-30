-- PREPARADA LOCALMENTE: aplicar no Supabase somente após aprovação explícita.
-- Cria equipes permanentes e o histórico dos atletas, sem tocar em campeonatos existentes.

CREATE TYPE "PermanentTeamCategory" AS ENUM ('LIVRE', 'MAIS_38', 'MAIS_48', 'MAIS_58');

CREATE TABLE "PermanentTeam" (
  "id" TEXT NOT NULL,
  "category" "PermanentTeamCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "activeForInterclubes" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PermanentTeam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PermanentTeam_category_key" ON "PermanentTeam"("category");

CREATE TABLE "PermanentTeamMembership" (
  "id" TEXT NOT NULL,
  "permanentTeamId" TEXT NOT NULL,
  "athleteProfileId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PermanentTeamMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PermanentTeamMembership_permanentTeamId_fkey" FOREIGN KEY ("permanentTeamId") REFERENCES "PermanentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PermanentTeamMembership_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PermanentTeamMembership_permanentTeamId_leftAt_idx" ON "PermanentTeamMembership"("permanentTeamId", "leftAt");
CREATE INDEX "PermanentTeamMembership_athleteProfileId_leftAt_idx" ON "PermanentTeamMembership"("athleteProfileId", "leftAt");
