export type CampaoCategory = "ADULTO" | "MASTER";
export type CampaoPosition = "GOLEIRO" | "ZAGUEIRO" | "LATERAL" | "VOLANTE" | "MEIA" | "ATACANTE";
export type CampaoLevel = "A" | "B" | "C" | "D" | "E";
export type CampaoPlayer = { id: string; fullName: string; age: number; phone: string; position: CampaoPosition; level: CampaoLevel | null; adminNotes?: string | null };
export type CampaoRelationship = { id: string; playerAId: string; playerBId: string; relationshipType: string; priorityWeight: number; notes?: string | null };
export type CampaoTeam = { id: number; name: string; playerIds: string[]; starterIds?: string[]; reserveIds?: string[] };
export type CampaoState = { players: CampaoPlayer[]; relationships: CampaoRelationship[]; teams: CampaoTeam[] };
export class CampaoDivisionError extends Error { constructor(message: string, public readonly relationshipIds: string[]) { super(message); this.name = "CampaoDivisionError"; } }

export const TEAM_COUNT = 6;
export const LINE_PLAYERS_PER_TEAM = 13;
export const STARTER_COMPOSITION: Record<Exclude<CampaoPosition, "GOLEIRO">, number> = { ZAGUEIRO: 2, LATERAL: 2, VOLANTE: 1, MEIA: 2, ATACANTE: 1 };
export const CAMPAO_COMPOSITION: Record<CampaoPosition, number> = { GOLEIRO: 1, ...STARTER_COMPOSITION };

const points: Record<CampaoLevel, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const adultEliteIds = ["85d1662f-564d-41bf-a1b7-06089ea64a36", "91894447-3246-4269-9c2c-7bd4a1783df4", "b3104c6e-c0cd-4537-a3e4-954c549dd886", "5e7f5372-6cd8-449d-bebb-ee9c4f162cc7", "43707176-1e1e-497a-aa47-5eb8b03be264", "a7dd9266-71ae-4a0f-81e9-a7e6576e4326"];
const masterEliteIds = ["daa8fe0b-3a89-471c-a239-27088e192de9", "14825f98-fe77-4216-8487-fce76482b4aa", "56359dfd-64a1-4a86-8058-d33d300448ce", "092db02b-95e6-4d91-bea9-a0092d339758", "24c4adc1-1018-463b-83d4-6663ed1c62a7", "375b30d6-e0f2-408d-aeb7-499ab1dc493c"];
const masterCenterBackIds = ["db454af0-418e-4029-af22-4687ed174e76", "23c9e222-76e6-4817-a1ea-a06cc03fa9b7", "e87d42a3-3984-4be4-ac9a-cb8d9a415d21", "fdf030ca-e76f-4e13-a57f-e450e94e8f70", "0d64ff56-6a14-4eb7-8c39-0c90f66d6da7", "024d4981-b373-4b75-8e97-591f2efae48a"];

export function generateCampaoTeams(state: CampaoState, teamCount = TEAM_COUNT) {
  if (state.players.some((player) => !player.level)) throw new Error("Todos os jogadores precisam ter nível definido antes do sorteio.");
  const candidateCount = 18;
  const candidates = Array.from({ length: candidateCount }, () => generateCandidate(state, teamCount));
  candidates.sort((first, second) => getCampaoBalanceScore(second) - getCampaoBalanceScore(first));
  // Vínculos são regra de elegibilidade: alternativas que os rompem não entram
  // na escolha quando existe uma divisão que os preserva integralmente.
  const validCandidates = candidates.filter((candidate) => getCampaoDiagnostics(candidate)?.brokenMandatory === 0);
  if (!validCandidates.length) {
    const closestAttempt = candidates[0];
    const blocked = state.relationships.filter((relationship) => closestAttempt.teams.some((team) => team.playerIds.includes(relationship.playerAId) && !team.playerIds.includes(relationship.playerBId))).map((relationship) => relationship.id);
    throw new CampaoDivisionError("Não foi possível gerar uma divisão sem romper vínculos.", blocked);
  }
  const eligibleCandidates = validCandidates;
  const bestScore = getCampaoBalanceScore(eligibleCandidates[0]);
  const strongAlternatives = eligibleCandidates.filter((candidate) => getCampaoBalanceScore(candidate) >= bestScore - 3);
  return strongAlternatives[Math.floor(Math.random() * Math.min(strongAlternatives.length, 5))] || eligibleCandidates[0];
}

function generateCandidate(state: CampaoState, teamCount: number) {
  const teams: CampaoTeam[] = Array.from({ length: teamCount }, (_, index) => ({ id: index + 1, name: `Time ${index + 1}`, playerIds: [], starterIds: [], reserveIds: [] }));
  const playerById = new Map(state.players.map((player) => [player.id, player]));
  const seeded = new Set<string>();
  const putStarter = (playerId: string, team: CampaoTeam) => { if (!seeded.has(playerId)) { team.playerIds.push(playerId); team.starterIds!.push(playerId); seeded.add(playerId); } };
  const eliteIds = state.players.some((player) => adultEliteIds.includes(player.id)) ? adultEliteIds : masterEliteIds;
  shuffle(eliteIds.filter((id) => playerById.has(id))).slice(0, teamCount).forEach((id, index) => putStarter(id, teams[index]));
  if (eliteIds === masterEliteIds) seedMasterCenterBackPairs(teams, state.players, playerById, seeded, putStarter);

  (Object.keys(STARTER_COMPOSITION) as Array<Exclude<CampaoPosition, "GOLEIRO">>).forEach((position) => {
    const required = STARTER_COMPOSITION[position];
    const pool = shuffle(state.players.filter((player) => player.position === position && !seeded.has(player.id))).sort((a, b) => strength(b) - strength(a));
    while (pool.length && teams.some((team) => starterPositionCount(team, position, playerById) < required)) {
      const player = pool.shift()!;
      const eligibleTeams = teams.filter((team) => starterPositionCount(team, position, playerById) < required);
      const target = pickLowest(eligibleTeams, (team) => starterStrength(team, playerById) * 100 + starterPositionStrength(team, position, playerById) * 25 + Math.random() * 0.6);
      putStarter(player.id, target);
    }
  });

  const remainingLinePlayers = shuffle(state.players.filter((player) => player.position !== "GOLEIRO" && !seeded.has(player.id))).sort((a, b) => strength(b) - strength(a));
  remainingLinePlayers.forEach((player) => {
    const teamsWithReserveSpace = teams.filter((team) => lineCount(team, playerById) < LINE_PLAYERS_PER_TEAM);
    const target = pickLowest(teamsWithReserveSpace.length ? teamsWithReserveSpace : teams, (team) => squadStrength(team, playerById) * 20 + reserveStrength(team, playerById) * 40 + Math.random() * 0.6);
    target.playerIds.push(player.id); target.reserveIds!.push(player.id); seeded.add(player.id);
  });
  shuffle(state.players.filter((player) => player.position === "GOLEIRO" && !seeded.has(player.id))).forEach((player, index) => { const team = teams[index % teams.length]; team.playerIds.push(player.id); seeded.add(player.id); });
  repairMandatoryRelationships(teams, state, playerById);
  return { ...state, teams };
}

/** Master: uma referência A de zaga por time e a segunda vaga preferencialmente B/C.
 * Isso é intencionalmente diferente do Adulto, cuja distribuição continua genérica. */
function seedMasterCenterBackPairs(teams: CampaoTeam[], players: CampaoPlayer[], playerById: Map<string, CampaoPlayer>, seeded: Set<string>, putStarter: (playerId: string, team: CampaoTeam) => void) {
  const isA = (player: CampaoPlayer) => player.position === "ZAGUEIRO" && player.level === "A";
  const hasAZagueiro = (team: CampaoTeam) => team.starterIds!.some((id) => { const player = playerById.get(id); return player ? isA(player) : false; });
  const referenceA = masterCenterBackIds.map((id) => playerById.get(id)).filter((player): player is CampaoPlayer => Boolean(player) && isA(player!));
  const otherA = players.filter((player) => isA(player) && !masterCenterBackIds.includes(player.id));
  const aPool = shuffle([...referenceA, ...otherA].filter((player) => !seeded.has(player.id)));

  teams.filter((team) => !hasAZagueiro(team)).forEach((team) => {
    const player = aPool.shift();
    if (player) putStarter(player.id, team);
  });

  // Depois de fixar a referência A, compõe a dupla com B/C. As opções mais baixas
  // são colocadas nos times que já ficaram tecnicamente mais fortes, formando pares complementares.
  const companions = players.filter((player) => player.position === "ZAGUEIRO" && (player.level === "B" || player.level === "C") && !seeded.has(player.id)).sort((first, second) => strength(first) - strength(second));
  teams.filter((team) => starterPositionCount(team, "ZAGUEIRO", playerById) < 2).forEach((team) => {
    if (!companions.length) return;
    const strongestTeamWithGap = teams.filter((candidate) => starterPositionCount(candidate, "ZAGUEIRO", playerById) < 2).reduce((strongest, candidate) => starterStrength(candidate, playerById) > starterStrength(strongest, playerById) ? candidate : strongest, team);
    const companion = companions.shift()!;
    putStarter(companion.id, strongestTeamWithGap);
  });
}

function repairMandatoryRelationships(teams: CampaoTeam[], state: CampaoState, playerById: Map<string, CampaoPlayer>) {
  // Para o Campão, todo vínculo cadastrado é obrigatório, independentemente da
  // prioridade histórica registrada no banco.
  const mandatory = state.relationships;
  for (let pass = 0; pass < 4; pass += 1) mandatory.forEach((relationship) => {
    const firstTeam = teams.find((team) => team.playerIds.includes(relationship.playerAId)); const secondTeam = teams.find((team) => team.playerIds.includes(relationship.playerBId));
    if (!firstTeam || !secondTeam || firstTeam === secondTeam) return;
    const target = starterStrength(firstTeam, playerById) <= starterStrength(secondTeam, playerById) ? firstTeam : secondTeam;
    const source = target === firstTeam ? secondTeam : firstTeam; const movingId = target === firstTeam ? relationship.playerBId : relationship.playerAId;
    const movingPlayer = playerById.get(movingId); if (!movingPlayer) return;
    const replacementId = target.playerIds.find((id) => { const player = playerById.get(id); return player && player.position === movingPlayer.position && !isMandatoryMember(id, mandatory); });
    if (!replacementId) return;
    exchange(source, target, movingId, replacementId);
  });
}

function exchange(first: CampaoTeam, second: CampaoTeam, firstId: string, secondId: string) { first.playerIds = first.playerIds.map((id) => id === firstId ? secondId : id); second.playerIds = second.playerIds.map((id) => id === secondId ? firstId : id); [first.starterIds, first.reserveIds, second.starterIds, second.reserveIds].forEach((ids) => { if (ids) { const firstIndex = ids.indexOf(firstId); const secondIndex = ids.indexOf(secondId); if (firstIndex >= 0) ids[firstIndex] = secondId; if (secondIndex >= 0) ids[secondIndex] = firstId; } }); }
function isMandatoryMember(id: string, relationships: CampaoRelationship[]) { return relationships.some((relationship) => relationship.playerAId === id || relationship.playerBId === id); }
function pickLowest<T>(items: T[], value: (item: T) => number) { return items.reduce((best, item) => value(item) < value(best) ? item : best); }
function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function strength(player: CampaoPlayer) { return points[player.level!] || 0; }
function teamRoles(team: CampaoTeam, playerById: Map<string, CampaoPlayer>) {
  const starters = (team.starterIds || []).map((id) => playerById.get(id)).filter(Boolean) as CampaoPlayer[];
  const all = team.playerIds.map((id) => playerById.get(id)).filter(Boolean) as CampaoPlayer[];
  const reserveIds = team.reserveIds || all.filter((player) => player.position !== "GOLEIRO" && !starters.some((starter) => starter.id === player.id)).map((player) => player.id);
  const reserves = reserveIds.map((id) => playerById.get(id)).filter(Boolean) as CampaoPlayer[];
  return { starters: starters.filter((player) => player.position !== "GOLEIRO"), reserves: reserves.filter((player) => player.position !== "GOLEIRO"), goalkeepers: all.filter((player) => player.position === "GOLEIRO"), all };
}
function starterPositionCount(team: CampaoTeam, position: CampaoPosition, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).starters.filter((player) => player.position === position).length; }
function starterPositionStrength(team: CampaoTeam, position: CampaoPosition, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).starters.filter((player) => player.position === position).reduce((total, player) => total + strength(player), 0); }
function starterStrength(team: CampaoTeam, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).starters.reduce((total, player) => total + strength(player), 0); }
function reserveStrength(team: CampaoTeam, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).reserves.reduce((total, player) => total + strength(player), 0); }
function squadStrength(team: CampaoTeam, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).all.reduce((total, player) => total + strength(player), 0); }
function lineCount(team: CampaoTeam, players: Map<string, CampaoPlayer>) { return teamRoles(team, players).all.filter((player) => player.position !== "GOLEIRO").length; }

export function getCampaoTeamStats(state: CampaoState, team: CampaoTeam) {
  const playerById = new Map(state.players.map((player) => [player.id, player])); const roles = teamRoles(team, playerById); const players = roles.all;
  const levelCounts = Object.fromEntries((['A', 'B', 'C', 'D', 'E'] as CampaoLevel[]).map((level) => [level, players.filter((player) => player.level === level).length])) as Record<CampaoLevel, number>;
  const positions = Object.fromEntries((Object.keys(CAMPAO_COMPOSITION) as CampaoPosition[]).map((position) => [position, roles.starters.filter((player) => player.position === position).length])) as Record<CampaoPosition, number>;
  const averageAge = players.length ? players.reduce((total, player) => total + player.age, 0) / players.length : 0;
  const issues = (Object.entries(STARTER_COMPOSITION) as [Exclude<CampaoPosition, "GOLEIRO">, number][]).flatMap(([position, expected]) => positions[position] === expected ? [] : [`${position}: ${positions[position]}/${expected}`]);
  if (roles.starters.length !== 8) issues.push(`${roles.starters.length}/8 titulares`); if (roles.reserves.length < 5) issues.push(`${roles.reserves.length}/5 reservas`);
  const satisfied = state.relationships.filter((relationship) => team.playerIds.includes(relationship.playerAId) && team.playerIds.includes(relationship.playerBId));
  const broken = state.relationships.filter((relationship) => (team.playerIds.includes(relationship.playerAId) ? !team.playerIds.includes(relationship.playerBId) : false));
  return { players, starters: roles.starters, reserves: roles.reserves, goalkeepers: roles.goalkeepers, levelCounts, positions, averageAge, issues, satisfied, broken, starterStrength: roles.starters.reduce((total, player) => total + strength(player), 0), reserveStrength: roles.reserves.reduce((total, player) => total + strength(player), 0) };
}

export function getCampaoBalanceScore(state: CampaoState) {
  if (!state.teams.length) return 0; const stats = state.teams.map((team) => getCampaoTeamStats(state, team)); const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
  const starterTechnicalSpread = spread(stats.map((item) => item.starterStrength)); const reserveTechnicalSpread = spread(stats.map((item) => item.reserveStrength)); const totalTechnicalSpread = spread(stats.map((item) => item.starterStrength + item.reserveStrength)); const ageSpread = spread(stats.map((item) => item.averageAge));
  const missing = stats.reduce((total, item) => total + item.issues.length, 0); const brokenMandatory = stats.reduce((total, item) => total + item.broken.length, 0);
  if (brokenMandatory > 0) return 0;
  return Math.max(0, Math.round(100 - starterTechnicalSpread * 4 - reserveTechnicalSpread * 1.2 - totalTechnicalSpread * 0.8 - ageSpread * 0.7 - missing * 7));
}

export function getCampaoDiagnostics(state: CampaoState) {
  const stats = state.teams.map((team) => ({ team, ...getCampaoTeamStats(state, team) }));
  if (!stats.length) return null;
  const strongest = [...stats].sort((a, b) => b.starterStrength - a.starterStrength)[0]; const weakest = [...stats].sort((a, b) => a.starterStrength - b.starterStrength)[0];
  const ages = stats.map((item) => item.averageAge); const brokenMandatory = stats.flatMap((item) => item.broken);
  return { strongestTeam: strongest.team.name, weakestTeam: weakest.team.name, technicalDifference: strongest.starterStrength - weakest.starterStrength, highestAverageAge: Math.max(...ages), lowestAverageAge: Math.min(...ages), ageDifference: Math.max(...ages) - Math.min(...ages), brokenMandatory: brokenMandatory.length, missingPositions: stats.flatMap((item) => item.issues.map((issue) => `${item.team.name}: ${issue}`)) };
}

export function moveCampaoPlayer(state: CampaoState, playerId: string, destinationTeamId: number | null) { return { ...state, teams: state.teams.map((team) => ({ ...team, playerIds: (team.id === destinationTeamId ? [...team.playerIds, playerId] : team.playerIds).filter((id, index, array) => id !== playerId || (team.id === destinationTeamId && index === array.lastIndexOf(playerId))) })) }; }
