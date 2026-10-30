import { strict as assert } from "node:assert";
import { test } from "node:test";

/*
 * Este teste é intencionalmente protegido: o projeto ainda não tem banco de
 * homologação. Para executá-lo, forneça IDs exclusivos de teste e habilite a
 * flag explicitamente. Ele nunca roda contra produção por padrão.
 */
const enabled = process.env.RUN_PREDICTION_CONCURRENCY_TESTS === "true";

test("dois envios simultâneos preservam um único palpite por participante e jogo", { skip: !enabled }, async () => {
  const poolId = process.env.TEST_PREDICTION_POOL_ID;
  const participantId = process.env.TEST_PREDICTION_PARTICIPANT_ID;
  const poolMatchId = process.env.TEST_PREDICTION_POOL_MATCH_ID;
  assert.ok(poolId && participantId && poolMatchId, "Defina os IDs isolados de teste antes de executar.");

  const { Prisma, PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const save = (homeGoals: number, awayGoals: number) => prisma.$transaction((tx) => tx.prediction.upsert({
      where: { participantId_poolMatchId: { participantId, poolMatchId } },
      create: { participantId, poolMatchId, homeGoals, awayGoals },
      update: { homeGoals, awayGoals },
    }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await Promise.all([save(1, 0), save(2, 1)]);
    const predictions = await prisma.prediction.findMany({ where: { participantId, poolMatchId } });
    assert.equal(predictions.length, 1);
  } finally {
    await prisma.$disconnect();
  }
});
