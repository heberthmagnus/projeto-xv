"use server";

import { MatchEventType, MatchStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { getPreferredPlayerName } from "@/lib/player-display-name";

const basePath = "/admin/interno-campao-2026/jogos";

export async function saveMatchResult(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const id = String(formData.get("matchId") || "");
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  if (!id || !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) throw new Error("Informe placares válidos.");
  await prisma.match.updateMany({ where: { id, championshipId: championship.id }, data: { homeScore, awayScore, status: MatchStatus.FINALIZADO } });
  finish();
}

export async function saveMatchSchedule(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const id = String(formData.get("matchId") || "");
  const rawScheduledAt = String(formData.get("scheduledAt") || "");
  const scheduledAt = rawScheduledAt ? new Date(`${rawScheduledAt}:00-03:00`) : null;
  if (!id || (scheduledAt && Number.isNaN(scheduledAt.getTime()))) throw new Error("Informe uma data e horário válidos.");
  await prisma.match.updateMany({ where: { id, championshipId: championship.id }, data: { scheduledAt } });
  finish();
}

export async function saveMatchReport(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const id = String(formData.get("matchId") || "");
  const matchReport = String(formData.get("matchReport") || "").trim();
  if (!id) throw new Error("Jogo não encontrado.");
  await prisma.match.updateMany({
    where: { id, championshipId: championship.id },
    data: { matchReport: matchReport || null },
  });
  finish();
}

export async function saveTeamMatchSheet(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const matchId = String(formData.get("matchId") || "");
  const teamId = String(formData.get("teamId") || "");
  const playerIds = formData.getAll("playerId").map(String).filter(Boolean);
  const match = await prisma.match.findFirst({
    where: { id: matchId, championshipId: championship.id, OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    select: { id: true },
  });
  if (!match || !playerIds.length) throw new Error("Súmula inválida.");

  for (const championshipPlayerId of playerIds) {
    const participation = formData.get(`played:${championshipPlayerId}`) === "on";
    const stats = {
      goals: parseCount(formData.get(`goals:${championshipPlayerId}`)),
      yellow: parseCount(formData.get(`yellow:${championshipPlayerId}`)),
      blue: parseCount(formData.get(`blue:${championshipPlayerId}`)),
      red: parseCount(formData.get(`red:${championshipPlayerId}`)),
    };
    const { playerId, playerName } = await resolveMatchPlayer(championship.id, matchId, championshipPlayerId);
    const hasStats = Object.values(stats).some((value) => value > 0);
    await prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({
        where: { matchId, teamId, playerId, type: { in: ["GOL", "CARTAO_AMARELO", "CARTAO_AZUL", "CARTAO_VERMELHO"] } },
      });
      const events = [
        ["GOL", stats.goals], ["CARTAO_AMARELO", stats.yellow], ["CARTAO_AZUL", stats.blue], ["CARTAO_VERMELHO", stats.red],
      ] as const;
      await Promise.all(events.filter(([, quantity]) => quantity > 0).map(([type, quantity]) => tx.matchEvent.create({
        data: { matchId, teamId, playerId, player: playerName, type, quantity },
      })));
      if (participation || hasStats) {
        await tx.matchPlayerParticipation.upsert({
          where: { matchId_playerId_teamId: { matchId, playerId, teamId } },
          update: { goals: stats.goals, yellowCards: stats.yellow, redCards: stats.red },
          create: { matchId, playerId, teamId, goals: stats.goals, yellowCards: stats.yellow, redCards: stats.red },
        });
      } else {
        await tx.matchPlayerParticipation.deleteMany({ where: { matchId, playerId, teamId } });
      }
    });
  }
  finish();
}

export async function addMatchEvent(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const matchId = String(formData.get("matchId") || "");
  const championshipPlayerId = String(formData.get("championshipPlayerId") || "");
  const rawType = String(formData.get("type") || "");
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  if (!Object.values(MatchEventType).includes(rawType as MatchEventType)) throw new Error("Tipo de evento inválido.");
  const { teamId, playerId, playerName } = await resolveMatchPlayer(championship.id, matchId, championshipPlayerId);
  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.create({ data: { matchId, teamId, playerId, player: playerName, type: rawType as MatchEventType, quantity } });
    await syncParticipation(tx, matchId, playerId, teamId);
  });
  finish();
}

export async function registerMatchParticipation(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const matchId = String(formData.get("matchId") || "");
  const championshipPlayerId = String(formData.get("championshipPlayerId") || "");
  const { teamId, playerId } = await resolveMatchPlayer(championship.id, matchId, championshipPlayerId);
  await prisma.matchPlayerParticipation.upsert({
    where: { matchId_playerId_teamId: { matchId, playerId, teamId } },
    update: {},
    create: { matchId, playerId, teamId },
  });
  finish();
}

export async function updateMatchEvent(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const eventId = String(formData.get("eventId") || "");
  const matchId = String(formData.get("matchId") || "");
  const championshipPlayerId = String(formData.get("championshipPlayerId") || "");
  const rawType = String(formData.get("type") || "");
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  if (!Object.values(MatchEventType).includes(rawType as MatchEventType)) throw new Error("Tipo de evento inválido.");
  const event = await prisma.matchEvent.findFirst({ where: { id: eventId, matchId, match: { championshipId: championship.id } } });
  if (!event) throw new Error("Lançamento não encontrado.");
  const { teamId, playerId, playerName } = await resolveMatchPlayer(championship.id, matchId, championshipPlayerId);
  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.update({ where: { id: eventId }, data: { teamId, playerId, player: playerName, type: rawType as MatchEventType, quantity } });
    if (event.playerId && event.teamId) await syncParticipation(tx, matchId, event.playerId, event.teamId);
    await syncParticipation(tx, matchId, playerId, teamId);
  });
  finish();
}

export async function deleteMatchEvent(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const eventId = String(formData.get("eventId") || "");
  const event = await prisma.matchEvent.findFirst({ where: { id: eventId, match: { championshipId: championship.id } } });
  if (!event) throw new Error("Lançamento não encontrado.");
  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.delete({ where: { id: event.id } });
    if (event.playerId && event.teamId) await syncParticipation(tx, event.matchId, event.playerId, event.teamId);
  });
  finish();
}

async function resolveMatchPlayer(championshipId: string, matchId: string, championshipPlayerId: string) {
  const [match, championshipPlayer] = await Promise.all([
    prisma.match.findFirst({ where: { id: matchId, championshipId }, select: { homeTeamId: true, awayTeamId: true } }),
    prisma.championshipPlayer.findFirst({ where: { id: championshipPlayerId, championshipId }, include: { registration: true } }),
  ]);
  if (!match || !championshipPlayer || !championshipPlayer.teamId || ![match.homeTeamId, match.awayTeamId].includes(championshipPlayer.teamId)) throw new Error("Selecione um atleta deste jogo.");

  let playerId = championshipPlayer.registration.athleteProfileId;
  if (!playerId) {
    playerId = await syncAthleteProfileFromRegistration({
      fullName: championshipPlayer.registration.fullName,
      nickname: championshipPlayer.registration.nickname,
      preferredPosition: championshipPlayer.registration.preferredPosition,
      birthDate: championshipPlayer.registration.birthDate,
      phone: championshipPlayer.registration.phone,
      email: championshipPlayer.registration.email,
      level: championshipPlayer.registration.level,
    });
    await prisma.registration.update({ where: { id: championshipPlayer.registrationId }, data: { athleteProfileId: playerId } });
  }

  return { teamId: championshipPlayer.teamId, playerId, playerName: getPreferredPlayerName(championshipPlayer.registration.nickname, championshipPlayer.registration.fullName) };
}

async function syncParticipation(tx: Prisma.TransactionClient, matchId: string, playerId: string, teamId: string) {
  const events = await tx.matchEvent.findMany({ where: { matchId, playerId, teamId }, select: { type: true, quantity: true } });
  const goals = events.filter((event) => event.type === "GOL").reduce((sum, event) => sum + event.quantity, 0);
  const yellowCards = events.filter((event) => event.type === "CARTAO_AMARELO").reduce((sum, event) => sum + event.quantity, 0);
  const redCards = events.filter((event) => event.type === "CARTAO_VERMELHO").reduce((sum, event) => sum + event.quantity, 0);
  await tx.matchPlayerParticipation.upsert({ where: { matchId_playerId_teamId: { matchId, playerId, teamId } }, update: { goals, yellowCards, redCards }, create: { matchId, playerId, teamId, goals, yellowCards, redCards } });
}

function parseCount(value: FormDataEntryValue | null) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

function finish() {
  revalidatePath(basePath);
  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/campeonatos/interno-campao-2026/jogos", "layout");
}
