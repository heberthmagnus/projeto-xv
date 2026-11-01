import { MatchStatus, Prisma } from "@prisma/client";
import { calculateStoredPredictionScore, getLockAt } from "@/lib/bolao";

/**
 * Mantém o espelho do Bolão consistente com o resultado oficial de uma partida.
 * Deve ser chamado na mesma transação que publica, corrige ou cancela o resultado.
 */
export async function syncPredictionPoolsForMatch(tx: Prisma.TransactionClient, matchId: string, now = new Date()) {
  const poolMatches = await tx.predictionPoolMatch.findMany({
    where: { matchId },
    select: {
      id: true,
      poolId: true,
      eligible: true,
      lockAt: true,
      lockedAt: true,
      match: { select: { status: true, homeScore: true, awayScore: true } },
      predictions: { select: { id: true, participantId: true, homeGoals: true, awayGoals: true, basePoints: true, awardedPoints: true, scoredAt: true } },
      multipliers: { select: { participantId: true } },
    },
  });

  let recalculatedPredictions = 0;
  for (const poolMatch of poolMatches) {
    if (!poolMatch.lockedAt && poolMatch.lockAt <= now) {
      await tx.predictionPoolMatch.update({ where: { id: poolMatch.id }, data: { lockedAt: now } });
    }
    await tx.predictionMultiplier.updateMany({
      where: { poolMatchId: poolMatch.id, lockedAt: null, poolMatch: { lockAt: { lte: now } } },
      data: { lockedAt: now },
    });
    const multiplierParticipants = new Set(poolMatch.multipliers.map((item) => item.participantId));
    for (const prediction of poolMatch.predictions) {
      const canScore = poolMatch.eligible
        && poolMatch.match.status === MatchStatus.FINALIZADO
        && poolMatch.match.homeScore !== null
        && poolMatch.match.awayScore !== null;
      const score = calculateStoredPredictionScore({
        prediction,
        officialScore: canScore ? { homeGoals: poolMatch.match.homeScore!, awayGoals: poolMatch.match.awayScore! } : null,
        eligible: poolMatch.eligible,
        finalized: poolMatch.match.status === MatchStatus.FINALIZADO,
        multiplierSelected: multiplierParticipants.has(prediction.participantId),
      });
      if (prediction.basePoints !== score.basePoints || prediction.awardedPoints !== score.awardedPoints || Boolean(prediction.scoredAt) !== score.scored) {
        await tx.prediction.update({
          where: { id: prediction.id },
          data: { basePoints: score.basePoints, awardedPoints: score.awardedPoints, scoredAt: score.scored ? now : null },
        });
        recalculatedPredictions += 1;
      }
    }
  }
  return { poolIds: [...new Set(poolMatches.map((item) => item.poolId))], recalculatedPredictions };
}

/** Reagendamentos só alteram o prazo enquanto o prazo original ainda estiver aberto. */
export async function syncPredictionPoolSchedule(tx: Prisma.TransactionClient, matchId: string, scheduledAt: Date | null, status: MatchStatus, now = new Date()) {
  const poolMatches = await tx.predictionPoolMatch.findMany({ where: { matchId }, select: { id: true, lockAt: true, lockedAt: true } });
  for (const poolMatch of poolMatches) {
    const eligible = status !== MatchStatus.CANCELADO && scheduledAt !== null;
    if (!scheduledAt || poolMatch.lockedAt || poolMatch.lockAt <= now) {
      await tx.predictionPoolMatch.update({ where: { id: poolMatch.id }, data: { eligible, lockedAt: poolMatch.lockedAt ?? (poolMatch.lockAt <= now ? now : null) } });
      continue;
    }
    await tx.predictionPoolMatch.update({ where: { id: poolMatch.id }, data: { eligible, lockAt: getLockAt(scheduledAt) } });
  }
}
