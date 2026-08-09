CREATE TABLE "TeamRelationship" (
  "id" TEXT NOT NULL,
  "championshipId" TEXT NOT NULL,
  "category" "RegistrationCategory" NOT NULL,
  "playerAId" TEXT NOT NULL,
  "playerBId" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL,
  "priorityWeight" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamSimulation" (
  "id" TEXT NOT NULL,
  "championshipId" TEXT NOT NULL,
  "category" "RegistrationCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "settings" JSONB NOT NULL,
  "teams" JSONB NOT NULL,
  "statistics" JSONB NOT NULL,
  "balanceScore" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamSimulation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamRelationship_championshipId_playerAId_playerBId_key" ON "TeamRelationship"("championshipId", "playerAId", "playerBId");
CREATE INDEX "TeamRelationship_championshipId_category_idx" ON "TeamRelationship"("championshipId", "category");
CREATE INDEX "TeamSimulation_championshipId_category_updatedAt_idx" ON "TeamSimulation"("championshipId", "category", "updatedAt");

ALTER TABLE "TeamRelationship" ADD CONSTRAINT "TeamRelationship_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamRelationship" ADD CONSTRAINT "TeamRelationship_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamRelationship" ADD CONSTRAINT "TeamRelationship_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamSimulation" ADD CONSTRAINT "TeamSimulation_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
