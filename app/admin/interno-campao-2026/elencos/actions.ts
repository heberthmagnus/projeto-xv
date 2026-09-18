"use server";

import type { PreferredPosition } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeFullName } from "@/lib/athlete-profiles";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const championshipSlug = "interno-campao-2026";
const pagePath = "/admin/interno-campao-2026/elencos";
const positions = ["GOLEIRO", "LATERAL", "ZAGUEIRO", "VOLANTE", "MEIA", "ATACANTE"] as const;

function finish(success: string) {
  revalidatePath(pagePath);
  revalidatePath("/admin/interno-campao-2026/ids-jogadores");
  revalidatePath("/admin/interno-campao-2026/jogos");
  revalidatePath("/campeonatos/interno-campao-2026");
  redirect(`${pagePath}?success=${success}`);
}

export async function moveRosterPlayer(formData: FormData) {
  await requireAdmin();
  const championshipPlayerId = String(formData.get("championshipPlayerId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  if (!championshipPlayerId || !teamId) throw new Error("Selecione o jogador e o novo time.");

  const [player, team] = await Promise.all([
    prisma.championshipPlayer.findFirst({ where: { id: championshipPlayerId, championship: { slug: championshipSlug } }, select: { id: true } }),
    prisma.championshipTeam.findFirst({ where: { championship: { slug: championshipSlug }, teamId }, select: { teamId: true } }),
  ]);
  if (!player || !team) throw new Error("Jogador ou time não pertence a este campeonato.");
  await prisma.championshipPlayer.update({ where: { id: player.id }, data: { teamId } });
  finish("time-atualizado");
}

export async function setRegistrationTeam(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const selectedTeamId = String(formData.get("teamId") || "").trim();
  if (!registrationId || !selectedTeamId) throw new Error("Selecione o jogador e o time.");

  const championship = await prisma.championship.findUnique({ where: { slug: championshipSlug }, select: { id: true } });
  const registration = await prisma.registration.findFirst({ where: { id: registrationId, championship: { slug: championshipSlug } }, select: { id: true } });
  if (!championship || !registration) throw new Error("Jogador não pertence a este campeonato.");

  const teamId = selectedTeamId === "SEM_TIME" ? null : selectedTeamId;
  if (teamId) {
    const team = await prisma.championshipTeam.findFirst({ where: { championshipId: championship.id, teamId }, select: { teamId: true } });
    if (!team) throw new Error("Time inválido para este campeonato.");
  }

  await prisma.championshipPlayer.upsert({
    where: { registrationId: registration.id },
    create: { championshipId: championship.id, registrationId: registration.id, teamId },
    update: { teamId },
  });
  finish(teamId ? "time-atualizado" : "jogador-sem-time");
}

export async function addRosterPlayer(formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const preferredPosition = String(formData.get("preferredPosition") || "").trim();
  const birthDateRaw = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!fullName || !teamId || !birthDateRaw || !phone) throw new Error("Preencha nome, time, data de nascimento e telefone.");
  if (!positions.includes(preferredPosition as (typeof positions)[number])) throw new Error("Selecione uma posição válida.");
  const birthDate = new Date(`${birthDateRaw}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) throw new Error("Data de nascimento inválida.");

  const championship = await prisma.championship.findUnique({ where: { slug: championshipSlug }, select: { id: true } });
  const championshipTeam = await prisma.championshipTeam.findFirst({ where: { championshipId: championship?.id, teamId }, select: { groupLabel: true } });
  if (!championship || !championshipTeam) throw new Error("Time inválido para este campeonato.");

  await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.create({
      data: {
        championshipId: championship.id,
        fullName,
        nickname: nickname || null,
        category: championshipTeam.groupLabel === "MASTER" ? "MASTER" : "ADULTO",
        preferredPosition: preferredPosition as PreferredPosition,
        birthDate,
        phone,
        confirmedRules: true,
      },
    });
    const profile = await tx.athleteProfile.create({
      data: {
        fullName,
        // O sufixo interno mantém atletas homônimos como pessoas separadas.
        normalizedFullName: `${normalizeFullName(fullName)}--${registration.id}`,
        nickname: nickname || null,
        preferredPosition: registration.preferredPosition,
        birthDate,
        phone,
      },
      select: { id: true },
    });
    await tx.registration.update({ where: { id: registration.id }, data: { athleteProfileId: profile.id } });
    await tx.championshipPlayer.create({ data: { championshipId: championship.id, registrationId: registration.id, teamId } });
  });
  finish("jogador-adicionado");
}
