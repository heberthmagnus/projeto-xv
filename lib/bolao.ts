export type PredictionScoreTier = 0 | 5 | 7 | 8 | 10;

export type PredictionInput = {
  homeGoals: number;
  awayGoals: number;
};

export type PredictionScore = {
  basePoints: PredictionScoreTier;
  outcome: "HOME" | "AWAY" | "DRAW";
  tier: "EXATO" | "VENCEDOR_E_GOLS_VENCEDOR" | "VENCEDOR_E_GOLS_PERDEDOR" | "RESULTADO" | "ERRO";
};

export type RankingInput = {
  participantId: string;
  name: string;
  basePoints: PredictionScoreTier;
  awardedPoints: number;
  round: number;
  submitted: boolean;
  maximumPoints: number;
};

export type RankingEntry = {
  participantId: string;
  name: string;
  position: number;
  points: number;
  exact10: number;
  tier8: number;
  tier7: number;
  tier5: number;
  submittedErrors: number;
  roundsParticipated: number;
  totalRounds: number;
  efficiencyNumerator: number;
  efficiencyDenominator: number;
  efficiencyPercent: number | null;
};

function resultOf({ homeGoals, awayGoals }: PredictionInput): PredictionScore["outcome"] {
  if (homeGoals === awayGoals) return "DRAW";
  return homeGoals > awayGoals ? "HOME" : "AWAY";
}

function assertGoals(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    throw new Error("Os gols previstos devem ser inteiros entre 0 e 99.");
  }
}

/** Pontuação oficial do Bolão: níveis mutuamente exclusivos, máximo base 10. */
export function scorePrediction(prediction: PredictionInput, official: PredictionInput): PredictionScore {
  assertGoals(prediction.homeGoals);
  assertGoals(prediction.awayGoals);
  assertGoals(official.homeGoals);
  assertGoals(official.awayGoals);

  const predictedOutcome = resultOf(prediction);
  const officialOutcome = resultOf(official);
  if (predictedOutcome !== officialOutcome) return { basePoints: 0, outcome: officialOutcome, tier: "ERRO" };
  if (prediction.homeGoals === official.homeGoals && prediction.awayGoals === official.awayGoals) return { basePoints: 10, outcome: officialOutcome, tier: "EXATO" };
  if (officialOutcome === "DRAW") return { basePoints: 5, outcome: officialOutcome, tier: "RESULTADO" };

  const winnerGoalsCorrect = officialOutcome === "HOME"
    ? prediction.homeGoals === official.homeGoals
    : prediction.awayGoals === official.awayGoals;
  const loserGoalsCorrect = officialOutcome === "HOME"
    ? prediction.awayGoals === official.awayGoals
    : prediction.homeGoals === official.homeGoals;
  if (winnerGoalsCorrect) return { basePoints: 8, outcome: officialOutcome, tier: "VENCEDOR_E_GOLS_VENCEDOR" };
  if (loserGoalsCorrect) return { basePoints: 7, outcome: officialOutcome, tier: "VENCEDOR_E_GOLS_PERDEDOR" };
  return { basePoints: 5, outcome: officialOutcome, tier: "RESULTADO" };
}

export function isPredictionOpen(lockAt: Date, now = new Date()) {
  return now.getTime() < lockAt.getTime();
}

export function getLockAt(scheduledAt: Date) {
  return new Date(scheduledAt.getTime() - 10 * 60 * 1000);
}

export function awardedPoints(basePoints: PredictionScoreTier, multiplierLocked: boolean) {
  return multiplierLocked ? basePoints * 2 : basePoints;
}

export function calculateStoredPredictionScore(input: {
  prediction: PredictionInput;
  officialScore: PredictionInput | null;
  eligible: boolean;
  finalized: boolean;
  multiplierSelected: boolean;
}) {
  if (!input.eligible || !input.finalized || !input.officialScore) {
    return { basePoints: 0 as PredictionScoreTier, awardedPoints: 0, scored: false };
  }
  const basePoints = scorePrediction(input.prediction, input.officialScore).basePoints;
  return {
    basePoints,
    awardedPoints: awardedPoints(basePoints, input.multiplierSelected),
    scored: true,
  };
}

function compareRank(left: RankingEntry, right: RankingEntry) {
  return right.points - left.points
    || right.exact10 - left.exact10
    || right.tier8 - left.tier8
    || right.tier7 - left.tier7
    || right.tier5 - left.tier5
    || left.name.localeCompare(right.name, "pt-BR");
}

/** Produz posição de competição: 1, 1, 3 para empates completos. */
export function buildRanking(rows: RankingInput[], totalRounds: number): RankingEntry[] {
  const grouped = new Map<string, RankingEntry>();
  const firstPredictionRound = new Map<string, number>();
  const submittedRounds = new Map<string, Set<number>>();
  for (const row of rows) {
    if (row.submitted) {
      firstPredictionRound.set(row.participantId, Math.min(firstPredictionRound.get(row.participantId) ?? row.round, row.round));
      const rounds = submittedRounds.get(row.participantId) ?? new Set<number>();
      rounds.add(row.round);
      submittedRounds.set(row.participantId, rounds);
    }
  }

  for (const row of rows) {
    const entry = grouped.get(row.participantId) ?? {
      participantId: row.participantId, name: row.name, position: 0, points: 0,
      exact10: 0, tier8: 0, tier7: 0, tier5: 0, submittedErrors: 0,
      roundsParticipated: 0, totalRounds, efficiencyNumerator: 0,
      efficiencyDenominator: 0, efficiencyPercent: null,
    };
    entry.points += row.awardedPoints;
    entry.efficiencyNumerator += row.awardedPoints;
    if (row.basePoints === 10) entry.exact10 += 1;
    if (row.basePoints === 8) entry.tier8 += 1;
    if (row.basePoints === 7) entry.tier7 += 1;
    if (row.basePoints === 5) entry.tier5 += 1;
    if (row.submitted && row.basePoints === 0) entry.submittedErrors += 1;
    if (row.round >= (firstPredictionRound.get(row.participantId) ?? Number.POSITIVE_INFINITY)) entry.efficiencyDenominator += row.maximumPoints;
    grouped.set(row.participantId, entry);
  }

  const ranked = [...grouped.values()].sort(compareRank);
  ranked.forEach((entry, index) => {
    const previous = ranked[index - 1];
    const tied = previous && entry.points === previous.points && entry.exact10 === previous.exact10 && entry.tier8 === previous.tier8 && entry.tier7 === previous.tier7 && entry.tier5 === previous.tier5;
    entry.position = tied ? previous.position : index + 1;
    entry.roundsParticipated = submittedRounds.get(entry.participantId)?.size ?? 0;
    entry.efficiencyPercent = entry.efficiencyDenominator ? Math.round((entry.efficiencyNumerator / entry.efficiencyDenominator) * 10000) / 100 : null;
  });
  return ranked;
}
