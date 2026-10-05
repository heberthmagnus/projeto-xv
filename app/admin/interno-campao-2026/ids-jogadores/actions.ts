"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeFullName } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";

const pagePath = "/admin/interno-campao-2026/ids-jogadores";
const championshipSlug = "interno-campao-2026";

function finish(success: string) {
  revalidatePath(pagePath);
  revalidatePath("/admin/interno-campao-2026/pendencias");
  revalidatePath("/admin/interno-campao-2026/jogos");
  revalidatePath("/campeonatos/interno-campao-2026");
  redirect(`${pagePath}?success=${success}`);
}

export async function declareDifferentAthletes(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") || "").trim();
  if (!registrationId) throw new Error("Jogador não encontrado.");

  await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findFirst({
      where: { id: registrationId, championship: { slug: championshipSlug } },
      select: {
        id: true,
        championshipId: true,
        athleteProfileId: true,
        fullName: true,
        nickname: true,
        preferredPosition: true,
        birthDate: true,
        phone: true,
        email: true,
        level: true,
      },
    });
    if (!registration?.athleteProfileId) throw new Error("Esta inscrição ainda não possui cadastro do XV para separar.");

    const sharedCount = await tx.registration.count({
      where: {
        championshipId: registration.championshipId,
        athleteProfileId: registration.athleteProfileId,
        id: { not: registration.id },
      },
    });
    if (!sharedCount) throw new Error("Este cadastro não está compartilhado por outra inscrição do Campão.");

    const newProfile = await tx.athleteProfile.create({
      data: {
        fullName: registration.fullName,
        // Mantém homônimos como pessoas distintas no cadastro canônico.
        normalizedFullName: `${normalizeFullName(registration.fullName)}--${registration.id}`,
        nickname: registration.nickname,
        preferredPosition: registration.preferredPosition,
        birthDate: registration.birthDate,
        phone: registration.phone,
        email: registration.email,
        defaultLevel: registration.level,
      },
      select: { id: true },
    });
    await tx.registration.update({
      where: { id: registration.id },
      data: { athleteProfileId: newProfile.id },
    });
  });

  // Os eventos já existentes permanecem no cadastro antigo: não há como
  // atribuí-los automaticamente a uma das duas pessoas com segurança.
  finish("pessoas-separadas");
}

export async function assignPlayerProfile(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const athleteProfileId = String(formData.get("athleteProfileId") || "").trim();
  if (!registrationId || !athleteProfileId) throw new Error("Informe um ID de atleta válido.");
  await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findFirst({
      where: { id: registrationId, championship: { slug: championshipSlug } },
      select: { id: true, championshipId: true, athleteProfileId: true },
    });
    if (!registration) throw new Error("Jogador não encontrado neste campeonato.");
    const profile = await tx.athleteProfile.findUnique({ where: { id: athleteProfileId }, select: { id: true } });
    if (!profile) throw new Error("Nenhum atleta foi encontrado no cadastro do XV.");
    if (registration.athleteProfileId === profile.id) return;

    const profileAlreadyInChampionship = await tx.registration.findFirst({
      where: { championshipId: registration.championshipId, athleteProfileId: profile.id, id: { not: registration.id } },
      select: { id: true },
    });
    if (profileAlreadyInChampionship) throw new Error("Este cadastro já está vinculado a outra inscrição do Campão. Revise a duplicidade antes de continuar.");

    if (registration.athleteProfileId) {
      const sourceProfileId = registration.athleteProfileId;
      const sharedSource = await tx.registration.count({ where: { championshipId: registration.championshipId, athleteProfileId: sourceProfileId, id: { not: registration.id } } });
      if (sharedSource) throw new Error("O ID atual é compartilhado por outra inscrição do Campão. Para não atribuir gols ou cartões à pessoa errada, revise os IDs compartilhados primeiro.");
      const targetHistory = await tx.matchPlayerParticipation.findFirst({ where: { playerId: profile.id, match: { championshipId: registration.championshipId } }, select: { id: true } });
      if (targetHistory) throw new Error("O cadastro escolhido já possui histórico no Campão. A união automática foi bloqueada para preservar os dados das duas pessoas.");

      await Promise.all([
        tx.matchEvent.updateMany({ where: { playerId: sourceProfileId, match: { championshipId: registration.championshipId } }, data: { playerId: profile.id } }),
        tx.matchPlayerParticipation.updateMany({ where: { playerId: sourceProfileId, match: { championshipId: registration.championshipId } }, data: { playerId: profile.id } }),
        tx.suspension.updateMany({ where: { playerId: sourceProfileId, championshipId: registration.championshipId }, data: { playerId: profile.id } }),
      ]);
    }
    await tx.registration.update({ where: { id: registration.id }, data: { athleteProfileId: profile.id } });
  });
  finish("historico-vinculado");
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
