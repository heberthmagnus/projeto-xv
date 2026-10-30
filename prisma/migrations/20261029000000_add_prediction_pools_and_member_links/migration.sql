-- PREPARADA LOCALMENTE: não aplicar sem aprovação explícita para o Supabase.
-- Não altera jogos, resultados, contas ou históricos existentes.

CREATE TYPE "PredictionPoolCategory" AS ENUM ('ADULTO', 'MASTER');
CREATE TYPE "MemberInvitationStatus" AS ENUM ('PENDENTE', 'ACEITO', 'CANCELADO', 'EXPIRADO');

ALTER TABLE "AthleteProfile" ADD COLUMN "memberId" TEXT;
CREATE UNIQUE INDEX "AthleteProfile_memberId_key" ON "AthleteProfile"("memberId");
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MemberInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "MemberInvitationStatus" NOT NULL DEFAULT 'PENDENTE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "MemberInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MemberInvitation_tokenHash_key" ON "MemberInvitation"("tokenHash");
CREATE INDEX "MemberInvitation_email_status_idx" ON "MemberInvitation"("email", "status");
CREATE INDEX "MemberInvitation_expiresAt_idx" ON "MemberInvitation"("expiresAt");

CREATE TABLE "PredictionPool" (
  "id" TEXT NOT NULL,
  "championshipId" TEXT NOT NULL,
  "category" "PredictionPoolCategory" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PredictionPool_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PredictionPool_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PredictionPool_championshipId_category_key" ON "PredictionPool"("championshipId", "category");
CREATE INDEX "PredictionPool_active_category_idx" ON "PredictionPool"("active", "category");

CREATE TABLE "PredictionPoolParticipant" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "firstPredictionAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PredictionPoolParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PredictionPoolParticipant_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PredictionPool"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PredictionPoolParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PredictionPoolParticipant_poolId_memberId_key" ON "PredictionPoolParticipant"("poolId", "memberId");
CREATE INDEX "PredictionPoolParticipant_memberId_joinedAt_idx" ON "PredictionPoolParticipant"("memberId", "joinedAt");

CREATE TABLE "PredictionPoolMatch" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "lockAt" TIMESTAMP(3) NOT NULL,
  "lockedAt" TIMESTAMP(3),
  "eligible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PredictionPoolMatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PredictionPoolMatch_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PredictionPool"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PredictionPoolMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PredictionPoolMatch_poolId_matchId_key" ON "PredictionPoolMatch"("poolId", "matchId");
CREATE INDEX "PredictionPoolMatch_poolId_lockAt_idx" ON "PredictionPoolMatch"("poolId", "lockAt");
CREATE INDEX "PredictionPoolMatch_matchId_idx" ON "PredictionPoolMatch"("matchId");

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "poolMatchId" TEXT NOT NULL,
  "homeGoals" INTEGER NOT NULL,
  "awayGoals" INTEGER NOT NULL,
  "basePoints" INTEGER NOT NULL DEFAULT 0,
  "awardedPoints" INTEGER NOT NULL DEFAULT 0,
  "scoredAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prediction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "PredictionPoolParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prediction_poolMatchId_fkey" FOREIGN KEY ("poolMatchId") REFERENCES "PredictionPoolMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Prediction_participantId_poolMatchId_key" ON "Prediction"("participantId", "poolMatchId");
CREATE INDEX "Prediction_poolMatchId_scoredAt_idx" ON "Prediction"("poolMatchId", "scoredAt");

CREATE TABLE "PredictionMultiplier" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "poolMatchId" TEXT NOT NULL,
  "round" INTEGER NOT NULL,
  "lockedAt" TIMESTAMP(3),
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PredictionMultiplier_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PredictionMultiplier_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "PredictionPoolParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PredictionMultiplier_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PredictionPool"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PredictionMultiplier_poolMatchId_fkey" FOREIGN KEY ("poolMatchId") REFERENCES "PredictionPoolMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PredictionMultiplier_participantId_poolId_round_key" ON "PredictionMultiplier"("participantId", "poolId", "round");
CREATE INDEX "PredictionMultiplier_poolMatchId_idx" ON "PredictionMultiplier"("poolMatchId");

-- A aplicação acessa estas tabelas exclusivamente via Prisma no servidor.
ALTER TABLE public."MemberInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredictionPool" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredictionPoolParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredictionPoolMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Prediction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredictionMultiplier" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."MemberInvitation", public."PredictionPool", public."PredictionPoolParticipant", public."PredictionPoolMatch", public."Prediction", public."PredictionMultiplier" FROM anon, authenticated;
