import { connection } from "next/server";
import { PageContainer } from "@/components/ui/PageContainer";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";
import { CampaoPublicDashboard } from "./public-dashboard";

export const dynamic = "force-dynamic";

export default async function InternoCampaoPublicPage() {
  await connection();
  const championship = await prisma.championship.findUniqueOrThrow({
    where: { slug: "interno-campao-2026" },
    select: {
      teams: { orderBy: { displayOrder: "asc" }, select: { groupLabel: true, displayOrder: true, shirtImageUrl: true, sponsors: { where: { isPrimary: true }, take: 1, select: { sponsor: { select: { name: true, logoUrl: true } } } }, team: { select: { id: true, name: true, shortName: true, slug: true, icon: true, players: { where: { championship: { slug: "interno-campao-2026" } }, orderBy: { rosterOrder: "asc" }, select: { registration: { select: { fullName: true, nickname: true, athleteProfileId: true } } } } } } } },
      suspensions: { where: { status: "ATIVA" }, select: { playerId: true, reason: true, player: { select: { fullName: true, nickname: true } }, team: { select: { id: true, shortName: true, name: true, icon: true } } } },
      matches: { orderBy: [{ round: "asc" }, { scheduledAt: "asc" }], select: { id: true, round: true, roundNumber: true, scheduledAt: true, status: true, homeScore: true, awayScore: true, stage: { select: { order: true, stageType: true, name: true } }, participations: { where: { OR: [{ goals: { gt: 0 } }, { yellowCards: { gt: 0 } }, { redCards: { gt: 0 } }] }, select: { goals: true, yellowCards: true, redCards: true, player: { select: { id: true, fullName: true, nickname: true } }, team: { select: { id: true, shortName: true, name: true, icon: true } } } }, events: { where: { type: "CARTAO_AZUL" }, select: { player: true, playerId: true, quantity: true, athlete: { select: { fullName: true, nickname: true } }, team: { select: { id: true, shortName: true, name: true, icon: true } } } }, homeTeam: { select: { id: true, shortName: true, name: true, slug: true, icon: true } }, awayTeam: { select: { id: true, shortName: true, name: true, slug: true, icon: true } } } },
    },
  });
  const categoryByTeamId = new Map(championship.teams.map((entry) => [entry.team.id, entry.groupLabel === "MASTER" ? "MASTER" : "ADULTO"] as const));
  const profileIdByTeamAndName = new Map<string, string>();
  const playerNameByTeamAndProfile = new Map<string, string>();
  for (const entry of championship.teams) {
    for (const player of entry.team.players) {
      const profileId = player.registration.athleteProfileId;
      if (!profileId) continue;
      playerNameByTeamAndProfile.set(`${entry.team.id}:${profileId}`, getPreferredPlayerName(player.registration.nickname, player.registration.fullName));
      for (const name of [player.registration.fullName, player.registration.nickname]) {
        if (name?.trim()) profileIdByTeamAndName.set(`${entry.team.id}:${normalizePlayerName(name)}`, profileId);
      }
    }
  }
  const teams = championship.teams.map((entry) => ({
    category: (entry.groupLabel === "MASTER" ? "MASTER" : "ADULTO") as "MASTER" | "ADULTO",
    order: entry.displayOrder ?? 0,
    name: entry.team.shortName || entry.team.name,
    slug: entry.team.slug,
    icon: entry.team.icon,
    shirtImageUrl: entry.shirtImageUrl,
    sponsor: entry.sponsors[0]?.sponsor ?? null,
    players: entry.team.players.map((player) => getPreferredPlayerName(player.registration.nickname, player.registration.fullName)),
  }));
  const matches = championship.matches.map((match) => {
    const matchLabel = `Rodada ${match.round} · ${match.homeTeam.shortName || match.homeTeam.name} ${match.homeScore ?? "–"} × ${match.awayScore ?? "–"} ${match.awayTeam.shortName || match.awayTeam.name}`;
    return {
      id: match.id,
      category: (categoryByTeamId.get(match.homeTeam.id) ?? "ADULTO") as "MASTER" | "ADULTO",
      round: match.round,
      order: match.roundNumber ?? 0,
      stage: match.stage,
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      home: match.homeTeam.shortName || match.homeTeam.name,
      homeSlug: match.homeTeam.slug,
      homeIcon: match.homeTeam.icon,
      away: match.awayTeam.shortName || match.awayTeam.name,
      awaySlug: match.awayTeam.slug,
      awayIcon: match.awayTeam.icon,
      scorers: match.participations.filter((item) => item.goals > 0).map((item) => ({ name: getPreferredPlayerName(item.player.nickname, item.player.fullName), team: item.team.shortName || item.team.name, icon: item.team.icon, quantity: item.goals })),
      cards: [
        ...match.participations.flatMap((item) => [
          { playerId: item.player.id, name: playerNameByTeamAndProfile.get(`${item.team.id}:${item.player.id}`) ?? getPreferredPlayerName(item.player.nickname, item.player.fullName), teamId: item.team.id, team: item.team.shortName || item.team.name, teamIcon: item.team.icon, quantity: item.yellowCards, type: "AMARELO" as const, matchId: match.id, matchLabel, round: match.round, stage: match.stage },
          { playerId: item.player.id, name: playerNameByTeamAndProfile.get(`${item.team.id}:${item.player.id}`) ?? getPreferredPlayerName(item.player.nickname, item.player.fullName), teamId: item.team.id, team: item.team.shortName || item.team.name, teamIcon: item.team.icon, quantity: item.redCards, type: "VERMELHO" as const, matchId: match.id, matchLabel, round: match.round, stage: match.stage },
        ]).filter((item) => item.quantity > 0),
        ...match.events.map((item) => { const playerId = item.playerId ?? (item.team ? profileIdByTeamAndName.get(`${item.team.id}:${normalizePlayerName(item.player)}`) ?? null : null); return { playerId, name: item.team && playerId ? playerNameByTeamAndProfile.get(`${item.team.id}:${playerId}`) ?? item.player : item.player, teamId: item.team?.id ?? null, team: item.team?.shortName || item.team?.name || "", teamIcon: item.team?.icon ?? null, quantity: item.quantity, type: "AZUL" as const, matchId: match.id, matchLabel, round: match.round, stage: match.stage }; }),
      ],
    };
  });
  const now = new Date();
  const nextGameByTeamId = new Map<string, string>();
  for (const match of championship.matches) {
    if (!match.scheduledAt || match.scheduledAt < now || ["FINALIZADO", "CANCELADO"].includes(match.status)) continue;
    const label = `Rodada ${match.round} · ${match.homeTeam.shortName || match.homeTeam.name} × ${match.awayTeam.shortName || match.awayTeam.name} · ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(match.scheduledAt)}`;
    for (const teamId of [match.homeTeam.id, match.awayTeam.id]) if (!nextGameByTeamId.has(teamId)) nextGameByTeamId.set(teamId, label);
  }
  const suspensions = Array.from(new Map(championship.suspensions.flatMap((item) => {
    const nextGame = nextGameByTeamId.get(item.team.id);
    return nextGame ? [[`${item.playerId}:${item.team.id}`, { playerId: item.playerId, name: getPreferredPlayerName(item.player.nickname, item.player.fullName), reason: item.reason, team: item.team.shortName || item.team.name, icon: item.team.icon, nextGame, category: categoryByTeamId.get(item.team.id) ?? "ADULTO" }] as const] : [];
  })).values());
  return <main className="xv-page-shell-soft" style={{ padding: "12px 0 24px" }}><PageContainer><CampaoPublicDashboard teams={teams} matches={matches} suspensions={suspensions} /></PageContainer></main>;
}

function normalizePlayerName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}
