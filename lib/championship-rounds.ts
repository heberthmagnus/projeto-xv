export type ChampionshipCategory = "ADULTO" | "MASTER";

type MatchForRoundSelection = {
  category: ChampionshipCategory;
  round: number;
  scheduledAt: string | null;
  status: string;
};

const categories: ChampionshipCategory[] = ["ADULTO", "MASTER"];

export function getDefaultRoundsByCategory(
  matches: MatchForRoundSelection[],
  now = new Date(),
): Record<ChampionshipCategory, number> {
  return Object.fromEntries(
    categories.map((category) => [category, getDefaultRound(matches, category, now)]),
  ) as Record<ChampionshipCategory, number>;
}

function getDefaultRound(
  matches: MatchForRoundSelection[],
  category: ChampionshipCategory,
  now: Date,
) {
  const categoryMatches = matches.filter((match) => match.category === category);
  const pendingMatches = categoryMatches.filter(
    (match) => !["FINALIZADO", "CANCELADO"].includes(match.status),
  );
  const nextScheduled = pendingMatches
    .filter((match) => match.scheduledAt && new Date(match.scheduledAt) >= now)
    .sort(compareScheduledMatches)[0];

  if (nextScheduled) return nextScheduled.round;

  // Quando não há data futura cadastrada, ainda priorizamos a primeira rodada pendente.
  if (pendingMatches.length) return [...pendingMatches].sort(compareRounds)[0].round;

  // Campeonato já encerrado: exibe a última rodada como contexto mais útil.
  return categoryMatches.length
    ? Math.max(...categoryMatches.map((match) => match.round))
    : 1;
}

function compareScheduledMatches(left: MatchForRoundSelection, right: MatchForRoundSelection) {
  const leftTime = left.scheduledAt ? new Date(left.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
  const rightTime = right.scheduledAt ? new Date(right.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
  return leftTime - rightTime || compareRounds(left, right);
}

function compareRounds(left: MatchForRoundSelection, right: MatchForRoundSelection) {
  return left.round - right.round;
}
