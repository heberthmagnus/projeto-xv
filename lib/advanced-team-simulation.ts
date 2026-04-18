export type AdvancedSimulationPosition =
  | "ZAGUEIRO"
  | "LATERAL"
  | "VOLANTE"
  | "MEIA"
  | "ATACANTE";

export type AdvancedSimulationLevel = "A" | "B" | "C" | "D" | "E";
export type AdvancedSimulationAssignedRole =
  | "ZAGUEIRO"
  | "LATERAL"
  | "MEIO"
  | "ATACANTE"
  | "RESERVA";

export type AdvancedSimulationPlayer = {
  id: string;
  fullName: string;
  preferredPosition: AdvancedSimulationPosition;
  level: AdvancedSimulationLevel;
  age: number;
  bondGroup: string | null;
  assignedTeamId: number | null;
  assignedRole: AdvancedSimulationAssignedRole | null;
  usedFallback: boolean;
};

export type AdvancedSimulationTeam = {
  id: number;
  name: string;
};

export type AdvancedSimulationIssue = {
  id: string;
  message: string;
  severity: "warning" | "info";
};

export type AdvancedSimulationDisplayTeam = AdvancedSimulationTeam & {
  players: AdvancedSimulationPlayer[];
  totalScore: number;
  averageAge: number;
  issues: string[];
};

export type AdvancedSimulationSummary = {
  totalPlayers: number;
  usedPlayers: number;
  unusedPlayers: number;
  scoreSpread: number;
  issues: AdvancedSimulationIssue[];
  hasForcedOverride: boolean;
};

export type AdvancedSimulationSwapResult = {
  valid: boolean;
  issues: string[];
  message: string;
};

export type AdvancedSimulationMoveResult = {
  valid: boolean;
  issues: string[];
  message: string;
};

export type AdvancedSimulationState = {
  players: AdvancedSimulationPlayer[];
  teams: AdvancedSimulationTeam[];
  draftGenerated: boolean;
  lastAction: string | null;
  nextTeamCursor: number;
  currentDraftLevel: AdvancedSimulationLevel;
  hasForcedOverride: boolean;
};

type BondUnit = {
  id: string;
  players: AdvancedSimulationPlayer[];
};

type RoleMatch = {
  role: Exclude<AdvancedSimulationAssignedRole, "RESERVA">;
  priority: number;
  usedFallback: boolean;
};

const TEAM_COUNT = 5;
const TEAM_SIZE = 9;
export const ADVANCED_DRAFT_LEVEL_ORDER: AdvancedSimulationLevel[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
];
const LEVEL_SCORE: Record<AdvancedSimulationLevel, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
};

const FICTIONAL_NAMES = [
  "André Fagundes",
  "Bruno Martins",
  "Caio Nascimento",
  "Daniel Lopes",
  "Eduardo Silveira",
  "Felipe Castro",
  "Gabriel Dorneles",
  "Henrique Motta",
  "Igor Teixeira",
  "João Pedro Nunes",
  "Kauê Almeida",
  "Leonardo Padilha",
  "Marcelo Duarte",
  "Nicolas Azevedo",
  "Otávio Borges",
  "Paulo Viana",
  "Rafael Moura",
  "Samuel Freitas",
  "Tiago Menezes",
  "Vinícius Peixoto",
  "William Costa",
  "Yuri Pacheco",
  "Alex Sandes",
  "Diego Fontes",
  "Everton Ramos",
  "Fernando Kist",
  "Gustavo Camargo",
  "Heitor Severo",
  "Júlio César Braga",
  "Lucas Zanetti",
  "Mateus Corrêa",
  "Nathan Ribeiro",
  "Pedro Rocha",
  "Renato Abreu",
  "Sérgio Bittencourt",
  "Tomás Leal",
  "Ubiratan Souza",
  "Vitor Hugo Prado",
  "Wagner Teles",
  "Xavier Oliveira",
  "Yan Schmitz",
  "Zeca Moreira",
  "Arthur Cunha",
  "Bento Farias",
  "Cristiano Lehmkuhl",
];

const POSITION_SEQUENCE: AdvancedSimulationPosition[] = [
  "ZAGUEIRO",
  "LATERAL",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
  "LATERAL",
  "ZAGUEIRO",
  "MEIA",
  "ATACANTE",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
  "LATERAL",
  "ZAGUEIRO",
  "ATACANTE",
  "MEIA",
  "VOLANTE",
];

const LEVEL_SEQUENCE: AdvancedSimulationLevel[] = [
  "A",
  "A",
  "A",
  "A",
  "A",
  "B",
  "B",
  "B",
  "B",
  "B",
  "B",
  "B",
  "B",
  "C",
  "C",
  "C",
  "C",
  "C",
  "C",
  "C",
  "C",
  "C",
  "C",
  "D",
  "D",
  "D",
  "D",
  "D",
  "D",
  "D",
  "D",
  "D",
  "E",
  "E",
  "E",
  "E",
  "E",
  "E",
  "E",
  "E",
  "E",
  "B",
  "C",
  "D",
  "E",
];

const AGE_SEQUENCE = [
  27, 34, 31, 29, 26, 38, 33, 28, 25, 36, 30, 27, 24, 32, 35, 41, 29, 26, 37,
  33, 28, 24, 31, 39, 34, 27, 42, 25, 30, 36, 29, 26, 38, 32, 35, 43, 28, 24,
  31, 37, 33, 27, 26, 34, 40,
];

export function createAdvancedSimulationState(): AdvancedSimulationState {
  return {
    players: FICTIONAL_NAMES.map((fullName, index) => ({
      id: `advanced-sim-${index + 1}`,
      fullName,
      preferredPosition: POSITION_SEQUENCE[index],
      level: LEVEL_SEQUENCE[index],
      age: AGE_SEQUENCE[index],
      bondGroup: null,
      assignedTeamId: null,
      assignedRole: null,
      usedFallback: false,
    })),
    teams: Array.from({ length: TEAM_COUNT }, (_, index) => ({
      id: index + 1,
      name: `Time ${index + 1}`,
    })),
    draftGenerated: false,
    lastAction: null,
    nextTeamCursor: 0,
    currentDraftLevel: "A",
    hasForcedOverride: false,
  };
}

export function addAdvancedBondBetweenPlayers(
  state: AdvancedSimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
) {
  if (!firstPlayerId || !secondPlayerId || firstPlayerId === secondPlayerId) {
    return state;
  }

  const first = state.players.find((player) => player.id === firstPlayerId);
  const second = state.players.find((player) => player.id === secondPlayerId);

  if (!first || !second) {
    return state;
  }

  const firstGroupPlayers =
    first.bondGroup === null
      ? [first]
      : state.players.filter((player) => player.bondGroup === first.bondGroup);
  const secondGroupPlayers =
    second.bondGroup === null
      ? [second]
      : state.players.filter((player) => player.bondGroup === second.bondGroup);
  const mergedIds = new Set(
    [...firstGroupPlayers, ...secondGroupPlayers].map((player) => player.id),
  );
  const mergedPlayers = state.players.filter((player) => mergedIds.has(player.id));

  if (mergedPlayers.filter((player) => player.level === "A").length > 1) {
    return {
      ...state,
      lastAction:
        "Não é possível criar o vínculo. Um mesmo grupo não pode reunir dois jogadores nível A.",
    };
  }

  const bondGroup =
    first.bondGroup || second.bondGroup || `vinculo-${first.id}-${second.id}`;
  const groupsToMerge = new Set(
    [first.bondGroup, second.bondGroup].filter(
      (group): group is string => Boolean(group),
    ),
  );

  return {
    ...state,
    players: state.players.map((player) => {
      if (
        player.id === firstPlayerId ||
        player.id === secondPlayerId ||
        (player.bondGroup !== null && groupsToMerge.has(player.bondGroup))
      ) {
        return { ...player, bondGroup };
      }

      return player;
    }),
    lastAction: `Vínculo criado entre ${first.fullName} e ${second.fullName}.`,
  };
}

export function generateAdvancedInitialDraft(state: AdvancedSimulationState) {
  return distributeAdvancedPlayersForLevel(resetAssignments(state), "A");
}

export function drawAdvancedNextPlayer(state: AdvancedSimulationState) {
  const currentLevel = getAdvancedNextPendingLevel(state) || state.currentDraftLevel;
  const targetIndex = findNextTargetTeamIndex(state, currentLevel);

  if (targetIndex === null) {
    const nextLevel = getNextLevelWithAvailableUnits(state.players, currentLevel);

    if (nextLevel) {
      return {
        ...state,
        currentDraftLevel: nextLevel,
        nextTeamCursor: 0,
        lastAction: `Nível ${currentLevel} concluído. O próximo passo é sortear jogadores nível ${nextLevel}.`,
      };
    }

    return {
      ...state,
      lastAction: "Todos os jogadores já foram distribuídos.",
    };
  }

  const targetTeam = state.teams[targetIndex];
  const unit = findBestUnitForTeam(state, targetTeam.id, currentLevel);

  if (!unit) {
    return {
      ...state,
      lastAction: `Nenhum jogador nível ${currentLevel} disponível encaixou no ${targetTeam.name}.`,
    };
  }

  const nextState = assignUnitToTeam(state, unit, targetTeam.id);
  const remainingUnits = getAvailableUnitsForLevel(nextState.players, currentLevel);
  const nextLevel = remainingUnits.length
    ? currentLevel
    : getNextLevelWithAvailableUnits(nextState.players, currentLevel);

  return {
    ...nextState,
    draftGenerated: true,
    nextTeamCursor: (targetIndex + 1) % state.teams.length,
    currentDraftLevel: nextLevel || currentLevel,
    lastAction:
      unit.players.length > 1
        ? `Grupo ${unit.id} do nível ${currentLevel} sorteado para ${targetTeam.name}.`
        : `${unit.players[0].fullName} do nível ${currentLevel} sorteado para ${targetTeam.name}.`,
  };
}

export function distributeAdvancedPlayersForLevel(
  state: AdvancedSimulationState,
  level: AdvancedSimulationLevel,
) {
  let nextState = {
    ...state,
    currentDraftLevel: level,
  };

  if (level === "A") {
    nextState = distributeLevelAPlayers(nextState);
  } else {
    let targetIndex = findNextTargetTeamIndex(nextState, level);

    while (targetIndex !== null) {
      const teamId = nextState.teams[targetIndex].id;
      const unit = findBestUnitForTeam(nextState, teamId, level);

      if (!unit) {
        break;
      }

      nextState = assignUnitToTeam(nextState, unit, teamId);
      nextState = {
        ...nextState,
        nextTeamCursor: (targetIndex + 1) % nextState.teams.length,
      };
      targetIndex = findNextTargetTeamIndex(nextState, level);
    }
  }

  const nextLevel = getNextLevelWithAvailableUnits(nextState.players, level);

  return {
    ...nextState,
    draftGenerated: true,
    nextTeamCursor: 0,
    currentDraftLevel: nextLevel || level,
    lastAction:
      level === "A"
        ? "Jogadores nível A distribuídos, com um atleta A por time."
        : `Jogadores nível ${level} distribuídos em rodízio entre os times.`,
  };
}

export function getAdvancedNextPendingLevel(state: AdvancedSimulationState) {
  for (const level of ADVANCED_DRAFT_LEVEL_ORDER) {
    if (getAvailableUnitsForLevel(state.players, level).length > 0) {
      return level;
    }
  }

  return null;
}

export function getAdvancedAvailablePlayers(state: AdvancedSimulationState) {
  return state.players
    .filter((player) => player.assignedTeamId === null)
    .sort(
      (left, right) =>
        ADVANCED_DRAFT_LEVEL_ORDER.indexOf(left.level) -
          ADVANCED_DRAFT_LEVEL_ORDER.indexOf(right.level) ||
        Number(Boolean(right.bondGroup)) - Number(Boolean(left.bondGroup)) ||
        left.fullName.localeCompare(right.fullName, "pt-BR"),
    );
}

export function getAdvancedDisplayTeams(
  state: AdvancedSimulationState,
): AdvancedSimulationDisplayTeam[] {
  return state.teams.map((team) => {
    const players = getTeamPlayers(state.players, team.id).sort(
      (left, right) =>
        roleSortValue(left.assignedRole) - roleSortValue(right.assignedRole) ||
        LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level] ||
        left.fullName.localeCompare(right.fullName, "pt-BR"),
    );

    return {
      ...team,
      players,
      totalScore: players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0),
      averageAge:
        players.reduce((total, player) => total + player.age, 0) /
        Math.max(players.length, 1),
      issues: getTeamIssues(players),
    };
  });
}

export function getAdvancedSummary(
  state: AdvancedSimulationState,
): AdvancedSimulationSummary {
  const teams = getAdvancedDisplayTeams(state);
  const scoreSpread = teams.length
    ? Math.max(...teams.map((team) => team.totalScore)) -
      Math.min(...teams.map((team) => team.totalScore))
    : 0;
  const issues = getGlobalIssues(state, teams);
  const usedPlayers = state.players.filter((player) => player.assignedTeamId !== null).length;

  return {
    totalPlayers: state.players.length,
    usedPlayers,
    unusedPlayers: state.players.length - usedPlayers,
    scoreSpread,
    issues,
    hasForcedOverride: state.hasForcedOverride || issues.length > 0,
  };
}

export function areAdvancedTeamsComplete(state: AdvancedSimulationState) {
  return state.teams.every(
    (team) => getTeamPlayers(state.players, team.id).length === TEAM_SIZE,
  );
}

export function validateAdvancedSimpleSwap(
  state: AdvancedSimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
) {
  return validateTransfers(state, [firstPlayerId, secondPlayerId]);
}

export function applyAdvancedSimpleSwap(
  state: AdvancedSimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
  force: boolean,
) {
  return applyTransfers(state, [firstPlayerId, secondPlayerId], force, "Troca simples");
}

export function validateAdvancedTripleSwap(
  state: AdvancedSimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
  thirdPlayerId: string,
) {
  return validateTransfers(state, [firstPlayerId, secondPlayerId, thirdPlayerId]);
}

export function applyAdvancedTripleSwap(
  state: AdvancedSimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
  thirdPlayerId: string,
  force: boolean,
) {
  return applyTransfers(
    state,
    [firstPlayerId, secondPlayerId, thirdPlayerId],
    force,
    "Troca tripla",
  );
}

export function validateAdvancedDragMove(
  state: AdvancedSimulationState,
  playerId: string,
  destinationTeamId: number | null,
): AdvancedSimulationMoveResult {
  const evaluation = evaluateDragMove(state, playerId, destinationTeamId);

  return {
    valid: evaluation.valid,
    issues: evaluation.issues,
    message: evaluation.message,
  };
}

export function applyAdvancedDragMove(
  state: AdvancedSimulationState,
  playerId: string,
  destinationTeamId: number | null,
  force: boolean,
) {
  const evaluation = evaluateDragMove(state, playerId, destinationTeamId);

  if (!evaluation.valid && !force) {
    return {
      ...state,
      lastAction: evaluation.message,
    };
  }

  if (!evaluation.nextPlayers) {
    return {
      ...state,
      lastAction: evaluation.message,
    };
  }

  return {
    ...state,
    players: evaluation.nextPlayers,
    hasForcedOverride: force ? true : state.hasForcedOverride,
    lastAction: force
      ? "Movimentação manual confirmada com inconsistências assumidas manualmente."
      : "Movimentação manual confirmada com sucesso.",
  };
}

export function formatAdvancedPosition(position: AdvancedSimulationPosition) {
  switch (position) {
    case "ZAGUEIRO":
      return "Zagueiro";
    case "LATERAL":
      return "Lateral";
    case "VOLANTE":
      return "Volante";
    case "MEIA":
      return "Meia";
    case "ATACANTE":
      return "Atacante";
  }
}

export function formatAdvancedSwapOption(player: AdvancedSimulationPlayer) {
  return `Time ${player.assignedTeamId} | ${player.fullName} [${player.level}] - ${getShortPositionCode(
    player.preferredPosition,
  )}`;
}

function applyTransfers(
  state: AdvancedSimulationState,
  playerIds: string[],
  force: boolean,
  actionLabel: string,
) {
  const evaluation = evaluateTransfers(state, playerIds);

  if (!evaluation.valid && !force) {
    return {
      ...state,
      lastAction: evaluation.message,
    };
  }

  if (!evaluation.nextPlayers) {
    return {
      ...state,
      lastAction: evaluation.message,
    };
  }

  return {
    ...state,
    players: evaluation.nextPlayers,
    hasForcedOverride: force ? true : state.hasForcedOverride,
    lastAction: force
      ? `${actionLabel} confirmada com inconsistências assumidas manualmente.`
      : `${actionLabel} confirmada com sucesso.`,
  };
}

function validateTransfers(
  state: AdvancedSimulationState,
  playerIds: string[],
): AdvancedSimulationSwapResult {
  const evaluation = evaluateTransfers(state, playerIds);

  return {
    valid: evaluation.valid,
    issues: evaluation.issues,
    message: evaluation.message,
  };
}

function evaluateDragMove(
  state: AdvancedSimulationState,
  playerId: string,
  destinationTeamId: number | null,
): {
  valid: boolean;
  issues: string[];
  message: string;
  nextPlayers?: AdvancedSimulationPlayer[];
} {
  const player = state.players.find((current) => current.id === playerId);

  if (!player) {
    return {
      valid: false,
      issues: ["Jogador não encontrado para a movimentação manual."],
      message: "Jogador não encontrado para a movimentação manual.",
    };
  }

  if (player.assignedTeamId === destinationTeamId) {
    return {
      valid: false,
      issues: ["O jogador já está nessa área."],
      message: "O jogador já está nessa área.",
    };
  }

  const movingUnit = getUnitForPlayer(state.players, player);
  let nextPlayers = state.players.map((current) => ({ ...current }));

  nextPlayers = nextPlayers.map((current) =>
    movingUnit.players.some((member) => member.id === current.id)
      ? {
          ...current,
          assignedTeamId: destinationTeamId,
          assignedRole: null,
          usedFallback: false,
        }
      : current,
  );

  const affectedTeamIds = new Set<number>();

  for (const member of movingUnit.players) {
    if (member.assignedTeamId !== null) {
      affectedTeamIds.add(member.assignedTeamId);
    }
  }

  if (destinationTeamId !== null) {
    affectedTeamIds.add(destinationTeamId);
  }

  for (const teamId of affectedTeamIds) {
    nextPlayers = rebuildTeamAssignments(nextPlayers, teamId);
  }

  const issues = collectStateIssues(nextPlayers, state.teams);

  return {
    valid: issues.length === 0,
    issues,
    message:
      issues.length === 0
        ? "Movimentação validada com sucesso."
        : "A movimentação gerou inconsistências que precisam de confirmação manual.",
    nextPlayers,
  };
}

function evaluateTransfers(
  state: AdvancedSimulationState,
  playerIds: string[],
): {
  valid: boolean;
  issues: string[];
  message: string;
  nextPlayers?: AdvancedSimulationPlayer[];
} {
  if (!areAdvancedTeamsComplete(state)) {
    return {
      valid: false,
      issues: [
        "As trocas manuais avançadas ficam disponíveis quando todos os times estiverem completos.",
      ],
      message:
        "As trocas manuais avançadas ficam disponíveis quando todos os times estiverem completos.",
    };
  }

  const selectedPlayers = playerIds.map((playerId) =>
    state.players.find((player) => player.id === playerId),
  );

  if (
    selectedPlayers.some(
      (player) => !player || player.assignedTeamId === null,
    )
  ) {
    return {
      valid: false,
      issues: ["Selecione apenas jogadores já distribuídos entre os times."],
      message: "Selecione apenas jogadores já distribuídos entre os times.",
    };
  }

  const selectedUnits = selectedPlayers.map((player) =>
    getUnitForPlayer(state.players, player!),
  );

  if (new Set(selectedUnits.map((unit) => unit.id)).size !== selectedUnits.length) {
    return {
      valid: false,
      issues: ["Cada seleção precisa representar um grupo diferente de jogadores."],
      message: "Cada seleção precisa representar um grupo diferente de jogadores.",
    };
  }

  const sourceTeams = selectedPlayers.map((player) => player!.assignedTeamId!);

  if (new Set(sourceTeams).size !== sourceTeams.length) {
    return {
      valid: false,
      issues: ["Cada jogador selecionado precisa vir de um time diferente."],
      message: "Cada jogador selecionado precisa vir de um time diferente.",
    };
  }

  const targetTeams = sourceTeams.map(
    (_, index) => sourceTeams[(index + 1) % sourceTeams.length],
  );
  let nextPlayers = state.players.map((player) => ({ ...player }));

  for (let index = 0; index < selectedUnits.length; index += 1) {
    const unit = selectedUnits[index];
    const destinationTeamId = targetTeams[index];

    nextPlayers = nextPlayers.map((player) =>
      unit.players.some((member) => member.id === player.id)
        ? {
            ...player,
            assignedTeamId: destinationTeamId,
            assignedRole: null,
            usedFallback: false,
          }
        : player,
    );
  }

  for (const teamId of new Set([...sourceTeams, ...targetTeams])) {
    nextPlayers = rebuildTeamAssignments(nextPlayers, teamId);
  }

  const issues = collectStateIssues(nextPlayers, state.teams);

  return {
    valid: issues.length === 0,
    issues,
    message:
      issues.length === 0
        ? "Troca validada com sucesso."
        : "A troca gerou inconsistências que precisam de confirmação manual.",
    nextPlayers,
  };
}

function collectStateIssues(
  players: AdvancedSimulationPlayer[],
  teams: AdvancedSimulationTeam[],
) {
  const issues: string[] = [];

  for (const team of teams) {
    const teamPlayers = getTeamPlayers(players, team.id);

    if (teamPlayers.length !== TEAM_SIZE) {
      issues.push(`${team.name} ficaria com quantidade incorreta de jogadores.`);
    }

    const levelACount = teamPlayers.filter((player) => player.level === "A").length;

    if (levelACount > 1) {
      issues.push(`${team.name} ficaria com mais de um jogador nível A.`);
    }

    const needs = getTeamNeeds(teamPlayers);

    if (needs.ZAGUEIRO > 0) {
      issues.push(`${team.name} ficaria sem zagueiro de referência.`);
    }

    if (needs.ATACANTE > 0) {
      issues.push(`${team.name} ficaria sem atacante de referência.`);
    }
  }

  if (isAnyBondGroupSplit(players)) {
    issues.push("Um vínculo entre jogadores seria quebrado.");
  }

  const displayTeams = teams.map((team) => ({
    id: team.id,
    totalScore: getTeamPlayers(players, team.id).reduce(
      (total, player) => total + LEVEL_SCORE[player.level],
      0,
    ),
  }));
  const scoreSpread = displayTeams.length
    ? Math.max(...displayTeams.map((team) => team.totalScore)) -
      Math.min(...displayTeams.map((team) => team.totalScore))
    : 0;

  if (scoreSpread > 6) {
    issues.push("A diferença de pontuação entre os times ficaria alta demais.");
  }

  return Array.from(new Set(issues));
}

function resetAssignments(state: AdvancedSimulationState): AdvancedSimulationState {
  return {
    ...state,
    nextTeamCursor: 0,
    currentDraftLevel: "A",
    hasForcedOverride: false,
    players: state.players.map((player) => ({
      ...player,
      assignedTeamId: null,
      assignedRole: null,
      usedFallback: false,
    })),
  };
}

function getAvailableUnits(players: AdvancedSimulationPlayer[]) {
  const groups = new Map<string, AdvancedSimulationPlayer[]>();

  for (const player of players) {
    if (player.assignedTeamId !== null) {
      continue;
    }

    const key = player.bondGroup || player.id;
    const current = groups.get(key) || [];
    current.push(player);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([id, groupedPlayers]) => ({
    id,
    players: groupedPlayers,
  }));
}

function getAvailableUnitsForLevel(
  players: AdvancedSimulationPlayer[],
  level: AdvancedSimulationLevel,
) {
  return getAvailableUnits(players).filter((unit) => getUnitDraftLevel(unit) === level);
}

function getUnitForPlayer(
  players: AdvancedSimulationPlayer[],
  player: AdvancedSimulationPlayer,
): BondUnit {
  if (!player.bondGroup) {
    return {
      id: player.id,
      players: [player],
    };
  }

  return {
    id: player.bondGroup,
    players: players.filter((current) => current.bondGroup === player.bondGroup),
  };
}

function distributeLevelAPlayers(state: AdvancedSimulationState) {
  let nextState = state;
  const levelAUnits = getAvailableUnitsForLevel(state.players, "A")
    .filter((unit) => unit.players.filter((player) => player.level === "A").length <= 1)
    .sort((left, right) => {
      const leftScore = getUnitScore(left);
      const rightScore = getUnitScore(right);

      return leftScore - rightScore || left.players.length - right.players.length;
    });

  for (const team of state.teams) {
    const availableUnit = levelAUnits.find((unit) =>
      unit.players.every(
        (player) =>
          nextState.players.find((current) => current.id === player.id)?.assignedTeamId === null,
      ),
    );

    if (!availableUnit) {
      break;
    }

    nextState = assignUnitToTeam(nextState, availableUnit, team.id);
  }

  return {
    ...nextState,
    currentDraftLevel: getNextLevelWithAvailableUnits(nextState.players, "A") || "A",
  };
}

function findNextTargetTeamIndex(
  state: AdvancedSimulationState,
  level: AdvancedSimulationLevel,
) {
  for (let offset = 0; offset < state.teams.length; offset += 1) {
    const index = (state.nextTeamCursor + offset) % state.teams.length;
    const team = state.teams[index];
    const teamPlayers = getTeamPlayers(state.players, team.id);

    if (teamPlayers.length >= TEAM_SIZE) {
      continue;
    }

    if (findBestUnitForTeam(state, team.id, level)) {
      return index;
    }
  }

  return null;
}

function findBestUnitForTeam(
  state: AdvancedSimulationState,
  teamId: number,
  level: AdvancedSimulationLevel,
) {
  const currentPlayers = getTeamPlayers(state.players, teamId);

  return getAvailableUnitsForLevel(state.players, level)
    .filter((unit) => currentPlayers.length + unit.players.length <= TEAM_SIZE)
    .filter((unit) => !wouldBreakLevelAConstraint(currentPlayers, unit))
    .sort(
      (left, right) =>
        getPlacementScoreForTeam(state, teamId, left) -
          getPlacementScoreForTeam(state, teamId, right) ||
        getUnitScore(right) - getUnitScore(left),
    )[0];
}

function getPlacementScoreForTeam(
  state: AdvancedSimulationState,
  teamId: number,
  unit: BondUnit,
) {
  const idealScore =
    state.players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0) /
    TEAM_COUNT;
  const averageAge =
    state.players.reduce((total, player) => total + player.age, 0) / state.players.length;
  const teamPlayers = getTeamPlayers(state.players, teamId);
  const needs = getTeamNeeds(teamPlayers);
  const roleMatch = getBestFitForUnit(teamPlayers, unit);
  const projectedScore =
    teamPlayers.reduce((total, player) => total + LEVEL_SCORE[player.level], 0) +
    getUnitScore(unit);
  const projectedAverageAge =
    (teamPlayers.reduce((total, player) => total + player.age, 0) +
      unit.players.reduce((total, player) => total + player.age, 0)) /
    (teamPlayers.length + unit.players.length);

  return (
    (roleMatch ? roleMatch.priority : 3) * 10 +
    teamPlayers.length * 4 +
    Math.abs(projectedScore - idealScore) * 4 +
    Math.abs(projectedAverageAge - averageAge) -
    Object.values(needs).reduce((total, value) => total + value, 0) -
    (unit.players.length > 1 ? 2 : 0)
  );
}

function getBestFitForUnit(
  currentTeamPlayers: AdvancedSimulationPlayer[],
  unit: BondUnit,
) {
  const needs = getTeamNeeds(currentTeamPlayers);

  return Object.entries(needs)
    .filter(([, amount]) => amount > 0)
    .flatMap(([role]) =>
      unit.players
        .map((player) =>
          getRoleMatch(
            player,
            role as Exclude<AdvancedSimulationAssignedRole, "RESERVA">,
          ),
        )
        .filter((value): value is RoleMatch => Boolean(value)),
    )
    .sort((left, right) => left.priority - right.priority)[0];
}

function getRoleMatch(
  player: AdvancedSimulationPlayer,
  role: Exclude<AdvancedSimulationAssignedRole, "RESERVA">,
): RoleMatch | null {
  switch (role) {
    case "ZAGUEIRO":
      if (player.preferredPosition === "ZAGUEIRO") {
        return { role, priority: 0, usedFallback: false };
      }
      if (player.preferredPosition === "LATERAL") {
        return { role, priority: 1, usedFallback: true };
      }
      if (player.preferredPosition === "VOLANTE") {
        return { role, priority: 2, usedFallback: true };
      }
      return null;
    case "LATERAL":
      return player.preferredPosition === "LATERAL"
        ? { role, priority: 0, usedFallback: false }
        : null;
    case "MEIO":
      if (
        player.preferredPosition === "VOLANTE" ||
        player.preferredPosition === "MEIA"
      ) {
        return { role, priority: 0, usedFallback: false };
      }
      if (player.preferredPosition === "LATERAL") {
        return { role, priority: 1, usedFallback: true };
      }
      return null;
    case "ATACANTE":
      if (player.preferredPosition === "ATACANTE") {
        return { role, priority: 0, usedFallback: false };
      }
      if (player.preferredPosition === "MEIA") {
        return { role, priority: 1, usedFallback: true };
      }
      return null;
  }
}

function assignUnitToTeam(
  state: AdvancedSimulationState,
  unit: BondUnit,
  teamId: number,
) {
  const players = [...state.players];
  const orderedUnitPlayers = [...unit.players].sort(
    (left, right) => LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level],
  );

  for (const unitPlayer of orderedUnitPlayers) {
    const currentTeamPlayers = getTeamPlayers(players, teamId);
    const role = chooseRoleForPlayer(currentTeamPlayers, unitPlayer);
    const index = players.findIndex((player) => player.id === unitPlayer.id);

    if (index >= 0) {
      players[index] = {
        ...players[index],
        assignedTeamId: teamId,
        assignedRole: role?.role || "RESERVA",
        usedFallback: role?.usedFallback || false,
      };
    }
  }

  return {
    ...state,
    players,
  };
}

function rebuildTeamAssignments(players: AdvancedSimulationPlayer[], teamId: number) {
  const nextPlayers = players.map((player) =>
    player.assignedTeamId === teamId
      ? { ...player, assignedRole: null, usedFallback: false }
      : player,
  );

  const orderedPlayers = getTeamPlayers(nextPlayers, teamId).sort(
    (left, right) =>
      playerAssignmentPriority(left) - playerAssignmentPriority(right) ||
      LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level] ||
      left.fullName.localeCompare(right.fullName, "pt-BR"),
  );

  for (const player of orderedPlayers) {
    const currentTeamPlayers = getTeamPlayers(nextPlayers, teamId);
    const role = chooseRoleForPlayer(currentTeamPlayers, player);
    const index = nextPlayers.findIndex((current) => current.id === player.id);

    if (index >= 0) {
      nextPlayers[index] = {
        ...nextPlayers[index],
        assignedRole: role?.role || "RESERVA",
        usedFallback: role?.usedFallback || false,
      };
    }
  }

  return nextPlayers;
}

function chooseRoleForPlayer(
  currentTeamPlayers: AdvancedSimulationPlayer[],
  player: AdvancedSimulationPlayer,
) {
  const needs = getTeamNeeds(currentTeamPlayers);

  return (["ZAGUEIRO", "LATERAL", "MEIO", "ATACANTE"] as Array<
    Exclude<AdvancedSimulationAssignedRole, "RESERVA">
  >)
    .filter((role) => needs[role] > 0)
    .map((role) => getRoleMatch(player, role))
    .filter((value): value is RoleMatch => Boolean(value))
    .sort((left, right) => left.priority - right.priority)[0];
}

function getTeamPlayers(players: AdvancedSimulationPlayer[], teamId: number) {
  return players.filter((player) => player.assignedTeamId === teamId);
}

function getTeamNeeds(players: AdvancedSimulationPlayer[]) {
  const counts = {
    ZAGUEIRO: players.filter((player) => player.assignedRole === "ZAGUEIRO").length,
    LATERAL: players.filter((player) => player.assignedRole === "LATERAL").length,
    MEIO: players.filter((player) => player.assignedRole === "MEIO").length,
    ATACANTE: players.filter((player) => player.assignedRole === "ATACANTE").length,
  };

  return {
    ZAGUEIRO: Math.max(0, 1 - counts.ZAGUEIRO),
    LATERAL: Math.max(0, 2 - counts.LATERAL),
    MEIO: Math.max(0, 2 - counts.MEIO),
    ATACANTE: Math.max(0, 1 - counts.ATACANTE),
  };
}

function getTeamIssues(players: AdvancedSimulationPlayer[]) {
  const issues: string[] = [];
  const needs = getTeamNeeds(players);

  if (needs.ZAGUEIRO > 0) {
    issues.push("Faltando zagueiro.");
  }

  if (needs.LATERAL > 0) {
    issues.push("Faltando laterais.");
  }

  if (needs.MEIO > 0) {
    issues.push("Faltando meio-campo.");
  }

  if (needs.ATACANTE > 0) {
    issues.push("Faltando atacante.");
  }

  if (players.length < TEAM_SIZE && players.length > 0) {
    issues.push(`Time com ${players.length} jogador(es) até agora.`);
  }

  return issues;
}

function getGlobalIssues(
  state: AdvancedSimulationState,
  teams: AdvancedSimulationDisplayTeam[],
): AdvancedSimulationIssue[] {
  const issues: AdvancedSimulationIssue[] = [];

  if (!state.draftGenerated) {
    issues.push({
      id: "draft",
      message: "Comece a distribuição para analisar o equilíbrio da simulação avançada.",
      severity: "info",
    });
  }

  if (state.hasForcedOverride) {
    issues.push({
      id: "override",
      message: "⚠️ Esta divisão contém inconsistências.",
      severity: "warning",
    });
  }

  for (const unit of getAvailableUnits(state.players)) {
    if (unit.players.length > 1) {
      issues.push({
        id: `bond-${unit.id}`,
        message: `Grupo vinculado ${unit.id} ainda não foi alocado.`,
        severity: "warning",
      });
    }
  }

  for (const team of teams) {
    const levelACount = team.players.filter((player) => player.level === "A").length;

    if (state.draftGenerated && levelACount === 0) {
      issues.push({
        id: `team-a-missing-${team.id}`,
        message: `${team.name} está sem jogador nível A.`,
        severity: "warning",
      });
    }

    if (levelACount > 1) {
      issues.push({
        id: `team-a-duplicate-${team.id}`,
        message: `${team.name} está com mais de um jogador nível A.`,
        severity: "warning",
      });
    }
  }

  const scoreSpread = teams.length
    ? Math.max(...teams.map((team) => team.totalScore)) -
      Math.min(...teams.map((team) => team.totalScore))
    : 0;

  if (scoreSpread > 6) {
    issues.push({
      id: "spread",
      message: "Há diferença relevante de pontuação entre os times.",
      severity: "warning",
    });
  }

  if (isAnyBondGroupSplit(state.players)) {
    issues.push({
      id: "bond-split",
      message: "Existe pelo menos um vínculo quebrado na divisão atual.",
      severity: "warning",
    });
  }

  return issues;
}

function getUnitDraftLevel(unit: BondUnit) {
  return [...unit.players].sort(
    (left, right) =>
      ADVANCED_DRAFT_LEVEL_ORDER.indexOf(left.level) -
      ADVANCED_DRAFT_LEVEL_ORDER.indexOf(right.level),
  )[0].level;
}

function getNextLevelWithAvailableUnits(
  players: AdvancedSimulationPlayer[],
  currentLevel: AdvancedSimulationLevel,
) {
  const currentIndex = ADVANCED_DRAFT_LEVEL_ORDER.indexOf(currentLevel);

  for (const level of ADVANCED_DRAFT_LEVEL_ORDER.slice(currentIndex + 1)) {
    if (getAvailableUnitsForLevel(players, level).length > 0) {
      return level;
    }
  }

  return null;
}

function wouldBreakLevelAConstraint(
  teamPlayers: AdvancedSimulationPlayer[],
  unit: BondUnit,
) {
  const teamALevelCount = teamPlayers.filter((player) => player.level === "A").length;
  const unitALevelCount = unit.players.filter((player) => player.level === "A").length;

  return teamALevelCount + unitALevelCount > 1;
}

function isAnyBondGroupSplit(players: AdvancedSimulationPlayer[]) {
  const teamsByBondGroup = new Map<string, number>();

  for (const player of players) {
    if (!player.bondGroup || player.assignedTeamId === null) {
      continue;
    }

    const currentTeam = teamsByBondGroup.get(player.bondGroup);

    if (currentTeam !== undefined && currentTeam !== player.assignedTeamId) {
      return true;
    }

    teamsByBondGroup.set(player.bondGroup, player.assignedTeamId);
  }

  return false;
}

function playerAssignmentPriority(player: AdvancedSimulationPlayer) {
  switch (player.preferredPosition) {
    case "ZAGUEIRO":
      return 0;
    case "ATACANTE":
      return 1;
    case "VOLANTE":
      return 2;
    case "MEIA":
      return 3;
    case "LATERAL":
      return 4;
  }
}

function getUnitScore(unit: BondUnit) {
  return unit.players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0);
}

function roleSortValue(role: AdvancedSimulationAssignedRole | null) {
  switch (role) {
    case "ZAGUEIRO":
      return 0;
    case "LATERAL":
      return 1;
    case "MEIO":
      return 2;
    case "ATACANTE":
      return 3;
    case "RESERVA":
      return 4;
    case null:
      return 5;
  }
}

function getShortPositionCode(position: AdvancedSimulationPosition) {
  switch (position) {
    case "ATACANTE":
      return "ATA";
    case "MEIA":
      return "MEI";
    case "VOLANTE":
      return "VOL";
    case "LATERAL":
      return "LAT";
    case "ZAGUEIRO":
      return "ZAG";
  }
}
