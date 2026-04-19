import type {
  PeladaArrival,
  PeladaTeamColor,
  PreferredPosition,
  Prisma,
  PlayerLevel,
} from "@prisma/client";

export const PELADA_TEAM_COLORS: PeladaTeamColor[] = ["AMARELO", "PRETO"];

const LEVEL_SCORES: Record<PlayerLevel, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
};

type ArrivalForTeams = Pick<
  PeladaArrival,
  "id" | "fullName" | "preferredPosition" | "age" | "level"
>;

type TeamState = {
  color: PeladaTeamColor;
  players: TeamDraftPlayer[];
  totalScore: number;
  averageAge: number;
};

export type TeamDraftPlayer = {
  arrivalId: string;
  assignedPosition: PreferredPosition;
  isFallback: boolean;
};

export type TeamDraftResult = {
  assignments: Prisma.PeladaTeamAssignmentCreateManyInput[];
  warnings: string[];
};

const CAMPINHO_ROLES: PreferredPosition[] = [
  "ZAGUEIRO",
  "LATERAL",
  "LATERAL",
  "MEIA",
  "MEIA",
  "ATACANTE",
];

const CAMPAO_ROLES: PreferredPosition[] = [
  "ZAGUEIRO",
  "ZAGUEIRO",
  "LATERAL",
  "LATERAL",
  "VOLANTE",
  "MEIA",
  "MEIA",
  "ATACANTE",
];

export function getPeladaTeamColorLabel(color: PeladaTeamColor) {
  return color === "AMARELO" ? "Amarelo" : "Preto";
}

export function getFormationRoles(linePlayersCount: number) {
  return linePlayersCount >= 8 ? CAMPAO_ROLES : CAMPINHO_ROLES;
}

export function getLevelScore(level: PlayerLevel | null) {
  if (!level) {
    return 0;
  }

  return LEVEL_SCORES[level];
}

export function buildPeladaTeams(
  arrivals: ArrivalForTeams[],
  linePlayersCount: number,
): TeamDraftResult {
  const warnings: string[] = [];
  const targetSize = Math.max(1, Math.floor(arrivals.length / 2));

  if (arrivals.length < 2) {
    return {
      assignments: [],
      warnings: ["Ainda não há jogadores suficientes para dividir os times."],
    };
  }

  const roles = getFormationRoles(linePlayersCount);
  const teams: TeamState[] = PELADA_TEAM_COLORS.map((color) => ({
    color,
    players: [],
    totalScore: 0,
    averageAge: 0,
  }));

  distributeSkeletonByRoles(arrivals, teams, roles, targetSize);

  for (const team of teams) {
    team.totalScore = team.players.reduce((sum, player) => {
      const arrival = arrivals.find((item) => item.id === player.arrivalId);
      return sum + getLevelScore(arrival?.level ?? null);
    }, 0);
    team.averageAge = calculateAverageAge(team.players, arrivals);
  }

  const difference = Math.abs(teams[0].totalScore - teams[1].totalScore);
  if (difference >= 3) {
    warnings.push("Os times ficaram com diferença perceptível de nível.");
  }

  for (const team of teams) {
    const missingRoles = getMissingRoles(team.players, roles);
    if (missingRoles.length > 0) {
      warnings.push(
        `O time ${getPeladaTeamColorLabel(team.color)} ficou sem cobertura ideal de ${missingRoles
          .map((role) => getPositionLabelShort(role))
          .join(", ")}.`,
      );
    }
  }

  const assignments = teams.flatMap((team) =>
    team.players.map((player, index) => ({
      peladaId: "",
      arrivalId: player.arrivalId,
      teamColor: team.color,
      assignedPosition: player.assignedPosition,
      isFallback: player.isFallback,
      displayOrder: index + 1,
    })),
  );

  return { assignments, warnings };
}

function distributeSkeletonByRoles(
  arrivals: ArrivalForTeams[],
  teams: TeamState[],
  roles: PreferredPosition[],
  targetSize: number,
) {
  const remaining = [...arrivals];

  for (const role of roles) {
    const sortedTeams = [...teams].sort((a, b) => {
      if (a.players.length !== b.players.length) {
        return a.players.length - b.players.length;
      }

      if (a.totalScore !== b.totalScore) {
        return a.totalScore - b.totalScore;
      }

      return a.averageAge - b.averageAge;
    });

    for (const team of sortedTeams) {
      if (remaining.length === 0 || team.players.length >= targetSize) {
        continue;
      }

      const bestIndex = findBestPlayerIndexForRole(remaining, role, team);
      const best = remaining.splice(bestIndex, 1)[0];
      const mapped = mapArrivalToRole(best, role);

      team.players.push({
        arrivalId: best.id,
        assignedPosition: mapped.assignedPosition,
        isFallback: mapped.isFallback,
      });
      team.totalScore += getLevelScore(best.level);
      team.averageAge = calculateAverageAge(team.players, arrivals);
    }
  }

  while (remaining.length > 0) {
    const sortedTeams = [...teams].sort((a, b) => {
      if (a.players.length !== b.players.length) {
        return a.players.length - b.players.length;
      }

      if (a.totalScore !== b.totalScore) {
        return a.totalScore - b.totalScore;
      }

      return a.averageAge - b.averageAge;
    });

    const team = sortedTeams.find((item) => item.players.length < targetSize) ?? sortedTeams[0];
    const next = remaining.shift();

    if (!next) {
      break;
    }

    team.players.push({
      arrivalId: next.id,
      assignedPosition: next.preferredPosition,
      isFallback: false,
    });
    team.totalScore += getLevelScore(next.level);
    team.averageAge = calculateAverageAge(team.players, arrivals);
  }
}

function findBestPlayerIndexForRole(
  arrivals: ArrivalForTeams[],
  desiredRole: PreferredPosition,
  team?: TeamState,
) {
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  arrivals.forEach((arrival, index) => {
    const score =
      getRoleFitScore(arrival.preferredPosition, desiredRole) * 100 +
      getLevelPreferenceScore(arrival.level, team) +
      getAgePreferenceScore(arrival.age, team);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function getLevelPreferenceScore(level: PlayerLevel | null, team?: TeamState) {
  if (!team) {
    return 0;
  }

  const raw = getLevelScore(level);

  if (raw === 0) {
    return 0;
  }

  return team.totalScore === 0 ? raw : raw * (team.totalScore <= 0 ? 1 : 1 / (team.totalScore + 1));
}

function getAgePreferenceScore(age: number | null, team?: TeamState) {
  if (!team || typeof age !== "number" || team.averageAge === 0) {
    return 0;
  }

  return -Math.abs(team.averageAge - age) / 10;
}

function getRoleFitScore(
  preferredPosition: PreferredPosition,
  desiredRole: PreferredPosition,
) {
  if (preferredPosition === desiredRole) {
    return 10;
  }

  if (desiredRole === "ATACANTE" && preferredPosition === "MEIA") {
    return 7;
  }

  if (
    desiredRole === "ZAGUEIRO" &&
    (preferredPosition === "LATERAL" || preferredPosition === "VOLANTE")
  ) {
    return 7;
  }

  if (desiredRole === "MEIA" && preferredPosition === "LATERAL") {
    return 6;
  }

  if (desiredRole === "MEIA" && preferredPosition === "VOLANTE") {
    return 8;
  }

  return 1;
}

function mapArrivalToRole(
  arrival: ArrivalForTeams,
  desiredRole: PreferredPosition,
) {
  const exactMatch = arrival.preferredPosition === desiredRole;
  const score = getRoleFitScore(arrival.preferredPosition, desiredRole);

  if (score >= 6) {
    return {
      assignedPosition: desiredRole,
      isFallback: !exactMatch,
    };
  }

  return {
    assignedPosition: arrival.preferredPosition,
    isFallback: false,
  };
}

function calculateAverageAge(
  draftPlayers: TeamDraftPlayer[],
  arrivals: ArrivalForTeams[],
) {
  const ageValues = draftPlayers
    .map((player) => arrivals.find((arrival) => arrival.id === player.arrivalId)?.age)
    .filter((age): age is number => typeof age === "number");

  if (ageValues.length === 0) {
    return 0;
  }

  return ageValues.reduce((sum, age) => sum + age, 0) / ageValues.length;
}

function getMissingRoles(players: TeamDraftPlayer[], roles: PreferredPosition[]) {
  const counts = new Map<PreferredPosition, number>();

  for (const role of roles) {
    counts.set(role, (counts.get(role) || 0) + 1);
  }

  for (const player of players) {
    const current = counts.get(player.assignedPosition) || 0;
    if (current > 0) {
      counts.set(player.assignedPosition, current - 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .map(([role]) => role);
}

function getPositionLabelShort(position: PreferredPosition) {
  switch (position) {
    case "ATACANTE":
      return "atacante";
    case "MEIA":
      return "meia";
    case "VOLANTE":
      return "volante";
    case "LATERAL":
      return "lateral";
    case "ZAGUEIRO":
      return "zagueiro";
    case "GOLEIRO":
      return "goleiro";
    default:
      return String(position).toLowerCase();
  }
}

export function buildPeladaTeamsWarningsSummary(warnings: string[]) {
  if (warnings.length === 0) {
    return null;
  }

  return "⚠️ Esta divisão precisa de ajuste manual.";
}
