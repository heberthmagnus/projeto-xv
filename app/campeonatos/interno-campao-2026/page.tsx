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
      teams: { orderBy: { displayOrder: "asc" }, select: { groupLabel: true, displayOrder: true, team: { select: { name: true, shortName: true, slug: true, icon: true, players: { where: { championship: { slug: "interno-campao-2026" } }, orderBy: { rosterOrder: "asc" }, select: { registration: { select: { fullName: true, nickname: true } } } } } } } },
      matches: { orderBy: [{ round: "asc" }, { scheduledAt: "asc" }], select: { round: true, roundNumber: true, scheduledAt: true, notes: true, homeTeam: { select: { shortName: true, name: true, slug: true, icon: true } }, awayTeam: { select: { shortName: true, name: true, slug: true, icon: true } } } },
    },
  });
  return <main className="xv-page-shell-soft" style={{ padding: "12px 0 24px" }}><PageContainer><CampaoPublicDashboard teams={championship.teams.map((entry) => ({ category: entry.groupLabel === "MASTER" ? "MASTER" : "ADULTO", order: entry.displayOrder ?? 0, name: entry.team.shortName || entry.team.name, slug: entry.team.slug, icon: entry.team.icon, players: entry.team.players.map((player) => player.registration.nickname || player.registration.fullName) }))} matches={championship.matches.map((match) => ({ category: match.notes?.includes("MASTER") ? "MASTER" : "ADULTO", round: match.round, order: match.roundNumber ?? 0, scheduledAt: match.scheduledAt?.toISOString() ?? null, home: match.homeTeam.shortName || match.homeTeam.name, homeSlug: match.homeTeam.slug, homeIcon: match.homeTeam.icon, away: match.awayTeam.shortName || match.awayTeam.name, awaySlug: match.awayTeam.slug, awayIcon: match.awayTeam.icon }))} /></PageContainer></main>;
}
