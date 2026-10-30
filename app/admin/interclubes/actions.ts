"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InterclubesFixtureType, MatchStatus } from "@prisma/client";
import { requireSportsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminPath = "/admin/interclubes";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function setInterclubesActivity(formData: FormData) {
  const actor = await requireSportsAdmin();
  const teamId = value(formData, "teamId");
  const active = value(formData, "active") === "true";
  if (!teamId) throw new Error("Time permanente inválido.");
  const before = await prisma.permanentTeam.findUnique({ where: { id: teamId }, select: { activeForInterclubes: true } });
  if (!before) throw new Error("Time permanente não encontrado.");
  if (before.activeForInterclubes !== active) await prisma.$transaction([
    prisma.permanentTeam.update({ where: { id: teamId }, data: { activeForInterclubes: active } }),
    prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.team.activity", target: `PermanentTeam:${teamId}`, previous: before, next: { activeForInterclubes: active } } }),
  ]);
  revalidatePath(adminPath);
  revalidatePath("/interclubes");
}

export async function assignPermanentTeamAthlete(formData: FormData) {
  const actor = await requireSportsAdmin();
  const permanentTeamId = value(formData, "permanentTeamId");
  const athleteProfileId = value(formData, "athleteProfileId");
  const notes = value(formData, "notes") || null;
  if (!permanentTeamId || !athleteProfileId) throw new Error("Selecione o time e o atleta.");
  await prisma.$transaction(async (tx) => {
    const [team, athlete, current] = await Promise.all([
      tx.permanentTeam.findUnique({ where: { id: permanentTeamId }, select: { id: true, name: true } }),
      tx.athleteProfile.findUnique({ where: { id: athleteProfileId }, select: { id: true, fullName: true } }),
      tx.permanentTeamMembership.findFirst({ where: { athleteProfileId, leftAt: null }, select: { id: true, permanentTeamId: true, permanentTeam: { select: { name: true } } } }),
    ]);
    if (!team || !athlete) throw new Error("Time ou atleta não encontrado.");
    if (current?.permanentTeamId === permanentTeamId) throw new Error("Este atleta já está neste time permanente.");
    const now = new Date();
    if (current) await tx.permanentTeamMembership.update({ where: { id: current.id }, data: { leftAt: now } });
    const membership = await tx.permanentTeamMembership.create({ data: { permanentTeamId, athleteProfileId, notes, joinedAt: now } });
    await tx.administrativeAudit.create({ data: { actorId: actor.id, action: current ? "interclubes.player.transfer" : "interclubes.player.assign", target: `PermanentTeamMembership:${membership.id}`, previous: current ? { permanentTeamId: current.permanentTeamId, teamName: current.permanentTeam.name } : undefined, next: { permanentTeamId, teamName: team.name, athleteProfileId, athleteName: athlete.fullName, notes } } });
  });
  revalidatePath(adminPath);
  revalidatePath("/interclubes");
}

export async function removePermanentTeamAthlete(formData: FormData) {
  const actor = await requireSportsAdmin();
  const membershipId = value(formData, "membershipId");
  if (!membershipId) throw new Error("Vínculo inválido.");
  const membership = await prisma.permanentTeamMembership.findFirst({ where: { id: membershipId, leftAt: null }, select: { id: true, athleteProfileId: true, permanentTeamId: true, athleteProfile: { select: { fullName: true } }, permanentTeam: { select: { name: true } } } });
  if (!membership) throw new Error("Este vínculo já foi encerrado.");
  const leftAt = new Date();
  await prisma.$transaction([
    prisma.permanentTeamMembership.update({ where: { id: membershipId }, data: { leftAt } }),
    prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.player.remove", target: `PermanentTeamMembership:${membershipId}`, previous: { permanentTeamId: membership.permanentTeamId, teamName: membership.permanentTeam.name, athleteProfileId: membership.athleteProfileId, athleteName: membership.athleteProfile.fullName }, next: { leftAt: leftAt.toISOString() } } }),
  ]);
  revalidatePath(adminPath);
  revalidatePath("/interclubes");
}

export async function createInterclubesFixture(formData: FormData) {
  const actor = await requireSportsAdmin();
  const permanentTeamId = value(formData, "permanentTeamId");
  const opponentName = value(formData, "opponentName");
  const type = value(formData, "type") as InterclubesFixtureType;
  const rawScheduledAt = value(formData, "scheduledAt");
  const scheduledAt = rawScheduledAt ? new Date(`${rawScheduledAt}:00-03:00`) : null;
  if (!permanentTeamId || !opponentName || !Object.values(InterclubesFixtureType).includes(type) || !scheduledAt || Number.isNaN(scheduledAt.getTime())) throw new Error("Informe time, adversário, tipo e data válidos.");
  const team = await prisma.permanentTeam.findUnique({ where: { id: permanentTeamId }, select: { id: true, name: true } });
  if (!team) throw new Error("Time permanente não encontrado.");
  const fixture = await prisma.interclubesFixture.create({ data: { permanentTeamId, opponentName, type, scheduledAt, location: value(formData, "location") || null, notes: value(formData, "notes") || null, homeGame: value(formData, "homeGame") === "home" } });
  await prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.fixture.create", target: `InterclubesFixture:${fixture.id}`, next: { teamName: team.name, opponentName, type, scheduledAt: scheduledAt.toISOString() } } });
  revalidatePath(adminPath);
  revalidatePath("/interclubes");
  redirect(`/admin/interclubes/jogos/${fixture.id}`);
}

export async function saveInterclubesFixtureResult(formData: FormData) {
  const actor = await requireSportsAdmin();
  const id = value(formData, "id");
  const clubRaw = value(formData, "clubScore");
  const opponentRaw = value(formData, "opponentScore");
  const clubScore = Number(clubRaw); const opponentScore = Number(opponentRaw);
  if (!id || !/^\d+$/.test(clubRaw) || !/^\d+$/.test(opponentRaw) || clubScore > 999 || opponentScore > 999) throw new Error("Informe placares válidos.");
  const before = await prisma.interclubesFixture.findUnique({ where: { id }, select: { clubScore: true, opponentScore: true, status: true } });
  if (!before) throw new Error("Jogo não encontrado.");
  await prisma.$transaction([
    prisma.interclubesFixture.update({ where: { id }, data: { clubScore, opponentScore, status: MatchStatus.FINALIZADO } }),
    prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.fixture.result", target: `InterclubesFixture:${id}`, previous: before, next: { clubScore, opponentScore, status: MatchStatus.FINALIZADO } } }),
  ]);
  revalidatePath(adminPath);
  revalidatePath("/interclubes");
}

function count(formData: FormData, key: string) { const raw = value(formData, key); const number = Number(raw || 0); if (!Number.isSafeInteger(number) || number < 0 || number > 99) throw new Error("Estatística inválida."); return number; }

export async function saveInterclubesFixtureSheet(formData: FormData) {
  const actor = await requireSportsAdmin();
  const fixtureId = value(formData, "fixtureId");
  const athleteIds = [...new Set(formData.getAll("athleteId").map(String).filter(Boolean))];
  if (!fixtureId || !athleteIds.length) throw new Error("Súmula inválida.");
  await prisma.$transaction(async (tx) => {
    const fixture = await tx.interclubesFixture.findUnique({ where: { id: fixtureId }, select: { id: true, permanentTeamId: true, clubScore: true } });
    if (!fixture) throw new Error("Jogo não encontrado.");
    const eligible = await tx.permanentTeamMembership.findMany({ where: { permanentTeamId: fixture.permanentTeamId, athleteProfileId: { in: athleteIds } }, select: { athleteProfileId: true } });
    if (eligible.length !== athleteIds.length) throw new Error("Um atleta não pertence ao histórico deste time.");
    const lines = athleteIds.map((athleteId) => ({ athleteId, played: formData.get(`played:${athleteId}`) === "on", starter: formData.get(`starter:${athleteId}`) === "on", goals: count(formData, `goals:${athleteId}`), yellowCards: count(formData, `yellow:${athleteId}`), blueCards: count(formData, `blue:${athleteId}`), redCards: count(formData, `red:${athleteId}`) }));
    if (lines.some((line) => line.starter && !line.played)) throw new Error("Todo titular precisa estar marcado como participante.");
    if (fixture.clubScore !== null && lines.reduce((total, line) => total + line.goals, 0) !== fixture.clubScore) throw new Error("Os gols do XV precisam somar o placar final.");
    await tx.interclubesFixturePlayer.deleteMany({ where: { fixtureId } });
    await tx.interclubesFixturePlayer.createMany({ data: lines.filter((line) => line.played || line.goals || line.yellowCards || line.blueCards || line.redCards).map((line) => ({ ...line, fixtureId })) });
    await tx.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.fixture.sheet", target: `InterclubesFixture:${fixtureId}`, next: { participants: lines.filter((line) => line.played).length, starters: lines.filter((line) => line.starter).length } } });
  });
  revalidatePath(adminPath);
}

export type InterclubesSheetState = { error?: string; success?: string };

export async function saveInterclubesCompleteSheet(_: InterclubesSheetState, data: FormData): Promise<InterclubesSheetState> {
  try {
    const actor = await requireSportsAdmin();
    const id = value(data, "fixtureId");
    const clubRaw = value(data, "clubScore"), opponentRaw = value(data, "opponentScore");
    const rawDate = value(data, "scheduledAt");
    const date = new Date(`${rawDate}:00-03:00`);
    if (!id || !/^\d+$/.test(clubRaw) || !/^\d+$/.test(opponentRaw) || Number(clubRaw) > 999 || Number(opponentRaw) > 999 || !rawDate || Number.isNaN(date.getTime())) throw new Error("Informe o placar e a data válidos.");
    const ids = data.getAll("athleteId").map(String);
    if (new Set(ids).size !== ids.length) throw new Error("Atleta duplicado na súmula.");
    const lines = ids.map(athleteId => ({ athleteId, played: data.get(`played:${athleteId}`) === "on", starter: data.get(`starter:${athleteId}`) === "on", goals: count(data, `goals:${athleteId}`), yellowCards: count(data, `yellow:${athleteId}`), blueCards: count(data, `blue:${athleteId}`), redCards: count(data, `red:${athleteId}`) }));
    if (lines.some(l => (!l.played && (l.starter || l.goals || l.yellowCards || l.blueCards || l.redCards)))) throw new Error("Marque como participante o atleta que for titular ou tiver gols ou cartões.");
    await prisma.$transaction(async tx => {
      const fixture = await tx.interclubesFixture.findUnique({ where: { id }, select: { permanentTeamId: true, clubScore: true, opponentScore: true, status: true } });
      if (!fixture) throw new Error("Jogo não encontrado.");
      const eligible = await tx.permanentTeamMembership.findMany({ where: { permanentTeamId: fixture.permanentTeamId, athleteProfileId: { in: ids } }, distinct: ["athleteProfileId"], select: { athleteProfileId: true } });
      if (eligible.length !== ids.length) throw new Error("Atleta não pertence ao histórico deste time.");
      await tx.interclubesFixture.update({ where: { id }, data: { clubScore: Number(clubRaw), opponentScore: Number(opponentRaw), scheduledAt: date, notes: value(data,"notes") || null, status: MatchStatus.FINALIZADO } });
      for (const line of lines) await tx.interclubesFixturePlayer.upsert({ where: { fixtureId_athleteId: { fixtureId: id, athleteId: line.athleteId } }, create: { fixtureId: id, ...line }, update: line });
      await tx.administrativeAudit.create({ data: { actorId: actor.id, action: "interclubes.fixture.sheet", target: `InterclubesFixture:${id}`, previous: fixture, next: { clubScore: Number(clubRaw), opponentScore: Number(opponentRaw), participants: lines.filter(l => l.played).length } } });
    });
    revalidatePath(adminPath); revalidatePath(`/admin/interclubes/jogos/${id}`); revalidatePath("/interclubes");
    return { success: "Súmula salva com sucesso." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível salvar a súmula." }; }
}
