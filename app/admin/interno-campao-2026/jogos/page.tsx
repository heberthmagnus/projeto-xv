import { requirePermission, userHasPermission } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";
import { getDefaultRoundsByCategory } from "@/lib/championship-rounds";
import { MatchResultsManager, type AdminMatch } from "./match-results-manager";
import { saveMatchResult } from "./actions";

export default async function JogosInternoAdminPage() {
  const user = await requirePermission("match.result.manage");
  const canManageSports = userHasPermission(user, "sports.manage");
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
  if (!canManageSports) return <main className="min-w-0"><SecretaryResults matches={data}/></main>;
  return <main className="min-w-0"><MatchResultsManager matches={data} initialRounds={getDefaultRoundsByCategory(data)}/></main>;
}

function SecretaryResults({ matches }: { matches: AdminMatch[] }) {
  const categories: Array<AdminMatch["category"]> = ["ADULTO", "MASTER"];
  return <div className="space-y-5"><section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#B89020]">Campeonato Interno 2026</p><h1 className="mt-1 text-2xl font-black">Lançar resultados</h1><p className="mt-2 text-sm text-[#6B7280]">Registre somente o placar oficial. A súmula, escalação, eventos e agenda permanecem sob gestão da diretoria.</p></section>{categories.map((category) => <section key={category} className="xv-card"><h2 className="text-xl font-black">{category === "ADULTO" ? "Adulto" : "Master"}</h2><div className="mt-4 grid gap-3">{matches.filter((match) => match.category === category).map((match) => <form key={match.id} action={saveMatchResult} className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-center"><input type="hidden" name="matchId" value={match.id}/><div><p className="text-xs font-bold uppercase tracking-wide text-[#8B6914]">Rodada {match.round}</p><p className="mt-1 font-black">{match.homeTeam.name}</p></div><div className="flex items-center gap-2"><input aria-label={`Gols de ${match.homeTeam.name}`} name="homeScore" type="number" min="0" max="999" required defaultValue={match.homeScore ?? ""} className="w-16 rounded-xl border border-[#D4D4D8] bg-white px-2 py-2 text-center text-xl font-black"/><span className="font-black text-[#8B6914]">×</span><input aria-label={`Gols de ${match.awayTeam.name}`} name="awayScore" type="number" min="0" max="999" required defaultValue={match.awayScore ?? ""} className="w-16 rounded-xl border border-[#D4D4D8] bg-white px-2 py-2 text-center text-xl font-black"/></div><p className="font-black sm:text-right">{match.awayTeam.name}</p><button className="rounded-xl bg-[#B89020] px-4 py-2.5 text-sm font-bold text-white">Salvar placar</button></form>)}</div></section>)}</div>;
}

type TeamWithPlayers = Prisma.TeamGetPayload<{ include: { players: { include: { registration: true } } } }>;

function mapTeam(team: TeamWithPlayers) {
  return {
    id: team.id, name: team.name, shortName: team.shortName, icon: team.icon,
    players: team.players.map((player) => ({ id: player.id, profileId: player.registration.athleteProfileId, name: getPreferredPlayerName(player.registration.nickname, player.registration.fullName) })),
  };
}
