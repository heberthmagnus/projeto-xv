import { connection } from "next/server";
import { PageContainer } from "@/components/ui/PageContainer";
import { prisma } from "@/lib/prisma";
import { CampaoPublicDashboard } from "./public-dashboard";

export const dynamic = "force-dynamic";

export default async function InternoCampaoPublicPage() {
  await connection();
  const championship = await prisma.championship.findUniqueOrThrow({
    where: { slug: "interno-campao-2026" },
    select: {
      teams: { orderBy: { displayOrder: "asc" }, select: { groupLabel: true, displayOrder: true, team: { select: { id: true, name: true, shortName: true, slug: true, icon: true, players: { where: { championship: { slug: "interno-campao-2026" } }, orderBy: { rosterOrder: "asc" }, select: { registration: { select: { fullName: true, nickname: true } } } } } } } },
      matches: { orderBy: [{ round: "asc" }, { scheduledAt: "asc" }], select: { round: true, roundNumber: true, scheduledAt: true, status: true, homeScore: true, awayScore: true, participations: { where: { OR: [{ goals: { gt: 0 } }, { yellowCards: { gt: 0 } }, { redCards: { gt: 0 } }] }, select: { goals: true, yellowCards: true, redCards: true, player: { select: { fullName: true } }, team: { select: { shortName: true, name: true } } } }, events: { where: { type: "CARTAO_AZUL" }, select: { player: true, quantity: true, team: { select: { shortName: true, name: true } } } }, homeTeam: { select: { id: true, shortName: true, name: true, slug: true, icon: true } }, awayTeam: { select: { id: true, shortName: true, name: true, slug: true, icon: true } } } },
    },
  });
  const categoryByTeamId = new Map(championship.teams.map((entry) => [entry.team.id, entry.groupLabel === "MASTER" ? "MASTER" : "ADULTO"] as const));
  return <main className="xv-page-shell-soft" style={{ padding: "12px 0 24px" }}><PageContainer><CampaoPublicDashboard teams={championship.teams.map((entry) => ({ category: entry.groupLabel === "MASTER" ? "MASTER" : "ADULTO", order: entry.displayOrder ?? 0, name: entry.team.shortName || entry.team.name, slug: entry.team.slug, icon: entry.team.icon, players: entry.team.players.map((player) => player.registration.nickname || player.registration.fullName) }))} matches={championship.matches.map((match) => ({ category: categoryByTeamId.get(match.homeTeam.id) ?? "ADULTO", round: match.round, order: match.roundNumber ?? 0, scheduledAt: match.scheduledAt?.toISOString() ?? null, status: match.status, homeScore: match.homeScore, awayScore: match.awayScore, home: match.homeTeam.shortName || match.homeTeam.name, homeSlug: match.homeTeam.slug, homeIcon: match.homeTeam.icon, away: match.awayTeam.shortName || match.awayTeam.name, awaySlug: match.awayTeam.slug, awayIcon: match.awayTeam.icon, scorers: match.participations.filter((item) => item.goals > 0).map((item) => ({ name: item.player.fullName, team: item.team.shortName || item.team.name, quantity: item.goals })), cards: [...match.participations.flatMap((item) => [{ name: item.player.fullName, team: item.team.shortName || item.team.name, quantity: item.yellowCards, type: "AMARELO" as const }, { name: item.player.fullName, team: item.team.shortName || item.team.name, quantity: item.redCards, type: "VERMELHO" as const }]).filter((item) => item.quantity > 0), ...match.events.map((item) => ({ name: item.player, team: item.team?.shortName || item.team?.name || "", quantity: item.quantity, type: "AZUL" as const }))] }))} /></PageContainer></main>;
}
