import { MatchStatus, PredictionPoolCategory, Prisma, PrismaClient } from "@prisma/client";
import { getLockAt } from "@/lib/bolao";

export type PoolSetupReport = {
  pools: number;
  matchesCreated: number;
  matchesUpdated: number;
  matchesSkipped: number;
};

const categories: PredictionPoolCategory[] = ["ADULTO", "MASTER"];

function categoryFromGroupLabel(groupLabel: string | null): PredictionPoolCategory {
  return groupLabel === "MASTER" ? "MASTER" : "ADULTO";
}

/**
 * Cria ou sincroniza os dois Bolões do Campão sem copiar partidas.
 * Um prazo que já fechou nunca é reaberto por reagendamento posterior.
 */
export async function setupCampaoPredictionPools(client: PrismaClient): Promise<PoolSetupReport> {
  const championship = await client.championship.findUniqueOrThrow({
    where: { slug: "interno-campao-2026" },
    select: {
      id: true,
      teams: { select: { teamId: true, groupLabel: true } },
      matches: { select: { id: true, homeTeamId: true, awayTeamId: true, scheduledAt: true, status: true } },
    },
  });
  const categoryByTeam = new Map(championship.teams.map((team) => [team.teamId, categoryFromGroupLabel(team.groupLabel)]));
  const now = new Date();
  const report: PoolSetupReport = { pools: 0, matchesCreated: 0, matchesUpdated: 0, matchesSkipped: 0 };

  await client.$transaction(async (tx) => {
    for (const category of categories) {
      const pool = await tx.predictionPool.upsert({
        where: { championshipId_category: { championshipId: championship.id, category } },
        create: { championshipId: championship.id, category, active: true },
        update: { active: true },
      });
      report.pools += 1;

      for (const match of championship.matches) {
        const homeCategory = categoryByTeam.get(match.homeTeamId);
        const awayCategory = categoryByTeam.get(match.awayTeamId);
        if (homeCategory !== category || awayCategory !== category || !match.scheduledAt) {
          report.matchesSkipped += 1;
          continue;
        }

        const existing = await tx.predictionPoolMatch.findUnique({
          where: { poolId_matchId: { poolId: pool.id, matchId: match.id } },
          select: { id: true, lockAt: true, lockedAt: true, eligible: true },
        });
        const eligible = match.status !== MatchStatus.CANCELADO;
        if (!existing) {
          const lockAt = getLockAt(match.scheduledAt);
          await tx.predictionPoolMatch.create({ data: { poolId: pool.id, matchId: match.id, lockAt, lockedAt: lockAt <= now ? now : null, eligible } });
          report.matchesCreated += 1;
          continue;
        }

        if (existing.lockedAt || existing.lockAt <= now) {
          if (!existing.lockedAt) await tx.predictionPoolMatch.update({ where: { id: existing.id }, data: { lockedAt: now, eligible } });
          report.matchesUpdated += 1;
          continue;
        }

        await tx.predictionPoolMatch.update({ where: { id: existing.id }, data: { lockAt: getLockAt(match.scheduledAt), eligible } });
        report.matchesUpdated += 1;
      }
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return report;
}
