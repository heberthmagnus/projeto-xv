CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "instagramUrl" TEXT,
    "whatsapp" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChampionshipTeamSponsor" (
    "id" TEXT NOT NULL,
    "championshipTeamId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChampionshipTeamSponsor_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChampionshipTeam" ADD COLUMN "shirtImageUrl" TEXT;

CREATE INDEX "Sponsor_active_idx" ON "Sponsor"("active");
CREATE UNIQUE INDEX "ChampionshipTeamSponsor_championshipTeamId_sponsorId_key" ON "ChampionshipTeamSponsor"("championshipTeamId", "sponsorId");
CREATE INDEX "ChampionshipTeamSponsor_championshipTeamId_isPrimary_idx" ON "ChampionshipTeamSponsor"("championshipTeamId", "isPrimary");
CREATE INDEX "ChampionshipTeamSponsor_sponsorId_idx" ON "ChampionshipTeamSponsor"("sponsorId");

ALTER TABLE "ChampionshipTeamSponsor" ADD CONSTRAINT "ChampionshipTeamSponsor_championshipTeamId_fkey" FOREIGN KEY ("championshipTeamId") REFERENCES "ChampionshipTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChampionshipTeamSponsor" ADD CONSTRAINT "ChampionshipTeamSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
