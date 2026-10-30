import { notFound } from "next/navigation";
import { requireSportsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MatchSheet } from "./match-sheet";

export default async function InterclubesSheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSportsAdmin();
  const { id } = await params;
  const fixture = await prisma.interclubesFixture.findUnique({ where: { id }, include: { permanentTeam: { include: { memberships: { where: { leftAt: null }, include: { athleteProfile: { select: { id: true, fullName: true, nickname: true } } } } } }, players: { include: { athlete: { select: { id: true, fullName: true, nickname: true } } } } } });
  if (!fixture) notFound();
  const saved = new Map(fixture.players.map(p => [p.athleteId,p]));
  const profiles = new Map([...fixture.permanentTeam.memberships.map(m => [m.athleteProfile.id,m.athleteProfile] as const), ...fixture.players.map(p => [p.athlete.id,p.athlete] as const)]);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(fixture.scheduledAt);
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === key)?.value ?? "";
  const players = [...profiles.values()].sort((a,b) => a.fullName.localeCompare(b.fullName)).map(profile => { const line = saved.get(profile.id); return { id: profile.id, name: profile.nickname ? `${profile.fullName} (${profile.nickname})` : profile.fullName, played: line?.played ?? false, starter: line?.starter ?? false, goals: line?.goals ?? 0, yellowCards: line?.yellowCards ?? 0, blueCards: line?.blueCards ?? 0, redCards: line?.redCards ?? 0 }; });
  return <MatchSheet fixture={{ id, back: `/admin/interclubes?time=${fixture.permanentTeam.category}&secao=jogos`, team: fixture.permanentTeam.name, opponent: fixture.opponentName, type: fixture.type === "AMISTOSO" ? "Amistoso" : "Interclubes", date: `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`, notes: fixture.notes ?? "", clubScore: fixture.clubScore, opponentScore: fixture.opponentScore, players }}/>
}
