export type CampaoCategory = "ADULTO" | "MASTER";
export type CampaoPosition = "GOLEIRO" | "ZAGUEIRO" | "LATERAL" | "VOLANTE" | "MEIA" | "ATACANTE";
export type CampaoLevel = "A" | "B" | "C" | "D" | "E";
export type CampaoPlayer = { id: string; fullName: string; age: number; phone: string; position: CampaoPosition; level: CampaoLevel | null; adminNotes?: string | null };
export type CampaoRelationship = { id: string; playerAId: string; playerBId: string; relationshipType: string; priorityWeight: number; notes?: string | null };
export type CampaoTeam = { id: number; name: string; playerIds: string[] };
export type CampaoState = { players: CampaoPlayer[]; relationships: CampaoRelationship[]; teams: CampaoTeam[] };

export const LINE_PLAYERS_PER_TEAM = 13;
export const CAMPAO_COMPOSITION: Record<CampaoPosition, number> = { GOLEIRO: 1, ZAGUEIRO: 2, LATERAL: 3, VOLANTE: 2, MEIA: 3, ATACANTE: 3 };
const points: Record<CampaoLevel, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };

export function generateCampaoTeams(state: CampaoState, teamCount: number) {
  if (state.players.some((player) => !player.level)) {
    throw new Error("Todos os jogadores precisam ter nível definido antes do sorteio.");
  }
  const teams: CampaoTeam[] = Array.from({ length: teamCount }, (_, index) => ({ id: index + 1, name: `Time ${index + 1}`, playerIds: [] }));
  const playerMap = new Map(state.players.map((p) => [p.id, p]));
  const mandatory = state.relationships.filter((r) => r.priorityWeight === 3);
  const units = mandatory.reduce<string[][]>((acc, relation) => {
    const unit = acc.find((u) => u.includes(relation.playerAId) || u.includes(relation.playerBId));
    if (unit) unit.push(...[relation.playerAId, relation.playerBId].filter((id) => !unit.includes(id)));
    else acc.push([relation.playerAId, relation.playerBId]);
    return acc;
  }, [] as string[][]);
  const linked = new Set(units.flat());
  [...units, ...state.players.filter((p) => !linked.has(p.id)).map((p) => [p.id])]
    .sort((a, b) => b.reduce((s, id) => s + points[playerMap.get(id)!.level!], 0) - a.reduce((s, id) => s + points[playerMap.get(id)!.level!], 0))
    .forEach((unit) => {
      const target = [...teams].sort((a, b) => placementCost(a, unit, playerMap) - placementCost(b, unit, playerMap))[0];
      target.playerIds.push(...unit);
    });
  return { ...state, teams };
}

function placementCost(team: CampaoTeam, ids: string[], players: Map<string, CampaoPlayer>) {
  const roster = [...team.playerIds, ...ids].map((id) => players.get(id)!);
  const score = roster.reduce((sum, p) => sum + points[p.level!], 0);
  const age = roster.reduce((sum, p) => sum + p.age, 0) / roster.length;
  const linePlayers = roster.filter((player) => player.position !== "GOLEIRO");
  const overflow = Math.max(0, linePlayers.length - LINE_PLAYERS_PER_TEAM) * 50;
  const positionPenalty = (Object.entries(CAMPAO_COMPOSITION) as [CampaoPosition, number][]).reduce((sum, [position, expected]) => sum + Math.max(0, roster.filter((p) => p.position === position).length - expected) * 8, 0);
  return score * 3 + age + overflow + positionPenalty;
}

export function getCampaoTeamStats(state: CampaoState, team: CampaoTeam) {
  const players = team.playerIds.map((id) => state.players.find((p) => p.id === id)!).filter(Boolean);
  const levelCounts = Object.fromEntries((["A", "B", "C", "D", "E"] as CampaoLevel[]).map((level) => [level, players.filter((p) => p.level === level).length]));
  const positions = Object.fromEntries((Object.keys(CAMPAO_COMPOSITION) as CampaoPosition[]).map((position) => [position, players.filter((p) => p.position === position).length]));
  const averageAge = players.length ? players.reduce((sum, p) => sum + p.age, 0) / players.length : 0;
  const issues = Object.entries(CAMPAO_COMPOSITION).flatMap(([position, expected]) => positions[position as CampaoPosition] === expected ? [] : [`${position}: ${positions[position as CampaoPosition]}/${expected}`]);
  const linePlayers = players.filter((player) => player.position !== "GOLEIRO");
  if (linePlayers.length !== LINE_PLAYERS_PER_TEAM) issues.push(`${linePlayers.length}/${LINE_PLAYERS_PER_TEAM} jogadores de linha`);
  const satisfied = state.relationships.filter((r) => team.playerIds.includes(r.playerAId) && team.playerIds.includes(r.playerBId));
  const broken = state.relationships.filter((r) => (team.playerIds.includes(r.playerAId) ? !team.playerIds.includes(r.playerBId) : false));
  return { players, levelCounts, positions, averageAge, issues, satisfied, broken };
}

export function getCampaoBalanceScore(state: CampaoState) {
  if (!state.teams.length) return 0;
  const stats = state.teams.map((team) => getCampaoTeamStats(state, team));
  const ages = stats.map((s) => s.averageAge).filter(Boolean);
  const skillTotals = stats.map((s) => Object.entries(s.levelCounts).reduce((sum, [level, count]) => sum + points[level as CampaoLevel] * Number(count), 0));
  const ageSpread = ages.length ? Math.max(...ages) - Math.min(...ages) : 0;
  const skillSpread = Math.max(...skillTotals) - Math.min(...skillTotals);
  const compositionPenalty = stats.reduce((sum, s) => sum + s.issues.length, 0);
  const brokenPenalty = stats.reduce((sum, s) => sum + s.broken.reduce((total, r) => total + r.priorityWeight * 3, 0), 0);
  return Math.max(0, Math.round(100 - ageSpread * 2 - skillSpread * 2 - compositionPenalty * 2 - brokenPenalty));
}

export function moveCampaoPlayer(state: CampaoState, playerId: string, destinationTeamId: number | null) {
  return { ...state, teams: state.teams.map((team) => ({ ...team, playerIds: (team.id === destinationTeamId ? [...team.playerIds, playerId] : team.playerIds).filter((id, index, array) => id !== playerId || (team.id === destinationTeamId && index === array.lastIndexOf(playerId))) })) };
}
