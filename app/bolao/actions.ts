"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireActiveMember, userHasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BolaoActionState = { error?: string; success?: string };
const initial = { error: "" };

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function goals(value: FormDataEntryValue | null) {
  const parsed = Number(text(value));
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) throw new Error("Informe gols inteiros entre 0 e 99.");
  return parsed;
}

async function activeParticipant(poolId: string) {
  const user = await requireActiveMember();
  if (!userHasPermission(user, "pool.participate") || !user.member?.id) throw new Error("Seu perfil não pode participar do Bolão.");
  const participant = await prisma.predictionPoolParticipant.findUnique({ where: { poolId_memberId: { poolId, memberId: user.member.id } } });
  return { user, participant };
}

export async function joinPool(_: BolaoActionState, formData: FormData): Promise<BolaoActionState> {
  try {
    const user = await requireActiveMember();
    const poolId = text(formData.get("poolId"));
    if (!poolId || !user.member?.id || !userHasPermission(user, "pool.participate")) throw new Error("Você não pode entrar neste Bolão.");
    const pool = await prisma.predictionPool.findUnique({ where: { id: poolId }, select: { active: true } });
    if (!pool?.active) throw new Error("Este Bolão não está disponível.");
    await prisma.predictionPoolParticipant.upsert({ where: { poolId_memberId: { poolId, memberId: user.member.id } }, create: { poolId, memberId: user.member.id }, update: {} });
    revalidatePath("/bolao");
    return { success: "Participação confirmada. Seus palpites já podem ser registrados." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível entrar no Bolão." };
  }
}

export async function savePrediction(_: BolaoActionState, formData: FormData): Promise<BolaoActionState> {
  try {
    const poolId = text(formData.get("poolId"));
    const poolMatchId = text(formData.get("poolMatchId"));
    const homeGoals = goals(formData.get("homeGoals"));
    const awayGoals = goals(formData.get("awayGoals"));
    const { participant } = await activeParticipant(poolId);
    if (!participant) throw new Error("Entre no Bolão antes de registrar palpites.");

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const poolMatch = await tx.predictionPoolMatch.findFirst({ where: { id: poolMatchId, poolId, eligible: true }, select: { id: true, lockAt: true, lockedAt: true } });
      if (!poolMatch) throw new Error("Partida indisponível para palpite.");
      if (poolMatch.lockedAt || poolMatch.lockAt <= now) {
        if (!poolMatch.lockedAt) await tx.predictionPoolMatch.update({ where: { id: poolMatch.id }, data: { lockedAt: now } });
        throw new Error("O prazo deste palpite já foi encerrado.");
      }
      await tx.prediction.upsert({ where: { participantId_poolMatchId: { participantId: participant.id, poolMatchId } }, create: { participantId: participant.id, poolMatchId, homeGoals, awayGoals }, update: { homeGoals, awayGoals } });
      await tx.predictionPoolParticipant.updateMany({ where: { id: participant.id, firstPredictionAt: null }, data: { firstPredictionAt: now } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/bolao");
    return { success: "Palpite salvo." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar o palpite." };
  }
}

export async function selectMultiplier(_: BolaoActionState, formData: FormData): Promise<BolaoActionState> {
  try {
    const poolId = text(formData.get("poolId"));
    const poolMatchId = text(formData.get("poolMatchId"));
    const round = Number(text(formData.get("round")));
    if (!Number.isInteger(round) || round < 1) throw new Error("Rodada inválida.");
    const { participant } = await activeParticipant(poolId);
    if (!participant) throw new Error("Entre no Bolão antes de selecionar o multiplicador.");

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const selectedMatch = await tx.predictionPoolMatch.findFirst({ where: { id: poolMatchId, poolId, eligible: true }, select: { id: true, lockAt: true, lockedAt: true } });
      if (!selectedMatch || selectedMatch.lockedAt || selectedMatch.lockAt <= now) throw new Error("Escolha uma partida que ainda esteja aberta.");
      const prediction = await tx.prediction.findUnique({ where: { participantId_poolMatchId: { participantId: participant.id, poolMatchId } }, select: { id: true } });
      if (!prediction) throw new Error("Registre o palpite desta partida antes de selecionar 2×.");
      const current = await tx.predictionMultiplier.findUnique({ where: { participantId_poolId_round: { participantId: participant.id, poolId, round } }, include: { poolMatch: { select: { id: true, lockAt: true, lockedAt: true } } } });
      if (current?.lockedAt || (current?.poolMatch.lockAt && current.poolMatch.lockAt <= now)) {
        if (current && !current.lockedAt) await tx.predictionMultiplier.update({ where: { id: current.id }, data: { lockedAt: now } });
        throw new Error("O multiplicador desta rodada já está bloqueado.");
      }
      await tx.predictionMultiplier.upsert({ where: { participantId_poolId_round: { participantId: participant.id, poolId, round } }, create: { participantId: participant.id, poolId, poolMatchId, round }, update: { poolMatchId, selectedAt: now } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/bolao");
    return { success: "Multiplicador 2× selecionado." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível selecionar o multiplicador." };
  }
}
