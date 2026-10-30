"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateStoredPredictionScore } from "@/lib/bolao";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ReprocessPoolState = { error?: string; success?: string };

export async function reprocessPool(_: ReprocessPoolState, formData: FormData): Promise<ReprocessPoolState> {
  try {
    const actor = await requirePermission("pool.recalculate");
    const poolId = String(formData.get("poolId") ?? "").trim();
    if (!poolId) throw new Error("Bolão inválido.");

    const pool = await prisma.predictionPool.findUnique({
      where: { id: poolId },
      select: { id: true, category: true, championship: { select: { slug: true } } },
    });
    if (!pool || pool.championship.slug !== "interno-campao-2026") throw new Error("Bolão não encontrado.");

    const [predictions, multipliers] = await Promise.all([
      prisma.prediction.findMany({
        where: { poolMatch: { poolId } },
        select: {
          id: true,
          participantId: true,
          poolMatchId: true,
          homeGoals: true,
          awayGoals: true,
          basePoints: true,
          awardedPoints: true,
          scoredAt: true,
          poolMatch: {
            select: {
              eligible: true,
              match: { select: { status: true, homeScore: true, awayScore: true } },
            },
          },
        },
      }),
      prisma.predictionMultiplier.findMany({
        where: { poolId },
        select: { participantId: true, poolMatchId: true },
      }),
    ]);

    const multiplied = new Set(multipliers.map((item) => `${item.participantId}:${item.poolMatchId}`));
    const now = new Date();
    let changed = 0;

    await prisma.$transaction(async (tx) => {
      await tx.predictionPoolMatch.updateMany({
        where: { poolId, lockAt: { lte: now }, lockedAt: null },
        data: { lockedAt: now },
      });

      for (const prediction of predictions) {
        const official = prediction.poolMatch.match;
        const canScore = prediction.poolMatch.eligible
          && official.status === "FINALIZADO"
          && official.homeScore !== null
          && official.awayScore !== null;
        const calculated = calculateStoredPredictionScore({
          prediction,
          officialScore: canScore ? { homeGoals: official.homeScore!, awayGoals: official.awayScore! } : null,
          eligible: prediction.poolMatch.eligible,
          finalized: official.status === "FINALIZADO",
          multiplierSelected: multiplied.has(`${prediction.participantId}:${prediction.poolMatchId}`),
        });
        const scoredAt = calculated.scored ? now : null;
        if (prediction.basePoints !== calculated.basePoints || prediction.awardedPoints !== calculated.awardedPoints || Boolean(prediction.scoredAt) !== Boolean(scoredAt)) {
          await tx.prediction.update({
            where: { id: prediction.id },
            data: { basePoints: calculated.basePoints, awardedPoints: calculated.awardedPoints, scoredAt },
          });
          changed += 1;
        }
      }

      await tx.administrativeAudit.create({
        data: {
          actorId: actor.id,
          action: "prediction_pool.reprocess",
          target: `PredictionPool:${pool.id}`,
          previous: { storedPredictions: predictions.length },
          next: { category: pool.category, recalculatedPredictions: changed, reprocessedAt: now.toISOString() },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/bolao");
    revalidatePath("/admin/bolao");
    return { success: `Reprocessamento concluído: ${changed} palpite(s) atualizado(s).` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível reprocessar o Bolão." };
  }
}
