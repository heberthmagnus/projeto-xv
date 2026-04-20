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
  remainingRoles: PreferredPosition[];
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
  "LATERAL",
  "ZAGUEIRO",
  "ZAGUEIRO",
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
  options?: {
    variationSeed?: number;
  },
): TeamDraftResult {
  const lineArrivals = arrivals.filter(
    (arrival) => arrival.preferredPosition !== "GOLEIRO",
  );
  const warnings: string[] = [];
  const targetSize = Math.max(1, Math.floor(lineArrivals.length / 2));

  if (lineArrivals.length < 2) {
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
    remainingRoles: [...roles],
  }));

  distributeBalancedDraft(
    lineArrivals,
    teams,
    roles,
    targetSize,
    options?.variationSeed ?? 0,
  );

  for (const team of teams) {
    team.players = orderTeamPlayersByFormation(team.players, roles);
    team.totalScore = team.players.reduce((sum, player) => {
      const arrival = lineArrivals.find((item) => item.id === player.arrivalId);
      return sum + getLevelScore(arrival?.level ?? null);
    }, 0);
    team.averageAge = calculateAverageAge(team.players, lineArrivals);
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

function distributeBalancedDraft(
  arrivals: ArrivalForTeams[],
  teams: TeamState[],
  roles: PreferredPosition[],
  targetSize: number,
  variationSeed: number,
) {
  const preferBlackOnTie = variationSeed % 2 === 1;
  const draftPool = [...arrivals].sort((a, b) => {
    const levelDifference = getLevelScore(b.level) - getLevelScore(a.level);
    if (levelDifference !== 0) {
      return levelDifference;
    }

    const ageA = typeof a.age === "number" ? a.age : 0;
    const ageB = typeof b.age === "number" ? b.age : 0;
    if (ageB !== ageA) {
      return ageB - ageA;
    }

    return preferBlackOnTie
      ? b.fullName.localeCompare(a.fullName, "pt-BR")
      : a.fullName.localeCompare(b.fullName, "pt-BR");
  });

  for (const arrival of draftPool) {
    const availableTeams = teams.filter((team) => team.players.length < targetSize);
    const candidateTeams = availableTeams.length > 0 ? availableTeams : teams;
    const chosenTeam =
      candidateTeams.reduce<TeamState | null>((best, team) => {
        if (!best) {
          return team;
        }

        const bestScore = getTeamDraftScore(best, teams, arrival);
        const teamScore = getTeamDraftScore(team, teams, arrival);

        if (teamScore === bestScore) {
          if (team.totalScore !== best.totalScore) {
            return team.totalScore < best.totalScore ? team : best;
          }

          if (team.players.length !== best.players.length) {
            return team.players.length < best.players.length ? team : best;
          }

          if (team.color !== best.color) {
            if (preferBlackOnTie) {
              return team.color === "PRETO" ? team : best;
            }

            return team.color === "AMARELO" ? team : best;
          }

          return best;
        }

        return teamScore > bestScore ? team : best;
      }, null) ?? candidateTeams[0];

    const mapped = mapArrivalToBestTeamRole(arrival, chosenTeam);

    chosenTeam.players.push({
      arrivalId: arrival.id,
      assignedPosition: mapped.assignedPosition,
      isFallback: mapped.isFallback,
    });

    if (mapped.consumeRoleIndex >= 0) {
      chosenTeam.remainingRoles.splice(mapped.consumeRoleIndex, 1);
    }

    chosenTeam.totalScore += getLevelScore(arrival.level);
    chosenTeam.averageAge = calculateAverageAge(chosenTeam.players, arrivals);
  }
}

function getTeamDraftScore(
  team: TeamState,
  teams: TeamState[],
  arrival: ArrivalForTeams,
) {
  const roleOption = getBestRoleOption(arrival, team);
  const otherTeams = teams.filter((candidate) => candidate.color !== team.color);
  const weakestOtherTeamScore = Math.min(
    ...otherTeams.map((candidate) => candidate.totalScore),
    team.totalScore,
  );
  const levelScore = getLevelScore(arrival.level);

  return (
    roleOption.fitScore * 1000 +
    (weakestOtherTeamScore - team.totalScore) * 120 +
    (targetTeamSlotsLeft(team) > 0 ? 50 : 0) +
    (team.players.length === 0 ? levelScore * 10 : 0) +
    getAgeBalanceScore(arrival.age, team)
  );
}

function targetTeamSlotsLeft(team: TeamState) {
  return team.remainingRoles.length;
}

function getAgeBalanceScore(age: number | null, team: TeamState) {
  if (typeof age !== "number" || team.averageAge === 0) {
    return 0;
  }

  return -Math.abs(team.averageAge - age);
}

function getRoleFitScore(
  preferredPosition: PreferredPosition,
  desiredRole: PreferredPosition,
) {
  if (preferredPosition === desiredRole) {
    return 10;
  }

  if (desiredRole === "ZAGUEIRO" && preferredPosition === "VOLANTE") {
    return 8;
  }

  if (desiredRole === "ZAGUEIRO" && preferredPosition === "LATERAL") {
    return 7;
  }

  if (desiredRole === "VOLANTE" && preferredPosition === "MEIA") {
    return 7;
  }

  if (desiredRole === "VOLANTE" && preferredPosition === "LATERAL") {
    return 5;
  }

  if (desiredRole === "ATACANTE" && preferredPosition === "MEIA") {
    return 7;
  }

  if (desiredRole === "MEIA" && preferredPosition === "LATERAL") {
    return 6;
  }

  if (desiredRole === "MEIA" && preferredPosition === "VOLANTE") {
    return 8;
  }

  if (desiredRole === "LATERAL" && preferredPosition === "MEIA") {
    return 6;
  }

  if (desiredRole === "LATERAL" && preferredPosition === "VOLANTE") {
    return 5;
  }

  return 1;
}

function getBestRoleOption(arrival: ArrivalForTeams, team: TeamState) {
  if (team.remainingRoles.length === 0) {
    return {
      assignedPosition: arrival.preferredPosition,
      fitScore: 5,
      consumeRoleIndex: -1,
    };
  }

  let bestIndex = 0;
  let bestFitScore = Number.NEGATIVE_INFINITY;

  team.remainingRoles.forEach((role, index) => {
    const fitScore = getRoleFitScore(arrival.preferredPosition, role);
    if (fitScore > bestFitScore) {
      bestFitScore = fitScore;
      bestIndex = index;
    }
  });

  return {
    assignedPosition: team.remainingRoles[bestIndex],
    fitScore: bestFitScore,
    consumeRoleIndex: bestIndex,
  };
}

function mapArrivalToBestTeamRole(
  arrival: ArrivalForTeams,
  team: TeamState,
) {
  const roleOption = getBestRoleOption(arrival, team);

  return {
    assignedPosition: roleOption.assignedPosition,
    isFallback: arrival.preferredPosition !== roleOption.assignedPosition,
    consumeRoleIndex: roleOption.consumeRoleIndex,
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

function orderTeamPlayersByFormation(
  players: TeamDraftPlayer[],
  roles: PreferredPosition[],
) {
  const remainingPlayers = [...players];
  const orderedPlayers: TeamDraftPlayer[] = [];

  for (const role of roles) {
    const nextIndex = remainingPlayers.findIndex(
      (player) => player.assignedPosition === role,
    );

    if (nextIndex >= 0) {
      const [matchedPlayer] = remainingPlayers.splice(nextIndex, 1);
      orderedPlayers.push(matchedPlayer);
    }
  }

  return [...orderedPlayers, ...remainingPlayers];
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
