export type SimulationPosition =
  | "ZAGUEIRO"
  | "LATERAL"
  | "VOLANTE"
  | "MEIA"
  | "ATACANTE";

export type SimulationLevel = "A" | "B" | "C" | "D" | "E";
export type SimulationAssignedRole =
  | "ZAGUEIRO"
  | "LATERAL"
  | "MEIO"
  | "ATACANTE"
  | "RESERVA";

export type SimulationPlayer = {
  id: string;
  fullName: string;
  preferredPosition: SimulationPosition;
  level: SimulationLevel;
  age: number;
  bondGroup: string | null;
  assignedTeamId: number | null;
  assignedRole: SimulationAssignedRole | null;
  usedFallback: boolean;
};

export type SimulationTeam = {
  id: number;
  name: string;
};

export type SimulationWarning = {
  id: string;
  message: string;
  severity: "info" | "warning";
};

export type SimulationState = {
  players: SimulationPlayer[];
  teams: SimulationTeam[];
  draftGenerated: boolean;
  lastAction: string | null;
  nextTeamCursor: number;
  currentDraftLevel: SimulationLevel;
};

export type SimulationSummary = {
  totalPlayers: number;
  usedPlayers: number;
  unusedPlayers: number;
  warnings: SimulationWarning[];
  scoreSpread: number;
};

export type SimulationSwapResult = {
  valid: boolean;
  message: string;
};

export type SimulationDisplayTeam = SimulationTeam & {
  players: SimulationPlayer[];
  totalScore: number;
  averageAge: number;
  warnings: string[];
};

type BondUnit = {
  id: string;
  players: SimulationPlayer[];
};

type RoleMatch = {
  role: Exclude<SimulationAssignedRole, "RESERVA">;
  priority: number;
  usedFallback: boolean;
};

const TEAM_COUNT = 5;
const TEAM_SIZE = 9;
export const DRAFT_LEVEL_ORDER: SimulationLevel[] = ["A", "B", "C", "D", "E"];
const LEVEL_SCORE: Record<SimulationLevel, number> = {
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

const POSITION_SEQUENCE: SimulationPosition[] = [
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

const LEVEL_SEQUENCE: SimulationLevel[] = [
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

export function createSimulationState(): SimulationState {
  return {
    players: createFictionalPlayers(),
    teams: Array.from({ length: TEAM_COUNT }, (_, index) => ({
      id: index + 1,
      name: `Time ${index + 1}`,
    })),
    draftGenerated: false,
    lastAction: null,
    nextTeamCursor: 0,
    currentDraftLevel: "A",
  };
}

export function addBondBetweenPlayers(
  state: SimulationState,
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
  const mergedALevelCount = mergedPlayers.filter((player) => player.level === "A").length;

  if (mergedALevelCount > 1) {
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

  const players = state.players.map((player) => {
    if (
      player.id === firstPlayerId ||
      player.id === secondPlayerId ||
      (player.bondGroup !== null && groupsToMerge.has(player.bondGroup))
    ) {
      return { ...player, bondGroup };
    }

    return player;
  });

  return {
    ...state,
    players,
    lastAction: `Vínculo criado entre ${first.fullName} e ${second.fullName}.`,
  };
}

export function generateInitialDraft(state: SimulationState) {
  let nextState = resetAssignments(state);
  nextState = distributePlayersForLevel(nextState, "A");

  return {
    ...nextState,
    draftGenerated: true,
    lastAction: "Esboço inicial gerado com a distribuição dos jogadores nível A.",
  };
}

export function drawNextPlayer(state: SimulationState) {
  const targetLevel = getNextPendingLevel(state) || state.currentDraftLevel;
  const availableUnits = getAvailableUnitsForLevel(state.players, targetLevel);

  if (availableUnits.length === 0) {
    const nextLevel = getNextLevelWithAvailableUnits(state.players, targetLevel);

    if (nextLevel) {
      return {
        ...state,
        currentDraftLevel: nextLevel,
        nextTeamCursor: 0,
        lastAction: `Nível ${targetLevel} concluído. O próximo passo é distribuir jogadores nível ${nextLevel}.`,
      };
    }

    return {
      ...state,
      lastAction: "Todos os jogadores já foram distribuídos.",
    };
  }

  const targetIndex = findNextTargetTeamIndex(state, targetLevel);

  if (targetIndex === null) {
    return {
      ...state,
      lastAction: `Não foi possível encontrar um encaixe válido para o próximo jogador nível ${targetLevel}.`,
    };
  }

  const targetTeam = state.teams[targetIndex];
  const candidate = findBestUnitForTeam(state, targetTeam.id, undefined, targetLevel);

  if (!candidate) {
    return {
      ...state,
      lastAction: `Nenhum jogador nível ${targetLevel} disponível encaixou no ${targetTeam.name}.`,
    };
  }

  const nextState = assignUnitToTeam(state, candidate, targetTeam.id, "proximo");
  const remainingCurrentLevel = getAvailableUnitsForLevel(nextState.players, targetLevel);
  const nextLevel = remainingCurrentLevel.length
    ? targetLevel
    : getNextLevelWithAvailableUnits(nextState.players, targetLevel);

  return {
    ...nextState,
    draftGenerated: true,
    nextTeamCursor: (targetIndex + 1) % state.teams.length,
    currentDraftLevel: nextLevel || targetLevel,
    lastAction:
      candidate.players.length > 1
        ? `Grupo ${candidate.id} do nível ${targetLevel} sorteado para ${targetTeam.name}.`
        : `${candidate.players[0].fullName} do nível ${targetLevel} sorteado para ${targetTeam.name}.`,
  };
}

export function distributePlayersForLevel(
  state: SimulationState,
  level: SimulationLevel,
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
      const targetTeam = nextState.teams[targetIndex];
      const candidate = findBestUnitForTeam(nextState, targetTeam.id, undefined, level);

      if (!candidate) {
        break;
      }

      nextState = assignUnitToTeam(nextState, candidate, targetTeam.id, "proximo");
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
    currentDraftLevel: nextLevel || level,
    nextTeamCursor: 0,
    lastAction:
      level === "A"
        ? "Jogadores nível A distribuídos, com um atleta A por time."
        : `Jogadores nível ${level} distribuídos em rodízio entre os times.`,
  };
}

export function movePlayerToTeam(
  state: SimulationState,
  playerId: string,
  destinationTeamId: number,
) {
  if (areTeamsComplete(state)) {
    return {
      ...state,
      lastAction:
        "Com todos os times completos, use troca simples ou troca tripla em vez de movimentação isolada.",
    };
  }

  const player = state.players.find((current) => current.id === playerId);
  const destinationTeam = state.teams.find((team) => team.id === destinationTeamId);

  if (!player || !destinationTeam) {
    return state;
  }

  if (player.assignedTeamId === null) {
    return {
      ...state,
      lastAction: "Selecione um jogador que já esteja em um dos times.",
    };
  }

  if (player.assignedTeamId === destinationTeamId) {
    return {
      ...state,
      lastAction: `${player.fullName} já está no ${destinationTeam.name}.`,
    };
  }

  const movingUnit = getUnitForPlayer(state.players, player);
  const destinationPlayers = getTeamPlayers(state.players, destinationTeamId);

  if (wouldBreakLevelAConstraint(destinationPlayers, movingUnit)) {
    return {
      ...state,
      lastAction:
        "Não é possível concluir a movimentação. O time de destino já possui um jogador nível A.",
    };
  }

  if (destinationPlayers.length + movingUnit.players.length > TEAM_SIZE) {
    return {
      ...state,
      lastAction: `Não há espaço suficiente no ${destinationTeam.name} para mover ${
        movingUnit.players.length > 1 ? "o grupo vinculado" : "o jogador"
      }.`,
    };
  }

  const originTeamId = player.assignedTeamId;
  let players = state.players.map((current) =>
    movingUnit.players.some((member) => member.id === current.id)
      ? { ...current, assignedTeamId: destinationTeamId, assignedRole: null, usedFallback: false }
      : current,
  );

  players = rebuildTeamAssignments(players, originTeamId);
  players = rebuildTeamAssignments(players, destinationTeamId);

  return {
    ...state,
    players,
    lastAction:
      movingUnit.players.length > 1
        ? `Grupo vinculado movido para ${destinationTeam.name}.`
        : `${player.fullName} movido para ${destinationTeam.name}.`,
  };
}

export function areTeamsComplete(state: SimulationState) {
  return state.teams.every(
    (team) => getTeamPlayers(state.players, team.id).length === TEAM_SIZE,
  );
}

export function validateSimpleSwap(
  state: SimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
): SimulationSwapResult {
  return validateTransfers(state, [
    { playerId: firstPlayerId, cycleOrder: 0 },
    { playerId: secondPlayerId, cycleOrder: 1 },
  ]);
}

export function applySimpleSwap(
  state: SimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
) {
  const result = buildStateFromTransfers(state, [
    { playerId: firstPlayerId, cycleOrder: 0 },
    { playerId: secondPlayerId, cycleOrder: 1 },
  ]);

  if (!result.valid || !result.nextState) {
    return {
      ...state,
      lastAction: result.message,
    };
  }

  return {
    ...result.nextState,
    lastAction: "Troca simples confirmada com sucesso.",
  };
}

export function validateTripleSwap(
  state: SimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
  thirdPlayerId: string,
): SimulationSwapResult {
  return validateTransfers(state, [
    { playerId: firstPlayerId, cycleOrder: 0 },
    { playerId: secondPlayerId, cycleOrder: 1 },
    { playerId: thirdPlayerId, cycleOrder: 2 },
  ]);
}

export function applyTripleSwap(
  state: SimulationState,
  firstPlayerId: string,
  secondPlayerId: string,
  thirdPlayerId: string,
) {
  const result = buildStateFromTransfers(state, [
    { playerId: firstPlayerId, cycleOrder: 0 },
    { playerId: secondPlayerId, cycleOrder: 1 },
    { playerId: thirdPlayerId, cycleOrder: 2 },
  ]);

  if (!result.valid || !result.nextState) {
    return {
      ...state,
      lastAction: result.message,
    };
  }

  return {
    ...result.nextState,
    lastAction: "Troca tripla confirmada com sucesso.",
  };
}

export function getDisplayTeams(state: SimulationState): SimulationDisplayTeam[] {
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
      warnings: getTeamWarnings(players),
    };
  });
}

export function getAvailablePlayers(state: SimulationState) {
  return state.players
    .filter((player) => player.assignedTeamId === null)
    .sort(
      (left, right) =>
        Number(Boolean(right.bondGroup)) - Number(Boolean(left.bondGroup)) ||
        LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level] ||
        left.fullName.localeCompare(right.fullName, "pt-BR"),
    );
}

export function getSimulationSummary(state: SimulationState): SimulationSummary {
  const teams = getDisplayTeams(state);
  const scores = teams.map((team) => team.totalScore);
  const usedPlayers = state.players.filter((player) => player.assignedTeamId !== null).length;
  const warnings = [
    ...buildGlobalWarnings(state, teams),
    ...teams.flatMap((team) =>
      team.warnings.map((message, index) => ({
        id: `${team.id}-${index}`,
        message: `${team.name}: ${message}`,
        severity: "warning" as const,
      })),
    ),
  ];

  return {
    totalPlayers: state.players.length,
    usedPlayers,
    unusedPlayers: state.players.length - usedPlayers,
    warnings,
    scoreSpread: scores.length ? Math.max(...scores) - Math.min(...scores) : 0,
  };
}

export function formatPosition(position: SimulationPosition) {
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

function createFictionalPlayers(): SimulationPlayer[] {
  return FICTIONAL_NAMES.map((fullName, index) => ({
    id: `sim-${index + 1}`,
    fullName,
    preferredPosition: POSITION_SEQUENCE[index],
    level: LEVEL_SEQUENCE[index],
    age: AGE_SEQUENCE[index],
    bondGroup: null,
    assignedTeamId: null,
    assignedRole: null,
    usedFallback: false,
  }));
}

function resetAssignments(state: SimulationState): SimulationState {
  return {
    ...state,
    nextTeamCursor: 0,
    currentDraftLevel: "A",
    players: state.players.map((player) => ({
      ...player,
      assignedTeamId: null,
      assignedRole: null,
      usedFallback: false,
    })),
  };
}

function getAvailableUnits(players: SimulationPlayer[]) {
  const groups = new Map<string, SimulationPlayer[]>();

  for (const player of players) {
    if (player.assignedTeamId !== null) {
      continue;
    }

    const key = player.bondGroup || player.id;
    const current = groups.get(key) || [];
    current.push(player);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([id, bondedPlayers]) => ({
    id,
    players: bondedPlayers,
  }));
}

function getAvailableUnitsForLevel(
  players: SimulationPlayer[],
  level: SimulationLevel,
) {
  return getAvailableUnits(players).filter((unit) => getUnitDraftLevel(unit) === level);
}

function getUnitForPlayer(players: SimulationPlayer[], player: SimulationPlayer): BondUnit {
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

type CycleTransferInput = {
  playerId: string;
  cycleOrder: number;
};

function validateTransfers(
  state: SimulationState,
  transfers: CycleTransferInput[],
): SimulationSwapResult {
  const result = buildStateFromTransfers(state, transfers);

  return {
    valid: result.valid,
    message: result.message,
  };
}

function buildStateFromTransfers(
  state: SimulationState,
  transfers: CycleTransferInput[],
): { valid: boolean; message: string; nextState?: SimulationState } {
  if (!areTeamsComplete(state)) {
    return {
      valid: false,
      message:
        "As trocas 1x1 e triplas ficam disponíveis quando todos os times estiverem completos.",
    };
  }

  const selectedPlayers = transfers.map(({ playerId }) =>
    state.players.find((player) => player.id === playerId),
  );

  if (selectedPlayers.some((player) => !player || player.assignedTeamId === null)) {
    return {
      valid: false,
      message: "Selecione apenas jogadores já alocados nos times.",
    };
  }

  const units = selectedPlayers.map((player) => getUnitForPlayer(state.players, player!));
  const uniqueUnitIds = new Set(units.map((unit) => unit.id));

  if (uniqueUnitIds.size !== units.length) {
    return {
      valid: false,
      message: "Cada seleção precisa representar um grupo diferente de jogadores.",
    };
  }

  const sourceTeams = selectedPlayers.map((player) => player!.assignedTeamId!);
  const uniqueSourceTeams = new Set(sourceTeams);

  if (uniqueSourceTeams.size !== sourceTeams.length) {
    return {
      valid: false,
      message: "Cada jogador selecionado deve vir de um time diferente.",
    };
  }

  const targetTeams = sourceTeams.map(
    (_, index) => sourceTeams[(index + 1) % sourceTeams.length],
  );
  const affectedTeamIds = new Set<number>([...sourceTeams, ...targetTeams]);

  let players = state.players.map((player) => ({
    ...player,
  }));

  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    const targetTeamId = targetTeams[index];

    players = players.map((player) =>
      unit.players.some((member) => member.id === player.id)
        ? {
            ...player,
            assignedTeamId: targetTeamId,
            assignedRole: null,
            usedFallback: false,
          }
        : player,
    );
  }

  for (const teamId of affectedTeamIds) {
    players = rebuildTeamAssignments(players, teamId);
  }

  for (const team of state.teams) {
    const currentTeamPlayers = getTeamPlayers(players, team.id);

    if (currentTeamPlayers.length !== TEAM_SIZE) {
      return {
        valid: false,
        message: `A troca deixaria o ${team.name} com quantidade incorreta de jogadores.`,
      };
    }

    const levelACount = currentTeamPlayers.filter((player) => player.level === "A").length;

    if (levelACount > 1) {
      return {
        valid: false,
        message: `Não é possível concluir a troca. O ${team.name} ficaria com mais de um jogador nível A.`,
      };
    }
  }

  if (isAnyBondGroupSplit(players)) {
    return {
      valid: false,
      message: "Não é possível concluir a troca porque um vínculo entre jogadores seria quebrado.",
    };
  }

  for (const teamId of affectedTeamIds) {
    const previousPlayers = getTeamPlayers(state.players, teamId);
    const nextPlayers = getTeamPlayers(players, teamId);

    if (getNeedGapCount(nextPlayers) > getNeedGapCount(previousPlayers)) {
      return {
        valid: false,
        message: `A troca pioraria a estrutura do ${getTeamName(state.teams, teamId)}.`,
      };
    }
  }

  return {
    valid: true,
    message: "Troca validada com sucesso.",
    nextState: {
      ...state,
      players,
    },
  };
}

function getTeamPlayers(players: SimulationPlayer[], teamId: number) {
  return players.filter((player) => player.assignedTeamId === teamId);
}

function getTeamNeeds(players: SimulationPlayer[]) {
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

function getNeedGapCount(players: SimulationPlayer[]) {
  return Object.values(getTeamNeeds(players)).reduce((total, value) => total + value, 0);
}

function getRoleMatch(
  player: SimulationPlayer,
  role: Exclude<SimulationAssignedRole, "RESERVA">,
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

function getBestFitForUnit(
  currentTeamPlayers: SimulationPlayer[],
  unit: BondUnit,
) {
  const needs = getTeamNeeds(currentTeamPlayers);
  const basePriority = Object.entries(needs)
    .filter(([, amount]) => amount > 0)
    .flatMap(([role]) =>
      unit.players
        .map((player) =>
          getRoleMatch(
            player,
            role as Exclude<SimulationAssignedRole, "RESERVA">,
          ),
        )
        .filter((value): value is RoleMatch => Boolean(value)),
    )
    .sort((left, right) => left.priority - right.priority)[0];

  if (basePriority) {
    return basePriority;
  }

  return null;
}

function getPlacementScoreForTeam(
  state: SimulationState,
  teamId: number,
  unit: BondUnit,
  role?: Exclude<SimulationAssignedRole, "RESERVA">,
) {
  const idealScore =
    state.players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0) /
    TEAM_COUNT;
  const averageAge =
    state.players.reduce((total, player) => total + player.age, 0) / state.players.length;
  const teamPlayers = getTeamPlayers(state.players, teamId);
  const needs = getTeamNeeds(teamPlayers);
  const roleMatch = role
    ? unit.players
        .map((player) => getRoleMatch(player, role))
        .filter((value): value is RoleMatch => Boolean(value))
        .sort((left, right) => left.priority - right.priority)[0] || null
    : getBestFitForUnit(teamPlayers, unit);
  const projectedScore =
    teamPlayers.reduce((total, player) => total + LEVEL_SCORE[player.level], 0) +
    getUnitScore(unit);
  const projectedAverageAge =
    (teamPlayers.reduce((total, player) => total + player.age, 0) +
      unit.players.reduce((total, player) => total + player.age, 0)) /
    (teamPlayers.length + unit.players.length);
  const sizePenalty = teamPlayers.length * 4;
  const balancePenalty = Math.abs(projectedScore - idealScore) * 4;
  const agePenalty = Math.abs(projectedAverageAge - averageAge);
  const needPressure = Object.values(needs).reduce((total, value) => total + value, 0);
  const rolePenalty = roleMatch ? roleMatch.priority * 10 : role ? 40 : 18;
  const bondBonus = unit.players.length > 1 ? -2 : 0;

  return (
    rolePenalty +
    sizePenalty +
    balancePenalty +
    agePenalty -
    needPressure +
    bondBonus
  );
}

function findBestUnitForTeam(
  state: SimulationState,
  teamId: number,
  role?: Exclude<SimulationAssignedRole, "RESERVA">,
  level?: SimulationLevel,
) {
  const availableUnits = level
    ? getAvailableUnitsForLevel(state.players, level)
    : getAvailableUnits(state.players);
  const currentPlayers = getTeamPlayers(state.players, teamId);
  const wantsLevelA = currentPlayers.every((player) => player.level !== "A");

  const candidates = availableUnits
    .filter((unit) => currentPlayers.length + unit.players.length <= TEAM_SIZE)
    .filter((unit) => !wouldBreakLevelAConstraint(currentPlayers, unit))
    .filter((unit) => {
      if (!role) {
        return true;
      }

      return unit.players.some((player) => Boolean(getRoleMatch(player, role)));
    })
    .sort((left, right) => {
      const leftHasA = left.players.some((player) => player.level === "A");
      const rightHasA = right.players.some((player) => player.level === "A");

      if (wantsLevelA && leftHasA !== rightHasA) {
        return Number(rightHasA) - Number(leftHasA);
      }

      return (
        getPlacementScoreForTeam(state, teamId, left, role) -
          getPlacementScoreForTeam(state, teamId, right, role) ||
        getUnitScore(right) - getUnitScore(left)
      );
    });

  return candidates[0] || null;
}

function assignUnitToTeam(
  state: SimulationState,
  unit: BondUnit,
  teamId: number,
  mode: "esboco" | "proximo",
) {
  const players = [...state.players];
  const assignedUnitPlayers = [...unit.players].sort(
    (left, right) => LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level],
  );

  for (const unitPlayer of assignedUnitPlayers) {
    const currentTeamPlayers = getTeamPlayers(players, teamId);
    const role = chooseRoleForPlayer(currentTeamPlayers, unitPlayer, mode);
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

function rebuildTeamAssignments(players: SimulationPlayer[], teamId: number) {
  const nextPlayers = players.map((player) =>
    player.assignedTeamId === teamId
      ? { ...player, assignedRole: null, usedFallback: false }
      : player,
  );

  const orderedTeamPlayers = getTeamPlayers(nextPlayers, teamId).sort(
    (left, right) =>
      playerAssignmentPriority(left) - playerAssignmentPriority(right) ||
      LEVEL_SCORE[right.level] - LEVEL_SCORE[left.level] ||
      left.fullName.localeCompare(right.fullName, "pt-BR"),
  );

  for (const player of orderedTeamPlayers) {
    const currentTeamPlayers = getTeamPlayers(nextPlayers, teamId);
    const role = chooseRoleForPlayer(currentTeamPlayers, player, "proximo");
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
  currentTeamPlayers: SimulationPlayer[],
  player: SimulationPlayer,
  mode: "esboco" | "proximo",
) {
  const roleOrder: Array<Exclude<SimulationAssignedRole, "RESERVA">> =
    mode === "esboco"
      ? ["ZAGUEIRO", "ATACANTE", "MEIO", "LATERAL"]
      : ["ZAGUEIRO", "LATERAL", "MEIO", "ATACANTE"];

  const needs = getTeamNeeds(currentTeamPlayers);

  const matches = roleOrder
    .filter((role) => needs[role] > 0)
    .map((role) => getRoleMatch(player, role))
    .filter((value): value is RoleMatch => Boolean(value))
    .sort((left, right) => left.priority - right.priority);

  return matches[0] || null;
}

function getUnitScore(unit: BondUnit) {
  return unit.players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0);
}

function distributeLevelAPlayers(state: SimulationState) {
  let nextState = state;
  const levelAUnits = getAvailableUnitsForLevel(state.players, "A")
    .filter((unit) => unit.players.some((player) => player.level === "A"))
    .filter((unit) => unit.players.filter((player) => player.level === "A").length <= 1)
    .sort((left, right) => {
      const leftACount = left.players.filter((player) => player.level === "A").length;
      const rightACount = right.players.filter((player) => player.level === "A").length;

      return (
        leftACount - rightACount ||
        getUnitScore(left) - getUnitScore(right) ||
        left.players.length - right.players.length
      );
    });

  for (const team of state.teams) {
    const availableAUnit = levelAUnits.find((unit) =>
      unit.players.every(
        (player) =>
          nextState.players.find((current) => current.id === player.id)?.assignedTeamId === null,
      ),
    );

    if (!availableAUnit) {
      break;
    }

    nextState = assignUnitToTeam(nextState, availableAUnit, team.id, "esboco");
  }

  return nextState;
}

function wouldBreakLevelAConstraint(
  teamPlayers: SimulationPlayer[],
  unit: BondUnit,
) {
  const teamALevelCount = teamPlayers.filter((player) => player.level === "A").length;
  const unitALevelCount = unit.players.filter((player) => player.level === "A").length;

  return teamALevelCount + unitALevelCount > 1;
}

function findNextTargetTeamIndex(
  state: SimulationState,
  level?: SimulationLevel,
) {
  for (let offset = 0; offset < state.teams.length; offset += 1) {
    const index = (state.nextTeamCursor + offset) % state.teams.length;
    const team = state.teams[index];
    const teamPlayers = getTeamPlayers(state.players, team.id);

    if (teamPlayers.length >= TEAM_SIZE) {
      continue;
    }

    const candidate = findBestUnitForTeam(state, team.id, undefined, level);

    if (candidate) {
      return index;
    }
  }

  return null;
}

function getUnitDraftLevel(unit: BondUnit) {
  return [...unit.players]
    .sort(
      (left, right) =>
        DRAFT_LEVEL_ORDER.indexOf(left.level) - DRAFT_LEVEL_ORDER.indexOf(right.level),
    )[0].level;
}

function getNextLevelWithAvailableUnits(
  players: SimulationPlayer[],
  currentLevel: SimulationLevel,
) {
  const currentIndex = DRAFT_LEVEL_ORDER.indexOf(currentLevel);

  for (const level of DRAFT_LEVEL_ORDER.slice(currentIndex + 1)) {
    if (getAvailableUnitsForLevel(players, level).length > 0) {
      return level;
    }
  }

  return null;
}

export function getNextPendingLevel(state: SimulationState) {
  for (const level of DRAFT_LEVEL_ORDER) {
    if (getAvailableUnitsForLevel(state.players, level).length > 0) {
      return level;
    }
  }

  return null;
}

function playerAssignmentPriority(player: SimulationPlayer) {
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

function isAnyBondGroupSplit(players: SimulationPlayer[]) {
  const groupTeams = new Map<string, number>();

  for (const player of players) {
    if (!player.bondGroup || player.assignedTeamId === null) {
      continue;
    }

    const currentTeam = groupTeams.get(player.bondGroup);

    if (currentTeam !== undefined && currentTeam !== player.assignedTeamId) {
      return true;
    }

    groupTeams.set(player.bondGroup, player.assignedTeamId);
  }

  return false;
}

function buildGlobalWarnings(
  state: SimulationState,
  teams: SimulationDisplayTeam[],
): SimulationWarning[] {
  const warnings: SimulationWarning[] = [];
  const availableUnits = getAvailableUnits(state.players);

  for (const unit of availableUnits) {
    if (unit.players.some((player) => player.bondGroup)) {
      warnings.push({
        id: `bond-${unit.id}`,
        message: `Grupo vinculado ${unit.id} ainda não foi alocado.`,
        severity: "warning",
      });
    }
  }

  const scores = teams.map((team) => team.totalScore);
  const spread = scores.length ? Math.max(...scores) - Math.min(...scores) : 0;

  if (spread > 5) {
    warnings.push({
      id: "spread",
      message: "Há diferença relevante de pontuação entre os times.",
      severity: "warning",
    });
  }

  if (!state.draftGenerated) {
    warnings.push({
      id: "draft",
      message: "Gere um esboço inicial antes de analisar o equilíbrio final.",
      severity: "info",
    });
  }

  for (const team of teams) {
    const levelACount = team.players.filter((player) => player.level === "A").length;

    if (state.draftGenerated && levelACount === 0) {
      warnings.push({
        id: `time-sem-a-${team.id}`,
        message: `${team.name} está sem jogador de nível A.`,
        severity: "warning",
      });
    }

    if (levelACount > 1) {
      warnings.push({
        id: `time-muitos-a-${team.id}`,
        message: `${team.name} está com mais de um jogador de nível A.`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

function getTeamWarnings(players: SimulationPlayer[]) {
  const needs = getTeamNeeds(players);
  const warnings: string[] = [];
  const totalScore = players.reduce((total, player) => total + LEVEL_SCORE[player.level], 0);

  if (needs.ZAGUEIRO > 0) {
    warnings.push("Faltando zagueiro.");
  }

  if (needs.LATERAL > 0) {
    warnings.push("Faltando laterais.");
  }

  if (needs.MEIO > 0) {
    warnings.push("Faltando meio-campo.");
  }

  if (needs.ATACANTE > 0) {
    warnings.push("Faltando atacante.");
  }

  if (totalScore > 31) {
    warnings.push("Time com nível alto demais.");
  }

  if (players.length < TEAM_SIZE && players.length > 0) {
    warnings.push(`Time com ${players.length} jogador(es) até agora.`);
  }

  return warnings;
}

function roleSortValue(role: SimulationAssignedRole | null) {
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

function getTeamName(teams: SimulationTeam[], teamId: number) {
  return teams.find((team) => team.id === teamId)?.name || `Time ${teamId}`;
}
