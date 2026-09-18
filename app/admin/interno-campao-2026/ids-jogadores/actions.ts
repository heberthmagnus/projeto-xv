"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeFullName } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";

const pagePath = "/admin/interno-campao-2026/ids-jogadores";
const championshipSlug = "interno-campao-2026";

async function getRegistration(id: string) {
  const registration = await prisma.registration.findFirst({
    where: { id, championship: { slug: championshipSlug } },
  });
  if (!registration) throw new Error("Jogador não encontrado neste campeonato.");
  return registration;
}

function finish(success: string) {
  revalidatePath(pagePath);
  revalidatePath("/admin/interno-campao-2026/jogos");
  revalidatePath("/campeonatos/interno-campao-2026");
  redirect(`${pagePath}?success=${success}`);
}

export async function assignPlayerProfile(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const athleteProfileId = String(formData.get("athleteProfileId") || "").trim();
  if (!registrationId || !athleteProfileId) throw new Error("Informe um ID de atleta válido.");
  await getRegistration(registrationId);
  const profile = await prisma.athleteProfile.findUnique({ where: { id: athleteProfileId }, select: { id: true } });
  if (!profile) throw new Error("Nenhum atleta foi encontrado com este ID.");
  await prisma.registration.update({ where: { id: registrationId }, data: { athleteProfileId: profile.id } });
  finish("vinculo-atualizado");
}

export async function createIndependentPlayerProfile(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const registration = await getRegistration(registrationId);
  const independentKey = `${normalizeFullName(registration.fullName)}--${registration.id}`;
  const profile = await prisma.athleteProfile.upsert({
    where: { normalizedFullName: independentKey },
    create: {
      fullName: registration.fullName,
      // O sufixo interno permite IDs independentes para homônimos.
      normalizedFullName: independentKey,
      nickname: registration.nickname,
      preferredPosition: registration.preferredPosition,
      birthDate: registration.birthDate,
      defaultLevel: registration.level,
      phone: registration.phone,
      email: registration.email,
    },
    update: {},
    select: { id: true },
  });
  await prisma.registration.update({ where: { id: registrationId }, data: { athleteProfileId: profile.id } });
  finish("id-criado");
}

export async function moveChampionshipPlayer(formData: FormData) {
  await requireAdmin();
  const championshipPlayerId = String(formData.get("championshipPlayerId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  if (!championshipPlayerId || !teamId) throw new Error("Selecione um time válido.");
  const [player, team] = await Promise.all([
    prisma.championshipPlayer.findFirst({ where: { id: championshipPlayerId, championship: { slug: championshipSlug } }, select: { id: true } }),
    prisma.championshipTeam.findFirst({ where: { championship: { slug: championshipSlug }, teamId }, select: { teamId: true } }),
  ]);
  if (!player || !team) throw new Error("Jogador ou time não pertence a este campeonato.");
  await prisma.championshipPlayer.update({ where: { id: player.id }, data: { teamId } });
  finish("time-atualizado");
}

export async function createChampionshipPlayer(formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const preferredPosition = String(formData.get("preferredPosition") || "").trim();
  const birthDateRaw = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!fullName || !teamId || !birthDateRaw || !phone) throw new Error("Preencha nome, time, data de nascimento e telefone.");
  if (!["GOLEIRO", "LATERAL", "ZAGUEIRO", "VOLANTE", "MEIA", "ATACANTE"].includes(preferredPosition)) throw new Error("Selecione uma posição válida.");
  const birthDate = new Date(`${birthDateRaw}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) throw new Error("Data de nascimento inválida.");
  const championship = await prisma.championship.findUnique({ where: { slug: championshipSlug }, select: { id: true } });
  const team = await prisma.championshipTeam.findFirst({ where: { championshipId: championship?.id, teamId }, select: { groupLabel: true } });
  if (!championship || !team) throw new Error("Time inválido para este campeonato.");
  const registration = await prisma.registration.create({ data: { championshipId: championship.id, fullName, nickname: nickname || null, category: team.groupLabel === "MASTER" ? "MASTER" : "ADULTO", preferredPosition: preferredPosition as "GOLEIRO" | "LATERAL" | "ZAGUEIRO" | "VOLANTE" | "MEIA" | "ATACANTE", birthDate, phone, confirmedRules: true } });
  const profile = await prisma.athleteProfile.create({ data: { fullName, normalizedFullName: `${normalizeFullName(fullName)}--${registration.id}`, nickname: nickname || null, preferredPosition: registration.preferredPosition, birthDate, phone }, select: { id: true } });
  await prisma.$transaction([
    prisma.registration.update({ where: { id: registration.id }, data: { athleteProfileId: profile.id } }),
    prisma.championshipPlayer.create({ data: { championshipId: championship.id, registrationId: registration.id, teamId } }),
  ]);
  finish("jogador-criado");
}
