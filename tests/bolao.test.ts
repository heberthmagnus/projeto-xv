import { strict as assert } from "node:assert";
import { test } from "node:test";
import { awardedPoints, buildRanking, calculateStoredPredictionScore, getLockAt, isPredictionOpen, scorePrediction } from "../lib/bolao";

test("pontuação respeita tiers mutuamente exclusivos, inclusive empate e placar zero", () => {
  assert.equal(scorePrediction({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 }).basePoints, 10);
  assert.equal(scorePrediction({ homeGoals: 2, awayGoals: 0 }, { homeGoals: 2, awayGoals: 1 }).basePoints, 8);
  assert.equal(scorePrediction({ homeGoals: 3, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 }).basePoints, 7);
  assert.equal(scorePrediction({ homeGoals: 4, awayGoals: 2 }, { homeGoals: 2, awayGoals: 1 }).basePoints, 5);
  assert.equal(scorePrediction({ homeGoals: 0, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 }).basePoints, 0);
  assert.equal(scorePrediction({ homeGoals: 0, awayGoals: 0 }, { homeGoals: 0, awayGoals: 0 }).basePoints, 10);
  assert.equal(scorePrediction({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 0, awayGoals: 0 }).basePoints, 5);
});

test("bloqueio ocorre exatamente dez minutos antes e multiplicador dobra somente pontos", () => {
  const kickoff = new Date("2026-11-01T15:00:00.000Z");
  const lockAt = getLockAt(kickoff);
  assert.equal(lockAt.toISOString(), "2026-11-01T14:50:00.000Z");
  assert.equal(isPredictionOpen(lockAt, new Date("2026-11-01T14:49:59.999Z")), true);
  assert.equal(isPredictionOpen(lockAt, lockAt), false);
  assert.equal(awardedPoints(10, true), 20);
  assert.equal(awardedPoints(8, false), 8);
});

test("reprocessamento só persiste pontuação de resultado oficial finalizado", () => {
  assert.deepEqual(calculateStoredPredictionScore({
    prediction: { homeGoals: 2, awayGoals: 1 },
    officialScore: { homeGoals: 2, awayGoals: 1 },
    eligible: true,
    finalized: true,
    multiplierSelected: true,
  }), { basePoints: 10, awardedPoints: 20, scored: true });
  assert.deepEqual(calculateStoredPredictionScore({
    prediction: { homeGoals: 2, awayGoals: 1 },
    officialScore: { homeGoals: 2, awayGoals: 1 },
    eligible: true,
    finalized: false,
    multiplierSelected: true,
  }), { basePoints: 0, awardedPoints: 0, scored: false });
});

test("ranking mantém ausência fora dos erros, calcula eficiência e usa posição de competição", () => {
  const ranking = buildRanking([
    { participantId: "a", name: "Ana", round: 1, submitted: true, basePoints: 10, awardedPoints: 10, maximumPoints: 10 },
    { participantId: "a", name: "Ana", round: 2, submitted: false, basePoints: 0, awardedPoints: 0, maximumPoints: 10 },
    { participantId: "b", name: "Bia", round: 1, submitted: true, basePoints: 10, awardedPoints: 10, maximumPoints: 10 },
    { participantId: "c", name: "Caio", round: 1, submitted: true, basePoints: 5, awardedPoints: 5, maximumPoints: 10 },
  ], 2);
  const ana = ranking.find((entry) => entry.participantId === "a")!;
  const bia = ranking.find((entry) => entry.participantId === "b")!;
  const caio = ranking.find((entry) => entry.participantId === "c")!;
  assert.equal(ana.position, 1);
  assert.equal(bia.position, 1);
  assert.equal(caio.position, 3);
  assert.equal(ana.submittedErrors, 0);
  assert.equal(ana.efficiencyDenominator, 20);
  assert.equal(ana.efficiencyPercent, 50);
});
