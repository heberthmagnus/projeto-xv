"use server";

import { MatchEventType, MatchStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";

const basePath = "/admin/interno-campao-2026/jogos";

export async function saveMatchResult(formData: FormData) {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const id = String(formData.get("matchId") || "");
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  if (!id || !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) throw new Error("Informe placares válidos.");
  await prisma.match.updateMany({ where: { id, championshipId: championship.id }, data: { homeScore, awayScore, status: MatchStatus.FINALIZADO } });
  revalidatePath(basePath); revalidatePath("/campeonatos/interno-campao-2026");
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
  revalidatePath(basePath); revalidatePath("/campeonatos/interno-campao-2026");
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
  revalidatePath(basePath); revalidatePath("/campeonatos/interno-campao-2026");
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
  revalidatePath(basePath); revalidatePath("/campeonatos/interno-campao-2026");
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
  revalidatePath(basePath); revalidatePath("/campeonatos/interno-campao-2026");
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

  return { teamId: championshipPlayer.teamId, playerId, playerName: championshipPlayer.registration.nickname || championshipPlayer.registration.fullName };
}

async function syncParticipation(tx: Prisma.TransactionClient, matchId: string, playerId: string, teamId: string) {
  const events = await tx.matchEvent.findMany({ where: { matchId, playerId, teamId }, select: { type: true, quantity: true } });
  const goals = events.filter((event) => event.type === "GOL").reduce((sum, event) => sum + event.quantity, 0);
  const yellowCards = events.filter((event) => event.type === "CARTAO_AMARELO" || event.type === "CARTAO_AZUL").reduce((sum, event) => sum + event.quantity, 0);
  const redCards = events.filter((event) => event.type === "CARTAO_VERMELHO").reduce((sum, event) => sum + event.quantity, 0);
  await tx.matchPlayerParticipation.upsert({ where: { matchId_playerId_teamId: { matchId, playerId, teamId } }, update: { goals, yellowCards, redCards }, create: { matchId, playerId, teamId, goals, yellowCards, redCards } });
}
