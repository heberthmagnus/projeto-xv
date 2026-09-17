import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";
import { MatchResultsManager, type AdminMatch } from "./match-results-manager";

export default async function JogosInternoAdminPage() {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const [championshipTeams, matches] = await Promise.all([
    prisma.championshipTeam.findMany({ where: { championshipId: championship.id }, select: { teamId: true, groupLabel: true } }),
    prisma.match.findMany({
      where: { championshipId: championship.id }, orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
      include: {
        events: { where: { type: { in: ["GOL", "CARTAO_AMARELO", "CARTAO_AZUL", "CARTAO_VERMELHO"] } } },
        participations: true,
        homeTeam: { include: { players: { where: { championshipId: championship.id }, include: { registration: true }, orderBy: { registration: { fullName: "asc" } } } } },
        awayTeam: { include: { players: { where: { championshipId: championship.id }, include: { registration: true }, orderBy: { registration: { fullName: "asc" } } } } },
      },
    }),
  ]);
  const categories = new Map(championshipTeams.map((team) => [team.teamId, team.groupLabel === "MASTER" ? "MASTER" : "ADULTO"] as const));
  const data: AdminMatch[] = matches.map((match) => ({
    id: match.id, category: categories.get(match.homeTeamId) ?? "ADULTO", round: match.round, scheduledAt: match.scheduledAt?.toISOString() ?? null,
    homeScore: match.homeScore, awayScore: match.awayScore, status: match.status, matchReport: match.matchReport,
    events: match.events.map((event) => ({ player: event.player, playerId: event.playerId, teamId: event.teamId, type: event.type as "GOL" | "CARTAO_AMARELO" | "CARTAO_AZUL" | "CARTAO_VERMELHO", quantity: event.quantity })),
    participations: match.participations.map((item) => ({ playerId: item.playerId, teamId: item.teamId, goals: item.goals, yellowCards: item.yellowCards, redCards: item.redCards })),
    homeTeam: mapTeam(match.homeTeam), awayTeam: mapTeam(match.awayTeam),
  }));
  return <main className="min-w-0"><MatchResultsManager matches={data}/></main>;
}

type TeamWithPlayers = Prisma.TeamGetPayload<{ include: { players: { include: { registration: true } } } }>;

function mapTeam(team: TeamWithPlayers) {
  return {
    id: team.id, name: team.name, shortName: team.shortName, icon: team.icon,
    players: team.players.map((player) => ({ id: player.id, profileId: player.registration.athleteProfileId, name: getPreferredPlayerName(player.registration.nickname, player.registration.fullName) })),
  };
}
